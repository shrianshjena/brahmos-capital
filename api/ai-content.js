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
  HAL:31.4,BEL:49.1,MAZDOCK:38.2,COCHINSHIP:53.8,GRSE:43.5,BDL:105.4,DATAPATTNS:83.2,
  PARAS:78.2,ZENTEC:77.7,SOLARINDS:99.0,MTAR:237.4,BHARATFORG:84.6,ASTRAMICRO:65.3,BEML:101.5,
  APOLLOMICRO:138.7,MIDHANI:58.6,IDEAFORGE:null,PREMEXPLN:76.7,UNIMECH:80.2,PTCIND:283.3,DCXINDIA:null,
  DYNAMATECH:214.6,AVANTEL:326.2,AXISCADES:100.0,CYIENTDLM:50.3,
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
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
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
          stream:false,
          response_format: { type: "json_object" }
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
    return `${t}:₹${Math.round(px)} ret${ret}% pe${PE[t]??"NM"}`;
  }).join(" | ");

  const headlineStr = headlines.length > 0
    ? headlines.map((h,i) => `${i+1}. ${h}`).join("\n")
    : "No live headlines available.";

  const prompt = `Today is ${today}. NSE trades Mon–Fri, closing 15:30 IST.
You have full knowledge of events as of 2 June 2026, including:
- India–Vietnam BrahMos export deal SIGNED 30 May 2026 (~₹60,000 Cr / $629M, Block-3) at the Shangri-La Dialogue; Indonesia pact in final stages — bullish for BDL, HAL, BEL
- FY26 results: HAL record order book ₹2.54L Cr + ₹9,115 Cr PAT, FY27 guidance 10–12% rev growth / 30–31% EBITDA; BEL FY26 revenue ₹27,480 Cr / PAT ₹6,048 Cr / order book ₹73,882 Cr / ROE ~29%
- Operation Epic Fury (US–Iran war) now under a FRAGILE ceasefire — Brent eased to ~$95/bbl from ~$120 April peak; Israeli strikes in Lebanon, Iran threatening to close the Strait of Hormuz
- Ukraine war in year 4 — on-off ceasefire talks; continued NATO/European rearmament
- India FY27 defence budget ₹7.85L Cr (+15.2%); defence exports crossed ₹21,000+ Cr toward ₹50,000 Cr FY29 target
- Nifty India Defence index ~8,900 (mid-May), outperforming Nifty 50 YTD; sector valuations rich (P/E ~52) but backed by record order books
- Broker targets: HAL ₹4,800–6,360, BEL ₹450–500, MAZDOCK ~₹2,850

Analyse this NSE defence portfolio and return ONLY a valid JSON object — no markdown, no explanation, just the raw JSON.

PORTFOLIO DATA:
${stockLines}

RECENT NEWS:
${headlineStr}

Return this exact JSON structure:
{
  "signals": [
    {"id":1,"ticker":"HAL","type":"STRONG BUY","cat":"Gov","conf":88,"date":"${today}","title":"MoD Rs.5,200 Cr Helicopter Order","detail":"Ministry of Defence cleared 12 ALH Mk-IV helicopters worth Rs.5,200 Cr. Order book now exceeds Rs.1.1L Cr with 7-year revenue visibility."},
    {"id":2,"ticker":"BDL","type":"BUY","cat":"Geo","conf":81,"date":"${today}","title":"Iran Conflict Boosts Missile Demand","detail":"Escalating Middle East conflict accelerating Akash and Astra missile orders. BDL Q3 order inflows up 34% YoY with DRDO clearance for next-gen torpedoes."},
    ...generate 8-10 signals total with SPECIFIC, REAL-SOUNDING titles and details referencing actual numbers, order values, P/E levels, order book figures, and current geo-political events. Types: STRONG BUY / BUY / HOLD / REDUCE / WATCH...
  ],
  "consensus": {
    "HAL":{"buy":20,"hold":5,"sell":2,"target":5300,"brokers":["Motilal","HDFC Sec","Kotak","Nomura","CLSA"]},
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
    // Strip ALL control characters (including literal newlines/tabs) from raw.
    // Groq Llama sometimes emits raw \n inside JSON string values.
    // Replacing them all with spaces is safe — detail fields remain readable.
    raw = raw.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, " ")  // strip ctrl except \n
             .replace(/\r\n|\r/g, " ")                              // normalise line endings
             .replace(/\n/g, " ");                                   // flatten all newlines
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
