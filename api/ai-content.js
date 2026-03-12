// Serverless function (not edge) — needs up to 60s for HF model response
const HF_MODEL = "Qwen/Qwen2.5-7B-Instruct";

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
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent":"Mozilla/5.0","Referer":"https://finance.yahoo.com/" }
    });
    const d = await res.json();
    return d?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch { return null; }
}

async function fetchNewsHeadlines() {
  try {
    const rss = await fetch("https://news.google.com/rss/search?q=India+defence+stocks+NSE&hl=en-IN&gl=IN&ceid=IN:en");
    const text = await rss.text();
    const titles = [...text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
      .map(m => m[1]).filter(t => !t.includes("Google News")).slice(0, 12);
    return titles;
  } catch { return []; }
}

export default async function handler(req, res) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GEMINI_API_KEY;
  const hfToken      = process.env.HF_TOKEN;
  if (!anthropicKey && !geminiKey && !hfToken) {
    return res.status(500).json({ ok: false, error: "No AI API key configured" });
  }

  // Fetch live prices + news in parallel
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
    return `${t}: CMP ₹${Math.round(px)} | Entry ₹${ENTRIES[t]} | Return ${ret}% | P/E ${PE[t]}x`;
  }).join("\n");

  const headlineStr = headlines.length > 0
    ? headlines.map((h,i) => `${i+1}. ${h}`).join("\n")
    : "No live headlines available.";

  const prompt = `You are a senior Indian equity research analyst. Today is ${today}. Analyse this NSE defence portfolio and return ONLY a valid JSON object — no markdown, no explanation, just the raw JSON.

PORTFOLIO DATA:
${stockLines}

RECENT NEWS:
${headlineStr}

Return this exact JSON structure:
{
  "signals": [
    {"id":1,"ticker":"HAL","type":"STRONG BUY","cat":"Gov","conf":88,"date":"${today}","title":"Short title","detail":"2 sentence rationale with specific numbers."},
    ...8 to 10 signals total, covering different tickers and types (STRONG BUY / BUY / HOLD / REDUCE / WATCH)...
  ],
  "consensus": {
    "HAL":{"buy":20,"hold":5,"sell":2,"target":4800,"brokers":["Motilal","HDFC Sec","Kotak","Nomura","CLSA"]},
    ...one entry for each of the 25 tickers: HAL,BEL,MAZDOCK,COCHINSHIP,GRSE,BDL,DATAPATTNS,PARAS,ZENTEC,SOLARINDS,MTAR,BHARATFORG,ASTRAMICRO,BEML,APOLLOMICRO,MIDHANI,IDEAFORGE,PREMEXPLN,UNIMECH,PTCIND,DCXINDIA,DYNAMATECH,AVANTEL,AXISCADES,CYIENTDLM...
  }
}

Rules:
- Targets should be 10-35% above current price for BUY stocks, realistic for HOLD/REDUCE
- buy+hold+sell should roughly add to ~20 analysts per stock
- Brokers from: Motilal, HDFC Sec, Kotak, Emkay, ICICI Sec, Axis, Nuvama, YES Sec, Jefferies, Nomura, CLSA, BOB Cap, Prabhudas, JM Fin, Nirmal Bang, Monarch
- Return ONLY the JSON. No markdown fences. No text before or after.`;

  // Helper: call Claude
  async function callClaude(prompt) {
    if (!anthropicKey) return null;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":anthropicKey,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2800,messages:[{role:"user",content:prompt}]}),
      });
      const d = await r.json();
      return d?.content?.[0]?.text || null;
    } catch { return null; }
  }

  // Helper: call Gemini
  async function callGemini(prompt) {
    if (!geminiKey) return null;
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:2800,temperature:0.4}}),
      });
      const d = await r.json();
      return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch { return null; }
  }

  // Helper: call HuggingFace
  async function callHF(prompt) {
    if (!hfToken) return null;
    try {
      const r = await fetch("https://router.huggingface.co/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${hfToken}`},
        body:JSON.stringify({model:HF_MODEL,messages:[{role:"user",content:prompt}],max_tokens:2500,temperature:0.4,stream:false}),
      });
      const d = await r.json();
      return d?.choices?.[0]?.message?.content || null;
    } catch { return null; }
  }

  try {
    // Try providers in order: Claude → Gemini → HF
async function callGroq(prompt, maxTok) {
    if (!process.env.GROQ_API_KEY) return null;
    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    for (const model of models) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: maxTok, temperature: 0.4, stream: false }),
        });
        const d = await r.json();
        if (d.error) continue;
        const t = d?.choices?.[0]?.message?.content;
        if (t && t.length > 50) return t;
      } catch { continue; }
    }
    return null;
  }

        let raw = await callGroq(prompt, 2800) || await callClaude(prompt) || await callGemini(prompt) || await callHF(prompt) || "";

    // Strip any markdown fences if AI added them
    raw = raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();

    // Find the JSON object
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const parsed = JSON.parse(raw.slice(start, end + 1));

    if (!parsed.signals || !parsed.consensus) throw new Error("Invalid JSON structure");

    res.setHeader("Cache-Control", "s-maxage=14400, stale-while-revalidate=3600");
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ ok: true, ...parsed, generatedAt: today });

  } catch (err) {
    // Return error so frontend falls back to static data
    return res.status(500).json({ ok: false, error: err.message });
  }
}
