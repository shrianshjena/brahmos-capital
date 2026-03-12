/**
 * Brahmos Capital — News Feed API  v3
 *
 * Feed priority (most reliable → most targeted):
 *   PRIMARY  — Livemint (works today, India-focused, no 403)
 *   SECONDARY — Google News targeted queries (India defence specific)
 *
 * ET RSS removed (returns 403). BS RSS removed (returns 403).
 * Cached 30 minutes on Vercel Edge.
 */

export const config = { runtime: "edge" };

const FEEDS = [
  // ── Livemint — primary, reliable, India finance (no 403) ─────────────────
  { url: "https://www.livemint.com/rss/markets",   cat: "MARKET",  source: "Livemint" },
  { url: "https://www.livemint.com/rss/companies", cat: "ORDER",   source: "Livemint" },
  { url: "https://www.livemint.com/rss/economy",   cat: "POLICY",  source: "Livemint" },
  // ── Google News targeted — defence-specific ────────────────────────────────
  { url: "https://news.google.com/rss/search?q=Nifty+India+defence+HAL+BEL+BDL+NSE+stocks&hl=en-IN&gl=IN&ceid=IN:en", cat: "MARKET",  source: "Google News" },
  { url: "https://news.google.com/rss/search?q=iran+india+defence+procurement+2026&hl=en-IN&gl=IN&ceid=IN:en",         cat: "GEOPO",   source: "Google News" },
  { url: "https://news.google.com/rss/search?q=india+defence+ministry+order+MoD+procurement&hl=en-IN&gl=IN&ceid=IN:en", cat: "ORDER", source: "Google News" },
  { url: "https://news.google.com/rss/search?q=india+defence+export+BrahMos+Tejas+Akash+2026&hl=en-IN&gl=IN&ceid=IN:en", cat: "EXPORTS", source: "Google News" },
  { url: "https://news.google.com/rss/search?q=ukraine+war+taiwan+nato+india+defence+rearmament&hl=en-IN&gl=IN&ceid=IN:en", cat: "GEOPO", source: "Google News" },
];

const DEFENCE_KEYWORDS = [
  "hal","bel","mazdock","mazagon","bharat electronics","bharat dynamics","bdl",
  "grse","garden reach","cochin shipyard","data patterns","paras defence","zen tech",
  "solar industries","mtar","bharat forge","astra micro","beml","ideaforge",
  "unimech","ptcind","dcx","dynamatic","avantel","axiscades","cyient",
  "defence","defense","military","missile","torpedo","submarine","frigate","tejas",
  "brahmos","akash","drdo","army","navy","air force","procurement","indigenisation",
  "make in india defence","nifty defence","operation","geopolit","iran","ukraine",
  "taiwan","nato","mod","ministry of defence","atmanirbhar","dac","dap 2026",
  "fifth generation","stealth","amca","predator uav","rafale","p-75i","kaveri",
];

const TICKER_MAP = [
  { words: ["hal","hindustan aeronautics","tejas","lca","helicopter","amca"], ticker: "HAL" },
  { words: ["bel","bharat electronics","radar","c4isr","qrsam","akash"], ticker: "BEL" },
  { words: ["mazagon","mazdock","submarine","p-75","p75"], ticker: "MAZDOCK" },
  { words: ["cochin shipyard","cochinship"], ticker: "COCHINSHIP" },
  { words: ["garden reach","grse","ngopv"], ticker: "GRSE" },
  { words: ["bdl","bharat dynamics","missile","torpedo","astra"], ticker: "BDL" },
  { words: ["data patterns","datapattns","radar electronics"], ticker: "DATAPATTNS" },
  { words: ["paras defence","paras defense"], ticker: "PARAS" },
  { words: ["zen tech","zentec","anti-drone","c-uav","counter uav"], ticker: "ZENTEC" },
  { words: ["solar industries","solarinds","explosives","propellant"], ticker: "SOLARINDS" },
  { words: ["mtar"], ticker: "MTAR" },
  { words: ["bharat forge","bharatforg","artillery","forging"], ticker: "BHARATFORG" },
  { words: ["astra micro","astramicro","ew system"], ticker: "ASTRAMICRO" },
  { words: ["beml","combat vehicle"], ticker: "BEML" },
  { words: ["apollo micro","apollomicro"], ticker: "APOLLOMICRO" },
  { words: ["midhani","mishra dhatu","titanium alloy"], ticker: "MIDHANI" },
  { words: ["ideaforge","drone","uav"], ticker: "IDEAFORGE" },
  { words: ["axiscades","axiscades technologies"], ticker: "AXISCADES" },
  { words: ["dynamatic technologies","dynamatech"], ticker: "DYNAMATECH" },
  { words: ["dcx systems","dcxindia"], ticker: "DCXINDIA" },
  { words: ["avantel","satellite comm"], ticker: "AVANTEL" },
  { words: ["cyient dlm","cyientdlm"], ticker: "CYIENTDLM" },
  { words: ["unimech aerospace","unimech"], ticker: "UNIMECH" },
  { words: ["ptcind","ptc industries","precision casting"], ticker: "PTCIND" },
];

function getTickersFromText(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const { words, ticker } of TICKER_MAP) {
    if (words.some(w => lower.includes(w))) found.add(ticker);
  }
  return found.size ? [...found] : ["SECTOR"];
}

function isDefenceRelevant(text) {
  const lower = text.toLowerCase();
  return DEFENCE_KEYWORDS.some(k => lower.includes(k));
}

function inferCat(text, defaultCat) {
  const t = text.toLowerCase();
  if (t.match(/iran|ukraine|taiwan|nato|war|conflict|geopolit/)) return "GEOPO";
  if (t.match(/order|contract|supply|deliver|wins|bags|awarded/)) return "ORDER";
  if (t.match(/export|brahmos|tejas|akash/)) return "EXPORTS";
  if (t.match(/budget|policy|dap|dac|indigeni|atma/)) return "POLICY";
  if (t.match(/result|quarter|profit|revenue|earnings/)) return "RESULTS";
  if (t.match(/analyst|buy|sell|target|initiat|coverage|upgrad/)) return "BROKER";
  return defaultCat;
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      block.match(/<title>([\s\S]*?)<\/title>/)
    )?.[1]?.trim() || "";
    const link = (block.match(/<link>([\s\S]*?)<\/link>/))?.[1]?.trim() || "#";
    // pubDate: handle both plain and CDATA-wrapped (Livemint uses CDATA)
    const pubDate = (
      block.match(/<pubDate><!\[CDATA\[([\s\S]*?)\]\]><\/pubDate>/) ||
      block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
    )?.[1]?.trim() || "";
    const rawDesc = (
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
      block.match(/<description>([\s\S]*?)<\/description>/)
    )?.[1] || "";
    const desc = rawDesc
      .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")
      .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&apos;/g,"'")
      .replace(/&nbsp;/g," ").replace(/&#[0-9]+;/g," ").replace(/&[a-z]+;/g," ")
      .replace(/<[^>]+>/g,"")
      .replace(/\s+/g," ").trim();
    // Source: Google News title format "Headline - Source Name"
    const srcMatch = title.match(/ - ([^-]{3,40})$/);
    const source = srcMatch ? srcMatch[1].trim() : "Livemint";
    const cleanTitle = srcMatch ? title.slice(0, -srcMatch[0].length).trim() : title;
    if (cleanTitle && cleanTitle.length > 15) {
      const safeTitle = cleanTitle
        .replace(/&amp;amp;/g,"&").replace(/&amp;/g,"&")
        .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"');
      items.push({ title: safeTitle, link, pubDate, desc, source });
    }
  }
  return items;
}

function formatDate(pubDate) {
  try {
    return new Date(pubDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  } catch { return "Recent"; }
}

export default async function handler(req) {
  const allArticles = [];

  const results = await Promise.allSettled(
    FEEDS.map(({ url, cat, source }) =>
      fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(8000),
      })
        .then(r => r.text())
        .then(xml => ({ xml, cat, source }))
    )
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { xml, cat, source } = result.value;
    const items = parseRSS(xml);
    for (const item of items.slice(0, 12)) {
      const combined = item.title + " " + item.desc;
      if (!isDefenceRelevant(combined)) continue;
      const finalCat = inferCat(combined, cat);
      allArticles.push({
        id: `live_${allArticles.length}`,
        date: formatDate(item.pubDate),
        rawDate: item.pubDate ? new Date(item.pubDate).getTime() : 0,
        cat: finalCat,
        impact: finalCat === "GEOPO" ? "BULLISH" : finalCat === "ORDER" ? "BULLISH" : "MIXED",
        hot: false,
        tickers: getTickersFromText(combined),
        headline: item.title,
        body: item.desc.slice(0, 320) + (item.desc.length > 320 ? "…" : ""),
        source: item.source || source,
        url: item.link,
        live: true,
      });
    }
  }

  // Sort newest first, dedupe
  allArticles.sort((a, b) => b.rawDate - a.rawDate);
  const seen = new Set();
  const deduped = allArticles.filter(a => {
    const key = a.headline.slice(0, 45).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return new Response(
    JSON.stringify({ ok: true, articles: deduped.slice(0, 50), ts: Date.now() }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=300",
      },
    }
  );
}
