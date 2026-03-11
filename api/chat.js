export const config = { runtime: "edge" };

// Uses Hugging Face's free Serverless Inference API (OpenAI-compatible endpoint)
// Model: Qwen2.5-72B-Instruct — strong reasoning, great for financial analysis
// Fallback: Qwen2.5-7B-Instruct if 72B is unavailable

const MODELS = [
  "Qwen/Qwen2.5-72B-Instruct",
  "Qwen/Qwen2.5-7B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
];

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405 });
  }

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    return new Response(
      JSON.stringify({ ok: false, content: [{ type: "text", text: "HF_TOKEN not configured." }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), { status: 400 });
  }

  const { system, messages, max_tokens } = body;

  const hfMessages = [
    { role: "system", content: system || "You are a helpful assistant." },
    ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
  ];

  // Try each model in order, return first success
  for (const model of MODELS) {
    try {
      const upstream = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${hfToken}`,
        },
        body: JSON.stringify({
          model,
          messages: hfMessages,
          max_tokens: max_tokens || 1000,
          temperature: 0.7,
          stream: false,
        }),
      });

      const data = await upstream.json();

      if (data?.choices?.[0]?.message?.content) {
        const text = data.choices[0].message.content;
        return new Response(
          JSON.stringify({ ok: true, content: [{ type: "text", text }] }),
          { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }

      // If this model failed with a "loading" error, don't try next model — it needs a retry
      if (data?.error) {
        const errMsg = typeof data.error === "string" ? data.error : (data.error?.message || "");
        if (errMsg.includes("loading") || errMsg.includes("currently loading")) {
          // Model cold-start — pass this through as a soft error so frontend shows retry message
          return new Response(
            JSON.stringify({ ok: true, content: [{ type: "text", text: "⏳ Shri is just logging in — please send your question again in about 20 seconds." }] }),
            { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }
      }
      // Any other error with this model → try next model in list
    } catch {
      // Network error with this model → try next
      continue;
    }
  }

  // All models failed
  return new Response(
    JSON.stringify({ ok: false, content: [{ type: "text", text: "" }] }),
    { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
}
