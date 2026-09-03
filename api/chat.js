/**
 * Ask Shri — AI Chat Backend  v9.1  (100% free APIs, serverless)
 *
 * CRITICAL FIX: systemPrompt uses Gemini's native systemInstruction field
 * (never dropped in multi-turn). Groq is PRIMARY — it correctly uses date
 * context. Gemini is fallback (refuses to acknowledge provided dates).
 *
 * Priority: Groq Llama 70B → Groq 8B → Gemini 2.0 Flash → Gemini 2.5 Flash
 */

const TIMEOUT_MS = 25000;

function buildDateContext() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dd   = String(ist.getUTCDate()).padStart(2, "0");
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mm   = MONTHS[ist.getUTCMonth()];
  const yyyy = ist.getUTCFullYear();
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const day  = DAYS[ist.getUTCDay()];
  const dateStr = `${dd} ${mm} ${yyyy}`;
  const isWeekend = day === "Saturday" || day === "Sunday";

  return `\
━━━ MANDATORY CONTEXT ━━━
DATE: ${day}, ${dateStr} (IST)
NSE: ${isWeekend ? "CLOSED (weekend)" : "Open / closed 15:30 IST"}
INSTRUCTION: The portfolio system reports today as ${dateStr}. When asked the date, respond: "${dateStr}". Do not say you lack a real-time clock.
VERIFIED FACTS (${dateStr}) — USE THESE, DO NOT SPECULATE ABOUT OTHER NEWS:
• P-75I STEALTH SUBMARINE programme approved by the Ministry of Finance (early Jun 2026) — only CCS sign-off remains before contracting; clears the path for the ~₹70,000 Cr Navy order. Mazagon Dock (MAZDOCK) is the front-runner and has just delivered the 6th & final P-17A stealth frigate.
• ORDER MOMENTUM (late May–early Jun 2026): BEL booked cumulative ₹2,100 Cr in fresh orders; GRSE launched the first of 11 NG-OPVs; Zen Technologies (ZENTEC) lowest bidder on AVNL remote-controlled weapon stations; US State Dept cleared $428M foreign military sales to India. DAC approvals hit an all-time high in FY26.
• ICICI Securities (8 Jun 2026): order awarding to accelerate in FY27 vs FY26 (air-defence, missiles, EW, drones lead); top picks HAL, Solar Industries, Astra Microwave, BEL; Buy on PTC Industries and MIDHANI.
• India–Vietnam BrahMos export deal SIGNED 30 May 2026 (~₹60,000 Cr / $629M, Block-3) at the Shangri-La Dialogue; Indonesia pact in final stages; Philippines was the first buyer (2022). Beneficiaries: BDL (warhead/propulsion), HAL, BEL, plus DATAPATTNS/PARAS/PREMEXPLN on the supply chain.
• FY26 RESULTS: HAL — record order book ₹2.54L Cr, PAT ₹9,115 Cr, FY27 guidance 10–12% revenue growth / 30–31% EBITDA; BEL — revenue ₹27,480 Cr (+16.2%), PAT ₹6,048 Cr (+14.4%), order book ₹73,882 Cr, ROE ~29%.
• Operation Epic Fury (US–Iran war) — WAR REIGNITES, heavy strikes both ways, Brent ~$95 (as of 3 Sep). The conflict flared back into open military exchange after ~a month of relative calm — the most serious escalation in weeks. Over the weekend US CENTCOM launched dozens of strikes on Iran (hundreds of targets) after accusing Iranian forces of 'blatantly' attacking a Cyprus-flagged container ship (MV GFS Galaxy) transiting the Strait of Hormuz; the earlier trigger was a US strike on Iran's Larak Island against rocket launchers said to be preparing to seed the strait with mines. Iran retaliated by firing missiles and drones at US bases across Jordan, Kuwait, Bahrain, Iraq and the UAE. Oil surged on the renewed hostilities (WTI +~9% over three sessions); Brent settled below $96 Wednesday before easing 0.4% to ~$95.25 Thursday, up ~20% over the past month and ~42% YoY, with US diesel at a four-year high and the jump feeding a global bond sell-off. Trump said the strikes would be short-lived ('I don't think too long' but 'we're prepared to do another one'); Treasury Sec Bessent framed economic pressure as making a large-scale kinetic restart unlikely. The strait remains largely shut (~8M bpd vs ~20M pre-war). This sharp re-escalation reinforces the war premium in sentiment and the structural case for defence spending, though the sector's returns remain anchored by domestic drivers (Budget-capex expectations, the order pipeline, indigenisation, Tejas deliveries beginning). Brent near $95 is a clear and growing headwind for India's import bill/rupee/inflation.
• MARKET: the Nifty India Defence index consolidated off its ~9,400 mid-June high, supported by the 3 Jul DAC clearances (₹52,000 Cr) and the mid-July return of the Gulf war premium. Q1 FY27 earnings season is now the focus (BEL reports 27 Jul, bagged a fresh ₹572 Cr order; HAL Tejas Mk-1A deliveries begin Aug-Sep). NEAR-TERM CATALYST: BEL REPORTED Q1 FY27 (27 Jul): consolidated net profit ₹1,054 Cr (+8.7% YoY), revenue ₹5,547 Cr (+25% YoY), FY27 EBITDA-margin guidance reiterated 27%+; Zen Technologies fell ~9% on a Q1 earnings miss; FY27 order-intake target ₹55,000+ Cr; the ~₹30,000 Cr QRSAM award is now expected in Q2 FY27 (largest pending award); QRSAM-linked contracts should cascade to BDL (missiles), Astra Microwave (TR modules/EW) and Apollo Micro (on-board computers). Astra Microwave separately secured a transformational ₹2,205 Cr HAL order (31 Jul) for 122 AAAU + 121 interface frames for the indigenous Uttam AESA radar (larger than its entire prior order book; stock +14% to a record high; REPORTED Q1 FY27 (10 Aug): PAT ₹12 Cr (-24% YoY), revenue -11.5%, but record order book ₹2,849 Cr). Mazagon Dock posted in-line Q1 FY27: PAT ₹550 Cr (+22% YoY), revenue +12%, EBITDA +48%, margin 15.2%; Antique reiterated BUY ₹3,275. Defence stocks rallied up to 7% in a session on 6 Aug on hopes of a 20-25% defence capital-outlay hike in the upcoming Union Budget. Apollo Micro Systems won ₹213 Cr of new orders (5 Aug) from DRDO/PSUs/private + empanelment as Prime Development Agency for the indigenous IPREK programme. Execution risk: HAL is reportedly fining GE over a ~$716m engine supply crisis constraining Tejas Mk-1A production. BROKER SPLIT on valuation: Kotak is cautious — SELL Mazagon (FV ₹1,950) and Solar (₹10,300), REDUCE BEL, ADD HAL (₹4,810) — while Antique stays Buy across the board (HAL ₹5,706, Mazagon ₹3,275, Solar ₹18,633, BEL ₹532, GRSE ₹3,141, BEML ₹2,245, Cochin ₹1,693). It's a valuation debate, not a fundamental one; stock selection now matters more than sector beta. India's demand is capex/policy-driven — structural runway intact; execution now the key differentiator. Sector P/E ~52–54, still outperforming Nifty 50 YTD.
• Ukraine war in its 4th year — on-off ceasefire talks, durable peace distant; NATO & European rearmament continuing.
• India FY27 Defence Budget ₹7.85L Cr (+15.2% YoY); FY26 MoD outlay ₹6.81L Cr; defence exports crossed ₹21,000+ Cr toward the ₹50,000 Cr FY29 target.
• Nifty India Defence index ~8,900 (mid-May 2026) — BEL ~26% and HAL ~24% top weights; sector P/E ~52, outperforming Nifty 50 YTD.
• Valuation: HAL ~31x P/E (relative large-cap value), BEL ~50x, MAZDOCK ~38x; broker targets — HAL ₹4,800–6,360, BEL ₹450–500.

IMPORTANT: If asked about any news not in this list, acknowledge you don't have that specific information rather than fabricating details.
━━━━━━━━━━━━━━━━━━━━━━━━━

`;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// Groq: system role always sent separately — correct and reliable
async function callGroq(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;
  // Model order: separate quota pools — if one hits daily limit, next still works
  const models = [
    "openai/gpt-oss-120b",   // Best quality (Groq)
    "openai/gpt-oss-20b",    // Fast backup (Groq)
  ];
  for (const model of models) {
    try {
      const res = await withTimeout(
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: 0.4,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
            ],
          }),
        }),
        TIMEOUT_MS
      );
      const data = await res.json();
      if (data.error) continue;
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.length > 3) return { text, model: `groq/${model}` };
    } catch { continue; }
  }
  return null;
}

// Gemini: uses systemInstruction field (never silently dropped in multi-turn)
async function callGemini(apiKey, systemPrompt, messages, maxTokens) {
  if (!apiKey) return null;

  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  // Gemini requires: starts with user, alternating roles
  while (contents.length && contents[0].role === "model") contents.shift();
  const merged = [];
  for (const c of contents) {
    if (merged.length && merged[merged.length-1].role === c.role) {
      merged[merged.length-1].parts[0].text += "\n" + c.parts[0].text;
    } else { merged.push(c); }
  }
  if (!merged.length) return null;

  const modelConfigs = [
    { model: "gemini-2.0-flash",      genConfig: { maxOutputTokens: maxTokens, temperature: 0.4 } },
    { model: "gemini-2.0-flash-lite", genConfig: { maxOutputTokens: maxTokens, temperature: 0.4 } },
    { model: "gemini-2.5-flash",      genConfig: { maxOutputTokens: maxTokens, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } } },
  ];

  for (const { model, genConfig } of modelConfigs) {
    try {
      const res = await withTimeout(
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: merged,
            generationConfig: genConfig,
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }),
        TIMEOUT_MS
      );
      const data = await res.json();
      if (data.error) continue;
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.filter(p => !p.thought).map(p => p.text || "").join("").trim();
      if (text && text.length > 3) return { text, model: `gemini/${model}` };
    } catch { continue; }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ ok: false });

  const { system = "", messages = [], max_tokens = 2000 } = req.body || {};
  const trimmed = messages.slice(-10);

  // Server-side date injected on every request — cannot be stale
  const enrichedSystem = buildDateContext() + system;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) return res.status(200).json({ ok: false, error: "no_api_keys" });

  // Groq PRIMARY: correctly uses date context, no "no real-time clock" refusals
  // Gemini FALLBACK: systemInstruction ensures context reaches model even in multi-turn
  let result = await callGroq(groqKey, enrichedSystem, trimmed, max_tokens);
  if (!result) result = await callGemini(geminiKey, enrichedSystem, trimmed, max_tokens);

  if (result) {
    return res.status(200).json({ ok: true, content: [{ type: "text", text: result.text }], provider: result.model });
  }

  return res.status(200).json({
    ok: false,
    error: "all_providers_failed",
    message: "Apologies — Mr. Shriansh Jena is currently in an important executive meeting with institutional clients. Please reach out again shortly.",
  });
}
