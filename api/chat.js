/**
 * Ask Shri — AI Chat Backend  v4
 *
 * Priority (accuracy first, not speed):
 *   1. Gemini 1.5 Pro   — best financial reasoning, 1500 req/day free
 *   2. Claude Sonnet    — strong analyst, reliable fallback
 *   3. Groq (Llama 70B) — fast last resort, always available
 *
 * Sequential, NOT a race — we wait for the best model first.
 * Target response time: 5-15 seconds (accuracy over speed, per spec).
 */

export const config = { runtime: "edge" };

const TIMEOUT_MS = 22000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// ── Provider 1: Google Gemini 1.5 Pro (primary — best financial accuracy) ────
async function callGemini(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  const contents = messages.map((m, i) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: i === 0 && m.role === "user"
      ? `${systemPrompt}\n\n${m.content}`
      : m.content }],
  }));
  if (!contents.length) return null;
  const models = ["gemini-1.5-pro", "gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    try {
      const res = await withTimeout(
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }), TIMEOUT_MS
      );
      const data = await res.json();
      if (data.error) continue;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 30) return { text, model: `gemini/${model}` };
    } catch { continue; }
  }
  return null;
}

// ── Provider 2: Anthropic Claude Sonnet (reliable fallback) ──────────────────
async function callClaude(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  try {
    const res = await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTokens,
          temperature: 0.4,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      }), TIMEOUT_MS
    );
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return text && text.length > 30 ? { text, model: "claude-sonnet-4" } : null;
  } catch { return null; }
}

// ── Provider 3: Groq Llama 70B (fast last resort) ────────────────────────────
async function callGroq(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  for (const model of models) {
    try {
      const res = await withTimeout(
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model, max_tokens: maxTokens, temperature: 0.4,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
              })),
            ],
          }),
        }), TIMEOUT_MS
      );
      const data = await res.json();
      if (data.error) continue;
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.length > 30) return { text, model: `groq/${model}` };
    } catch { continue; }
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

  const { system = "", messages = [], max_tokens = 1000 } = body;
  const trimmed = messages.slice(-10);
  const geminiKey    = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey      = process.env.GROQ_API_KEY;

  const HEADERS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (!geminiKey && !anthropicKey && !groqKey) {
    return new Response(JSON.stringify({ ok: false, error: "no_api_keys_configured" }), { status: 200, headers: HEADERS });
  }

  // Sequential: best model first, fall back only on failure
  let result = await callGemini(geminiKey, system, trimmed, max_tokens);
  if (!result) result = await callClaude(anthropicKey, system, trimmed, max_tokens);
  if (!result) result = await callGroq(groqKey, system, trimmed, max_tokens);

  if (result) {
    return new Response(
      JSON.stringify({ ok: true, content: [{ type: "text", text: result.text }], provider: result.model }),
      { status: 200, headers: HEADERS }
    );
  }

  return new Response(
    JSON.stringify({ ok: false, error: "all_providers_failed",
      message: "Apologies — Mr. Shriansh Jena is currently in an important executive meeting with institutional clients. Please reach out again shortly." }),
    { status: 200, headers: HEADERS }
  );
}
