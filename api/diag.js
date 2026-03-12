export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: "no key" });
  
  // Test different API versions
  const tests = [
    // v1 API (newer)
    ["v1/gemini-2.0-flash", "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent"],
    ["v1/gemini-1.5-pro", "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent"],
    ["v1/gemini-1.5-flash", "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"],
    ["v1/gemini-2.0-flash-exp", "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent"],
    // v1beta with correct names
    ["v1beta/gemini-2.0-flash-exp", "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"],
    ["v1beta/gemini-1.5-pro-exp-0827", "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-exp-0827:generateContent"],
  ];
  
  const results = {};
  for (const [label, url] of tests) {
    try {
      const r = await fetch(`${url}?key=${key}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ contents:[{parts:[{text:"Say: OK"}]}], generationConfig:{maxOutputTokens:5} }),
        signal: AbortSignal.timeout(8000)
      });
      const d = await r.json();
      if (d.error) results[label] = `❌ ${d.error.status}: ${d.error.message.slice(0,70)}`;
      else results[label] = `✅ ${d?.candidates?.[0]?.content?.parts?.[0]?.text}`;
    } catch(e) { results[label] = `⏱ ${e.message}`; }
  }
  return res.json(results);
}
