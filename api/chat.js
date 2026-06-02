/**
 * Ask Shri — AI Chat Backend  v9.1  (100% free APIs, serverless)
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
VERIFIED FACTS (${dateStr}) — USE THESE, DO NOT SPECULATE ABOUT OTHER NEWS:
• India–Vietnam BrahMos export deal SIGNED 30 May 2026 at the Shangri-La Dialogue, Singapore
  · Value ~₹60,000 Cr (~$629M), BrahMos Block-3 (290–300 km range), incl. training & logistics
  · Vietnam is the 2nd foreign BrahMos buyer after the Philippines (2022); Indonesia pact in final stages
  · Confirmed by Defence Secretary Rajesh Kumar Singh — big positive for BDL (warhead/propulsion), HAL, BEL
• FY26 RESULTS (reported May 2026):
  · HAL — record order book ₹2.54 lakh Cr (up from ₹1.89L Cr); standalone net profit ₹9,115 Cr (+9.1%); FY27 guidance 10–12% revenue growth, 30–31% EBITDA margin; ~₹97,000 Cr fresh orders in FY26
  · BEL — FY26 revenue ₹27,480 Cr (+16.2%), PAT ₹6,048 Cr (+14.4%), Q4 PAT ₹2,225 Cr, order book ₹73,882 Cr, ROE ~29%, ₹0.55 final dividend
• Operation Epic Fury (US–Iran war, started 28 Feb 2026) now under a FRAGILE CEASEFIRE
  · Brent crude eased to ~$95/bbl from its late-April peak near $120
  · Latest flashpoint: Israeli operations in Lebanon; Iran suspended US communications and is threatening to close the Strait of Hormuz & Bab el-Mandeb; Trump floated an MoU to reopen Hormuz within a week
• Ukraine war in its 4th year — on-off ceasefire talks, durable peace still distant; NATO & European rearmament continuing at pace
• India FY27 Defence Budget ₹7.85L Cr (+15.2% YoY); FY26 MoD outlay was ₹6.81L Cr; India defence exports crossed ₹21,000+ Cr, ₹50,000 Cr FY29 target
• Nifty India Defence index ~8,900 (mid-May 2026) — BEL ~26% and HAL ~24% are the largest index weights; sector outperforming Nifty 50 YTD
• Valuation: HAL ~31x P/E (relative large-cap value), BEL ~49x, MAZDOCK ~47x; broker targets — HAL ₹4,800–6,360, BEL ₹450–500

IMPORTANT: If asked about any news not in this list, acknowledge you don't have that specific information rather than fabricating details.
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
  // Model order: separate quota pools — if one hits daily limit, next still works
  const models = [
    "meta-llama/llama-4-scout-17b-16e-instruct",  // Llama 4 Scout — fresh quota, fast
    "llama-3.3-70b-versatile",                     // Best quality
    "llama-3.1-8b-instant",                        // Fast backup
  ];
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
      if (text && text.length > 3) return { text, model: `groq/${model}` };
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
      if (text && text.length > 3) return { text, model: `gemini/${model}` };
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

  const { system = "", messages = [], max_tokens = 2000 } = req.body || {};
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
