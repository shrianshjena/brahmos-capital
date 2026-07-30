#!/usr/bin/env python3
"""
Brahmos Capital — Daily Price Updater
Runs via GitHub Action at 16:00 IST (30 min after NSE close).
Fetches closing prices from Yahoo Finance and patches src/App.jsx.
"""

import re
import time
import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone, timedelta

# ── Config ────────────────────────────────────────────────────────────────────
APP_JSX = "src/App.jsx"

# NSE ticker → Yahoo Finance symbol
SYMBOL_MAP = {
    "HAL":         "HAL.NS",
    "BEL":         "BEL.NS",
    "MAZDOCK":     "MAZDOCK.NS",
    "COCHINSHIP":  "COCHINSHIP.NS",
    "GRSE":        "GRSE.NS",
    "BDL":         "BDL.NS",
    "DATAPATTNS":  "DATAPATTNS.NS",
    "PARAS":       "PARAS.NS",
    "ZENTEC":      "ZENTEC.NS",
    "SOLARINDS":   "SOLARINDS.NS",
    "MTAR":        "MTARTECH.NS",
    "BHARATFORG":  "BHARATFORG.NS",
    "ASTRAMICRO":  "ASTRAMICRO.NS",
    "BEML":        "BEML.NS",
    "APOLLOMICRO": "APOLLO.NS",
    "MIDHANI":     "MIDHANI.NS",
    "IDEAFORGE":   "IDEAFORGE.NS",
    "PREMEXPLN":   "PREMEXPLN.NS",
    "UNIMECH":     "UNIMECH.NS",
    "PTCIND":      "PTCIL.NS",
    "DCXINDIA":    "DCXINDIA.NS",
    "DYNAMATECH":  "DYNAMATECH.NS",
    "AVANTEL":     "AVANTEL.NS",
    "AXISCADES":   "AXISCADES.NS",
    "CYIENTDLM":   "CYIENTDLM.NS",
}

# Rotate user agents to avoid Yahoo Finance rate limiting
HEADERS_LIST = [
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept": "application/json, */*",
        "Referer": "https://finance.yahoo.com/",
    },
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept": "application/json, */*",
        "Referer": "https://finance.yahoo.com/",
    },
    {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/json, */*",
        "Referer": "https://finance.yahoo.com/",
    },
]
import random
HEADERS = random.choice(HEADERS_LIST)


# ── Crumb-free batched fetch (PRIMARY) ────────────────────────────────────────
# The /v7/finance/spark endpoint returns price + previous close for many symbols
# in one request WITHOUT a crumb. This matters because Yahoo blocks the crumb
# handshake from datacenter IPs (GitHub Actions runners), which forced the old
# path to fall back to per-ticker /v8/chart calls that hit 429 rate limits and
# left tickers on a stale prior-session close. Spark works from those runners.
# Symbols are chunked (a 25-symbol URL 400s) into batches of 8.
def fetch_spark_quotes() -> dict:
    """Return {ticker: {px, day, ts}} via the crumb-free spark endpoint.

    Yahoo's spark endpoint sometimes returns HTTP 200 but silently omits some
    requested symbols from the response body (seen on 29 Jul: 16/25 with no error).
    So we check each chunk for the symbols we asked for and retry the shortfall —
    first the same chunk once, then a final sweep of any still-missing symbols in
    small pairs — before the caller falls through to the crumb/per-ticker paths.
    """
    rev = {v: k for k, v in SYMBOL_MAP.items()}
    ua = random.choice(HEADERS_LIST)["User-Agent"]
    out = {}

    def pull(symbols) -> None:
        url = (f"https://query1.finance.yahoo.com/v7/finance/spark"
               f"?symbols={urllib.parse.quote(','.join(symbols))}&range=1d&interval=1d")
        for host in ("query1", "query2"):
            u = url.replace("query1", host, 1) if host != "query1" else url
            try:
                req = urllib.request.Request(u, headers={"User-Agent": ua, "Accept": "application/json"})
                data = json.loads(urllib.request.urlopen(req, timeout=15).read())
                for r in data.get("spark", {}).get("result", []):
                    try:
                        meta = r["response"][0]["meta"]
                    except (KeyError, IndexError):
                        continue
                    t = rev.get(r.get("symbol"))
                    px = meta.get("regularMarketPrice")
                    pc = meta.get("chartPreviousClose") or meta.get("previousClose")
                    if not t or not px:
                        continue
                    out[t] = {
                        "ticker": t,
                        "px": round(float(px), 2),
                        "day": round((px - pc) / pc * 100, 2) if pc else 0.0,
                        "ts": int(meta.get("regularMarketTime") or 0),
                    }
                return  # this host answered (even if partially)
            except Exception as e:
                if host == "query2":
                    print(f"  ⚠  spark request failed on both hosts for {len(symbols)} sym; {e}")

    syms = list(SYMBOL_MAP.values())
    # First pass in chunks of 8, retrying each chunk once if it comes back short.
    for i in range(0, len(syms), 8):
        batch = syms[i:i + 8]
        pull(batch)
        missing_in_chunk = [s for s in batch if rev[s] not in out]
        if missing_in_chunk:
            time.sleep(1.0)
            pull(missing_in_chunk)
        time.sleep(0.3)
    # Final sweep: any symbols still missing across the whole set, in pairs.
    still = [s for s in syms if rev[s] not in out]
    if still:
        print(f"  spark: retrying {len(still)} still-missing symbol(s) in small batches…")
        for i in range(0, len(still), 2):
            pull(still[i:i + 2])
            time.sleep(0.5)
    return out


# ── Crumb-based batched fetch (secondary) ─────────────────────────────────────
# One /v7/finance/quote request returns all 25 symbols at once. This is the same
# endpoint used for manual pulls and is essentially never rate-limited, unlike the
# per-ticker /v8/chart calls which trip Yahoo's 429 limiter when fired 25x in a row.
def fetch_all_quotes() -> dict:
    """Return {ticker: {px, day, ts}} for as many symbols as the batch endpoint gives."""
    rev = {v: k for k, v in SYMBOL_MAP.items()}
    ua = random.choice(HEADERS_LIST)["User-Agent"]
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(__import__("http.cookiejar", fromlist=["CookieJar"]).CookieJar())
    )
    opener.addheaders = [("User-Agent", ua), ("Accept", "*/*"), ("Accept-Language", "en-US,en;q=0.9")]
    # Seed cookies + obtain a crumb (required by /v7/finance/quote)
    for u in ("https://fc.yahoo.com/", "https://finance.yahoo.com/quote/HAL.NS/"):
        try:
            opener.open(u, timeout=12).read()
        except Exception:
            pass
    crumb = None
    for host in ("query1", "query2"):
        try:
            c = opener.open(f"https://{host}.finance.yahoo.com/v1/test/getcrumb", timeout=12).read().decode().strip()
            if c and len(c) < 20:
                crumb = c
                break
        except Exception:
            pass
    if not crumb:
        print("  ⚠  quote: could not obtain crumb — skipping to per-ticker fetch")
        return {}
    syms = ",".join(SYMBOL_MAP.values())
    url = (f"https://query1.finance.yahoo.com/v7/finance/quote"
           f"?symbols={urllib.parse.quote(syms)}&crumb={urllib.parse.quote(crumb)}")
    out = {}
    try:
        data = json.loads(opener.open(url, timeout=20).read())
        for q in data.get("quoteResponse", {}).get("result", []):
            t = rev.get(q.get("symbol"))
            px = q.get("regularMarketPrice")
            if not t or not px:
                continue
            out[t] = {
                "ticker": t,
                "px": round(float(px), 2),
                "day": round(q.get("regularMarketChangePercent", 0) or 0, 2),
                "ts": int(q.get("regularMarketTime") or 0),
            }
    except Exception as e:
        print(f"  ⚠  batch quote request failed: {e} — falling back to per-ticker fetch")
        return {}
    return out


# ── Fetch one stock ───────────────────────────────────────────────────────────
def fetch_price(ticker: str, symbol: str, retries: int = 3) -> dict | None:
    urls = [
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2d",
        f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2d",
    ]
    for attempt in range(retries):
        headers = random.choice(HEADERS_LIST)  # rotate per attempt
        for url in urls:
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=15) as r:
                    data = json.loads(r.read())
                result = data.get("chart", {}).get("result", [])
                if not result:
                    continue
                meta = result[0].get("meta", {})
                px = meta.get("regularMarketPrice")
                prev = meta.get("chartPreviousClose") or meta.get("regularMarketPreviousClose") or 0
                if not px:
                    continue
                day = round(((px - prev) / prev) * 100, 2) if prev else 0.0
                # regularMarketTime lets us detect cached/stale quotes (see staleness
                # guard in main()) — Yahoo occasionally serves a prior-session close.
                ts = meta.get("regularMarketTime") or 0
                return {"ticker": ticker, "px": round(float(px), 2), "day": day, "ts": int(ts)}
            except Exception as e:
                # Yahoo rate-limits (HTTP 429) when 25 symbols are fetched in quick
                # succession. A 1-5s backoff is useless against it — the limit window
                # is far longer — so back off hard on 429 and let the second pass in
                # main() pick up anything still failing.
                is_429 = "429" in str(e)
                print(f"    attempt {attempt+1} failed for {ticker} ({url[:50]}): {e}")
                time.sleep((8.0 + attempt * 7.0) if is_429 else (1.0 + attempt * 2.0))
                continue
    return None


# ── Patch App.jsx ─────────────────────────────────────────────────────────────
def patch_stocks(code: str, prices: dict) -> str:
    """
    Replace px:OLD and day:OLD for each ticker in the STOCKS array.
    Only patches the STOCKS literal; does not touch any other px occurrences.
    """
    # Locate STOCKS array boundaries
    start = code.find("const STOCKS=[")
    end   = code.find("];", start) + 2
    if start < 0 or end < 2:
        raise ValueError("STOCKS array not found in App.jsx")

    before = code[:start]
    stocks = code[start:end]
    after  = code[end:]

    for ticker, vals in prices.items():
        px  = vals["px"]
        day = vals["day"]

        # Each stock is on ONE line (minified). Pattern:
        # ticker:"TICKER",...,px:NUMBER[, ]day:NUMBER,
        # Some stocks have a space after the comma (px:453.55, day:-0.12)
        # others do not (px:4013.5,day:0.21) — handle both.
        pattern = (
            rf'(ticker:"{re.escape(ticker)}"'
            rf'[^\n]{{0,500}}?'          # same line, non-greedy
            rf'px:)[\d.]+,\s*(day:)[+-]?[\d.]+'
        )
        repl = rf'\g<1>{px}, \g<2>{day}'
        if re.search(pattern, stocks):
            stocks = re.sub(pattern, repl, stocks, count=1)
        else:
            print(f"  ⚠  Pattern did not match for {ticker} — manual check needed")

    return before + stocks + after


def patch_date_banner(code: str, date_str: str) -> str:
    """Update 'as of DD Month YYYY' in the geo banner."""
    return re.sub(
        r'(as of )\d{1,2} \w+ \d{4}( —)',
        rf'\g<1>{date_str}\g<2>',
        code,
        count=1,
    )


def patch_geo_event_date(code: str, date_range: str) -> str:
    """Update the first geo event's date range."""
    return re.sub(
        r'(date:"28 Feb–)\d{1,2} \w+ \d{4}(")',
        rf'\g<1>{date_range}\g<2>',
        code,
        count=1,
    )


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ist = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(ist)
    date_str = now.strftime("%-d %b %Y")          # e.g. "13 Mar 2026"
    print(f"Brahmos Capital — Daily Update  {date_str}\n")

    # 1. Fetch all prices. Primary: crumb-free spark endpoint (works from GitHub
    # runners). Secondary: crumb-based batch quote (works locally). Tertiary:
    # per-ticker chart calls for any stragglers.
    prices = {}
    print("Fetching via spark endpoint (crumb-free, all symbols)…")
    prices = fetch_spark_quotes()
    if prices:
        print(f"  Spark returned {len(prices)}/{len(SYMBOL_MAP)}")

    if len(prices) < len(SYMBOL_MAP):
        print("Trying crumb-based batch quote for the remainder…")
        batch = fetch_all_quotes()
        for ticker, result in batch.items():
            prices.setdefault(ticker, result)
        if batch:
            print(f"  After batch quote: {len(prices)}/{len(SYMBOL_MAP)}")

    for ticker, result in list(prices.items()):
        sign = "+" if result["day"] >= 0 else ""
        src_tag = "batch"
        print(f"  ✅ {ticker:<14} ₹{result['px']:>10.2f}  {sign}{result['day']:.2f}%")

    # Per-ticker chart fallback for anything both batch methods missed
    fallback = [t for t in SYMBOL_MAP if t not in prices]
    if fallback:
        print(f"\nPer-ticker fallback for {len(fallback)} symbol(s): {', '.join(fallback)}")
        for ticker in fallback:
            result = fetch_price(ticker, SYMBOL_MAP[ticker])
            if result:
                prices[ticker] = result
                sign = "+" if result["day"] >= 0 else ""
                print(f"  ✅ {ticker:<14} ₹{result['px']:>10.2f}  {sign}{result['day']:.2f}%")
            else:
                print(f"  ❌ {ticker:<14} fetch failed — keeping existing value")
            # 1.5s spacing: the /v8/chart endpoint works crumb-free for every ticker
            # from GitHub runners; the ONLY failure mode is 429 from bursting requests
            # too fast. Pacing wide enough avoids the rate limit rather than fighting it.
            time.sleep(1.5)

    print(f"\nFetched {len(prices)}/{len(SYMBOL_MAP)} prices")

    # 1a. Second pass — if some tickers are still missing (e.g. all batch paths
    # failed and per-ticker calls got 429'd), wait out the rate-limit window and
    # retry. Previously these fell through to "keeping existing value", silently
    # leaving a prior-session close in App.jsx while the workflow reported success.
    missing = [t for t in SYMBOL_MAP if t not in prices]
    if missing:
        print(f"\n⚠  {len(missing)} ticker(s) still missing: {', '.join(missing)}")
        print("   Cooling down 75s to clear the rate limit, then retrying…")
        time.sleep(75)
        for ticker in missing:
            result = fetch_price(ticker, SYMBOL_MAP[ticker])
            if result:
                prices[ticker] = result
                sign = "+" if result["day"] >= 0 else ""
                print(f"   ✅ {ticker:<14} ₹{result['px']:>10.2f}  {sign}{result['day']:.2f}%  (2nd pass)")
            else:
                print(f"   ❌ {ticker:<14} still failing")
            time.sleep(2.0)
        print(f"\nAfter second pass: {len(prices)}/{len(SYMBOL_MAP)} prices")

    # 1b. Third pass — a symbol that fails two passes (BDL has been the recurring
    # straggler) gets one more attempt after a longer cooldown, spaced very wide.
    # This is the last line of defence before we accept a prior-session close.
    still_missing = [t for t in SYMBOL_MAP if t not in prices]
    if still_missing:
        print(f"\n⚠  {len(still_missing)} still missing after 2 passes: {', '.join(still_missing)}")
        print("   Final cooldown 120s, then one more spaced retry…")
        time.sleep(120)
        for ticker in still_missing:
            result = fetch_price(ticker, SYMBOL_MAP[ticker])
            if result:
                prices[ticker] = result
                sign = "+" if result["day"] >= 0 else ""
                print(f"   ✅ {ticker:<14} ₹{result['px']:>10.2f}  {sign}{result['day']:.2f}%  (3rd pass)")
            else:
                print(f"   ❌ {ticker:<14} still failing after 3 passes")
            time.sleep(3.0)
        print(f"\nAfter third pass: {len(prices)}/{len(SYMBOL_MAP)} prices")

    # Surface incomplete coverage as a GitHub Actions annotation so it is visible on
    # the run page — a "success" conclusion alone hid this failure mode before.
    unresolved = [t for t in SYMBOL_MAP if t not in prices]
    if unresolved:
        print(f"::warning title=Stale prices::{len(unresolved)} ticker(s) kept a prior-session "
              f"close (fetch failed twice): {', '.join(unresolved)}")

    if len(prices) < 10:
        print("Too few prices — aborting to avoid corrupting the file.")
        raise SystemExit(1)

    # 1b. Staleness guard — Yahoo sometimes serves a cached prior-session quote for a
    # few symbols while reporting success. Most tickers carry the latest session's
    # timestamp, so anything materially older than the newest is stale. Retry those
    # once, then report loudly so the failure is visible in the workflow log.
    STALE_TOLERANCE = 6 * 3600   # seconds behind the newest quote before we call it stale
    def stale_tickers(pr):
        stamps = [v["ts"] for v in pr.values() if v.get("ts")]
        if not stamps:
            return []
        newest = max(stamps)
        return [t for t, v in pr.items() if v.get("ts") and v["ts"] < newest - STALE_TOLERANCE]

    stale = stale_tickers(prices)
    if stale:
        print(f"\n⚠  {len(stale)} stale quote(s) detected (prior-session close): {', '.join(stale)}")
        print("   Retrying those symbols…")
        for ticker in stale:
            time.sleep(1.0)
            retry = fetch_price(ticker, SYMBOL_MAP[ticker])
            if retry and retry.get("ts", 0) > prices[ticker].get("ts", 0):
                prices[ticker] = retry
                print(f"   ✅ {ticker:<14} refreshed to ₹{retry['px']:.2f}")
            else:
                print(f"   ⚠  {ticker:<14} still stale — patching prior close (verify manually)")
        still = stale_tickers(prices)
        if still:
            print(f"\n⚠  STALE AFTER RETRY: {', '.join(still)} — these carry a prior-session close.")
        else:
            print("\n✅ All quotes now current after retry.")
    else:
        print("✅ Staleness check passed — all quotes from the latest session.")

    # 2. Read App.jsx
    with open(APP_JSX, "r", encoding="utf-8") as f:
        code = f.read()

    # 3. Patch prices
    code = patch_stocks(code, prices)

    # 4. Patch geo banner date
    code = patch_date_banner(code, date_str)

    # 5. Patch geo event date range (war started 28 Feb)
    code = patch_geo_event_date(code, date_str)

    # 6. Write back
    with open(APP_JSX, "w", encoding="utf-8") as f:
        f.write(code)

    print(f"\n✅ App.jsx patched — {len(prices)} stock prices updated for {date_str}")


if __name__ == "__main__":
    main()
