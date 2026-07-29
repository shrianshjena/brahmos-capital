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
  HAL:33.7,BEL:46.1,MAZDOCK:36.0,COCHINSHIP:52.3,GRSE:43.7,BDL:110.3,DATAPATTNS:91.2,
  PARAS:111.1,ZENTEC:82.2,SOLARINDS:97.2,MTAR:169.6,BHARATFORG:96.6,ASTRAMICRO:87.5,BEML:105.5,
  APOLLOMICRO:122.0,MIDHANI:56.5,IDEAFORGE:null,PREMEXPLN:78.0,UNIMECH:96.1,PTCIND:264.6,DCXINDIA:null,
  DYNAMATECH:217.1,AVANTEL:375.4,AXISCADES:92.9,CYIENTDLM:65.7,
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
You have full knowledge of events as of 29 July 2026, including:
- US-IRAN (diplomacy gaining, volatile, 29 Jul): US paused strikes, Iran ceased retaliation; Trump 'good talks'/'good chance' of resolution; Oman proposed a joint Hormuz mechanism (Iran voluntary transit fees), Gulf support. Brent hit ~$81 Tue then rebounded to ~$88 Wed on a fresh Iranian attack on US troops. Caspian Pipeline resumed. Durable de-escalation would cool the war premium.
- Q1 FY27 RESULTS (27 Jul): BEL net profit ₹1,054 Cr (+8.7% YoY), revenue +25% YoY, FY27 margin guide 27%+ reiterated; Zen fell ~9% on an earnings miss. QRSAM expected Q2 FY27.
- CATALYST: MOFSL expects BEL to win the ~₹30,000 Cr QRSAM order within weeks; cascades to BDL, ASTRAMICRO, APOLLOMICRO. BROKER SPLIT: Kotak SELL Mazagon (₹1,950)/Solar (₹10,300), REDUCE BEL, ADD HAL (₹4,810); Antique Buy across the board. Stock selection > sector beta.
- DAC PROCUREMENT (3 Jul): DAC (Rajnath Singh) cleared ~₹52,000 Cr (further ~₹79,000 Cr referenced) — air-defence, unmanned/ISR, localisation — lifting the sector. Post-DAC: B&K Buy BEL (₹513)/HAL, Hold BDL; ICICI picks BEL/HAL/Astra/Solar (Buy PTC ₹21,000); Antique HAL ₹6,356, BEL ₹454, Solar ₹16,600, MDL ₹3,856. India FY26 defence production record ₹1.78L Cr.
- MARKET: defence sector rebounded sharply on 12 Jun (MTAR +13% recovering its Bloom Energy drop, PARAS +11%, DATAPATTNS +8%) after the 11 Jun profit-booking selloff. India structural drivers intact and independent of the ceasefire.
- P-75I stealth submarine programme approved by the Ministry of Finance (early Jun 2026) — only CCS sign-off left before the ~₹70,000 Cr Navy order; MAZDOCK front-runner, just delivered 6th & final P-17A frigate
- Order momentum: BEL booked ₹2,100 Cr fresh orders; GRSE launched first of 11 NG-OPVs; ZENTEC lowest bidder on AVNL weapon stations; US cleared $428M FMS to India; FY26 DAC approvals at all-time high
- ICICI Securities (8 Jun): FY27 order build-up to outpace FY26; top picks HAL, Solar Industries, Astra Microwave, BEL; Buy on PTC Industries, MIDHANI
- India–Vietnam BrahMos export deal SIGNED 30 May 2026 (~₹60,000 Cr / $629M, Block-3); Indonesia pact in final stages — bullish for BDL, HAL, BEL, DATAPATTNS, PARAS
- FY26 results: HAL record order book ₹2.54L Cr + ₹9,115 Cr PAT, FY27 guidance 10–12% rev growth / 30–31% EBITDA; BEL FY26 revenue ₹27,480 Cr / PAT ₹6,048 Cr / order book ₹73,882 Cr / ROE ~29%
- Operation Epic Fury (US–Iran war) under a FRAGILE ceasefire — Brent ~$94/bbl (down ~20% from ~$120 April peak); Iran says it ended operations vs Israel; 60-day US–Iran MoU mostly agreed; Hormuz still largely closed
- Ukraine war in year 4 — on-off ceasefire talks; continued NATO/European rearmament
- India FY27 defence budget ₹7.85L Cr (+15.2%); defence exports crossed ₹21,000+ Cr toward ₹50,000 Cr FY29 target
- Nifty India Defence index consolidated off its ~9,400 mid-Jun high as the war premium faded, still outperforming Nifty 50 YTD; sector P/E ~52–54, backed by record order books, record ₹1.78L Cr FY26 production and the 3 Jul DAC clearances
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
