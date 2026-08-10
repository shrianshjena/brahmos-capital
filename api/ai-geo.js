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

  const prompt = `Today is ${today}. You are operating with full knowledge of events as of 10 August 2026.

MANDATORY CURRENT EVENTS you must include as cards (order them NEWEST first):
1. Hormuz Deal Stalls on Iranian Conditions, Brent Rebounds to ~$84 (10 Aug 2026) — last week's optimism cooled: Tehran said its Oman talks were 'nearing agreement' but warned it would NOT mean an immediate reopening, and Iran rejected direct US negotiations for now (citing June-deal breaches), demanding an end to the naval blockade, sanctions relief and war-damage compensation. FM Araghchi said Tehran isn't in direct talks with Washington, contradicting US claims a deal is near. Houthis claimed an attack on Saudi's Jazan refinery; an ADNOC tanker was attacked in Hormuz. Brent climbed back above $84 (3rd straight up session), recovering part of last week's ~7% slide. Sector's own drivers (Budget capex, order pipeline) remain in control. colorType orange, score 7, hot true.
2. Defence Stocks Rally up to 7% on Budget-Capex Hopes; Apollo Micro Wins ₹213 Cr (6 Aug 2026) — HAL, Mazagon Dock and GRSE rose up to 7% in a session on expectations of a 20-25% defence capital-outlay hike in the upcoming Union Budget + strong order pipeline. Apollo Micro Systems won ₹213 Cr of new orders (5 Aug) from DRDO/PSUs/private + empanelment as Prime Development Agency for the indigenous IPREK programme. Watch: HAL reportedly fining GE over a ~$716m engine crisis constraining Tejas Mk-1A production. colorType green, score 7, hot true.
3. DAC Clears ₹52,000 Cr Procurement (3 Jul 2026) — the Defence Acquisition Council (chaired by Rajnath Singh) approved ~₹52,000 Cr of capital acquisitions (further ~₹79,000 Cr referenced by brokers) — air-defence layering, unmanned/ISR, localisation via Buy-and-Make. Nifty India Defence index rose (BDL/BEML/Cochin Shipyard/Paras +2%+). Post-DAC: B&K Buy BEL (₹513)/HAL, Hold BDL; ICICI picks BEL/HAL/Astra/Solar. colorType green, score 8, hot true.
4. P-75I Stealth Submarine Programme Cleared (Jun 2026) — Ministry of Finance approved; only CCS sign-off remains before the ~₹70,000 Cr Navy order. Mazagon Dock (front-runner) delivered the 6th & final P-17A frigate. colorType green, score 8.
5. India Record FY26 Defence Production ₹1.78 Lakh Cr — record domestic output underscores indigenisation and long-term order visibility; alongside record order books it anchors the structural growth runway. colorType green, score 7.
6. India–Vietnam BrahMos Deal Signed (30 May 2026) — ~₹60,000 Cr Block-3 export; Indonesia pact in final stages; Philippines first buyer (2022). Positive for BDL, HAL, BEL, DATAPATTNS, PARAS. colorType green, score 8.
7. FY26 Results (May 2026) — HAL record order book ₹2.54L Cr + ₹9,115 Cr PAT; BEL FY26 revenue ₹27,480 Cr / PAT ₹6,048 Cr / order book ₹73,882 Cr. colorType green, score 7.
8. Ukraine War Year 4 (2026) — on-off ceasefire talks, durable peace distant; NATO & European rearmament continuing. colorType blue, score 7.

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
