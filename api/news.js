export const config = { runtime: "edge" };

const FEEDS = [
  // Google News RSS — India defence stocks
  { url: "https://news.google.com/rss/search?q=india+defence+HAL+BEL+Mazagon+NSE&hl=en-IN&gl=IN&ceid=IN:en", cat: "MARKET" },
  { url: "https://news.google.com/rss/search?q=india+defence+ministry+procurement+order+2026&hl=en-IN&gl=IN&ceid=IN:en", cat: "ORDER" },
  { url: "https://news.google.com/rss/search?q=india+defence+export+BrahMos+Tejas+Akash&hl=en-IN&gl=IN&ceid=IN:en", cat: "EXPORTS" },
  { url: "https://news.google.com/rss/search?q=iran+war+ukraine+taiwan+geopolitical+2026&hl=en-IN&gl=IN&ceid=IN:en", cat: "GEOPO" },
  { url: "https://news.google.com/rss/search?q=HAL+BEL+Bharat+Electronics+share+price&hl=en-IN&gl=IN&ceid=IN:en", cat: "MARKET" },
  { url: "https://news.google.com/rss/search?q=india+defence+budget+atma+nirbhar+indigenisation&hl=en-IN&gl=IN&ceid=IN:en", cat: "POLICY" },
  // Economic Times Markets RSS
  { url: "https://economictimes.indiatimes.com/markets/stocks/news/rss.cms", cat: "MARKET" },
  // Business Standard defence
  { url: "https://news.google.com/rss/search?q=site:business-standard.com+defence+stocks&hl=en-IN&gl=IN&ceid=IN:en", cat: "BROKER" },
];

// Defence-relevance keywords to filter articles
const DEFENCE_KEYWORDS = [
  "hal","bel","mazdock","mazagon","bharat electronics","bharat dynamics","bdl",
  "grse","garden reach","cochin shipyard","data patterns","paras defence","zen tech",
  "solar industries","mtar","bharat forge","astra micro","beml","ideaforge",
  "defence","defense","military","missile","torpedo","submarine","frigate","tejas",
  "brahmos","akash","drdo","army","navy","air force","procurement","indigenisation",
  "make in india defence","nifty defence","operation","geopolit","iran","ukraine",
  "taiwan","nato","mod","ministry of defence"
];

// Map keywords → ticker tags
const TICKER_MAP = [
  { words: ["hal","hindustan aeronautics","tejas","lca","helicopter"], ticker: "HAL" },
  { words: ["bel","bharat electronics","radar","c4isr","qrsam"], ticker: "BEL" },
  { words: ["mazagon","mazdock","submarine","p-75"], ticker: "MAZDOCK" },
  { words: ["cochin shipyard","cochinship"], ticker: "COCHINSHIP" },
  { words: ["garden reach","grse"], ticker: "GRSE" },
  { words: ["bdl","bharat dynamics","missile"], ticker: "BDL" },
  { words: ["data patterns","datapattns"], ticker: "DATAPATTNS" },
  { words: ["paras defence","paras defense"], ticker: "PARAS" },
  { words: ["zen tech","zentec","anti-drone","c-uav"], ticker: "ZENTEC" },
  { words: ["solar industries","solarinds","explosives"], ticker: "SOLARINDS" },
  { words: ["mtar"], ticker: "MTAR" },
  { words: ["bharat forge","bharatforg","artillery"], ticker: "BHARATFORG" },
  { words: ["astra micro","astramicro"], ticker: "ASTRAMICRO" },
  { words: ["beml","combat vehicle"], ticker: "BEML" },
  { words: ["apollo micro","apollomicro"], ticker: "APOLLOMICRO" },
  { words: ["midhani","mishra dhatu"], ticker: "MIDHANI" },
  { words: ["ideaforge","drone","uav"], ticker: "IDEAFORGE" },
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

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title   = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                     block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || "";
    const link    = (block.match(/<link>([\s\S]*?)<\/link>/))?.[1]?.trim() || "#";
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/))?.[1]?.trim() || "";
    const rawDesc = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                     block.match(/<description>([\s\S]*?)<\/description>/))?.[1] || "";
    // Decode HTML entities, then strip any remaining HTML tags
    const desc = rawDesc
      .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")
      .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&apos;/g,"'")
      .replace(/&nbsp;/g," ").replace(/&#[0-9]+;/g," ").replace(/&[a-z]+;/g," ")
      .replace(/<[^>]+>/g,"")   // strip real HTML tags
      .replace(/\s+/g," ").trim() || "";
    // Parse source from Google News title "Headline - Source"
    const sourceMatch = title.match(/ - ([^-]+)$/);
    const source = sourceMatch ? sourceMatch[1].trim() : "Financial News";
    const cleanTitle = sourceMatch ? title.slice(0, -sourceMatch[0].length).trim() : title;

    if (cleanTitle && cleanTitle.length > 15) {
      items.push({ title: cleanTitle, link, pubDate, desc, source });
    }
  }
  return items;
}

function formatDate(pubDate) {
  try {
    const d = new Date(pubDate);
    return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  } catch { return "Recent"; }
}

export default async function handler(req) {
  const allArticles = [];

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    FEEDS.map(({ url, cat }) =>
      fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrahmosCapital/1.0)" },
        signal: AbortSignal.timeout(6000),
      })
        .then(r => r.text())
        .then(xml => ({ xml, cat }))
    )
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { xml, cat } = result.value;
    const items = parseRSS(xml);
    for (const item of items.slice(0, 8)) {
      const combined = item.title + " " + item.desc;
      if (!isDefenceRelevant(combined)) continue;
      allArticles.push({
        id: `live_${allArticles.length}`,
        date: formatDate(item.pubDate),
        rawDate: item.pubDate ? new Date(item.pubDate).getTime() : 0,
        cat,
        impact: cat === "GEOPO" ? "BULLISH" : cat === "ORDER" ? "BULLISH" : "MIXED",
        hot: false,
        tickers: getTickersFromText(combined),
        headline: item.title,
        body: item.desc.slice(0, 320) + (item.desc.length > 320 ? "…" : ""),
        source: item.source,
        url: item.link,
        live: true,
      });
    }
  }

  // Sort by date (newest first) and deduplicate by headline similarity
  allArticles.sort((a, b) => b.rawDate - a.rawDate);
  const seen = new Set();
  const deduped = allArticles.filter(a => {
    const key = a.headline.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return new Response(
    JSON.stringify({ ok: true, articles: deduped.slice(0, 40), ts: Date.now() }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        // Cache 1 hour on Vercel Edge — free, no re-fetch every visitor
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=300",
      },
    }
  );
}
