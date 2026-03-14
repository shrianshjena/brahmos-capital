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
                return {"ticker": ticker, "px": round(float(px), 2), "day": day}
            except Exception as e:
                print(f"    attempt {attempt+1} failed for {ticker} ({url[:50]}): {e}")
                time.sleep(1.0 + attempt * 2.0)  # backoff: 1s, 3s, 5s
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

    # 1. Fetch all prices
    prices = {}
    for ticker, symbol in SYMBOL_MAP.items():
        result = fetch_price(ticker, symbol)
        if result:
            prices[ticker] = result
            sign = "+" if result["day"] >= 0 else ""
            print(f"  ✅ {ticker:<14} ₹{result['px']:>10.2f}  {sign}{result['day']:.2f}%")
        else:
            print(f"  ❌ {ticker:<14} fetch failed — keeping existing value")
        time.sleep(0.25)   # gentle rate limit

    print(f"\nFetched {len(prices)}/{len(SYMBOL_MAP)} prices")

    if len(prices) < 10:
        print("Too few prices — aborting to avoid corrupting the file.")
        raise SystemExit(1)

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
