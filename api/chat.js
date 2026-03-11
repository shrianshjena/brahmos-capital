export const config = { runtime: "edge" };

// Uses Hugging Face's free Serverless Inference API (OpenAI-compatible endpoint)
// Model: Qwen2.5-72B-Instruct — strong reasoning, great for financial analysis, free tier
// Get token: huggingface.co → Settings → Access Tokens → New token (READ scope)
// Set in Vercel: Settings → Environment Variables → HF_TOKEN

const MODEL = "Qwen/Qwen2.5-72B-Instruct";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    return new Response(
      JSON.stringify({ content: [{ type: "text", text: "⚠️ HF_TOKEN not set. Please add your Hugging Face token to Vercel environment variables." }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { system, messages, max_tokens } = body;

  // Build OpenAI-compatible messages array with system prompt
  const hfMessages = [
    { role: "system", content: system || "You are a helpful assistant." },
    ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
  ];

  const hfBody = {
    model: MODEL,
    messages: hfMessages,
    max_tokens: max_tokens || 1000,
    temperature: 0.7,
    stream: false,
  };

  try {
    const upstream = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${hfToken}`,
      },
      body: JSON.stringify(hfBody),
    });

    const data = await upstream.json();

    let text = "Sorry, I couldn't generate a response. Please try again.";
    if (data?.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    } else if (data?.error) {
      const errMsg = typeof data.error === "string" ? data.error : data.error?.message || JSON.stringify(data.error);
      // Model loading — tell user to retry in a few seconds
      if (errMsg.includes("loading") || errMsg.includes("503")) {
        text = "⏳ Model is warming up (takes ~20 seconds on first request). Please send your message again in a moment.";
      } else {
        text = `API Error: ${errMsg}`;
      }
    }

    return new Response(
      JSON.stringify({ content: [{ type: "text", text }] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ content: [{ type: "text", text: `Network error: ${err.message}` }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
