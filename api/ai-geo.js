// Serverless function — generates geopolitical event cards from live news

const HF_MODEL = "Qwen/Qwen2.5-7B-Instruct";

async function fetchGeoNews() {
  const feeds = [
    "https://news.google.com/rss/search?q=India+defence+geopolitical+military&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=Iran+war+Ukraine+Taiwan+conflict+2026&hl=en&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=India+defence+budget+export+BrahMos&hl=en-IN&gl=IN&ceid=IN:en",
  ];
  const results = await Promise.allSettled(feeds.map(url =>
    fetch(url).then(r => r.text()).catch(() => "")
  ));
  const allTitles = new Set();
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const matches = [...r.value.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)];
    matches.forEach(m => {
      const t = m[1];
      if (!t.includes("Google News") && t.length > 20) allTitles.add(t);
    });
  }
  return [...allTitles].slice(0, 20);
}

export default async function handler(req, res) {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) return res.status(500).json({ ok: false, error: "HF_TOKEN not set" });

  const headlines = await fetchGeoNews();
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

  const headlineStr = headlines.length > 0
    ? headlines.map((h,i) => `${i+1}. ${h}`).join("\n")
    : "No live headlines. Use your knowledge of current events as of 2026.";

  const prompt = `You are a geopolitical risk analyst for Indian defence stocks. Today is ${today}.

Based on these news headlines:
${headlineStr}

Generate 8 geopolitical event cards relevant to Indian defence sector. Return ONLY a raw JSON array — no markdown, no explanation.

[
  {
    "id": 1,
    "title": "Concise event title",
    "region": "Middle East",
    "impact": "ACTIVE WAR",
    "score": 9,
    "date": "${today}",
    "hot": true,
    "detail": "2-3 sentence analysis of what this means for Indian defence stocks specifically. Mention specific companies or sectors that benefit.",
    "tickers": ["BDL","HAL"],
    "colorType": "red"
  }
]

Rules:
- impact must be one of: ACTIVE WAR, ESCALATING, YEAR 4, RISING RISK, BULLISH, LT BULL, NEUTRAL
- colorType: red for war/conflict, orange for escalating, blue for ongoing, green for India bullish, teal for long-term
- hot: true only for ACTIVE WAR or ESCALATING
- score: 1-10 impact on Indian defence stocks
- tickers: relevant portfolio tickers from: HAL,BEL,MAZDOCK,COCHINSHIP,GRSE,BDL,DATAPATTNS,PARAS,ZENTEC,SOLARINDS,MTAR,BHARATFORG,ASTRAMICRO,BEML,APOLLOMICRO,MIDHANI,IDEAFORGE,PREMEXPLN,UNIMECH,PTCIND,DCXINDIA,DYNAMATECH,AVANTEL,AXISCADES,CYIENTDLM,SECTOR
- Include a mix: conflicts, India policy/budget events, export deals, tech programmes
- Return ONLY the JSON array. Nothing else.`;

  try {
    const hfRes = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${hfToken}` },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [{ role:"user", content: prompt }],
        max_tokens: 1800,
        temperature: 0.5,
        stream: false,
      }),
    });

    const data = await hfRes.json();
    let raw = data?.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();

    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array in response");
    const events = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(events)) throw new Error("Not an array");

    res.setHeader("Cache-Control", "s-maxage=7200, stale-while-revalidate=1800");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ ok: true, events, generatedAt: today });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
