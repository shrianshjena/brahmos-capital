/**
 * Ask Shri — AI Chat Backend  v5  (100% free APIs only)
 *
 * Priority chain (accuracy first, all free):
 *   1. Gemini 1.5 Pro   — best financial reasoning, FREE 1500 req/day via AI Studio
 *   2. Gemini 2.0 Flash — faster Gemini, FREE 1500 req/day
 *   3. Gemini 1.5 Flash — lightest Gemini fallback
 *   4. Groq Llama 70B   — FREE 30 req/min, always available, never expires
 *
 * Sequential, NOT a race — best model tried first.
 * Anthropic Claude removed — paid API, no free tier.
 * HuggingFace removed — token expires every ~90 days, unreliable.
 *
 * Env vars needed in Vercel (both free):
 *   GEMINI_API_KEY  — aistudio.google.com/apikey   FREE, no card needed
 *   GROQ_API_KEY    — console.groq.com              FREE, never expires
 */

export const config = { runtime: "edge" };

const TIMEOUT_MS = 22000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// ── Provider 1: Google Gemini (primary — best financial accuracy, free) ───────
async function callGemini(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;

  // Gemini has no system role — prepend to first user message
  const contents = messages.map((m, i) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: i === 0 && m.role === "user"
      ? `${systemPrompt}\n\n${m.content}`
      : m.content }],
  }));
  if (!contents.length) return null;

  // Try best → fastest, all on the same free key
  const models = [
    "gemini-1.5-pro",      // best reasoning — 1500 req/day free
    "gemini-2.0-flash",    // fast + capable — 1500 req/day free
    "gemini-1.5-flash",    // lighter fallback
  ];

  for (const model of models) {
    try {
      const res = await withTimeout(
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                maxOutputTokens: maxTokens,
                temperature: 0.4,   // lower = more grounded financial analysis
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              ],
            }),
          }
        ),
        TIMEOUT_MS
      );
      const data = await res.json();
      if (data.error) continue;  // quota hit or model unavailable — try next
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 30) return { text, model: `gemini/${model}` };
    } catch { continue; }
  }
  return null;
}

// ── Provider 2: Groq Llama 70B (reliable free fallback, never expires) ────────
async function callGroq(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  const models = [
    "llama-3.3-70b-versatile",  // best quality on Groq
    "llama-3.1-8b-instant",     // fast fallback
  ];
  for (const model of models) {
    try {
      const res = await withTimeout(
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: 0.4,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
              })),
            ],
          }),
        }),
        TIMEOUT_MS
      );
      const data = await res.json();
      if (data.error) continue;
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.length > 30) return { text, model: `groq/${model}` };
    } catch { continue; }
  }
  return null;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false }), { status: 405 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false }), { status: 400 }); }

  const { system = "", messages = [], max_tokens = 1000 } = body;
  const trimmed = messages.slice(-10);

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  const HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (!geminiKey && !groqKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "no_api_keys_configured" }),
      { status: 200, headers: HEADERS }
    );
  }

  // Sequential — best free model first
  let result = await callGemini(geminiKey, system, trimmed, max_tokens);
  if (!result) result = await callGroq(groqKey, system, trimmed, max_tokens);

  if (result) {
    return new Response(
      JSON.stringify({
        ok: true,
        content: [{ type: "text", text: result.text }],
        provider: result.model,
      }),
      { status: 200, headers: HEADERS }
    );
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: "all_providers_failed",
      message: "Apologies — Mr. Shriansh Jena is currently in an important executive meeting with institutional clients. Please reach out again shortly.",
    }),
    { status: 200, headers: HEADERS }
  );
}
