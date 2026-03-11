export const config = { runtime: "edge" };

/**
 * Ask Shri — AI Chat Backend
 * Strategy: Race Gemini (primary) against HF models in parallel.
 * First successful response wins. 5-model fallback chain.
 * Env vars: GEMINI_API_KEY (primary) + HF_TOKEN (fallbacks)
 */

// ── Helper: call Google Gemini ────────────────────────────────────────────────
async function callGemini(apiKey, systemPrompt, messages, maxTokens) {
  const GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
  ];

  // Build Gemini history (no system role — put system in first user turn)
  const geminiHistory = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    geminiHistory.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  // Prepend system context into first user message
  if (geminiHistory.length > 0 && geminiHistory[0].role === "user") {
    geminiHistory[0].parts[0].text = systemPrompt + "\n\n" + geminiHistory[0].parts[0].text;
  }

  for (const model of GEMINI_MODELS) {
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
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
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

// ── Helper: call HuggingFace router ──────────────────────────────────────────
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
    // Skip if model is still loading — don't block, let parallel race win
    if (!text || data?.error) return null;
    return text.length > 20 ? text : null;
  } catch { return null; }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false }), { status: 405 });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const { system = "", messages = [], max_tokens = 1000 } = body;

  // Trim conversation to last 6 messages to prevent token overflow / timeouts
  const trimmedMsgs = messages.slice(-6);

  const geminiKey = process.env.GEMINI_API_KEY;
  const hfToken   = process.env.HF_TOKEN;

  // HF message format
  const hfMessages = [
    { role: "system", content: system },
    ...trimmedMsgs.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
  ];

  // HF models in priority order
  const HF_MODELS = [
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.3-70B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "HuggingFaceH4/zephyr-7b-beta",
  ];

  // ── RACE: fire Gemini + first 2 HF models simultaneously ─────────────────
  const racers = [];

  if (geminiKey) {
    racers.push(callGemini(geminiKey, system, trimmedMsgs, max_tokens));
  }
  if (hfToken) {
    // Fire top 2 HF models in parallel alongside Gemini
    racers.push(callHF(hfToken, HF_MODELS[0], hfMessages, max_tokens));
    racers.push(callHF(hfToken, HF_MODELS[1], hfMessages, max_tokens));
  }

  // Promise.any → first non-null result wins
  let text = null;
  if (racers.length > 0) {
    try {
      // Custom Promise.any that ignores null results
      text = await new Promise((resolve, reject) => {
        let settled = false;
        let pending = racers.length;
        racers.forEach(p => {
          Promise.resolve(p).then(result => {
            if (!settled && result && result.length > 20) {
              settled = true;
              resolve(result);
            }
          }).catch(() => {}).finally(() => {
            pending--;
            if (pending === 0 && !settled) reject(new Error("all failed"));
          });
        });
      });
    } catch { text = null; }
  }

  // ── SEQUENTIAL FALLBACKS if race failed ──────────────────────────────────
  if (!text && hfToken) {
    for (const model of HF_MODELS.slice(2)) {
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
