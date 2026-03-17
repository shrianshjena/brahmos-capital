/**
 * Ask Shri — AI Chat Backend  v9  (100% free APIs, serverless)
 *
 * CRITICAL FIX: systemPrompt uses Gemini's native systemInstruction field
 * (never dropped in multi-turn). Groq is PRIMARY — it correctly uses date
 * context. Gemini is fallback (refuses to acknowledge provided dates).
 *
 * Priority: Groq Llama 70B → Groq 8B → Gemini 2.0 Flash → Gemini 2.5 Flash
 */

const TIMEOUT_MS = 25000;

function buildDateContext() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dd   = String(ist.getUTCDate()).padStart(2, "0");
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mm   = MONTHS[ist.getUTCMonth()];
  const yyyy = ist.getUTCFullYear();
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const day  = DAYS[ist.getUTCDay()];
  const dateStr = `${dd} ${mm} ${yyyy}`;
  const isWeekend = day === "Saturday" || day === "Sunday";

  return `\
━━━ MANDATORY CONTEXT ━━━
DATE: ${day}, ${dateStr} (IST)
NSE: ${isWeekend ? "CLOSED (weekend)" : "Open / closed 15:30 IST"}
INSTRUCTION: The portfolio system reports today as ${dateStr}. When asked the date, respond: "${dateStr}". Do not say you lack a real-time clock.
MACRO (${dateStr}): US-Iran war (Op Epic Fury, 28 Feb 2026) — Strait of Hormuz disrupted. India FY27 defence budget ₹7.85L Cr (+15.2%). Indonesia BrahMos deal $375M finalised. Nifty 50 fell 9.2% on 13 Mar 2026. India defence index outperforming YTD.
━━━━━━━━━━━━━━━━━━━━━━━━━

`;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// Groq: system role always sent separately — correct and reliable
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
            model,
            max_tokens: maxTokens,
            temperature: 0.4,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
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

// Gemini: uses systemInstruction field (never silently dropped in multi-turn)
async function callGemini(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;

  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  // Gemini requires: starts with user, alternating roles
  while (contents.length && contents[0].role === "model") contents.shift();
  const merged = [];
  for (const c of contents) {
    if (merged.length && merged[merged.length-1].role === c.role) {
      merged[merged.length-1].parts[0].text += "\n" + c.parts[0].text;
    } else { merged.push(c); }
  }
  if (!merged.length) return null;

  const modelConfigs = [
    { model: "gemini-2.0-flash",      genConfig: { maxOutputTokens: maxTokens, temperature: 0.4 } },
    { model: "gemini-2.0-flash-lite", genConfig: { maxOutputTokens: maxTokens, temperature: 0.4 } },
    { model: "gemini-2.5-flash",      genConfig: { maxOutputTokens: maxTokens, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } } },
  ];

  for (const { model, genConfig } of modelConfigs) {
    try {
      const res = await withTimeout(
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: merged,
            generationConfig: genConfig,
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }),
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ ok: false });

  const { system = "", messages = [], max_tokens = 1000 } = req.body || {};
  const trimmed = messages.slice(-10);

  // Server-side date injected on every request — cannot be stale
  const enrichedSystem = buildDateContext() + system;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) return res.status(200).json({ ok: false, error: "no_api_keys" });

  // Groq PRIMARY: correctly uses date context, no "no real-time clock" refusals
  // Gemini FALLBACK: systemInstruction ensures context reaches model even in multi-turn
  let result = await callGroq(groqKey, enrichedSystem, trimmed, max_tokens);
  if (!result) result = await callGemini(geminiKey, enrichedSystem, trimmed, max_tokens);

  if (result) {
    return res.status(200).json({ ok: true, content: [{ type: "text", text: result.text }], provider: result.model });
  }

  return res.status(200).json({
    ok: false,
    error: "all_providers_failed",
    message: "Apologies — Mr. Shriansh Jena is currently in an important executive meeting with institutional clients. Please reach out again shortly.",
  });
}
