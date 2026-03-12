export const config = { runtime: "edge" };

/**
 * Ask Shri — AI Chat Backend
 * Priority: Anthropic Claude → Google Gemini → HuggingFace (5 models)
 * Race: Claude + Gemini fire simultaneously, first response wins.
 * Falls back sequentially through HF models if both primary fail.
 *
 * Env vars (set in Vercel → Settings → Environment Variables):
 *   ANTHROPIC_API_KEY  — from console.anthropic.com  (primary)
 *   GEMINI_API_KEY     — from aistudio.google.com    (secondary)
 *   HF_TOKEN           — from huggingface.co/settings (fallback)
 */

// ── Claude (Anthropic) ────────────────────────────────────────────────────────
async function callClaude(apiKey, systemPrompt, messages, maxTokens) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",  // fast + cheap, perfect for chat
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.filter(m => m.role !== "system").map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return text && text.length > 20 ? text : null;
  } catch { return null; }
}

// ── Google Gemini ─────────────────────────────────────────────────────────────
async function callGemini(apiKey, systemPrompt, messages, maxTokens) {
  const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

  const geminiHistory = messages
    .filter(m => m.role !== "system")
    .map((m, i) => {
      let content = m.content;
      // Inject system prompt into first user message
      if (i === 0 && m.role === "user") content = systemPrompt + "\n\n" + content;
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: content }],
      };
    });

  if (geminiHistory.length === 0) return null;

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: geminiHistory,
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }
      );
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 20) return text;
    } catch { continue; }
  }
  return null;
}

// ── HuggingFace ───────────────────────────────────────────────────────────────
async function callHF(token, model, hfMessages, maxTokens) {
  try {
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages: hfMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false,
      }),
    });
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || data?.error) return null;
    return text.length > 20 ? text : null;
  } catch { return null; }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false }), { status: 405 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false }), { status: 400 }); }

  const { system = "", messages = [], max_tokens = 900 } = body;

  // Trim to last 8 messages to prevent token overflow
  const trimmed = messages.slice(-8);

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GEMINI_API_KEY;
  const hfToken      = process.env.HF_TOKEN;

  // HF message format (with system role)
  const hfMessages = [
    { role: "system", content: system },
    ...trimmed.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  const HF_MODELS = [
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "HuggingFaceH4/zephyr-7b-beta",
  ];

  // ── RACE: Claude + Gemini simultaneously ─────────────────────────────────
  const racers = [];
  if (anthropicKey) racers.push(callClaude(anthropicKey, system, trimmed, max_tokens));
  if (geminiKey)    racers.push(callGemini(geminiKey, system, trimmed, max_tokens));

  let text = null;

  if (racers.length > 0) {
    text = await new Promise(resolve => {
      let pending = racers.length;
      let resolved = false;
      racers.forEach(p =>
        Promise.resolve(p)
          .then(r => { if (!resolved && r) { resolved = true; resolve(r); } })
          .catch(() => {})
          .finally(() => { pending--; if (pending === 0 && !resolved) resolve(null); })
      );
    });
  }

  // ── Sequential HF fallbacks ───────────────────────────────────────────────
  if (!text && hfToken) {
    for (const model of HF_MODELS) {
      text = await callHF(hfToken, model, hfMessages, max_tokens);
      if (text) break;
    }
  }

  if (text) {
    return new Response(
      JSON.stringify({ ok: true, content: [{ type: "text", text }] }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: false, content: [{ type: "text", text: "" }] }),
    { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
}
