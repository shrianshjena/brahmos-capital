export const config = { runtime: "edge" };

// Maps our internal ticker → Yahoo Finance NSE symbol
const SYMBOL_MAP = {
  HAL:         "HAL.NS",
  BEL:         "BEL.NS",
  MAZDOCK:     "MAZDOCK.NS",
  COCHINSHIP:  "COCHINSHIP.NS",
  GRSE:        "GRSE.NS",
  BDL:         "BDL.NS",
  DATAPATTNS:  "DATAPATTNS.NS",
  PARAS:       "PARAS.NS",
  ZENTEC:      "ZENTEC.NS",
  SOLARINDS:   "SOLARINDS.NS",
  MTAR:        "MTAR.NS",
  BHARATFORG:  "BHARATFORG.NS",
  ASTRAMICRO:  "ASTRAMICRO.NS",
  BEML:        "BEML.NS",
  APOLLOMICRO: "APOLLOMICRO.NS",
  MIDHANI:     "MIDHANI.NS",
  IDEAFORGE:   "IDEAFORGE.NS",
  PREMEXPLN:   "PREMEXPLN.NS",
  UNIMECH:     "UNIMECH.NS",
  PTCIND:      "PTCIND.NS",
  DCXINDIA:    "DCXINDIA.NS",
  DYNAMATECH:  "DYNAMATECH.NS",
  AVANTEL:     "AVANTEL.NS",
  AXISCADES:   "AXISCADES.NS",
  CYIENTDLM:   "CYIENTDLM.NS",
};

export default async function handler(req) {
  const symbols = Object.values(SYMBOL_MAP).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketPreviousClose&lang=en-US&region=IN`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    if (!res.ok) throw new Error(`Yahoo Finance responded ${res.status}`);
    const data = await res.json();
    const quotes = data?.quoteResponse?.result || [];

    // Build lookup: Yahoo symbol → { px, day }
    const lookup = {};
    for (const q of quotes) {
      const sym = q.symbol; // e.g. "HAL.NS"
      lookup[sym] = {
        px:  +(q.regularMarketPrice?.toFixed(2) ?? 0),
        day: +(q.regularMarketChangePercent?.toFixed(2) ?? 0),
      };
    }

    // Re-key by our internal ticker names
    const result = {};
    for (const [ticker, yfSym] of Object.entries(SYMBOL_MAP)) {
      if (lookup[yfSym]) result[ticker] = lookup[yfSym];
    }

    return new Response(JSON.stringify({ ok: true, prices: result, ts: Date.now() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        // Cache for 5 minutes on Vercel Edge
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
