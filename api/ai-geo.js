/**
 * Geopolitical Event Cards  (100% free)
 * Model: Groq Llama 70B (dedicated — Gemini reserved for Ask Shri chat)
 * Cached 1 hour on Vercel edge.
 */

async function fetchGeoNews() {
  const feeds = [
    "https://news.google.com/rss/search?q=Iran+war+India+defence+2026&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=Ukraine+Taiwan+nato+conflict+2026&hl=en&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=India+defence+budget+export+BrahMos+Tejas&hl=en-IN&gl=IN&ceid=IN:en",
  ];
  const results = await Promise.allSettled(feeds.map(url => fetch(url).then(r => r.text()).catch(() => "")));
  const allTitles = new Set();
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    [...r.value.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
      .forEach(m => { if (!m[1].includes("Google News") && m[1].length > 20) allTitles.add(m[1]); });
  }
  return [...allTitles].slice(0, 20);
}

// Groq only — Gemini quota reserved exclusively for Ask Shri
async function callGroq(apiKey, prompt) {
  if (!apiKey) return null;
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  for (const model of models) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
        body:JSON.stringify({
          model,
          messages:[
            { role:"system", content:"You are a geopolitical risk analyst for Indian defence stocks. Return ONLY valid JSON — no markdown, no explanation." },
            { role:"user", content:prompt }
          ],
          max_tokens:2500,
          temperature:0.4,
          stream:false
        }),
      });
      const d = await r.json();
      if (d.error) continue;
      const t = d?.choices?.[0]?.message?.content;
      if (t && t.length > 100) return t;
    } catch { continue; }
  }
  return null;
}

export default async function handler(req, res) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ ok: false, error: "GROQ_API_KEY not configured" });
  }

  const headlines = await fetchGeoNews();
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const headlineStr = headlines.length > 0
    ? headlines.map((h,i) => `${i+1}. ${h}`).join("\n")
    : "No live headlines. Use your knowledge of current global events as of 2026.";

  const prompt = `Today is ${today}. You are operating with full knowledge of events as of 3 June 2026.

MANDATORY CURRENT EVENTS you must include as cards (order them NEWEST first):
1. India–Vietnam BrahMos Deal Signed (30 May 2026, Shangri-La Dialogue, Singapore) — ~₹60,000 Cr (~$629M) BrahMos Block-3 export; Indonesia pact in final stages; Vietnam is 2nd foreign buyer after Philippines (2022). Major positive for BDL, HAL, BEL. colorType green, score 9.
2. FY26 Results Season (May 2026) — HAL record order book ₹2.54L Cr + ₹9,115 Cr PAT; BEL FY26 revenue ₹27,480 Cr / PAT ₹6,048 Cr / order book ₹73,882 Cr. Structural execution story intact. colorType green, score 8.
3. Operation Epic Fury — Fragile US–Iran Ceasefire (started 28 Feb 2026; ceasefire now fragile as of Jun 2026) — Brent eased to ~$95/bbl from ~$120 April peak; Israeli operations in Lebanon, Iran threatening to close Strait of Hormuz & Bab el-Mandeb; Trump floats MoU to reopen Hormuz within a week. colorType red/orange, score 9, hot true.
4. Ukraine War Year 4 (2026) — on-off ceasefire talks, durable peace distant; NATO & European rearmament continuing at pace, sustained military aid. colorType blue, score 7.
5. India FY27 Defence Budget ₹7.85L Cr (+15.2% YoY) — largest ever; ₹50,000 Cr export target by FY29; defence exports already crossed ₹21,000+ Cr. colorType green, score 8.
6. DAC / CCS Procurement Momentum (2026) — Navy cleared 200+ BrahMos (~₹19,000 Cr); DAC approvals spanning mid-air refuellers, torpedoes, air-defence radars, additional S-400 units, transport aircraft and UCAV squadrons. BEL/HAL/BDL/MDL beneficiaries. colorType green, score 8.
7. Nifty India Defence Index Leadership (mid-2026) — index ~8,900, BEL ~26% & HAL ~24% top weights, outperforming Nifty 50 YTD; valuations rich (sector P/E ~52) but supported by record order books. colorType teal, score 7.

Additional context from today's news headlines:
${headlineStr}

Generate 8 geopolitical event cards relevant to Indian defence stocks, ordered NEWEST date first. Return ONLY a raw JSON array.

[
  {
    "id": 1,
    "title": "Concise event title",
    "region": "Middle East",
    "impact": "ACTIVE WAR",
    "score": 9,
    "date": "28 Feb 2026",
    "hot": true,
    "detail": "2-3 sentence analysis of what this means for Indian defence stocks specifically. Mention specific companies or sectors that benefit.",
    "tickers": ["BDL","HAL"],
    "colorType": "red"
  }
]

Rules:
- impact: ACTIVE WAR / ESCALATING / YEAR 4 / RISING RISK / BULLISH / LT BULL / NEUTRAL
- colorType: red=war, orange=escalating, blue=ongoing, green=India bullish, teal=long-term
- hot: true only for ACTIVE WAR or ESCALATING
- score: 1-10 impact on Indian defence stocks
- tickers from: HAL,BEL,MAZDOCK,COCHINSHIP,GRSE,BDL,DATAPATTNS,PARAS,ZENTEC,SOLARINDS,MTAR,BHARATFORG,ASTRAMICRO,BEML,APOLLOMICRO,MIDHANI,IDEAFORGE,PREMEXPLN,UNIMECH,PTCIND,DCXINDIA,DYNAMATECH,AVANTEL,AXISCADES,CYIENTDLM,SECTOR
- Include a mix: active conflicts, India policy/budget, export deals, tech programmes
- Return ONLY the JSON array. Nothing else.`;

  try {
    let raw = await callGroq(groqKey, prompt) || "";
    raw = raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
    // Sanitize literal control chars that Groq/Llama sometimes emits in JSON strings
    raw = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ");
    const start = raw.indexOf("[");
    const end   = raw.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array in response");
    const events = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(events)) throw new Error("Not an array");

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ ok: true, events, generatedAt: today });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
