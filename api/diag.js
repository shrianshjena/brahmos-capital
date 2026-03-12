export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: "no key" });
  
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say: HELLO WORLD" }] }],
          generationConfig: { maxOutputTokens: 50, temperature: 0.4 },
        })
      }
    );
    const raw = await r.text();
    // Return full raw response (first 3000 chars)
    return res.json({ rawLength: raw.length, raw: raw.slice(0, 3000) });
  } catch(e) { return res.json({ error: e.message }); }
}
