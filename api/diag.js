export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: "no key" });
  
  // Check quota reset info and available models
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=50`,
      { signal: AbortSignal.timeout(10000) }
    );
    const d = await r.json();
    if (d.error) return res.json({ error: d.error });
    const models = (d.models || []).map(m => ({
      name: m.name,
      supported: m.supportedGenerationMethods,
    }));
    return res.json({ modelCount: models.length, models: models.slice(0, 20) });
  } catch(e) { return res.json({ error: e.message }); }
}
