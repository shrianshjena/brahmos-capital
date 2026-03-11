export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not set in Vercel environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { system, messages, max_tokens } = body;

  // Convert Anthropic message format → Gemini format
  const geminiContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const geminiBody = {
    system_instruction: { parts: [{ text: system || "" }] },
    contents: geminiContents,
    generationConfig: { maxOutputTokens: max_tokens || 1000, temperature: 0.7 }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiBody),
  });

  const data = await upstream.json();

  // Convert Gemini response → Anthropic-style response so frontend doesn't change
  let text = "Sorry, I couldn't generate a response. Please try again.";
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = data.candidates[0].content.parts[0].text;
  } else if (data?.error?.message) {
    text = `API Error: ${data.error.message}`;
  }

  return new Response(
    JSON.stringify({ content: [{ type: "text", text }] }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    }
  );
}
