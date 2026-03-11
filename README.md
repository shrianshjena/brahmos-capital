# 🛡️ Brahmos Capital

**NSE India Defence Investment Intelligence Dashboard**

Built by [Shriansh Jena](https://github.com/shrianshjena)

---

## Overview

Brahmos Capital is a real-time dashboard for tracking Indian defence sector stocks listed on the NSE. It provides portfolio analytics, investment signals, geopolitical intelligence, and sector drill-downs — all in a clean Apple-ecosystem aesthetic.

**Live stocks tracked:** HAL · BEL · MAZDOCK · COCHINSHIP · GRSE · BDL · DATAPATTNS · PARAS · ZENTEC

## Features

| Section | Description |
|---|---|
| **Portfolio** | Normalised benchmark chart vs Nifty India Defence + full positions table with sparklines |
| **Signals** | Buy/Sell/Hold signals filtered by Gov, Geo, and Market categories with confidence scores |
| **Drill-Down** | Sector allocation breakdown + individual stock cards with P/E, market cap, return |
| **Geopolitical** | Live geopolitical events with impact scores and affected tickers |

## Stack

- **React 18** + **Vite**
- **Recharts** for charts and sparklines
- **Lucide React** for SF Symbol-inspired icons
- Apple dark mode design system (`-apple-system` SF Pro font stack)

## Deploy

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### GitHub + Vercel

1. Push to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/brahmos-capital.git
git push -u origin master
```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub → Deploy

### Local Development

```bash
npm install
npm run dev
```

---

*Data as of 11 Mar 2026 · For informational purposes only · Not investment advice*
