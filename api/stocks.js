export const config = { runtime: "edge" };

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
  MTAR:        "MTARTECH.NS",
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

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com/",
};

async function fetchOne(ticker, yfSymbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d&range=2d`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const px = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose || meta.previousClose;
    const day = prev ? +( ((px - prev) / prev) * 100 ).toFixed(2) : 0;
    return { ticker, px: +px.toFixed(2), day };
  } catch {
    return null;
  }
}

export default async function handler(req) {
  try {
    const entries = Object.entries(SYMBOL_MAP);
    const results = await Promise.all(entries.map(([t, sym]) => fetchOne(t, sym)));

    const prices = {};
    for (const r of results) {
      if (r) prices[r.ticker] = { px: r.px, day: r.day };
    }

    const found = Object.keys(prices).length;
    if (found === 0) throw new Error("No prices returned from Yahoo Finance");

    return new Response(JSON.stringify({ ok: true, prices, ts: Date.now() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
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
