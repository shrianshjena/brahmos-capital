/**
 * Ask Shri — AI Chat Backend  v6  (100% free APIs, serverless runtime)
 *
 * Priority chain (accuracy first, all free):
 *   1. Gemini 1.5 Pro   — best financial reasoning, FREE 1500 req/day
 *   2. Gemini 2.0 Flash — faster Gemini fallback
 *   3. Gemini 1.5 Flash — lightest Gemini fallback
 *   4. Groq Llama 70B   — FREE 30 req/min, never expires
 *
 * Runtime: SERVERLESS (not edge) — allows 30s maxDuration config in vercel.json
 * Sequential providers with 12s timeout each — fits within 30s function limit
 *
 * Env vars (Vercel → Settings → Environment Variables):
 *   GEMINI_API_KEY  — aistudio.google.com/apikey   FREE, no card needed
 *   GROQ_API_KEY    — console.groq.com              FREE, never expires
 */

const TIMEOUT_MS = 12000; // 12s per provider — 2 attempts fit in 30s window

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// ── Provider 1: Google Gemini (primary — best financial accuracy) ─────────────
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
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
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
          }
        ),
        TIMEOUT_MS
      );
      const data = await res.json();
      if (data.error) {
        console.error(`Gemini ${model} error:`, data.error.message);
        continue;
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 30) return { text, model: `gemini/${model}` };
    } catch (e) {
      console.error(`Gemini ${model} exception:`, e.message);
      continue;
    }
  }
  return null;
}

// ── Provider 2: Groq Llama 70B (reliable free fallback) ──────────────────────
async function callGroq(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
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
      if (data.error) { console.error("Groq error:", data.error); continue; }
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.length > 30) return { text, model: `groq/${model}` };
    } catch (e) { console.error("Groq exception:", e.message); continue; }
  }
  return null;
}

// ── Main handler (serverless) ─────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch { return res.status(400).json({ ok: false, error: "invalid_json" }); }

  const { system = "", messages = [], max_tokens = 1000 } = body;
  const trimmed = messages.slice(-10);

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    return res.status(200).json({ ok: false, error: "no_api_keys_configured" });
  }

  // Sequential: best model first
  let result = await callGemini(geminiKey, system, trimmed, max_tokens);
  if (!result) result = await callGroq(groqKey, system, trimmed, max_tokens);

  if (result) {
    return res.status(200).json({
      ok: true,
      content: [{ type: "text", text: result.text }],
      provider: result.model,
    });
  }

  return res.status(200).json({
    ok: false,
    error: "all_providers_failed",
    message: "Apologies — Mr. Shriansh Jena is currently in an important executive meeting with institutional clients. Please reach out again shortly.",
  });
}

// Node.js body reader for serverless (req is IncomingMessage, not Request)
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
