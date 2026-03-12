// Quick test — does GEMINI_API_KEY exist and does it work?
export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  const groq = process.env.GROQ_API_KEY;
  
  const hasGemini = !!key;
  const hasGroq = !!groq;
  const keyPrefix = key ? key.slice(0, 8) + "..." : "NOT SET";
  
  // Try a minimal Gemini call
  let geminiStatus = "not_tested";
  if (key) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        { method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ contents:[{parts:[{text:"Say: OK"}]}], generationConfig:{maxOutputTokens:5} }) }
      );
      const d = await r.json();
      if (d.error) geminiStatus = `error: ${d.error.message}`;
      else geminiStatus = `ok: ${d?.candidates?.[0]?.content?.parts?.[0]?.text}`;
    } catch(e) { geminiStatus = `exception: ${e.message}`; }
  }
  
  return res.json({ hasGemini, hasGroq, keyPrefix, geminiStatus });
}
