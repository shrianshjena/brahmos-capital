export const config = { runtime: "edge" };

/**
 * Ask Shri — AI Chat Backend  v3
 * Priority chain: Groq → Claude → Gemini → HuggingFace
 * All four race simultaneously; first valid response wins.
 *
 * Env vars (Vercel → Settings → Environment Variables):
 *   GROQ_API_KEY       — console.groq.com           FREE, no expiry, fast
 *   ANTHROPIC_API_KEY  — console.anthropic.com      FREE $5 credit
 *   GEMINI_API_KEY     — aistudio.google.com        FREE 1500 req/day
 *   HF_TOKEN           — huggingface.co/settings    FREE but expires ~90d
 */

const GROQ_MODELS  = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
const HF_MODELS    = ["Qwen/Qwen2.5-72B-Instruct", "Qwen/Qwen2.5-7B-Instruct", "meta-llama/Llama-3.3-70B-Instruct"];

// ── Groq (OpenAI-compatible) ──────────────────────────────────────────────────
async function callGroq(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
          ],
        }),
      });
      const data = await res.json();
      if (data.error) continue;
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.length > 20) return text;
    } catch { continue; }
  }
  return null;
}

// ── Anthropic Claude ──────────────────────────────────────────────────────────
async function callClaude(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map(m => ({
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
  if (!apiKey) return null;
  // Build Gemini history — inject system into first user message
  const history = messages.map((m, i) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: i === 0 && m.role === "user" ? systemPrompt + "\n\n" + m.content : m.content }],
  }));
  if (!history.length) return null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: history,
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
      if (data.error) continue;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 20) return text;
    } catch { continue; }
  }
  return null;
}

// ── HuggingFace ───────────────────────────────────────────────────────────────
async function callHF(token, systemPrompt, messages, maxTokens) {
  if (!token) return null;
  const hfMsgs = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
  ];
  for (const model of HF_MODELS) {
    try {
      const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ model, messages: hfMsgs, max_tokens: maxTokens, temperature: 0.7, stream: false }),
      });
      const data = await res.json();
      if (data.error) continue;
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.length > 20) return text;
    } catch { continue; }
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" },
    });
  }
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false }), { status: 405 });

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false }), { status: 400 }); }

  const { system = "", messages = [], max_tokens = 900 } = body;
  const trimmed = messages.slice(-8);

  const groqKey      = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GEMINI_API_KEY;
  const hfToken      = process.env.HF_TOKEN;

  const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // No keys at all — return clear error
  if (!groqKey && !anthropicKey && !geminiKey && !hfToken) {
    return new Response(JSON.stringify({ ok: false, error: "no_keys" }), { status: 200, headers: HEADERS });
  }

  // Race all available providers simultaneously — first valid response wins
  const racers = [
    callGroq(groqKey, system, trimmed, max_tokens),
    callClaude(anthropicKey, system, trimmed, max_tokens),
    callGemini(geminiKey, system, trimmed, max_tokens),
    callHF(hfToken, system, trimmed, max_tokens),
  ];

  const text = await new Promise(resolve => {
    let settled = 0;
    let won = false;
    racers.forEach(p =>
      Promise.resolve(p)
        .then(r => { if (!won && r) { won = true; resolve(r); } })
        .catch(() => {})
        .finally(() => { settled++; if (settled === racers.length && !won) resolve(null); })
    );
  });

  if (text) {
    return new Response(JSON.stringify({ ok: true, content: [{ type: "text", text }] }), { status: 200, headers: HEADERS });
  }

  return new Response(JSON.stringify({ ok: false, error: "all_providers_failed" }), { status: 200, headers: HEADERS });
}
