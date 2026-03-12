// Check which Gemini models have remaining quota right now
export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  const results = {};
  // Test each model with minimal tokens
  for (const model of ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"]) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            contents:[{parts:[{text:"Say: OK"}]}],
            generationConfig:{maxOutputTokens:10, temperature:0},
            // Disable thinking for 2.5 models to avoid token overhead
            ...(model.includes("2.5") ? {generationConfig:{thinkingConfig:{thinkingBudget:0},maxOutputTokens:10,temperature:0}} : {})
          }),
          signal: AbortSignal.timeout(8000) }
      );
      const d = await r.json();
      if (d.error) { results[model] = `EXHAUSTED: ${d.error.status}`; }
      else {
        const parts = d?.candidates?.[0]?.content?.parts || [];
        const text = parts.filter(p=>!p.thought).map(p=>p.text||"").join("").trim();
        results[model] = `OK: "${text}"`;
      }
    } catch(e) { results[model] = `ERROR: ${e.message}`; }
  }
  return res.json(results);
}
