export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: "no key" });
  
  const modelsToTest = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro-002",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-2.5-pro-preview-03-25",
  ];
  
  const results = {};
  for (const model of modelsToTest) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ contents:[{parts:[{text:"Say: OK"}]}], generationConfig:{maxOutputTokens:5} }),
          signal: AbortSignal.timeout(6000) }
      );
      const d = await r.json();
      if (d.error) results[model] = `❌ ${d.error.status}: ${d.error.message.slice(0,60)}`;
      else results[model] = `✅ ${d?.candidates?.[0]?.content?.parts?.[0]?.text}`;
    } catch(e) { results[model] = `⏱ ${e.message}`; }
  }
  return res.json(results);
}
