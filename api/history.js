export const config = { runtime: "edge" };

// Entry prices for all 25 stocks (March 2025 purchase prices)
const PORTFOLIO = [
  { ticker:"HAL",        sym:"HAL.NS",        entry:3200  },
  { ticker:"BEL",        sym:"BEL.NS",        entry:310   },
  { ticker:"MAZDOCK",    sym:"MAZDOCK.NS",    entry:1800  },
  { ticker:"COCHINSHIP", sym:"COCHINSHIP.NS", entry:1100  },
  { ticker:"GRSE",       sym:"GRSE.NS",       entry:1900  },
  { ticker:"BDL",        sym:"BDL.NS",        entry:900   },
  { ticker:"DATAPATTNS", sym:"DATAPATTNS.NS", entry:2500  },
  { ticker:"PARAS",      sym:"PARAS.NS",      entry:500   },
  { ticker:"ZENTEC",     sym:"ZENTEC.NS",     entry:900   },
  { ticker:"SOLARINDS",  sym:"SOLARINDS.NS",  entry:10500 },
  { ticker:"MTAR",       sym:"MTARTECH.NS",   entry:1600  },
  { ticker:"BHARATFORG", sym:"BHARATFORG.NS", entry:1250  },
  { ticker:"ASTRAMICRO", sym:"ASTRAMICRO.NS", entry:660   },
  { ticker:"BEML",       sym:"BEML.NS",       entry:1100  },
  { ticker:"APOLLOMICRO",sym:"APOLLO.NS",     entry:165   },
  { ticker:"MIDHANI",    sym:"MIDHANI.NS",    entry:280   },
  { ticker:"IDEAFORGE",  sym:"IDEAFORGE.NS",  entry:310   },
  { ticker:"PREMEXPLN",  sym:"PREMEXPLN.NS",  entry:320   },
  { ticker:"UNIMECH",    sym:"UNIMECH.NS",    entry:560   },
  { ticker:"PTCIND",     sym:"PTCIL.NS",      entry:9500  },
  { ticker:"DCXINDIA",   sym:"DCXINDIA.NS",   entry:150   },
  { ticker:"DYNAMATECH", sym:"DYNAMATECH.NS", entry:3800  },
  { ticker:"AVANTEL",    sym:"AVANTEL.NS",    entry:95    },
  { ticker:"AXISCADES",  sym:"AXISCADES.NS",  entry:450   },
  { ticker:"CYIENTDLM",  sym:"CYIENTDLM.NS",  entry:850   },
];
const BENCHMARK_SYM = "MODEFENCE.NS";
const HEADERS = {
  "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept":"application/json",
  "Referer":"https://finance.yahoo.com/",
};

async function fetchHistory(sym) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1mo&range=13mo`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const d = await res.json();
    const result = d?.chart?.result?.[0];
    if (!result) return null;
    const ts = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    return ts.map((t, i) => ({ t, px: closes[i] || null }));
  } catch { return null; }
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function label(unixSec) {
  const d = new Date(unixSec * 1000);
  const m = MONTH_LABELS[d.getUTCMonth()];
  const y = d.getUTCFullYear();
  return y === 2025 ? `${m} '25` : m;
}

export default async function handler() {
  try {
    // Fetch all stocks + benchmark in parallel
    const [benchData, ...stockData] = await Promise.all([
      fetchHistory(BENCHMARK_SYM),
      ...PORTFOLIO.map(p => fetchHistory(p.sym)),
    ]);

    // Use benchmark timestamps as the x-axis spine
    if (!benchData || benchData.length < 5) throw new Error("Benchmark data missing");

    // Find the first month that is >= March 2025 (our purchase date)
    const MAR_2025 = 1740787200; // ~Mar 1 2025 UTC
    const spine = benchData.filter(pt => pt.t >= MAR_2025 && pt.px !== null);
    if (spine.length < 2) throw new Error("Not enough spine data");

    const benchBase = spine[0].px;

    const chartData = spine.map(benchPt => {
      // For each stock, find its closest monthly closing price to this timestamp
      let portSum = 0, portCount = 0;
      PORTFOLIO.forEach((p, i) => {
        const hist = stockData[i];
        if (!hist) return;
        // Find closest timestamp within ±20 days
        const closest = hist.reduce((best, pt) => {
          if (pt.px === null) return best;
          return Math.abs(pt.t - benchPt.t) < Math.abs((best?.t || Infinity) - benchPt.t) ? pt : best;
        }, null);
        if (closest && Math.abs(closest.t - benchPt.t) < 20 * 86400) {
          portSum += (closest.px / p.entry) * 100;
          portCount++;
        }
      });
      return {
        d: label(benchPt.t),
        p: portCount > 0 ? +((portSum / portCount)).toFixed(1) : null,
        b: +((benchPt.px / benchBase) * 100).toFixed(1),
      };
    }).filter(pt => pt.p !== null);

    return new Response(JSON.stringify({ ok: true, chart: chartData, ts: Date.now() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
