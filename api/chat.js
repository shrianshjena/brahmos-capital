/**
 * Ask Shri — AI Chat Backend  v7  (100% free APIs, serverless)
 *
 * Priority: Gemini 1.5 Pro → Gemini 2.0 Flash → Gemini 1.5 Flash → Groq Llama 70B
 * Sequential (accuracy > speed). 12s timeout per provider.
 *
 * Env vars: GEMINI_API_KEY  (aistudio.google.com)  FREE
 *           GROQ_API_KEY    (console.groq.com)       FREE, never expires
 */

const TIMEOUT_MS = 12000;

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
      ? `${systemPrompt}

${m.content}`
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

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    return res.status(200).json({ ok: false, error: "no_api_keys_configured" });
  }

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
