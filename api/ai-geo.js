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

// Primary: Groq (gpt-oss). Falls back to Gemini if Groq is unavailable
// (e.g. a model decommission or outage) so the geo feed never goes fully dark.
async function callGroq(apiKey, prompt) {
  if (!apiKey) return null;
  const models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
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
          max_tokens:4000,
          temperature:0.4,
          reasoning_effort:"low",
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

// Fallback only (used when Groq yields nothing). Kept lightweight to preserve
// Gemini quota for Ask Shri under normal operation.
async function callGemini(apiKey, prompt) {
  if (!apiKey) return null;
  const models = ["gemini-2.0-flash", "gemini-2.5-flash"];
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          systemInstruction:{ parts:[{ text:"You are a geopolitical risk analyst for Indian defence stocks. Return ONLY valid JSON — no markdown, no explanation." }] },
          contents:[{ role:"user", parts:[{ text:prompt }] }],
          generationConfig:{ maxOutputTokens:4000, temperature:0.4, thinkingConfig:{ thinkingBudget:0 } },
        }),
      });
      const d = await r.json();
      if (d.error) continue;
      const parts = d?.candidates?.[0]?.content?.parts || [];
      const t = parts.filter(p => !p.thought).map(p => p.text || "").join("").trim();
      if (t && t.length > 100) return t;
    } catch { continue; }
  }
  return null;
}

export default async function handler(req, res) {
  const groqKey   = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!groqKey && !geminiKey) {
    return res.status(500).json({ ok: false, error: "No LLM API key configured" });
  }

  const headlines = await fetchGeoNews();
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const headlineStr = headlines.length > 0
    ? headlines.map((h,i) => `${i+1}. ${h}`).join("\n")
    : "No live headlines. Use your knowledge of current global events as of 2026.";

  const prompt = `Today is ${today}. You are operating with full knowledge of events as of 18 September 2026.

MANDATORY CURRENT EVENTS you must include as cards (order them NEWEST first):
1. Crude Spiked Past $100 to a ~$110 Peak on Iran War; Easing to ~$104, Fed Hiked (18 Sep 2026) — the two weeks to 18 Sep saw the sharpest energy shock of the war. On 8 Sep US CENTCOM destroyed five IRGC oil tankers in Hormuz; on 9 Sep Brent crossed $100 for the first time since July (~$100.19), closing that day with WTI +6.7% at $102.48 and Brent +6.3% at $107.63, as Iran fired missiles at US forces in Jordan and Houthis hit Saudi energy facilities. On 11 Sep the Saudi East-West pipeline was shut. Brent peaked ~$108-110 around 15-16 Sep, easing to ~$103.61 on the 17th and ~$104 on the 18th. On 16 Sep the Fed HIKED 25bp to 3.75-4% (first since 2023) citing oil-driven inflation; US 10y yield touched 5% then eased. Brent ~$104 (+~54% YoY) a serious headwind for India (rupee ~88/$). Sector returns anchored by domestic drivers. colorType red, score 9, hot true.
2. India Defence's Volatile Fortnight: $11bn Arms Approval and Submarine Talks, Then a Sharp Correction (8-17 Sep 2026) — on 8 Sep the govt gave initial approval for ~$11bn of proposed military purchases (BSE Defence index +2.1%, its most in a month, HAL/BEL leading); on 11 Sep the Nifty logged its 8th straight gain with defence rallying after the govt began talks for six next-generation submarines (a P-75I follow-on cascading to Mazagon Dock/GRSE for build and BEL for combat systems). But on 15 Sep the Nifty India Defence index fell ~5.5% to ~9,190 (Solar -14%, HAL/BEL/Solar >half the index weight) as it breached its 2-month MA amid a broad selloff (Sensex -2,200 pts in Sept on ~$104 oil, 5% US yields, hawkish Fed); defence recovered up to 5% on 17 Sep on value buying. Domestic order-pipeline thesis intact. colorType green, score 6, hot false.
2. HAL's Tejas Mk-1A Execution Bottleneck: GE Engine Deliveries Lag (24 Aug 2026) — HAL closed ~₹4,906 on 24 Aug (-1.9%, worst large defence name), ~4.7% below its 17 Aug all-time high of ₹5,149.90, as its Tejas Mk-1A execution stays constrained: ~30 airframes are built, flown and tested but cannot be delivered because only ~6 of 99 GE F404 engines have arrived since 2021. HAL has more signed work than it can execute, while BEL awaits a ₹30,000 Cr QRSAM order to be signed. A reminder that in this sector order-book conversion (not just backlog size) is the key execution variable. colorType orange, score 6, hot false.
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
    let raw = await callGroq(groqKey, prompt);
    if (!raw) raw = await callGemini(geminiKey, prompt);   // fallback if Groq is down
    raw = raw || "";
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
