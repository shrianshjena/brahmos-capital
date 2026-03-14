/**
 * Ask Shri — AI Chat Backend  v8  (100% free APIs, serverless)
 *
 * Priority: Gemini 2.0 Flash → Gemini 2.0 Flash Lite → Gemini 2.5 Flash → Groq Llama 70B
 * Sequential (accuracy > speed). 12s timeout per provider.
 *
 * CRITICAL: Today's date (14 Mar 2026) is injected server-side into EVERY request.
 * Models must NEVER report their training cutoff as "today". The system prompt
 * is enforced here regardless of what the client sends.
 *
 * Env vars: GEMINI_API_KEY  (aistudio.google.com)  FREE
 *           GROQ_API_KEY    (console.groq.com)       FREE, never expires
 */

const TIMEOUT_MS = 12000;

// ── Current date + market context injected into every prompt ─────────────────
// This ensures models never quote their training cutoff as today's date.
function buildDateContext() {
  const now = new Date();
  // Force IST offset (UTC+5:30)
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const dd = String(ist.getUTCDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mm = months[ist.getUTCMonth()];
  const yyyy = ist.getUTCFullYear();
  const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][ist.getUTCDay()];
  const dateStr = `${dd} ${mm} ${yyyy}`;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM CLOCK — MANDATORY CONTEXT
Today is: ${day}, ${dateStr} (IST)
NSE market status: ${["Saturday","Sunday"].includes(day) ? "CLOSED (weekend)" : "Open / Recently closed at 15:30 IST"}
Your knowledge cutoff does NOT define today's date.
If the user asks today's date, you MUST respond: "${dateStr}"
Do NOT say your knowledge only goes up to a certain year — you are operating in real-time with live portfolio data provided below.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT MACRO CONTEXT (as of ${dateStr}):
• US-Israel launched Operation Epic Fury against Iran on 28 Feb 2026 — Strait of Hormuz disrupted
• India FY27 defence budget: ₹7.85L Cr (+15.2% YoY), highest ever
• Indonesia BrahMos deal ~$375M signed Mar 2026
• NSE Nifty 50 crashed ~9.2% on 14 Mar 2026 (Middle East war escalation)
• Nifty India Defence index: +14.5% YTD despite recent correction
• India-Pakistan LoC ceasefire holding; India accelerating indigenisation
• Global defence spend: $2.65T at 8.6% CAGR — India among top 5 importers moving to exporter

`;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function callGemini(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;

  const contents = messages.map((m, i) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: i === 0 && m.role === "user"
      ? `${systemPrompt}\n\n${m.content}`
      : m.content }],
  }));
  if (!contents.length) return null;

  // Model order: highest daily quota first, then quality fallbacks
  // gemini-2.0-flash:      1500 req/day — primary workhorse
  // gemini-2.0-flash-lite: 1500 req/day — fast backup
  // gemini-2.5-flash:        20 req/day — emergency only, thinking disabled
  const modelConfigs = [
    { model: "gemini-2.0-flash",       genConfig: { maxOutputTokens: maxTokens, temperature: 0.4 } },
    { model: "gemini-2.0-flash-lite",  genConfig: { maxOutputTokens: maxTokens, temperature: 0.4 } },
    { model: "gemini-2.5-flash",       genConfig: { maxOutputTokens: maxTokens, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } } },
  ];

  for (const { model, genConfig } of modelConfigs) {
    try {
      const res = await withTimeout(
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: genConfig,
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
      if (data.error) continue;
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.filter(p => !p.thought).map(p => p.text || "").join("").trim();
      if (text && text.length > 30) return { text, model: `gemini/${model}` };
    } catch { continue; }
  }
  return null;
}

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
      if (data.error) continue;
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.length > 30) return { text, model: `groq/${model}` };
    } catch { continue; }
  }
  return null;
}

// Vercel serverless — req.body is auto-parsed from JSON
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  // Vercel auto-parses JSON body — just use req.body directly
  const { system = "", messages = [], max_tokens = 1000 } = req.body || {};
  const trimmed = messages.slice(-10);

  // ── CRITICAL: Prepend current date + macro context server-side ────────────
  // This overrides any stale date from the model's training data.
  // The client system prompt (which has live portfolio data) follows after.
  const enrichedSystem = buildDateContext() + system;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    return res.status(200).json({ ok: false, error: "no_api_keys_configured" });
  }

  let result = await callGemini(geminiKey, enrichedSystem, trimmed, max_tokens);
  if (!result) result = await callGroq(groqKey, enrichedSystem, trimmed, max_tokens);

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
