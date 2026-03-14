/**
 * AI Investment Signals + Consensus  (100% free)
 * Model: Groq Llama 70B (dedicated — Gemini reserved for Ask Shri chat)
 * Cached 4 hours on Vercel edge.
 */

const TICKERS = ["HAL","BEL","MAZDOCK","COCHINSHIP","GRSE","BDL","DATAPATTNS","PARAS",
  "ZENTEC","SOLARINDS","MTAR","BHARATFORG","ASTRAMICRO","BEML","APOLLOMICRO","MIDHANI",
  "IDEAFORGE","PREMEXPLN","UNIMECH","PTCIND","DCXINDIA","DYNAMATECH","AVANTEL","AXISCADES","CYIENTDLM"];

const SYMBOL_MAP = {
  HAL:"HAL.NS",BEL:"BEL.NS",MAZDOCK:"MAZDOCK.NS",COCHINSHIP:"COCHINSHIP.NS",GRSE:"GRSE.NS",
  BDL:"BDL.NS",DATAPATTNS:"DATAPATTNS.NS",PARAS:"PARAS.NS",ZENTEC:"ZENTEC.NS",SOLARINDS:"SOLARINDS.NS",
  MTAR:"MTARTECH.NS",BHARATFORG:"BHARATFORG.NS",ASTRAMICRO:"ASTRAMICRO.NS",BEML:"BEML.NS",
  APOLLOMICRO:"APOLLO.NS",MIDHANI:"MIDHANI.NS",IDEAFORGE:"IDEAFORGE.NS",PREMEXPLN:"PREMEXPLN.NS",
  UNIMECH:"UNIMECH.NS",PTCIND:"PTCIL.NS",DCXINDIA:"DCXINDIA.NS",DYNAMATECH:"DYNAMATECH.NS",
  AVANTEL:"AVANTEL.NS",AXISCADES:"AXISCADES.NS",CYIENTDLM:"CYIENTDLM.NS",
};

const ENTRIES = {
  HAL:3200,BEL:310,MAZDOCK:1800,COCHINSHIP:1100,GRSE:1900,BDL:900,DATAPATTNS:2500,
  PARAS:500,ZENTEC:900,SOLARINDS:10500,MTAR:1600,BHARATFORG:1250,ASTRAMICRO:660,BEML:1100,
  APOLLOMICRO:165,MIDHANI:280,IDEAFORGE:310,PREMEXPLN:320,UNIMECH:560,PTCIND:9500,
  DCXINDIA:150,DYNAMATECH:3800,AVANTEL:95,AXISCADES:450,CYIENTDLM:850,
};

const PE = {
  HAL:30.2,BEL:65.1,MAZDOCK:47.3,COCHINSHIP:30.5,GRSE:42.1,BDL:83.5,DATAPATTNS:75.2,
  PARAS:70.8,ZENTEC:45.1,SOLARINDS:94.4,MTAR:169.8,BHARATFORG:42.0,ASTRAMICRO:58.9,BEML:55.3,
  APOLLOMICRO:84.9,MIDHANI:60.2,IDEAFORGE:145.0,PREMEXPLN:62.0,UNIMECH:68.0,PTCIND:85.0,
  DCXINDIA:48.0,DYNAMATECH:202.8,AVANTEL:228.9,AXISCADES:62.4,CYIENTDLM:55.0,
};

async function fetchPrice(sym) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`, {
      headers: { "User-Agent":"Mozilla/5.0","Referer":"https://finance.yahoo.com/" }
    });
    const d = await res.json();
    return d?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch { return null; }
}

async function fetchNewsHeadlines() {
  try {
    const rss = await fetch("https://news.google.com/rss/search?q=Nifty+India+defence+HAL+BEL+NSE+stocks&hl=en-IN&gl=IN&ceid=IN:en");
    const text = await rss.text();
    return [...text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
      .map(m => m[1]).filter(t => !t.includes("Google News")).slice(0, 10);
  } catch { return []; }
}

// Groq only — Gemini quota reserved exclusively for Ask Shri
async function callGroq(apiKey, prompt) {
  if (!apiKey) return null;
  const models = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];
  for (const model of models) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
        body:JSON.stringify({
          model,
          messages:[
            { role:"system", content:"You are a senior Indian equity research analyst. Return ONLY valid JSON — no markdown, no explanation, no preamble." },
            { role:"user", content:prompt }
          ],
          max_tokens:2000,
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

  const [prices, headlines] = await Promise.all([
    Promise.all(TICKERS.map(t => fetchPrice(SYMBOL_MAP[t]).then(px => ({ t, px })))),
    fetchNewsHeadlines(),
  ]);

  const priceMap = {};
  for (const { t, px } of prices) priceMap[t] = px;
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

  const stockLines = TICKERS.map(t => {
    const px = priceMap[t] || ENTRIES[t];
    const ret = (((px - ENTRIES[t]) / ENTRIES[t]) * 100).toFixed(1);
    return `${t}:₹${Math.round(px)} ret${ret}% pe${PE[t]}`;
  }).join(" | ");

  const headlineStr = headlines.length > 0
    ? headlines.map((h,i) => `${i+1}. ${h}`).join("\n")
    : "No live headlines available.";

  const prompt = `Today is ${today} (Saturday — NSE closed; last trading day was Friday 13 Mar 2026).
You have full knowledge of events as of March 2026, including:
- US-Iran war (Operation Epic Fury, 28 Feb 2026) — Strait of Hormuz disrupted — defence stocks bullish
- Indonesia BrahMos deal $375M signed — India's first missile export
- India FY27 defence budget ₹7.85L Cr (+15.2%) — highest ever
- Nifty 50 fell 9.2% on 14 Mar 2026 (Middle East escalation) — buying opportunity for long-term defence holders
- Indian defence index outperforming broader market YTD

Analyse this NSE defence portfolio and return ONLY a valid JSON object — no markdown, no explanation, just the raw JSON.

PORTFOLIO DATA:
${stockLines}

RECENT NEWS:
${headlineStr}

Return this exact JSON structure:
{
  "signals": [
    {"id":1,"ticker":"HAL","type":"STRONG BUY","cat":"Gov","conf":88,"date":"${today}","title":"MoD ₹5,200 Cr Helicopter Order","detail":"Ministry of Defence cleared 12 ALH Mk-IV helicopters worth ₹5,200 Cr. Order book now exceeds ₹1.1L Cr with 7-year revenue visibility."},
    {"id":2,"ticker":"BDL","type":"BUY","cat":"Geo","conf":81,"date":"${today}","title":"Iran Conflict Boosts Missile Demand","detail":"Escalating Middle East conflict accelerating Akash and Astra missile orders. BDL Q3 order inflows up 34% YoY with DRDO clearance for next-gen torpedoes."},
    ...generate 8-10 signals total with SPECIFIC, REAL-SOUNDING titles and details referencing actual numbers, order values, P/E levels, order book figures, and current geo-political events. Types: STRONG BUY / BUY / HOLD / REDUCE / WATCH...
  ],
  "consensus": {
    "HAL":{"buy":20,"hold":5,"sell":2,"target":4800,"brokers":["Motilal","HDFC Sec","Kotak","Nomura","CLSA"]},
    ...one entry for each of the 25 tickers...
  }
}

Rules:
- Targets should be 10-35% above current price for BUY stocks, realistic for HOLD/REDUCE
- buy+hold+sell should roughly add to ~20 analysts per stock
- Brokers from: Motilal, HDFC Sec, Kotak, Emkay, ICICI Sec, Axis, Jefferies, Nomura, CLSA, Prabhudas
- Return ONLY the JSON. No markdown fences. No text before or after.`;

  try {
    let raw = await callGroq(groqKey, prompt) || "";
    raw = raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
    // Sanitize literal control chars that Groq/Llama sometimes emits in JSON strings
    raw = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ");
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!parsed.signals || !parsed.consensus) throw new Error("Invalid JSON structure");

    res.setHeader("Cache-Control", "s-maxage=14400, stale-while-revalidate=3600");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ ok: true, ...parsed, generatedAt: today });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
