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
          contents: [{ parts: [{ text: "Write a 3-paragraph analysis of HAL stock with specific numbers for: valuation, order book, and 12-month price target." }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
        })
      }
    );
    const d = await r.json();
    const candidate = d?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const allParts = parts.map((p, i) => ({ 
      index: i, 
      hasThought: !!p.thought, 
      textLength: (p.text||"").length,
      textPreview: (p.text||"").slice(0, 100)
    }));
    const filteredText = parts.filter(p => !p.thought).map(p => p.text||"").join("").trim();
    
    return res.json({
      finishReason: candidate?.finishReason,
      numParts: parts.length,
      allParts,
      filteredTextLength: filteredText.length,
      filteredTextPreview: filteredText.slice(0, 300),
      usageMetadata: d?.usageMetadata,
    });
  } catch(e) { return res.json({ error: e.message }); }
}
