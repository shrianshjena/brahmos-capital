import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Layers, Zap, Globe, BarChart2, Search, Calculator, Shield, TrendingUp, Newspaper, MessageSquare, ChevronRight, ArrowUpRight, ArrowDownRight, TrendingDown, Activity, Send, Loader, Filter, Star, AlertCircle, CheckCircle, Info, BookOpen, Flame } from "lucide-react";

const A = {
  bg:"#000000",bg2:"#0A0A0A",bg3:"#111111",
  card:"#1C1C1E",card2:"#2C2C2E",card3:"#3A3A3C",
  sep:"rgba(84,84,88,0.55)",sepLight:"rgba(84,84,88,0.28)",
  blue:"#0A84FF",blueGlow:"rgba(10,132,255,0.18)",
  green:"#30D158",greenGlow:"rgba(48,209,88,0.15)",
  red:"#FF453A",redGlow:"rgba(255,69,58,0.15)",
  orange:"#FF9F0A",yellow:"#FFD60A",
  purple:"#BF5AF2",teal:"#32ADE6",indigo:"#5E5CE6",
  t1:"#FFFFFF",t2:"rgba(235,235,245,0.60)",
  t3:"rgba(235,235,245,0.30)",t4:"rgba(235,235,245,0.18)",
};

function rng(s){let v=s;return()=>{v=(v*16807)%2147483647;return(v-1)/2147483646;};}
function mkSpark(seed,up){const r=rng(seed);const p=[100];for(let i=1;i<24;i++)p.push(Math.max(68,p[i-1]+(up?.5:-.2)+(r()-.46)*4));return p.map(v=>({v}));}

const STOCKS=[
  {ticker:"HAL",        name:"Hindustan Aeronautics",    sub:"Aerospace · MRO",              shares:50,  buy:3200, px:3979.40,day:-1.10,pe:30.2,pb:5.8, roe:19.2,mc:2970,  ob:1050,seed:1001,sector:"Aerospace"},
  {ticker:"BEL",        name:"Bharat Electronics",       sub:"Electronics · C4ISR",          shares:500, buy:310,  px:454.60, day:-2.96,pe:65.1,pb:12.4,roe:22.5,mc:2920,  ob:700, seed:1002,sector:"Electronics"},
  {ticker:"MAZDOCK",    name:"Mazagon Dock Shipbuilders", sub:"Naval · Submarines",           shares:80,  buy:1800, px:2371.00,day:-4.08,pe:47.3,pb:9.1, roe:21.3,mc:1000,  ob:380, seed:1003,sector:"Naval"},
  {ticker:"COCHINSHIP", name:"Cochin Shipyard",           sub:"Naval · Shipbuilding",         shares:120, buy:1100, px:1457.10,day:-2.23,pe:30.5,pb:5.2, roe:17.8,mc:440,   ob:210, seed:1004,sector:"Naval"},
  {ticker:"GRSE",       name:"Garden Reach Shipbuilders", sub:"Naval · Patrol Vessels",       shares:60,  buy:1900, px:2470.90,day:-2.07,pe:42.1,pb:8.3, roe:20.1,mc:290,   ob:225, seed:1005,sector:"Naval"},
  {ticker:"BDL",        name:"Bharat Dynamics",           sub:"Missiles · Munitions",         shares:150, buy:900,  px:1313.60,day:-3.18,pe:83.5,pb:14.2,roe:17.0,mc:550,   ob:290, seed:1006,sector:"Missiles"},
  {ticker:"DATAPATTNS", name:"Data Patterns India",       sub:"Defence Electronics · Radar",  shares:30,  buy:2500, px:3470.90,day:-0.58,pe:75.2,pb:11.8,roe:16.5,mc:100,   ob:32,  seed:1007,sector:"Electronics"},
  {ticker:"PARAS",      name:"Paras Defence & Space",     sub:"Optics · Space · EMP",         shares:200, buy:500,  px:721.45, day:-3.72,pe:70.8,pb:9.6, roe:14.2,mc:60,    ob:18,  seed:1008,sector:"Space"},
  {ticker:"ZENTEC",     name:"Zen Technologies",           sub:"Training · Anti-Drone",        shares:100, buy:900,  px:1413.00,day:-0.97,pe:45.1,pb:8.9, roe:20.8,mc:70,    ob:42,  seed:1009,sector:"Electronics"},
  {ticker:"SOLARINDS",  name:"Solar Industries India",    sub:"Explosives · Propellants",     shares:15,  buy:10500,px:15050.00,day:+0.49,pe:94.4,pb:16.0,roe:18.5,mc:135277,ob:5800,seed:2001,sector:"Explosives"},
  {ticker:"MTAR",       name:"MTAR Technologies",         sub:"Precision Aero · Propulsion",  shares:60,  buy:1600, px:3722.00,day:+3.02,pe:169.8,pb:14.2,roe:8.5, mc:10778, ob:580, seed:2002,sector:"Aerospace"},
  {ticker:"BHARATFORG", name:"Bharat Forge",              sub:"Forgings · Artillery · UAV",   shares:100, buy:1250, px:1848.00,day:-0.75,pe:42.0,pb:8.5, roe:20.2,mc:86000, ob:2200,seed:2003,sector:"Forgings"},
  {ticker:"ASTRAMICRO", name:"Astra Microwave Products",  sub:"Radar · EW Systems",           shares:180, buy:660,  px:1030.00,day:+2.21,pe:58.9,pb:10.2,roe:17.8,mc:9821,  ob:890, seed:2004,sector:"Electronics"},
  {ticker:"BEML",       name:"BEML Ltd",                  sub:"Combat Vehicles · Rail",       shares:100, buy:1100, px:1590.00,day:+1.44,pe:55.3,pb:4.8, roe:8.7, mc:13772, ob:620, seed:2005,sector:"Vehicles"},
  {ticker:"APOLLOMICRO",name:"Apollo Micro Systems",      sub:"Embedded Defence Electronics", shares:500, buy:165,  px:211.00, day:+0.47,pe:84.9,pb:12.5,roe:14.8,mc:7578,  ob:180, seed:2006,sector:"Electronics"},
  {ticker:"MIDHANI",    name:"Mishra Dhatu Nigam",        sub:"Special Alloys · Titanium",    shares:250, buy:280,  px:350.00, day:+0.85,pe:60.2,pb:5.1, roe:8.4, mc:6526,  ob:920, seed:2007,sector:"Materials"},
  {ticker:"IDEAFORGE",  name:"Ideaforge Technology",      sub:"Drones · UAV Systems",         shares:300, buy:310,  px:510.00, day:+4.46,pe:145.0,pb:8.5,roe:5.8, mc:2600,  ob:180, seed:2008,sector:"Drones"},
  {ticker:"PREMEXPLN",  name:"Premier Explosives",        sub:"Explosives · Propellants",     shares:400, buy:320,  px:491.00, day:+0.42,pe:62.0,pb:8.8, roe:14.2,mc:1560,  ob:220, seed:2009,sector:"Explosives"},
  {ticker:"UNIMECH",    name:"Unimech Aerospace",         sub:"Aerospace Precision Parts",    shares:350, buy:560,  px:872.00, day:-0.07,pe:68.0,pb:12.0,roe:17.6,mc:3000,  ob:140, seed:2010,sector:"Aerospace"},
  {ticker:"PTCIND",     name:"PTC Industries",            sub:"Precision Castings · Aero",    shares:20,  buy:9500, px:14200.00,day:+1.20,pe:85.0,pb:14.5,roe:16.8,mc:6800,  ob:380, seed:2011,sector:"Aerospace"},
  {ticker:"DCXINDIA",   name:"DCX Systems",               sub:"Cable Harness · Electronics",  shares:800, buy:150,  px:173.00, day:-0.30,pe:48.0,pb:5.2, roe:11.0,mc:2800,  ob:650, seed:2012,sector:"Electronics"},
  {ticker:"DYNAMATECH", name:"Dynamatic Technologies",    sub:"Aerospace Structures · UAV",   shares:30,  buy:3800, px:5150.00,day:+1.55,pe:202.8,pb:22.0,roe:10.8,mc:7287,  ob:640, seed:2013,sector:"Aerospace"},
  {ticker:"AVANTEL",    name:"Avantel Ltd",               sub:"Satellite Comms · Defence",    shares:600, buy:95,   px:141.00, day:+0.48,pe:228.9,pb:18.5,roe:8.1, mc:3845,  ob:290, seed:2014,sector:"Electronics"},
  {ticker:"AXISCADES",  name:"Axiscades Technologies",    sub:"Aerospace Engineering R&D",    shares:250, buy:450,  px:620.00, day:+0.60,pe:62.4,pb:6.8, roe:10.9,mc:6402,  ob:180, seed:2015,sector:"Aerospace"},
  {ticker:"CYIENTDLM",  name:"Cyient DLM",                sub:"PCB · Defence Electronics",    shares:200, buy:850,  px:960.00, day:-2.50,pe:55.0,pb:7.2, roe:13.0,mc:3200,  ob:380, seed:2016,sector:"Electronics"},
].map(s=>({...s,mktVal:s.shares*s.px,cost:s.shares*s.buy,ret:((s.px-s.buy)/s.buy)*100,spark:mkSpark(s.seed,s.px>s.buy)}));

const TOTVAL=STOCKS.reduce((a,s)=>a+s.mktVal,0);
const TOTCOST=STOCKS.reduce((a,s)=>a+s.cost,0);
const TOTRET=((TOTVAL-TOTCOST)/TOTCOST)*100;
const BENCH=19.0; const ALPHA=TOTRET-BENCH;
STOCKS.forEach(s=>{s.wt=(s.mktVal/TOTVAL)*100;});
const SECT_PE_AVG=52;

const CONSENSUS={
  HAL:       {buy:20,hold:5, sell:2, target:4960,brokers:["Motilal","HDFC Sec","Kotak","Nomura","CLSA"]},
  BEL:       {buy:15,hold:8, sell:4, target:520, brokers:["Motilal","Emkay","Axis","ICICI Sec","JM Fin"]},
  MAZDOCK:   {buy:16,hold:4, sell:2, target:2850,brokers:["Kotak","Motilal","Nuvama","CLSA","Jefferies"]},
  COCHINSHIP:{buy:12,hold:6, sell:3, target:1750,brokers:["HDFC Sec","Motilal","ICICI Sec","Axis","Prabhudas"]},
  GRSE:      {buy:14,hold:5, sell:2, target:2950,brokers:["Kotak","Emkay","Motilal","Yes Sec","BOB Cap"]},
  BDL:       {buy:10,hold:7, sell:5, target:1450,brokers:["Nomura","Kotak","HDFC Sec","Axis","Jefferies"]},
  DATAPATTNS:{buy:8, hold:6, sell:7, target:3200,brokers:["HDFC Sec","Motilal","Kotak","Emkay","Prabhudas"]},
  PARAS:     {buy:10,hold:5, sell:4, target:820, brokers:["ICICI Sec","Axis","YES Sec","Nirmal Bang","Monarch"]},
  ZENTEC:    {buy:12,hold:4, sell:2, target:1650,brokers:["Motilal","HDFC Sec","Emkay","Nirmal Bang","BOB Cap"]},
  SOLARINDS: {buy:18,hold:5, sell:2, target:18500,brokers:["ICICI Sec","Motilal","Emkay","Kotak","Jefferies"]},
  MTAR:      {buy:12,hold:6, sell:3, target:4200, brokers:["Motilal","HDFC Sec","Kotak","Emkay","Nuvama"]},
  BHARATFORG:{buy:16,hold:7, sell:2, target:2200, brokers:["Motilal","ICICI Sec","Kotak","CLSA","Nomura"]},
  ASTRAMICRO:{buy:14,hold:5, sell:2, target:1200, brokers:["ICICI Sec","Motilal","Axis","BOB Cap","Prabhudas"]},
  BEML:      {buy:10,hold:8, sell:4, target:1850, brokers:["HDFC Sec","Motilal","Axis","Emkay","ICICI Sec"]},
  APOLLOMICRO:{buy:12,hold:4,sell:2, target:280,  brokers:["HDFC Sec","Motilal","YES Sec","Nirmal Bang","Monarch"]},
  MIDHANI:   {buy:10,hold:6, sell:3, target:445,  brokers:["ICICI Sec","Motilal","Axis","Emkay","Kotak"]},
  IDEAFORGE: {buy:8, hold:5, sell:4, target:650,  brokers:["Motilal","Emkay","YES Sec","Nirmal Bang","BOB Cap"]},
  PREMEXPLN: {buy:10,hold:5, sell:3, target:620,  brokers:["Motilal","HDFC Sec","YES Sec","Nirmal Bang","Monarch"]},
  UNIMECH:   {buy:11,hold:5, sell:2, target:1050, brokers:["Kotak","Motilal","Emkay","YES Sec","BOB Cap"]},
  PTCIND:    {buy:12,hold:4, sell:2, target:17200,brokers:["ICICI Sec","Motilal","Kotak","Emkay","Nuvama"]},
  DCXINDIA:  {buy:9, hold:6, sell:3, target:215,  brokers:["HDFC Sec","Motilal","YES Sec","Nirmal Bang","Monarch"]},
  DYNAMATECH:{buy:8, hold:5, sell:4, target:6200, brokers:["Kotak","Emkay","Motilal","YES Sec","Nuvama"]},
  AVANTEL:   {buy:6, hold:5, sell:5, target:175,  brokers:["ICICI Sec","Axis","YES Sec","Nirmal Bang","Monarch"]},
  AXISCADES: {buy:10,hold:5, sell:3, target:780,  brokers:["HDFC Sec","Kotak","Emkay","YES Sec","BOB Cap"]},
  CYIENTDLM: {buy:9, hold:6, sell:4, target:1150, brokers:["Motilal","HDFC Sec","Kotak","Emkay","Nuvama"]},
  SOLARINDS: {buy:18,hold:6, sell:3, target:18500,brokers:["Motilal","Kotak","CLSA","Jefferies","Nomura"]},
  MTARTECH:  {buy:12,hold:5, sell:4, target:4200, brokers:["HDFC Sec","Emkay","Axis","Motilal","BOB Cap"]},
  BHARATFORG:{buy:16,hold:5, sell:2, target:2250, brokers:["Kotak","Motilal","CLSA","Nomura","Jefferies"]},
  ASTRAMICRO:{buy:14,hold:4, sell:3, target:1250, brokers:["HDFC Sec","Motilal","Emkay","ICICI Sec","Axis"]},
  BEML:      {buy:15,hold:5, sell:3, target:2400, brokers:["Motilal","HDFC Sec","Kotak","Emkay","Axis"]},
  MIDHANI:   {buy:10,hold:6, sell:4, target:410,  brokers:["Motilal","HDFC Sec","ICICI Sec","Axis","Emkay"]},
  APOLLOMICRO:{buy:14,hold:4,sell:3, target:340,  brokers:["HDFC Sec","Motilal","BOB Cap","YES Sec","Monarch"]},
  DYNAMATIC: {buy:8, hold:5, sell:6, target:7200, brokers:["Kotak","HDFC Sec","Motilal","Emkay","Axis"]},
  UNIMECHAE: {buy:11,hold:4, sell:3, target:1100, brokers:["Motilal","HDFC Sec","ICICI Sec","Emkay","BOB Cap"]},
  DCXSYSTEMS:{buy:10,hold:5, sell:4, target:240,  brokers:["HDFC Sec","Motilal","Axis","YES Sec","BOB Cap"]},
  PTCIND:    {buy:9, hold:5, sell:4, target:19500,brokers:["Kotak","Motilal","HDFC Sec","CLSA","Emkay"]},
  IDEAFORGE: {buy:10,hold:6, sell:5, target:620,  brokers:["Motilal","HDFC Sec","Emkay","Axis","YES Sec"]},
  CYIENTDLM: {buy:9, hold:5, sell:4, target:580,  brokers:["Motilal","HDFC Sec","Kotak","Emkay","Axis"]},
  PREMEXPLN: {buy:8, hold:6, sell:4, target:600,  brokers:["Motilal","YES Sec","BOB Cap","Monarch","Nirmal Bang"]},
  AXISCADES: {buy:10,hold:5, sell:3, target:760,  brokers:["HDFC Sec","Motilal","Axis","Emkay","YES Sec"]},
  AVANTEL:   {buy:7, hold:5, sell:6, target:155,  brokers:["Motilal","YES Sec","BOB Cap","Monarch","Nirmal Bang"]},
};

const NEWS=[
  // --- March 11 ---
  {id:1, date:"11 Mar 2026",cat:"GEOPO",  impact:"BULLISH",hot:true, tickers:["BDL","ZENTEC","PARAS"],
   headline:"Iran Strikes Slow to Halt as India Boosts Air-Defence Procurement — BDL, ZENTEC in Focus",
   body:"As Operation Epic Fury enters its twelfth day with no ceasefire, India's MoD has fast-tracked emergency procurement of QRSAM and short-range air-defence systems. BDL and Zen Technologies are direct beneficiaries of the C-UAS and missile-defence surge.",
   source:"Moneycontrol · Defence Correspondent"},
  {id:2, date:"11 Mar 2026",cat:"MARKET", impact:"MIXED",  hot:false,tickers:["HAL","BEL","BDL","MAZDOCK"],
   headline:"Nifty India Defence Falls 0.75% as Trump Signals Iran Conflict 'May Be Short-Lived'",
   body:"Profit-booking hit defence stocks on 11 March after US President Trump suggested the war with Iran could end soon. HAL and ZENTEC fell ~2%; GRSE and BEL among losers. However, analysts note structural demand is intact regardless of near-term ceasefire.",
   source:"India TV News · Markets Desk"},
  // --- March 10 ---
  {id:3, date:"10 Mar 2026",cat:"DEAL",   impact:"BULLISH",hot:true, tickers:["HAL","BEL","BDL"],
   headline:"Indonesia Formalises BrahMos Missile Acquisition — India's Largest Defence Export",
   body:"Indonesia has formally signed the BrahMos supersonic cruise missile deal, marking India's largest-ever defence export at ~$375M. HAL supplies propulsion systems, BEL provides guidance electronics, and BDL manufactures the warhead subsystem.",
   source:"Economic Times Defence"},
  {id:4, date:"10 Mar 2026",cat:"BROKER", impact:"BULLISH",hot:false,tickers:["HAL","BEL","BDL","MAZDOCK"],
   headline:"Motilal Oswal Issues BUY on 4 Stocks Post BrahMos Deal; Raises Targets",
   body:"Following the Indonesia deal, Motilal Oswal raised targets: HAL to ₹4,960, BEL to ₹520, BDL to ₹1,450, MAZDOCK to ₹2,850. Analyst cited strong order pipeline and sustained geopolitical tailwinds as key re-rating drivers.",
   source:"Motilal Oswal Research"},
  // --- March 9 ---
  {id:5, date:"9 Mar 2026", cat:"BROKER", impact:"MIXED",  hot:false,tickers:["HAL","BEL","BDL","DATAPATTNS","PARAS"],
   headline:"HDFC Securities Initiates on 8 Defence Stocks — Mixed Bag; Electronics Preferred",
   body:"HDFC Sec initiated coverage: BEL (Add ₹490), Data Patterns (Buy ₹3,770), Apollo Micro (Buy ₹280), MAZDOCK (Add ₹2,950), Astra Micro (Add ₹1,130) are positive; HAL (Reduce ₹3,265), BDL (Reduce ₹1,120), and Paras Defence (Reduce ₹665) flagged on valuation. Prefers electronics value-chain.",
   source:"HDFC Securities Research · Business Standard"},
  // --- March 8 ---
  {id:6, date:"8 Mar 2026", cat:"RESULTS",impact:"BULLISH",hot:false,tickers:["DATAPATTNS"],
   headline:"Data Patterns Hits 52-Week High ₹3,609; Order Book at All-Time High ₹1,868 Cr",
   body:"Data Patterns rallied 7.5% intraday, touching a 52-week high of ₹3,609. The company's order book reached a record ₹1,868 Cr. Management cited strong budget support for radars, EW systems, and advanced electronics as the key demand driver.",
   source:"Business Standard · Markets"},
  // --- March 7 ---
  {id:7, date:"7 Mar 2026", cat:"MARKET", impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"Nifty India Defence Hits 7-Month High; Up 6% in 2 Days on Iran War Tailwinds",
   body:"The Nifty India Defence index hit 8,579.80 — a seven-month high — surging 3.4% intraday, taking the 2-day gain to 6% vs Nifty 50's 1% move. The sector has rallied 11% in one month, significantly outperforming the benchmark's 4% fall.",
   source:"Business Standard · Markets"},
  // --- March 6 ---
  {id:8, date:"6 Mar 2026", cat:"GEOPO",  impact:"BULLISH",hot:true, tickers:["MAZDOCK","COCHINSHIP","GRSE"],
   headline:"US Destroys Iranian Warship Near Sri Lanka — Accelerates Indian Navy Procurement",
   body:"The first US naval combat engagement since WWII occurred in India's strategic backyard. The Indian Navy has accelerated its P-75I submarine programme and NGOPV procurement timelines. MAZDOCK, Cochin Shipyard, and GRSE are direct beneficiaries.",
   source:"Defence News India"},
  {id:9, date:"6 Mar 2026", cat:"POLICY", impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"Defence Minister Approves New Procurement Manual (DPM) — Streamlines ₹1L Cr Revenue Orders",
   body:"Defence Minister Rajnath Singh approved a new Defence Procurement Manual, streamlining procurement for estimated ₹1 trillion in annual revenue orders. DPM reduces execution risk, lowers timeline, and is widely viewed as structural positive per ICICI Securities.",
   source:"ICICI Securities Research"},
  // --- March 5 ---
  {id:10,date:"5 Mar 2026", cat:"ORDER",  impact:"BULLISH",hot:true, tickers:["MAZDOCK"],
   headline:"Indian Navy Finalises ₹99,000 Cr P-75I Submarine Deal with Thyssenkrupp",
   body:"The Indian Navy is finalising the landmark ₹99,000 Cr contract for 6 advanced P-75I submarines with Germany's Thyssenkrupp Marine Systems. MDL's Mazagon Dock is the designated Indian construction yard — a transformative decade-long revenue pipeline.",
   source:"Defence News India"},
  {id:11,date:"5 Mar 2026", cat:"GEOPO",  impact:"BULLISH",hot:true, tickers:["SECTOR"],
   headline:"Strait of Hormuz Traffic Near Standstill — 150 Ships Stalled; India Eyes Strategic Opportunity",
   body:"Iranian counter-strikes have slowed Strait of Hormuz traffic to near-standstill, with 150 freight and oil tankers stalled. India's strategic location in the Indian Ocean and its growing naval capacity have made it an indispensable regional security partner — directly boosting procurement urgency.",
   source:"Wikipedia · Economic Impact of 2026 Iran War"},
  // --- March 4 ---
  {id:12,date:"4 Mar 2026", cat:"ORDER",  impact:"BULLISH",hot:false,tickers:["HAL"],
   headline:"MoD Awards HAL ₹5,083 Cr — 6 ALH Mk-III Helicopters + Shtil Naval Missiles",
   body:"HAL secured ₹5,083 Cr in contracts from MoD: ₹2,901 Cr for 6 ALH Mk-III helicopters for the Coast Guard, and ₹2,182 Cr for Shtil surface-to-air missiles for the Indian Navy. Order book visibility and cash flows strengthen materially.",
   source:"Ministry of Defence"},
  // --- March 3 ---
  {id:13,date:"3 Mar 2026", cat:"ORDER",  impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"Sunita Tools Gets Full Advance on ₹576 Cr NATO 155mm Shell Contract — Defence Exports Accelerating",
   body:"Sunita Tools confirmed receipt of full advance payment for 2,40,000 NATO-spec 155mm M107 shells over 24 months (~₹24 Cr monthly billing). The contract signals India's growing integration into NATO defence supply chains.",
   source:"BSE Filing"},
  // --- March 2 ---
  {id:14,date:"2 Mar 2026", cat:"GEOPO",  impact:"BULLISH",hot:true, tickers:["PARAS","ZENTEC","BDL"],
   headline:"US-Israel Launch 'Operation Epic Fury' on Iran — 900 Strikes in 12 Hours; Khamenei Killed",
   body:"On 28 February 2026, the US and Israel launched Operation Epic Fury targeting Iranian military infrastructure, killing Supreme Leader Khamenei. Iran retaliated with missile and drone strikes across the Gulf. Global defence spending urgency hit a post-Cold War high — Indian stocks surged up to 17% over the following week.",
   source:"Britannica · 2026 Iran Conflict"},
  {id:15,date:"2 Mar 2026", cat:"MARKET", impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"MTAR Technologies +51%, Data Patterns +39%, Bharat Forge +34.6% in Past Month — Iran War Catalyst",
   body:"The Iran conflict triggered sharp re-ratings across the Indian defence complex. MTAR Technologies (+51%), Data Patterns (+39.2%), Bharat Forge (+34.6%), Dynamatic Tech (+26.3%), and Astra Micro (+6.5%) led gains. Defence index now up 19% YTD vs Nifty 50 up 7%.",
   source:"Goodreturns · Market Wrap"},
  // --- March 1 ---
  {id:16,date:"1 Mar 2026", cat:"MARKET", impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"Nifty India Defence Up 19% YTD — Outperforms Nifty 50 by 12 Percentage Points",
   body:"The Nifty India Defence Index has surged 19% year-to-date by March 2026, significantly outperforming the Nifty 50's 7% gain. BEL holds the highest index weight at 29.82%, followed by HAL at 23.44% and Solar Industries at 11.94%.",
   source:"NSE India · Smart-Investing.in"},
  // --- February 28 ---
  {id:17,date:"28 Feb 2026",cat:"GEOPO",  impact:"BULLISH",hot:true, tickers:["HAL","BEL","BDL"],
   headline:"Iran Launches Retaliatory Missiles Across Gulf — Antique Stockbroking Flags BEL & BDL Supply Chain Risk",
   body:"Iran launched missiles and drones targeting UAE, Qatar, Kuwait, and Gulf oil infrastructure. Antique Stockbroking flagged BEL and BDL supply chain exposure to US and Israeli components. Both stocks fell 2–3% near-term but recovered sharply on sustained procurement urgency.",
   source:"Goodreturns · Antique Stockbroking"},
  {id:18,date:"28 Feb 2026",cat:"BROKER", impact:"MIXED",  hot:false,tickers:["HAL","BEL","MAZDOCK"],
   headline:"HDFC Securities: Global Defence Spend at $2.65T in 2024, Growing at 8.6% CAGR",
   body:"HDFC Sec report: Worldwide military spending reached $2.65 trillion in 2024, growing at 8.6% CAGR over three years — well above historical averages. Countries investing heavily in missile defence, drones, space systems, and EW technologies. India's domestic manufacturers capture growing share.",
   source:"HDFC Securities · India TV News"},
  // --- February 20 ---
  {id:19,date:"20 Feb 2026",cat:"POLICY", impact:"LT BULL",hot:false,tickers:["BEL","HAL","DATAPATTNS"],
   headline:"AMCA Program Narrows to 3 Consortia — BEL-L&T Among Avionics Finalists",
   body:"India's Advanced Medium Combat Aircraft programme shortlisted 3 consortia for its critical avionics package. BEL-L&T is among the finalists. AMCA is a decade-long, ₹1.5L Cr+ stealth fighter programme that will shape India's air power through the 2040s-2060s.",
   source:"Indian Defence Research Wing"},
  // --- February 17 ---
  {id:20,date:"17 Feb 2026",cat:"RESULTS",impact:"BULLISH",hot:false,tickers:["PARAS"],
   headline:"Paras Defence Q3 Net Profit +21% to ₹18.2 Cr; Revenue +24% to ₹106.4 Cr",
   body:"Paras Defence posted strong Q3 FY26 results: net profit up 21.1% to ₹18.21 Cr, revenue up 24% to ₹106.35 Cr. Company also approved incorporation of Paras Avionics subsidiary and took 49% stake in Himanshi Thermal Solutions for space thermal applications.",
   source:"Capital Market Live · Tickertape"},
  // --- February 15 ---
  {id:21,date:"15 Feb 2026",cat:"ORDER",  impact:"BULLISH",hot:false,tickers:["BEL"],
   headline:"BEL Commits to ₹570 Bn FY26 Order Target — QRSAM Contract Expected in Q4",
   body:"Bharat Electronics committed to ₹570 Bn in FY26 order inflows. The QRSAM air-defence contract (~₹300 Bn) is expected in Q4 FY26. BEL is also a development partner for DRDO's Project Kusha (Sudarshan Chakra) advanced radar system.",
   source:"BEL Investor Day"},
  // --- February 10 ---
  {id:22,date:"10 Feb 2026",cat:"ORDER",  impact:"BULLISH",hot:false,tickers:["PARAS"],
   headline:"Paras Defence Subsidiary Secures €2.57M CERBAIR Deal — CHIMERA 200 Anti-Drone Tech Exported to France",
   body:"A Paras Defence subsidiary secured a €2.57M deal with France-based CERBAIR to supply the CHIMERA 200 counter-UAS system. Company calls it a 'pivotal step in India's defence export ambitions'. Paras stock up 4.6% on the news.",
   source:"Reuters · Zerodha Markets"},
  // --- February 5 ---
  {id:23,date:"5 Feb 2026", cat:"POLICY", impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"India Signals Long-Term Move Toward 2.5% of GDP on Defence — NATO Benchmark",
   body:"Senior government officials signalled India's intention to align defence spending with NATO norms of 2.5% of GDP, up from ~2%. This would add approximately ₹1.5L Cr annually to the defence budget over the next 5 years — a structural, multi-year earnings catalyst.",
   source:"Ministry of Defence"},
  // --- February 1 ---
  {id:24,date:"1 Feb 2026", cat:"BUDGET", impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"Union Budget FY27: Defence Allocation ₹7.85L Cr (+15.2% YoY) — Record Capex at ₹2.31L Cr",
   body:"India's FY27 Union Budget allocated ₹7.85L Cr to defence — a 15.2% YoY jump. Capital expenditure surged 20.1% to ₹2.31L Cr. Budget also provided customs duty relief on aircraft components and MRO raw materials, lowering input costs for HAL and Cochin Shipyard.",
   source:"Union Budget 2026 · Smallcase"},
  // --- January 27 ---
  {id:25,date:"27 Jan 2026",cat:"GEOPO",  impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"DAC Approves ₹79,000 Cr Procurement — HAL, BEL, MAZDOCK, ZENTEC Among Top Beneficiaries",
   body:"Defence Acquisition Council approved procurement proposals worth ₹79,000 Cr for Army, Navy, and IAF. Bastion Research identified HAL, BEL, MAZDOCK, Zen Technologies, and PTC Industries as primary beneficiaries. HAL's Tejas Mk-1A order backlog expected to reach 180 units and ₹2.6T order book.",
   source:"Bastion Research · Stocktwits"},
  // --- January 15 ---
  {id:26,date:"15 Jan 2026",cat:"EXPORTS",impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"India Defence Exports Hit ₹23,622 Cr in FY25 — 78% Growth in 3 Years; ₹50,000 Cr Target FY29",
   body:"India's defence exports reached a record ₹23,622 Cr in FY2025, up 78% over three years. With BrahMos now exported to multiple countries and Armenia purchasing Pinaka rockets, the FY29 target of ₹50,000 Cr appears increasingly achievable.",
   source:"Ministry of Defence"},
  // --- January 10 ---
  {id:27,date:"10 Jan 2026",cat:"ORDER",  impact:"BULLISH",hot:false,tickers:["GRSE"],
   headline:"GRSE Delivers Record Q3; Order Book ₹22,500 Cr Gives 3-Year Revenue Visibility",
   body:"Garden Reach Shipbuilders posted record Q3 delivery milestones on next-gen offshore patrol vessels. With ₹22,500 Cr order book, revenue visibility extends well into FY29. Multiple analyst target upgrades followed Q3 results.",
   source:"GRSE Investor Relations"},
  // --- January 5 ---
  {id:28,date:"5 Jan 2026", cat:"RESULTS",impact:"BULLISH",hot:false,tickers:["DATAPATTNS"],
   headline:"Data Patterns Q2 FY26: Revenue +32% YoY — Radar & EW Orders Drive Growth",
   body:"Data Patterns reported Q2 FY26 revenue growth of 32% YoY, driven by large radar and electronic warfare system deliveries. Order book at all-time high. Company increased headcount by 18% to support expanding execution pipeline.",
   source:"Capital Market Live"},
  // --- December 2025 ---
  {id:29,date:"18 Dec 2025",cat:"GEOPO",  impact:"BULLISH",hot:false,tickers:["SECTOR"],
   headline:"Ukraine War Enters Year 4: Europe's NATO Rearmament Adds $400B in New Orders — Indian Exporters Gain",
   body:"As the Russia-Ukraine war enters its fourth year, NATO members have committed to raising defence spending to 2.5% of GDP. European rearmament is creating indirect export opportunities for Indian defence manufacturers via dual-use technology and component supply chains.",
   source:"Council on Foreign Relations"},
  {id:30,date:"10 Dec 2025",cat:"POLICY", impact:"BULLISH",hot:false,tickers:["HAL","BEL","DATAPATTNS"],
   headline:"India Finalises New Defence Acquisition Procedure — Faster Timelines, Higher Domestic Content",
   body:"The updated DAP mandates higher indigenisation thresholds for new contracts. Systems-level suppliers like HAL, BEL, and Data Patterns see expanded scope. Long-term visibility on capex allocation strengthened.",
   source:"Ministry of Defence"},
  // --- October 2025 ---
  {id:31,date:"24 Oct 2025",cat:"ORDER",  impact:"BULLISH",hot:false,tickers:["ZENTEC"],
   headline:"Zen Technologies Wins ₹420 Cr C-UAV Contract — Anti-Drone Demand Structurally Elevated",
   body:"Zen Technologies won a ₹420 Cr counter-unmanned aerial vehicle system contract from the Indian Army. The contract follows Operation Sindoor and multiple border drone incidents. Zen's anti-drone training and detection systems are now a priority across all three services.",
   source:"Zen Technologies Filing"},
  {id:32,date:"15 Oct 2025",cat:"GEOPO",  impact:"BULLISH",hot:false,tickers:["BDL","HAL"],
   headline:"Israel-Hamas Conflict Enters Year 3 — India's Missile Ecosystem Sees Spillover Demand",
   body:"With the Gaza conflict entering its third year and Hezbollah active in Lebanon, regional demand for missile interception systems has surged. India's BDL, a key missile and guided-weapon supplier, has fielded multiple export inquiries from Gulf nations.",
   source:"Defence Research and Studies"},
  {id:33,date:"5 Oct 2025", cat:"RESULTS",impact:"BULLISH",hot:false,tickers:["BEL"],
   headline:"BEL Q2 FY26: Net Profit +23% — QRSAM, Arudhra Radar Deliveries Drive Revenue",
   body:"Bharat Electronics reported Q2 FY26 net profit up 23% with revenue growth of 18% YoY. Key deliveries: Arudhra 3D surveillance radar systems, QRSAM sub-components, and BFSRs. Order pipeline healthy at ₹700 Cr+ backlog.",
   source:"BEL Quarterly Results"},
];

const PCHART=[{d:"Mar '25",p:100,b:100},{d:"Apr",p:96,b:97},{d:"May",p:104,b:100},{d:"Jun",p:111,b:103},{d:"Jul",p:117,b:107},{d:"Aug",p:113,b:105},{d:"Sep",p:120,b:108},{d:"Oct",p:126,b:111},{d:"Nov",p:132,b:114},{d:"Dec",p:135,b:116},{d:"Jan '26",p:129,b:113},{d:"Feb",p:125,b:112},{d:"Mar",p:138,b:119}];
const pct=v=>`${v>=0?"+":""}${v.toFixed(2)}%`;
const inr=v=>`₹${(v/100000).toFixed(2)}L`;
const money=v=>`₹${v.toLocaleString("en-IN",{maximumFractionDigits:2})}`;

function Spark({data,color}){return(<div style={{width:72,height:28}}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:2,right:2,left:2,bottom:2}}><Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5}/></LineChart></ResponsiveContainer></div>);}

function KpiCard({label,value,sub,positive}){return(<div style={{background:A.card,borderRadius:16,padding:"20px 22px",border:`1px solid ${A.sepLight}`,flex:1}}><p style={{fontSize:11,color:A.t3,marginBottom:8,letterSpacing:"0.04em",fontWeight:500}}>{label}</p><p style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",lineHeight:1,marginBottom:6,color:positive===false?A.red:positive===true?A.green:A.t1}}>{value}</p><p style={{fontSize:12,color:A.t3}}>{sub}</p></div>);}

const BADGE_CFG={"STRONG BUY":{bg:"rgba(48,209,88,0.18)",color:A.green,border:"rgba(48,209,88,0.4)"},"BUY":{bg:"rgba(48,209,88,0.10)",color:A.green,border:"rgba(48,209,88,0.25)"},"HOLD":{bg:"rgba(255,159,10,0.15)",color:A.orange,border:"rgba(255,159,10,0.3)"},"REDUCE":{bg:"rgba(255,69,58,0.15)",color:A.red,border:"rgba(255,69,58,0.3)"},"WATCH":{bg:"rgba(10,132,255,0.15)",color:A.blue,border:"rgba(10,132,255,0.3)"}};
function Badge({type}){const c=BADGE_CFG[type]||BADGE_CFG["HOLD"];return(<span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,borderRadius:6,fontSize:10,fontWeight:700,padding:"3px 9px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{type}</span>);}

const IMPACT_CFG={BULLISH:{c:A.green,bg:"rgba(48,209,88,0.12)"},MIXED:{c:A.orange,bg:"rgba(255,159,10,0.12)"},"LT BULL":{c:A.teal,bg:"rgba(50,173,230,0.12)"},NEUTRAL:{c:A.t3,bg:"rgba(255,255,255,0.06)"}};
function ImpactTag({impact}){const c=IMPACT_CFG[impact]||IMPACT_CFG.NEUTRAL;return(<span style={{background:c.bg,color:c.c,borderRadius:6,fontSize:10,fontWeight:600,padding:"2px 8px",letterSpacing:"0.04em"}}>{impact}</span>);}

/* ═══ ASK AI — Shri persona ══════════════════════════════════════ */
const SHRIANSH_PROMPT=`You are Shri, a seasoned Indian equity research analyst and veteran investor with over 20 years of experience on Dalal Street, formerly Head of India Equity Research at a leading global investment bank. You have covered everything from mid-cap opportunities to Nifty 50 blue chips for HNI and institutional clients, with a deep specialisation in Indian PSU defence stocks, aerospace, and naval manufacturing.

You speak with directness, intellectual confidence, and genuine conviction — the kind of clear, honest advice you would give a trusted client over a cup of chai at the BSE members' lounge. No corporate fluff. No hedging for compliance. Just your real view, backed by 20 years of watching cycles on Dalal Street.

When someone asks about a stock or sector, provide a professional equity research note covering:

1. VALUATION CHECK — Assess P/E, P/B, EV/EBITDA vs sector peers on NSE/BSE. Is it fairly valued, overheated, or a hidden bargain?
2. BUSINESS QUALITY & MOAT — Durable competitive advantage? Rate: Weak / Moderate / Strong with reasoning.
3. REVENUE & EARNINGS TRAJECTORY — 5-year revenue/earnings growth trend. Improving or deteriorating?
4. BALANCE SHEET HEALTH — D/E ratio, interest coverage, promoter pledge. Any red flags?
5. DIVIDEND TRACK RECORD — Consistent/sustainable or occasional?
6. 12-MONTH PRICE TARGETS — Realistic bull case and bear case based on fundamentals.
7. RISK RATING (1–10) — Promoter quality, regulatory risk, sector tailwinds/headwinds, liquidity.
8. ENTRY ZONE & STOP-LOSS — Reasonable entry range and disciplined stop-loss level.

End with a structured VERDICT TABLE: | Metric | Value | Rating |

You have live data for these 25 NSE defence stocks as of 11 March 2026 (all bought March 2025):
ORIGINAL 9: HAL ₹3,979 (+24.4% | P/E 30x | Target ₹4,960) | BEL ₹454 (+46.6% | P/E 65x | Target ₹520) | MAZDOCK ₹2,371 (+31.7% | P/E 47x | Target ₹2,850) | COCHINSHIP ₹1,457 (+32.5% | P/E 30x | Target ₹1,750) | GRSE ₹2,471 (+30.1% | P/E 42x | Target ₹2,950) | BDL ₹1,314 (+45.9% | P/E 84x | Target ₹1,450) | DATAPATTNS ₹3,471 (+38.8% | P/E 75x | Target ₹3,770) | PARAS ₹721 (+44.3% | P/E 71x | Target ₹820) | ZENTEC ₹1,413 (+57.0% | P/E 45x | Target ₹1,650)
NEW 16: SOLARINDS ₹15,050 (+43.3% | P/E 94x | explosives/propellants leader) | MTAR ₹3,722 (+132.6% | P/E 170x | propulsion/precision) | BHARATFORG ₹1,848 (+47.8% | P/E 42x | artillery/forgings) | ASTRAMICRO ₹1,030 (+56.1% | P/E 59x | radar/EW) | BEML ₹1,590 (+44.5% | P/E 55x | combat vehicles) | APOLLOMICRO ₹211 (+27.9% | P/E 85x | defence electronics) | MIDHANI ₹350 (+25.0% | P/E 60x | special alloys) | IDEAFORGE ₹510 (+64.5% | P/E 145x | drones/UAV) | PREMEXPLN ₹491 (+53.4% | P/E 62x | explosives) | UNIMECH ₹872 (+55.7% | P/E 68x | aerospace parts) | PTCIND ₹14,200 (+49.5% | P/E 85x | precision castings) | DCXINDIA ₹173 (+15.3% | P/E 48x | cable harness) | DYNAMATECH ₹5,150 (+35.5% | P/E 203x | aerospace structures) | AVANTEL ₹141 (+48.4% | P/E 229x | satcom/naval) | AXISCADES ₹620 (+37.8% | P/E 62x | aerospace R&D) | CYIENTDLM ₹960 (+12.9% | P/E 55x | PCB/electronics)

Key macro context: India FY27 defence budget ₹7.85L Cr (+15.2%); Indonesia BrahMos deal signed; US-Israel launched Operation Epic Fury against Iran (Feb 28); Strait of Hormuz disrupted; Global defence spend $2.65T growing at 8.6% CAGR; Nifty India Defence +19% YTD.

Keep responses structured but conversational. End every response with a clear one-line verdict in bold.`;

function AskAIView(){
  const [messages,setMessages]=useState([{role:"assistant",content:"Namaste. I'm Shri — 20 years on Dalal Street. I built this dashboard to track my own defence portfolio, and now I'm opening it up to the community.\n\nAsk me anything — whether to buy HAL at these levels, whether BDL at 83x P/E makes sense, which stock has the best risk-reward today. I'll give you a full equity research note, not the usual sanitised analyst fluff.\n\nWhat's on your mind?"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const bottomRef=useRef();
  const QUICK=[
    "Is HAL a buy at ₹3,979?",
    "Full analysis of BDL — 83x P/E justified?",
    "Which stock has best risk-reward right now?",
    "Should I book profits after 30-57% gains?",
    "MAZDOCK vs COCHINSHIP — which would you pick?",
    "Is Data Patterns at 75x P/E overvalued?",
    "Impact of US-Iran war on this portfolio?",
    "Best entry point for someone new to this sector?",
  ];
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  const ask=async(q)=>{
    if(!q.trim())return;
    const userMsg={role:"user",content:q};
    setMessages(m=>[...m,userMsg]);
    setInput("");setLoading(true);
    try{
      const res=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:SHRIANSH_PROMPT,
          messages:[...messages,userMsg].map(m=>({role:m.role,content:m.content}))
        })
      });
      const data=await res.json();
      const text=data.content?.[0]?.text||"Server error — please check your API key is set in Vercel environment variables (ANTHROPIC_API_KEY).";
      setMessages(m=>[...m,{role:"assistant",content:text}]);
    }catch(e){setMessages(m=>[...m,{role:"assistant",content:"Network error — please check your connection and try again."}]);}
    setLoading(false);
  };
  return(
    <div style={{padding:"24px 28px",display:"flex",gap:20,height:"calc(100vh - 260px)"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${A.sepLight}`,display:"flex",alignItems:"center",gap:12,background:"linear-gradient(90deg,rgba(10,132,255,0.08),transparent)"}}>
          <div style={{width:42,height:42,borderRadius:13,background:"linear-gradient(135deg,#0A84FF,#0055CC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 16px rgba(10,132,255,0.35)"}}>S</div>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:A.t1}}>Shri</p>
            <p style={{fontSize:11,color:A.t3}}>Ex-Morgan Stanley · Head of India Equity Research · NSE Defence Specialist · 20 yrs Dalal Street</p>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"rgba(48,209,88,0.1)",borderRadius:20,padding:"3px 10px",border:"1px solid rgba(48,209,88,0.2)",display:"flex",gap:5,alignItems:"center"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:A.green,display:"inline-block",animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:11,color:A.green,fontWeight:600}}>AI POWERED</span>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:14}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"82%",padding:"13px 16px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"rgba(10,132,255,0.2)":A.card2,border:`1px solid ${m.role==="user"?"rgba(10,132,255,0.3)":A.sepLight}`}}>
                <p style={{fontSize:13,color:A.t1,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading&&(<div style={{display:"flex"}}><div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:A.card2,border:`1px solid ${A.sepLight}`,display:"flex",alignItems:"center",gap:8}}><Loader size={14} color={A.blue} style={{animation:"spin 1s linear infinite"}}/><span style={{fontSize:13,color:A.t3}}>Shri is analysing...</span></div></div>)}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"14px 16px",borderTop:`1px solid ${A.sepLight}`,display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&ask(input)}
            placeholder="Ask Shri for a full equity research note on any stock..."
            style={{flex:1,background:A.card2,border:`1px solid ${A.sep}`,borderRadius:12,padding:"10px 16px",color:A.t1,fontSize:13,outline:"none"}}/>
          <button onClick={()=>ask(input)} disabled={loading||!input.trim()} style={{width:42,height:42,borderRadius:12,background:A.blue,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:loading||!input.trim()?0.4:1}}>
            <Send size={16} color="#fff"/>
          </button>
        </div>
      </div>
      <div style={{width:268,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:A.card,borderRadius:16,padding:18,border:`1px solid ${A.sepLight}`,flex:1}}>
          <p style={{fontSize:11,fontWeight:600,color:A.t3,marginBottom:14,letterSpacing:"0.05em"}}>QUICK RESEARCH NOTES</p>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {QUICK.map(q=>(<button key={q} onClick={()=>ask(q)} style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${A.sep}`,background:"transparent",color:A.t2,fontSize:12,cursor:"pointer",textAlign:"left",lineHeight:1.5}} onMouseEnter={e=>{e.currentTarget.style.borderColor=A.blue;e.currentTarget.style.color=A.t1;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=A.sep;e.currentTarget.style.color=A.t2;}}>{q}</button>))}
          </div>
        </div>
        <div style={{background:A.card,borderRadius:14,padding:14,border:`1px solid ${A.sepLight}`}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}><AlertCircle size={13} color={A.orange} style={{marginTop:1,flexShrink:0}}/><p style={{fontSize:11,color:A.t4,lineHeight:1.6}}>Equity research notes are for informational purposes only. Not investment advice. SEBI regulations apply.</p></div>
        </div>
      </div>
    </div>
  );
}

/* ═══ PORTFOLIO ════════════════════════════════════════════════════════════ */
function PortfolioView({onAskAI,stocks}){
  const totValP=stocks.reduce((a,s)=>a+s.mktVal,0);
  const stocksWt=stocks.map(s=>({...s,wt:(s.mktVal/totValP)*100}));
  const SIGNALS=[{id:1,ticker:"HAL",type:"STRONG BUY",cat:"Gov",conf:88,date:"4 Mar 2026",title:"MoD Awards ₹5,083 Cr Contract",detail:"6 ALH Mk-III helicopters (₹2,901 Cr) + Shtil naval missiles (₹2,182 Cr). Order book strengthens."},{id:2,ticker:"BDL",type:"STRONG BUY",cat:"Geo",conf:85,date:"10 Mar 2026",title:"Indonesia Signs BrahMos Deal",detail:"India's largest-ever defence export. BDL is key propulsion & warhead supplier."},{id:3,ticker:"MAZDOCK",type:"BUY",cat:"Gov",conf:74,date:"5 Mar 2026",title:"₹99,000 Cr Submarine Pipeline",detail:"Navy finalising 6 P-75I submarines. Transformative decade-long contract."},{id:4,ticker:"GRSE",type:"BUY",cat:"Market",conf:70,date:"1 Mar 2026",title:"Record Q3 Execution",detail:"Order book ₹22,500 Cr provides 3+ year revenue visibility. Target upgrades."},{id:5,ticker:"ZENTEC",type:"BUY",cat:"Geo",conf:72,date:"8 Mar 2026",title:"Anti-Drone Tailwind Post Epic Fury",detail:"Emergency C-UAV procurement accelerated. ZENTEC primary domestic beneficiary."},{id:6,ticker:"COCHINSHIP",type:"BUY",cat:"Market",conf:68,date:"7 Mar 2026",title:"Compelling Valuation at P/E 30x",detail:"P/E 30.5x vs sector avg 52x. NGOPV execution strong, margin recovery underway."},{id:7,ticker:"BEL",type:"HOLD",cat:"Market",conf:55,date:"6 Mar 2026",title:"Stretched at 65x — Await Pullback",detail:"₹570Bn FY26 target achievable, but P/E 65x limits near-term upside. Entry: ₹380–400."},{id:8,ticker:"DATAPATTNS",type:"REDUCE",cat:"Market",conf:63,date:"3 Mar 2026",title:"P/E 75x Prices in Perfection",detail:"Strong franchise but HDFC Sec flags execution risk. Trim 20–30% on strength."},{id:9,ticker:"HAL",type:"WATCH",cat:"Gov",conf:40,date:"23 Feb 2026",title:"Tejas Ground Incident — Monitor",detail:"Minor ground incident confirmed by HAL. Safety record intact. Watch export pipeline."}];
  const [sigFilter,setSigFilter]=useState("All");
  const catColor={Gov:A.blue,Geo:A.orange,Market:A.t3};
  const sigItems=SIGNALS.filter(s=>sigFilter==="All"||s.cat===sigFilter);
  return(
    <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:20}}>
      {/* ASK AI HERO BANNER */}
      <div onClick={onAskAI} style={{background:"linear-gradient(135deg,rgba(10,132,255,0.22) 0%,rgba(94,92,230,0.18) 60%,rgba(10,132,255,0.08) 100%)",borderRadius:18,padding:"22px 28px",border:"1px solid rgba(10,132,255,0.4)",cursor:"pointer",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",gap:22}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(10,132,255,0.7)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(10,132,255,0.4)"}>
        <div style={{position:"absolute",top:-30,right:-30,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(10,132,255,0.15),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{width:54,height:54,borderRadius:16,background:"linear-gradient(135deg,#0A84FF,#0055CC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 6px 24px rgba(10,132,255,0.4)"}}>S</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
            <p style={{fontSize:16,fontWeight:700,color:A.t1}}>Ask Shri — AI Equity Research</p>
            <span style={{background:"rgba(10,132,255,0.25)",color:A.blue,border:"1px solid rgba(10,132,255,0.5)",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 10px",letterSpacing:"0.05em"}}>POWERED BY AI</span>
          </div>
          <p style={{fontSize:13,color:A.t2,lineHeight:1.5}}>Ex-Morgan Stanley (hypothetical). Ask for a full valuation analysis, buy/hold/sell call, 12-month price targets, and entry zones on any stock in this portfolio.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,color:A.blue,fontSize:13,fontWeight:600,flexShrink:0}}>
          <span>Open Chat</span>
          <ChevronRight size={16}/>
        </div>
      </div>
      {/* Chart */}
      <div style={{background:A.card,borderRadius:16,padding:"22px 24px",border:`1px solid ${A.sepLight}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><p style={{fontSize:13,fontWeight:600,color:A.t1,marginBottom:3}}>Portfolio vs Nifty India Defence</p><p style={{fontSize:12,color:A.t3}}>Normalised to 100 · Mar 2025 – Mar 2026</p></div>
          <div style={{display:"flex",gap:20}}>{[{l:"Portfolio",c:A.blue},{l:"Nifty Defence",c:A.green}].map(({l,c})=>(<div key={l} style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:20,height:2,background:c,borderRadius:1,display:"inline-block"}}/><span style={{fontSize:12,color:A.t2}}>{l}</span></div>))}</div>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={PCHART} margin={{top:5,right:4,left:-18,bottom:0}}>
            <defs>
              <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={A.blue} stopOpacity={0.3}/><stop offset="95%" stopColor={A.blue} stopOpacity={0}/></linearGradient>
              <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={A.green} stopOpacity={0.15}/><stop offset="95%" stopColor={A.green} stopOpacity={0}/></linearGradient>
            </defs>
            <XAxis dataKey="d" tick={{fill:A.t4,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis domain={[80,150]} tick={{fill:A.t4,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:A.card2,border:`1px solid ${A.sep}`,borderRadius:10,color:A.t1,fontSize:12}}/>
            <Area type="monotone" dataKey="b" stroke={A.green} strokeWidth={1.5} fill="url(#gB)" dot={false}/>
            <Area type="monotone" dataKey="p" stroke={A.blue} strokeWidth={2} fill="url(#gP)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Positions table */}
      <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${A.sepLight}`}}><p style={{fontSize:13,fontWeight:600,color:A.t1}}>Positions · Bought March 2025</p></div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:920}}>
            <thead><tr style={{borderBottom:`1px solid ${A.sepLight}`}}>{["Ticker","Company","Sector","Shares","Avg Cost","Price","Mkt Value","Weight","Return","Today","Trend"].map(h=>(<th key={h} style={{padding:"10px 16px",textAlign:["Ticker","Company","Sector"].includes(h)?"left":"right",fontSize:11,color:A.t3,fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
            <tbody>{stocksWt.map((s,i)=>(<tr key={s.ticker} style={{borderBottom:`1px solid ${A.sepLight}`,background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}><td style={{padding:"11px 16px"}}><span style={{color:A.blue,fontSize:13,fontWeight:600}}>{s.ticker}</span></td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,whiteSpace:"nowrap"}}>{s.name}</td><td style={{padding:"11px 16px",color:A.t3,fontSize:12}}>{s.sub}</td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{s.shares}</td><td style={{padding:"11px 16px",color:A.t3,fontSize:12,textAlign:"right"}}>{money(s.buy)}</td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{money(s.px)}</td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{inr(s.mktVal)}</td><td style={{padding:"11px 16px",color:A.t3,fontSize:12,textAlign:"right"}}>{s.wt.toFixed(1)}%</td><td style={{padding:"11px 16px",textAlign:"right"}}><span style={{color:s.ret>=0?A.green:A.red,fontSize:12,fontWeight:500}}>{pct(s.ret)}</span></td><td style={{padding:"11px 16px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>{s.day>=0?<ArrowUpRight size={12} color={A.green}/>:<ArrowDownRight size={12} color={A.red}/>}<span style={{color:s.day>=0?A.green:A.red,fontSize:12}}>{pct(s.day)}</span></div></td><td style={{padding:"8px 16px"}}><Spark data={s.spark} color={s.ret>=0?A.blue:A.red}/></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      {/* Signals */}
      <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,padding:"20px 22px"}}>
        <div style={{display:"flex",gap:8,marginBottom:18,alignItems:"center"}}>
          <p style={{fontSize:13,fontWeight:600,color:A.t1,marginRight:10}}>Investment Signals</p>
          {["All","Gov","Geo","Market"].map(c=>(<button key={c} onClick={()=>setSigFilter(c)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${sigFilter===c?A.blue:A.sep}`,background:sigFilter===c?"rgba(10,132,255,0.15)":"transparent",color:sigFilter===c?A.blue:A.t3,fontSize:12,cursor:"pointer",fontWeight:sigFilter===c?600:400}}>{c}</button>))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sigItems.map(sig=>(<div key={sig.id} style={{display:"flex",alignItems:"flex-start",gap:16,padding:"13px 16px",background:A.bg2,borderRadius:12,border:`1px solid ${A.sepLight}`}}><div style={{minWidth:110}}><p style={{color:A.blue,fontSize:13,fontWeight:600,marginBottom:6}}>{sig.ticker}</p><Badge type={sig.type}/></div><div style={{flex:1}}><p style={{color:A.t1,fontSize:13,fontWeight:600,marginBottom:4}}>{sig.title}</p><p style={{color:A.t3,fontSize:12,lineHeight:1.55}}>{sig.detail}</p></div><div style={{minWidth:130,display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}><span style={{background:sig.cat==="Gov"?"rgba(10,132,255,0.15)":sig.cat==="Geo"?"rgba(255,159,10,0.15)":"rgba(255,255,255,0.06)",color:catColor[sig.cat]||A.t3,borderRadius:6,fontSize:10,fontWeight:600,padding:"2px 8px"}}>{sig.cat}</span><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:64,height:3,background:A.sep,borderRadius:2}}><div style={{width:`${sig.conf}%`,height:"100%",borderRadius:2,background:sig.conf>=75?A.green:sig.conf>=55?A.blue:A.orange}}/></div><span style={{fontSize:11,color:A.t3}}>{sig.conf}%</span></div><p style={{fontSize:11,color:A.t4}}>{sig.date}</p></div></div>))}
        </div>
      </div>
    </div>
  );
}

/* ═══ SCREENER ═════════════════════════════════════════════════════════════ */
function ScreenerView({stocks}){
  const [sortKey,setSortKey]=useState("mc");
  const [sortAsc,setSortAsc]=useState(false);
  const [peMax,setPeMax]=useState(100);
  const [retMin,setRetMin]=useState(-100);
  const [sectorF,setSectorF]=useState("All");
  const sectors=["All",...new Set(STOCKS.map(s=>s.sector))];
  const toggleSort=k=>{if(sortKey===k)setSortAsc(!sortAsc);else{setSortKey(k);setSortAsc(false);}};
  const filtered=STOCKS.filter(s=>s.pe<=peMax&&s.ret>=retMin&&(sectorF==="All"||s.sector===sectorF)).sort((a,b)=>sortAsc?(a[sortKey]-b[sortKey]):(b[sortKey]-a[sortKey]));
  const cols=[{k:"ticker",l:"Ticker",s:false},{k:"name",l:"Company",s:false},{k:"sector",l:"Sector",s:false},{k:"px",l:"Price"},{k:"day",l:"Today %"},{k:"pe",l:"P/E"},{k:"pb",l:"P/B"},{k:"roe",l:"ROE %"},{k:"mc",l:"Mkt Cap"},{k:"ob",l:"Order Book"},{k:"ret",l:"Return"}];
  const Hdr=({col})=>(<th onClick={col.s===false?null:()=>toggleSort(col.k)} style={{padding:"10px 14px",textAlign:["ticker","name","sector"].includes(col.k)?"left":"right",fontSize:11,color:sortKey===col.k?A.blue:A.t3,fontWeight:500,cursor:col.s===false?"default":"pointer",whiteSpace:"nowrap",userSelect:"none"}}>{col.l}{sortKey===col.k?(sortAsc?" ↑":" ↓"):""}</th>);
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{background:A.card,borderRadius:14,padding:"16px 20px",border:`1px solid ${A.sepLight}`,marginBottom:16,display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Filter size={13} color={A.t3}/><span style={{fontSize:12,color:A.t3}}>Filters:</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:A.t3}}>Sector</span>
          <div style={{display:"flex",gap:5}}>{sectors.map(s=>(<button key={s} onClick={()=>setSectorF(s)} style={{padding:"4px 11px",borderRadius:20,border:`1px solid ${sectorF===s?A.blue:A.sep}`,background:sectorF===s?"rgba(10,132,255,0.15)":"transparent",color:sectorF===s?A.blue:A.t3,fontSize:11,cursor:"pointer"}}>{s}</button>))}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:A.t3}}>Max P/E</span><input type="range" min={20} max={100} value={peMax} onChange={e=>setPeMax(+e.target.value)} style={{accentColor:A.blue,width:80}}/><span style={{fontSize:12,color:A.blue,minWidth:30}}>{peMax}x</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:A.t3}}>Min Return</span><input type="range" min={-50} max={100} value={retMin} onChange={e=>setRetMin(+e.target.value)} style={{accentColor:A.blue,width:80}}/><span style={{fontSize:12,color:A.blue,minWidth:40}}>{retMin}%</span></div>
        <span style={{marginLeft:"auto",fontSize:12,color:A.t4}}>{filtered.length}/{STOCKS.length} stocks</span>
      </div>
      <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
            <thead><tr style={{borderBottom:`1px solid ${A.sepLight}`}}>{cols.map(c=>(<Hdr key={c.k} col={c}/>))}</tr></thead>
            <tbody>{filtered.map((s,i)=>{const c=CONSENSUS[s.ticker];const upside=c?((c.target-s.px)/s.px)*100:null;return(<tr key={s.ticker} style={{borderBottom:`1px solid ${A.sepLight}`,background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}><td style={{padding:"11px 14px"}}><span style={{color:A.blue,fontSize:13,fontWeight:600}}>{s.ticker}</span></td><td style={{padding:"11px 14px",color:A.t1,fontSize:12,whiteSpace:"nowrap"}}>{s.name}</td><td style={{padding:"11px 14px"}}><span style={{background:"rgba(10,132,255,0.1)",color:A.blue,borderRadius:5,fontSize:10,padding:"2px 7px"}}>{s.sector}</span></td><td style={{padding:"11px 14px",color:A.t1,fontSize:12,textAlign:"right"}}>{money(s.px)}</td><td style={{padding:"11px 14px",textAlign:"right"}}><span style={{color:s.day>=0?A.green:A.red,fontSize:12}}>{pct(s.day)}</span></td><td style={{padding:"11px 14px",textAlign:"right"}}><span style={{color:s.pe>SECT_PE_AVG?A.orange:A.green,fontSize:12,fontWeight:500}}>{s.pe}x</span></td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>{s.pb}x</td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>{s.roe}%</td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>{"₹"+s.mc+"Cr"}</td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>{"₹"+s.ob+"Cr"}</td><td style={{padding:"11px 14px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}><span style={{color:s.ret>=0?A.green:A.red,fontSize:12,fontWeight:500}}>{pct(s.ret)}</span>{upside!==null&&<span style={{color:upside>0?A.teal:A.red,fontSize:10,background:"rgba(50,173,230,0.1)",borderRadius:4,padding:"1px 6px"}}>TP {pct(upside)}</span>}</div></td></tr>);})}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══ ENTRY CALCULATOR ═════════════════════════════════════════════════════ */
function EntryCalcView({stocks}){
  const [budget,setBudget]=useState(500000);
  const [profile,setProfile]=useState("Moderate");
  const PROFILES={
    Conservative:{weights:{HAL:0.30,BEL:0.25,MAZDOCK:0.20,COCHINSHIP:0.15,GRSE:0.10},risk:"Lower volatility. PSU heavyweights with steady order books.",upside:18},
    Moderate:{weights:{HAL:0.22,BEL:0.15,MAZDOCK:0.18,GRSE:0.12,ZENTEC:0.10,BDL:0.13,COCHINSHIP:0.10},risk:"Balanced mix of large-caps and quality mid-caps.",upside:28},
    Aggressive:{weights:{ZENTEC:0.15,PARAS:0.15,DATAPATTNS:0.15,BDL:0.15,MAZDOCK:0.15,GRSE:0.12,HAL:0.13},risk:"Higher volatility mid-caps with greater upside potential.",upside:42},
  };
  const prof=PROFILES[profile];
  const allocation=Object.entries(prof.weights).map(([ticker,w])=>{
    const s=STOCKS.find(x=>x.ticker===ticker);
    const c=CONSENSUS[ticker];
    const amount=budget*w;
    const shares=Math.floor(amount/s.px);
    const invested=shares*s.px;
    return{ticker,name:s.name,weight:w,amount,shares,px:s.px,invested,target:c?.target,upside:c?((c.target-s.px)/s.px)*100:null};
  });
  const totalInvested=allocation.reduce((a,x)=>a+x.invested,0);
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:20}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:A.card,borderRadius:16,padding:22,border:`1px solid ${A.sepLight}`}}>
            <p style={{fontSize:13,fontWeight:600,color:A.t1,marginBottom:18}}>Investment Parameters</p>
            <div style={{marginBottom:20}}>
              <p style={{fontSize:12,color:A.t3,marginBottom:8}}>Budget (₹)</p>
              <input type="number" value={budget} onChange={e=>setBudget(+e.target.value)} style={{width:"100%",background:A.card2,border:`1px solid ${A.sep}`,borderRadius:10,padding:"10px 14px",color:A.t1,fontSize:16,fontWeight:600,outline:"none"}}/>
              <input type="range" min={50000} max={5000000} step={50000} value={budget} onChange={e=>setBudget(+e.target.value)} style={{width:"100%",marginTop:10,accentColor:A.blue}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>{["₹50K","₹5L","₹25L","₹50L"].map(l=>(<span key={l} style={{fontSize:10,color:A.t4}}>{l}</span>))}</div>
            </div>
            <div style={{marginBottom:20}}>
              <p style={{fontSize:12,color:A.t3,marginBottom:8}}>Risk Profile</p>
              <div style={{display:"flex",gap:8}}>{["Conservative","Moderate","Aggressive"].map(p=>(<button key={p} onClick={()=>setProfile(p)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`1px solid ${profile===p?A.blue:A.sep}`,background:profile===p?"rgba(10,132,255,0.15)":"transparent",color:profile===p?A.blue:A.t3,fontSize:12,cursor:"pointer",fontWeight:profile===p?600:400}}>{p}</button>))}</div>
            </div>
            <div style={{padding:"14px 16px",background:A.bg2,borderRadius:12,border:`1px solid ${A.sepLight}`}}>
              <p style={{fontSize:11,color:A.t3,marginBottom:4}}>{prof.risk}</p>
              <p style={{fontSize:13,color:A.teal,fontWeight:600,marginTop:6}}>Estimated upside: +{prof.upside}% over 12–18M</p>
            </div>
          </div>
          <div style={{background:A.card,borderRadius:16,padding:18,border:`1px solid ${A.sepLight}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Stocks",allocation.length],["Total Invest",inr(totalInvested)],["Remaining",inr(budget-totalInvested)],["Avg Upside","+"+(allocation.filter(a=>a.upside).reduce((s,a)=>s+a.upside,0)/allocation.filter(a=>a.upside).length|0)+"%"]].map(([l,v])=>(<div key={l} style={{background:A.bg2,borderRadius:10,padding:"12px 14px"}}><p style={{fontSize:10,color:A.t4,marginBottom:4}}>{l}</p><p style={{fontSize:16,fontWeight:700,color:A.t1}}>{v}</p></div>))}
            </div>
          </div>
        </div>
        <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
          <div style={{padding:"16px 22px",borderBottom:`1px solid ${A.sepLight}`}}><p style={{fontSize:13,fontWeight:600,color:A.t1}}>Suggested Allocation · {profile} Profile</p></div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${A.sepLight}`}}>{["Ticker","Company","Weight","Amount","Shares","Entry","Target","Upside"].map(h=>(<th key={h} style={{padding:"10px 16px",textAlign:["Ticker","Company"].includes(h)?"left":"right",fontSize:11,color:A.t3,fontWeight:500}}>{h}</th>))}</tr></thead>
            <tbody>{allocation.map((a,i)=>(<tr key={a.ticker} style={{borderBottom:`1px solid ${A.sepLight}`,background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}><td style={{padding:"13px 16px"}}><span style={{color:A.blue,fontSize:13,fontWeight:600}}>{a.ticker}</span></td><td style={{padding:"13px 16px",color:A.t1,fontSize:12}}>{a.name}</td><td style={{padding:"13px 16px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}><div style={{width:40,height:3,background:A.sep,borderRadius:2}}><div style={{width:""+(a.weight*100)+"%",height:"100%",background:A.blue,borderRadius:2}}/></div><span style={{color:A.t2,fontSize:12}}>{(a.weight*100).toFixed(0)}%</span></div></td><td style={{padding:"13px 16px",color:A.t1,fontSize:13,fontWeight:600,textAlign:"right"}}>{inr(a.amount)}</td><td style={{padding:"13px 16px",color:A.t2,fontSize:12,textAlign:"right"}}>{a.shares}</td><td style={{padding:"13px 16px",color:A.t2,fontSize:12,textAlign:"right"}}>{money(a.px)}</td><td style={{padding:"13px 16px",color:A.teal,fontSize:12,fontWeight:500,textAlign:"right"}}>{a.target?money(a.target):"—"}</td><td style={{padding:"13px 16px",textAlign:"right"}}>{a.upside!=null?(<span style={{color:a.upside>0?A.green:A.red,fontSize:12,fontWeight:600}}>{pct(a.upside)}</span>):(<span style={{color:A.t4}}>—</span>)}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══ WHY DEFENCE NOW ══════════════════════════════════════════════════════ */
function WhyDefenceView(){
  const THESIS=[
    {icon:"💥",color:A.red,    title:"Operation Epic Fury: World's Largest Air Campaign Since 2003",stat:"900 strikes · 28 Feb 2026",body:"The US-Israel joint operation against Iran on 28 February 2026 was the largest air campaign since the Iraq War. Supreme Leader Khamenei was killed. Iran retaliated with hundreds of missiles and thousands of drones across the Gulf. Global defence procurement urgency hit a post-Cold War high — and India, sitting at the centre of the Iranian theatre, is the primary regional beneficiary."},
    {icon:"🌊",color:A.orange, title:"Strait of Hormuz Near-Standstill — 150 Ships Stalled",stat:"20% of global oil supply at risk",body:"Iran's retaliatory strikes slowed the Strait of Hormuz to a near-standstill, with 150 oil tankers and freight ships stalled. 20% of global oil trade transits this route. India's strategic maritime positioning and its growing blue-water navy make accelerated Indian naval procurement — submarines, OPVs, frigates — a national security imperative."},
    {icon:"🇺🇦",color:A.blue,  title:"Ukraine War Enters Year 4 — NATO Rearming at Scale",stat:"$400B in new NATO orders · 2026",body:"Russia's invasion of Ukraine, entering its fourth year in 2026, has forced NATO members to commit to raising defence spending to 2.5% of GDP. European rearmament is running at its fastest pace since the Cold War. This creates both direct export opportunities for India and validates the structural case for domestic defence manufacturing."},
    {icon:"🔥",color:A.red,    title:"Gaza Conflict Year 3 — Missile Systems in Extreme Demand",stat:"Hezbollah, Hamas, Houthi — 3 active fronts",body:"The Gaza conflict has expanded to multiple fronts — Israeli-Hamas fighting, Hezbollah in Lebanon, and Houthi missile campaigns in the Red Sea. The global demand for air-defence systems, anti-missile interceptors, and C-UAS technology has never been higher. BDL, a key missile system supplier, and ZENTEC (anti-drone) are direct structural beneficiaries."},
    {icon:"🚀",color:A.green,  title:"Make in India: 75% Indigenisation Mandate — Permanent Transfer",stat:"75% domestic content target",body:"India's government has mandated 75%+ indigenisation in all new defence contracts. This permanently transfers revenue from foreign OEMs to domestic manufacturers — a structural shift with no reversal risk given cross-party political consensus. HAL, BEL, MAZDOCK, and GRSE are the primary recipients."},
    {icon:"🛡️",color:A.blue,  title:"Record ₹7.85L Cr Defence Budget (+15.2% YoY)",stat:"Capex +20.1% to ₹2.31L Cr",body:"India's FY27 defence allocation is the largest in history. Capital expenditure surged 20.1% to ₹2.31L Cr — funding Rafale Marines, Predator drones, submarines, and next-gen aircraft programmes. Customs duty relief on aircraft components and MRO materials further lowers input costs for domestic manufacturers."},
    {icon:"🌏",color:A.orange, title:"South China Sea & Taiwan Strait — Asia's Powder Keg",stat:"50% probability of crisis in 2026 — CFR",body:"The Council on Foreign Relations rates a Taiwan Strait crisis and Russia-NATO clash as 50%+ likely in 2026. India's role as the democratic counterweight to China in the Indo-Pacific makes Indian defence capability a strategic imperative for both the government and allied nations — translating into sustained, predictable procurement cycles."},
    {icon:"📡",color:A.purple, title:"Drone Warfare Revolution — C-UAV Is the Fastest-Growing Segment",stat:"Op. Sindoor emergency C-UAV procurement",body:"Ukraine, Gaza, and the Iran-Gulf conflict have validated drone warfare as the dominant near-future battlefield technology. India's Operation Sindoor triggered emergency C-UAV procurement. ZENTEC and Paras Defence are the primary domestic beneficiaries of this fast-growing, high-margin technology segment."},
    {icon:"🚢",color:A.teal,   title:"₹99,000 Cr Submarine Contract — MDL's Decade-Long Pipeline",stat:"6 × P-75I submarines · Thyssenkrupp",body:"The Indian Navy's P-75I submarine contract is transformative for Mazagon Dock Shipbuilders — a decade-long, ₹99,000 Cr revenue pipeline covering construction, integration, and future maintenance. Combined with the MAZDOCK P-75 (Scorpène) series already underway, MDL has multi-decade order visibility."},
    {icon:"🔭",color:A.yellow, title:"AMCA & 6th Gen Aircraft — ₹1.5L Cr, 30-Year Programme",stat:"BEL-L&T shortlisted for avionics",body:"India's Advanced Medium Combat Aircraft will define its air power for the 2040s–2060s. BEL-L&T is shortlisted for the critical avionics package. AMCA creates a 30-year compounding revenue stream for the domestic electronics, sensor, and propulsion supply chain."},
    {icon:"📊",color:A.green,  title:"India Exports Hit ₹23,622 Cr FY25 — ₹50,000 Cr by FY29",stat:"+78% in 3 years · BrahMos, Pinaka",body:"India's defence exports reached a record ₹23,622 Cr in FY25, up 78% in three years. The Indonesia BrahMos deal (₹23,000 Cr), Armenia Pinaka contracts, and NATO supply chain integration are driving the next leg. The ₹50,000 Cr FY29 target appears increasingly conservative."},
    {icon:"💡",color:A.indigo, title:"Valuation: HAL at 30x P/E — Cheap vs 52x Sector Average",stat:"HAL, COCHINSHIP: relative bargains",body:"Not all defence stocks are expensive. HAL at 30x P/E and Cochin Shipyard at 30.5x offer genuinely reasonable entry relative to their growth trajectories. MAZDOCK at 47x is justified by the transformative submarine pipeline. Quality names at fair prices still exist in this sector — but they require selectivity."},
  ];
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{background:"linear-gradient(135deg,rgba(255,69,58,0.12),rgba(10,132,255,0.1),transparent)",borderRadius:18,padding:"20px 24px",border:"1px solid rgba(255,69,58,0.3)",marginBottom:20}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:8}}><Flame size={18} color={A.red}/><p style={{fontSize:15,fontWeight:700,color:A.t1}}>The Global Security Crisis & India's Defence Investment Case</p></div>
        <p style={{fontSize:13,color:A.t2,lineHeight:1.75,maxWidth:1000}}>2026 has fundamentally rewritten the global security calculus. A full-scale US-Israel war against Iran, a 4th-year Russia-Ukraine conflict, an expanding Gaza front, and a credible Taiwan Strait threat have collectively made the 2010s' era of globalised peace irreversible. Global military spending has hit $2.65 trillion — growing at 8.6% CAGR. India, sitting at the intersection of every major flashpoint, is transforming from the world's largest arms importer to a serious defence exporter. The case for Indian defence stocks has never been stronger — and here is exactly why.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {THESIS.map((t,i)=>(<div key={i} style={{background:A.card,borderRadius:16,padding:22,border:`1px solid ${A.sepLight}`,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+t.color+",transparent)"}}/><div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:12}}><span style={{fontSize:26,lineHeight:1}}>{t.icon}</span><div><p style={{fontSize:13,fontWeight:700,color:A.t1,marginBottom:4}}>{t.title}</p><span style={{background:"rgba(255,255,255,0.08)",color:t.color,borderRadius:6,fontSize:11,fontWeight:600,padding:"3px 9px"}}>{t.stat}</span></div></div><p style={{color:A.t2,fontSize:12,lineHeight:1.7}}>{t.body}</p></div>))}
      </div>
    </div>
  );
}

/* ═══ HEATMAP ══════════════════════════════════════════════════════════════ */
function HeatmapView({stocks}){
  const [metric,setMetric]=useState("pe");
  const metrics={pe:{label:"P/E",desc:"Price-to-Earnings",fmt:v=>v+"x",invert:false},pb:{label:"P/B",desc:"Price-to-Book",fmt:v=>v+"x",invert:false},roe:{label:"ROE %",desc:"Return on Equity",fmt:v=>v+"%",invert:true}};
  const m=metrics[metric];
  const vals=STOCKS.map(s=>s[metric]);
  const minV=Math.min(...vals),maxV=Math.max(...vals);
  const getColor=v=>{const norm=(v-minV)/(maxV-minV);const heat=m.invert?1-norm:norm;if(heat<0.33)return A.green;if(heat<0.66)return A.orange;return A.red;};
  const getLabel=v=>{const norm=(v-minV)/(maxV-minV);const heat=m.invert?1-norm:norm;if(heat<0.33)return "CHEAP";if(heat<0.66)return "FAIR";return "RICH";};
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <p style={{fontSize:13,fontWeight:600,color:A.t1}}>Valuation Heatmap</p>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(metrics).map(([k,v])=>(<button key={k} onClick={()=>setMetric(k)} style={{padding:"6px 16px",borderRadius:20,border:`1px solid ${metric===k?A.blue:A.sep}`,background:metric===k?"rgba(10,132,255,0.15)":"transparent",color:metric===k?A.blue:A.t3,fontSize:12,cursor:"pointer",fontWeight:metric===k?600:400}}>{v.label} · {v.desc}</button>))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:14,alignItems:"center"}}>
          {[{c:A.green,l:"Cheap"},{c:A.orange,l:"Fair"},{c:A.red,l:"Rich"}].map(({c,l})=>(<div key={l} style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:2,background:c,display:"inline-block"}}/><span style={{fontSize:11,color:A.t3}}>{l}</span></div>))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:18}}>
        {STOCKS.map(s=>{const v=s[metric];const c=getColor(v);const lbl=getLabel(v);return(<div key={s.ticker} style={{background:A.card,borderRadius:16,padding:20,border:`1px solid ${A.sepLight}`,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 80% 20%,"+c+"22 0%,transparent 60%)",pointerEvents:"none"}}/><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{color:A.blue,fontSize:14,fontWeight:700}}>{s.ticker}</span><span style={{background:c+"22",color:c,borderRadius:6,fontSize:10,fontWeight:700,padding:"3px 9px"}}>{lbl}</span></div><p style={{color:c,fontSize:36,fontWeight:800,letterSpacing:"-0.03em",lineHeight:1,marginBottom:6}}>{m.fmt(v)}</p><p style={{color:A.t3,fontSize:11,marginBottom:12}}>{m.desc}</p><div style={{height:4,background:A.sep,borderRadius:2,marginBottom:4}}><div style={{width:""+(((v-minV)/(maxV-minV))*100)+"%",height:"100%",background:c,borderRadius:2}}/></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:A.t4}}>{m.fmt(minV)}</span><span style={{fontSize:10,color:A.t4}}>{m.fmt(maxV)}</span></div></div>);})}
      </div>
      {metric==="pe"&&(<div style={{background:A.card,borderRadius:14,padding:"16px 20px",border:`1px solid ${A.sepLight}`,display:"flex",gap:12,alignItems:"flex-start"}}><Info size={16} color={A.blue} style={{marginTop:1,flexShrink:0}}/><p style={{fontSize:13,color:A.t2,lineHeight:1.65}}><span style={{color:A.t1,fontWeight:600}}>Sector average P/E: 52x</span> · HAL (30x) and Cochin Shipyard (30.5x) trade at the most compelling valuations relative to peers. HDFC Securities issues Reduce on HAL and BDL citing valuation, while preferring BEL (Add), Data Patterns (Buy), and Apollo Micro (Buy). BDL at 83x and Data Patterns at 75x price in aggressive execution — limited margin of safety.</p></div>)}
    </div>
  );
}

/* ═══ CONSENSUS ════════════════════════════════════════════════════════════ */
function ConsensusView({stocks}){
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        {STOCKS.map(s=>{
          const c=CONSENSUS[s.ticker];if(!c)return null;
          const total=c.buy+c.hold+c.sell;
          const upside=((c.target-s.px)/s.px)*100;
          const rec=c.buy/total>0.6?"BUY":c.sell/total>0.4?"SELL":"HOLD";
          const recColor=rec==="BUY"?A.green:rec==="SELL"?A.red:A.orange;
          return(
            <div key={s.ticker} style={{background:A.card,borderRadius:16,padding:20,border:`1px solid ${A.sepLight}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div><p style={{color:A.blue,fontSize:14,fontWeight:700,marginBottom:2}}>{s.ticker}</p><p style={{color:A.t3,fontSize:11}}>{s.name}</p></div><span style={{background:recColor+"22",color:recColor,border:"1px solid "+recColor+"44",borderRadius:8,fontSize:11,fontWeight:700,padding:"4px 10px"}}>{rec}</span></div>
              <div style={{marginBottom:14}}>{[{l:"Buy",n:c.buy,c:A.green},{l:"Hold",n:c.hold,c:A.orange},{l:"Sell",n:c.sell,c:A.red}].map(({l,n,c:col})=>(<div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:11,color:A.t3,minWidth:28}}>{l}</span><div style={{flex:1,height:5,background:A.sep,borderRadius:3}}><div style={{width:""+(n/total*100)+"%",height:"100%",background:col,borderRadius:3}}/></div><span style={{fontSize:11,color:A.t2,minWidth:18,textAlign:"right"}}>{n}</span></div>))}</div>
              <div style={{background:A.bg2,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:A.t3}}>Current</span><span style={{fontSize:13,color:A.t1,fontWeight:600}}>{money(s.px)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:A.t3}}>Median Target</span><span style={{fontSize:13,color:A.teal,fontWeight:600}}>{money(c.target)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:A.t3}}>Potential Upside</span><span style={{fontSize:13,color:upside>0?A.green:A.red,fontWeight:700}}>{pct(upside)}</span></div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:A.t4}}>{total} analysts</span><div style={{display:"flex",gap:3}}>{c.brokers.slice(0,3).map(b=>(<span key={b} style={{fontSize:9,color:A.t4,background:A.card2,border:"1px solid "+A.sep,borderRadius:4,padding:"1px 5px"}}>{b}</span>))}</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ NEWS ═════════════════════════════════════════════════════════════════ */
function NewsView(){
  const [catF,setCatF]=useState("All");
  const [tickerF,setTickerF]=useState("All");
  const cats=["All","GEOPO","ORDER","DEAL","BROKER","POLICY","BUDGET","MARKET","RESULTS","EXPORTS"];
  const catColors={GEOPO:A.red,ORDER:A.blue,DEAL:A.green,BROKER:A.purple,POLICY:A.orange,BUDGET:A.yellow,MARKET:A.teal,RESULTS:A.green,EXPORTS:A.teal};
  const tickers=["All",...STOCKS.map(s=>s.ticker),"SECTOR"];
  const filtered=NEWS.filter(n=>(catF==="All"||n.cat===catF)&&(tickerF==="All"||n.tickers.includes(tickerF)));
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{background:A.card,borderRadius:14,padding:"14px 18px",border:`1px solid ${A.sepLight}`,marginBottom:16}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {cats.map(c=>(<button key={c} onClick={()=>setCatF(c)} style={{padding:"4px 12px",borderRadius:20,border:"1px solid "+(catF===c?(catColors[c]||A.blue):A.sep),background:catF===c?((catColors[c]||A.blue)+"22"):"transparent",color:catF===c?(catColors[c]||A.blue):A.t3,fontSize:11,cursor:"pointer",fontWeight:catF===c?600:400}}>{c}</button>))}
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:A.t4,marginRight:4}}>Stock filter:</span>
          {tickers.map(t=>(<button key={t} onClick={()=>setTickerF(t)} style={{padding:"3px 10px",borderRadius:20,border:"1px solid "+(tickerF===t?A.blue:A.sep),background:tickerF===t?"rgba(10,132,255,0.15)":"transparent",color:tickerF===t?A.blue:A.t3,fontSize:10,cursor:"pointer"}}>{t}</button>))}
        </div>
      </div>
      <p style={{fontSize:12,color:A.t4,marginBottom:14}}>{filtered.length} articles · Sources: Moneycontrol, Business Standard, Economic Times, India TV News, Goodreturns, BSE Filings, MoD, Motilal / HDFC / ICICI Securities, Reuters, Britannica</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(n=>{
          const catColor=catColors[n.cat]||A.blue;
          return(
            <div key={n.id} style={{background:A.card,borderRadius:14,padding:"16px 20px",border:"1px solid "+(n.hot?"rgba(255,69,58,0.35)":A.sepLight),borderLeft:"3px solid "+(n.hot?A.red:catColor)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,paddingRight:16}}>
                  <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                    {n.hot&&<span style={{background:"rgba(255,69,58,0.18)",color:A.red,border:"1px solid rgba(255,69,58,0.4)",borderRadius:5,fontSize:9,fontWeight:700,padding:"2px 7px",letterSpacing:"0.05em"}}>HOT</span>}
                    <span style={{background:catColor+"22",color:catColor,borderRadius:5,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{n.cat}</span>
                    <ImpactTag impact={n.impact}/>
                    <span style={{fontSize:11,color:A.t4}}>{n.date}</span>
                    <span style={{fontSize:11,color:A.t4}}>· {n.source}</span>
                  </div>
                  <p style={{color:A.t1,fontSize:14,fontWeight:600,lineHeight:1.4,marginBottom:8}}>{n.headline}</p>
                  <p style={{color:A.t2,fontSize:12,lineHeight:1.65}}>{n.body}</p>
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:10}}>
                {n.tickers.map(t=>(<span key={t} style={{background:"rgba(10,132,255,0.1)",color:A.blue,borderRadius:5,fontSize:10,fontWeight:600,padding:"2px 7px"}}>{t}</span>))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ GEO ══════════════════════════════════════════════════════════════════ */
function GeoView(){
  const GEO=[
    {id:1,impact:"ACTIVE WAR",score:10,region:"Middle East",color:A.red,date:"28 Feb–11 Mar 2026",hot:true,
     title:"Operation Epic Fury: US-Israel vs Iran — Full-Scale War",
     detail:"The US and Israel launched 900 strikes in 12 hours on 28 February 2026, killing Supreme Leader Khamenei. Iran retaliated with hundreds of missiles and thousands of drones across the Gulf, UAE, Qatar, and oil infrastructure. The Strait of Hormuz was disrupted, 150 ships stalled. As of 11 March, Trump signals potential short-term ceasefire — but structural defence procurement impact is irreversible.",
     tickers:["BDL","ZENTEC","HAL","BEL","PARAS"]},
    {id:2,impact:"ESCALATING",score:9,region:"Indian Ocean",color:A.orange,date:"6 Mar 2026",hot:true,
     title:"US Naval Action Near Sri Lanka — India's Strategic Backyard Militarised",
     detail:"The first US naval combat engagement since WWII occurred off the Sri Lankan coast. The Indian Navy responded by accelerating its P-75I submarine programme and NGOPV procurement timelines. India's role as a regional maritime security anchor is now formalised — accelerating MDL, Cochin, and GRSE procurement.",
     tickers:["MAZDOCK","COCHINSHIP","GRSE"]},
    {id:3,impact:"YEAR 4",score:8,region:"Eastern Europe",color:A.blue,date:"24 Feb 2026",hot:false,
     title:"Russia-Ukraine War: Year 4 — NATO Rearmament at $400B",
     detail:"Russia's war of aggression in Ukraine entered its fourth year. Russia is advancing in Donbas; NATO committed €400B in new defence orders. Europe's rearmament is the fastest since the Cold War. India's defence exports are entering NATO supply chains — 155mm shells, BrahMos, and dual-use components are in active procurement.",
     tickers:["SECTOR","BDL","HAL"]},
    {id:4,impact:"YEAR 3",score:7,region:"Middle East",color:A.orange,date:"7 Oct 2023–present",hot:false,
     title:"Gaza Conflict Year 3 — 3 Active Fronts: Hamas, Hezbollah, Houthis",
     detail:"The October 7, 2023 Hamas attack triggered a multi-front conflict: Israeli-Hamas fighting, Hezbollah in Lebanon, and Houthi Red Sea missile campaigns. Demand for missile interception systems, anti-drone technology, and air defence has never been higher. BDL's guided missile pipeline and ZENTEC's C-UAV systems are direct structural beneficiaries.",
     tickers:["BDL","ZENTEC","PARAS"]},
    {id:5,impact:"RISING RISK",score:8,region:"Asia-Pacific",color:A.red,date:"Ongoing 2026",hot:false,
     title:"Taiwan Strait Crisis — CFR Rates 50%+ Probability in 2026",
     detail:"The Council on Foreign Relations rates a Taiwan Strait military confrontation as 50%+ likely in 2026. A cross-strait crisis would trigger the largest global defence procurement surge since the Cold War. India, as the democratic counterweight to China in the Indo-Pacific, would receive accelerated military modernisation support from the US and allies.",
     tickers:["HAL","BEL","MAZDOCK"]},
    {id:6,impact:"BULLISH",score:9,region:"India",color:A.green,date:"10 Mar 2026",hot:false,
     title:"Indonesia Signs BrahMos Deal — India's Largest Defence Export",
     detail:"Indonesia formalised India's largest-ever defence export: BrahMos supersonic cruise missiles at ~$375M. Multiple Southeast Asian nations are now in active discussions for BrahMos, Akash, Pinaka, and Tejas. India's export order pipeline has expanded to 85+ countries.",
     tickers:["HAL","BEL","BDL"]},
    {id:7,impact:"BULLISH",score:10,region:"India",color:A.green,date:"1 Feb 2026",hot:false,
     title:"India Defence Budget ₹7.85L Cr (+15.2%) — Largest Ever",
     detail:"Record defence allocation with 20.1% capex surge to ₹2.31L Cr. Funds Rafale-M, Predator UAVs, P-75I submarines, AMCA, and modernisation of all three services. Government also signalling long-term intent to raise spending to 2.5% of GDP — NATO-equivalent levels.",
     tickers:["HAL","BEL","MAZDOCK","BDL","GRSE"]},
    {id:8,impact:"ESCALATING",score:7,region:"South Asia",color:A.orange,date:"Apr 2025 & ongoing",hot:false,
     title:"India-Pakistan Border Tensions — Operation Sindoor Triggers C-UAV Surge",
     detail:"Cross-border drone incidents and Operation Sindoor have driven emergency procurement of counter-UAV systems, precision munitions, and border surveillance technology. CFR notes India-Pakistan conflict as moderately likely to re-escalate in 2026. ZENTEC, Paras Defence, and Solar Industries are primary beneficiaries.",
     tickers:["ZENTEC","PARAS","BDL"]},
    {id:9,impact:"LT BULL",score:6,region:"India",color:A.teal,date:"20 Feb 2026",hot:false,
     title:"AMCA Program: BEL-L&T Shortlisted — 30-Year Stealth Fighter Programme",
     detail:"India's Advanced Medium Combat Aircraft programme shortlisted 3 consortia. BEL-L&T is among the finalists for the avionics package. The AMCA programme is expected to cost ₹1.5L Cr+ and span 3 decades. It defines India's 5th-gen stealth air combat capability from the 2030s–2060s.",
     tickers:["BEL","HAL","DATAPATTNS"]},
    {id:10,impact:"NEUTRAL",score:3,region:"India",color:A.card3,date:"23 Feb 2026",hot:false,
     title:"HAL Clarifies on Tejas Ground Incident — No Crash, Safety Record Intact",
     detail:"HAL filed a regulatory clarification after media reports of a Tejas LCA incident. Confirmed minor technical issue during ground testing with no crash and the pilot safe. Tejas maintains one of the world's best safety records for contemporary combat aircraft. No impact on HAL's export pipeline.",
     tickers:["HAL"]},
  ];
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{background:"linear-gradient(90deg,rgba(255,69,58,0.1),transparent)",borderRadius:14,padding:"14px 20px",border:"1px solid rgba(255,69,58,0.25)",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
        <Flame size={15} color={A.red}/>
        <p style={{fontSize:13,color:A.t2}}><span style={{color:A.t1,fontWeight:600}}>4 simultaneous active conflicts</span> as of 11 March 2026 — US-Iran war, Russia-Ukraine Year 4, Gaza Year 3, South China Sea escalation. Global military spending at $2.65 trillion and growing at 8.6% CAGR. India sits at the intersection of every major flashpoint.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {GEO.map(e=>(<div key={e.id} style={{background:A.card,border:"1px solid "+(e.hot?"rgba(255,69,58,0.3)":A.sepLight),borderRadius:16,padding:22,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+e.color+",transparent)"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{flex:1,paddingRight:16}}>
              <div style={{display:"flex",gap:7,marginBottom:8,flexWrap:"wrap"}}>
                {e.hot&&<span style={{background:"rgba(255,69,58,0.18)",color:A.red,border:"1px solid rgba(255,69,58,0.4)",borderRadius:5,fontSize:9,fontWeight:700,padding:"2px 7px"}}>ACTIVE</span>}
                <span style={{background:e.color+"22",color:e.color,borderRadius:5,fontSize:10,fontWeight:700,padding:"2px 8px"}}>{e.impact}</span>
                <span style={{fontSize:11,color:A.t4}}>{e.region}</span>
              </div>
              <p style={{color:A.t1,fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8}}>{e.title}</p>
            </div>
            <div style={{textAlign:"center",background:A.card2,borderRadius:10,padding:"8px 12px",minWidth:48}}>
              <p style={{fontSize:22,fontWeight:700,color:e.color,lineHeight:1}}>{e.score}</p>
              <p style={{fontSize:9,color:A.t4,marginTop:2,letterSpacing:"0.05em"}}>IMPACT</p>
            </div>
          </div>
          <p style={{color:A.t2,fontSize:12,lineHeight:1.65,marginBottom:12}}>{e.detail}</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
            {e.tickers.map(t=>(<span key={t} style={{background:"rgba(10,132,255,0.12)",color:A.blue,borderRadius:6,fontSize:10,fontWeight:600,padding:"2px 7px"}}>{t}</span>))}
          </div>
          <p style={{fontSize:11,color:A.t4,textAlign:"right"}}>{e.date}</p>
        </div>))}
      </div>
    </div>
  );
}

/* ═══ DRILL DOWN ═══════════════════════════════════════════════════════════ */
const DRILL_SECTORS_DEF=[
  {name:"Naval / Shipbuilding",    keys:["MAZDOCK","COCHINSHIP","GRSE"],                         color:A.blue},
  {name:"Electronics / C4ISR",     keys:["BEL","ASTRAMICRO","DATAPATTNS","APOLLOMICRO","CYIENTDLM","DCXINDIA","AVANTEL"],color:A.purple},
  {name:"Aerospace",               keys:["HAL","MTAR","UNIMECH","PTCIND","DYNAMATECH","AXISCADES"],color:A.orange},
  {name:"Missiles / Munitions",    keys:["BDL","SOLARINDS","PREMEXPLN"],                         color:A.red},
  {name:"Vehicles & Materials",    keys:["BEML","MIDHANI","BHARATFORG"],                         color:A.teal},
  {name:"Optics / Space / Drones", keys:["PARAS","IDEAFORGE"],                                   color:A.yellow},
  {name:"Training / Anti-Drone",   keys:["ZENTEC"],                                              color:A.green},
];

function DrillView({stocks}){
  const [open,setOpen]=useState(null);
  const totValD=stocks.reduce((a,s)=>a+s.mktVal,0);
  const DRILL_SECTORS=DRILL_SECTORS_DEF.map(sec=>({...sec,
    val:sec.keys.reduce((a,k)=>a+(stocks.find(s=>s.ticker===k)?.mktVal||0),0),
    ret:(()=>{const v=sec.keys.map(k=>stocks.find(s=>s.ticker===k)?.ret||0);return v.reduce((a,x)=>a+x,0)/v.length;})()
  }));
  const sorted=[...DRILL_SECTORS].sort((a,b)=>b.val-a.val);
  return(
    <div style={{padding:"24px 28px",display:"grid",gridTemplateColumns:"320px 1fr",gap:20}}>
      <div style={{background:A.card,borderRadius:16,padding:22,border:`1px solid ${A.sepLight}`,height:"fit-content"}}>
        <p style={{fontSize:13,fontWeight:600,color:A.t1,marginBottom:18}}>Sector Allocation</p>
        {sorted.map(sec=>{
          const w=(sec.val/totValD)*100;
          return(
            <div key={sec.name} style={{marginBottom:16,cursor:"pointer"}} onClick={()=>setOpen(open===sec.name?null:sec.name)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:A.t1,display:"flex",alignItems:"center",gap:7}}>
                  <span style={{width:8,height:8,borderRadius:2,background:sec.color,display:"inline-block"}}/>
                  {sec.name}
                </span>
                <div style={{display:"flex",gap:14}}>
                  <span style={{fontSize:12,color:A.t3}}>{w.toFixed(1)}%</span>
                  <span style={{fontSize:12,color:sec.ret>=0?A.green:A.red,fontWeight:500}}>{pct(sec.ret)}</span>
                </div>
              </div>
              <div style={{height:4,background:A.card2,borderRadius:2}}>
                <div style={{width:w+"%",height:"100%",background:sec.color,borderRadius:2}}/>
              </div>
              {open===sec.name&&(
                <div style={{marginTop:10,padding:"10px 12px",background:A.bg2,borderRadius:10,border:`1px solid ${A.sepLight}`}}>
                  {sec.keys.map(k=>{
                    const s=STOCKS.find(x=>x.ticker===k);
                    if(!s)return null;
                    return(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                        <span style={{color:A.blue,fontSize:12,fontWeight:600,minWidth:95}}>{k}</span>
                        <span style={{color:A.t3,fontSize:11}}>{money(s.px)}</span>
                        <span style={{color:s.ret>=0?A.green:A.red,fontSize:11,fontWeight:500}}>{pct(s.ret)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,alignContent:"start"}}>
        {STOCKS.map(s=>(
          <div key={s.ticker} style={{background:A.card,borderRadius:14,border:`1px solid ${A.sepLight}`,padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:A.blue,fontSize:13,fontWeight:700}}>{s.ticker}</span>
              <div style={{display:"flex",alignItems:"center",gap:3}}>
                {s.day>=0?<TrendingUp size={11} color={A.green}/>:<TrendingDown size={11} color={A.red}/>}
                <span style={{color:s.day>=0?A.green:A.red,fontSize:11,fontWeight:500}}>{pct(s.day)}</span>
              </div>
            </div>
            <p style={{color:A.t1,fontSize:15,fontWeight:700,marginBottom:2}}>{money(s.px)}</p>
            <p style={{color:A.t4,fontSize:10,marginBottom:12}}>{s.sub}</p>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              {[["P/E",s.pe+"x"],["Cap","₹"+s.mc+"Cr"],["Ret",pct(s.ret)]].map(([l,v])=>(
                <div key={l}>
                  <p style={{color:A.t4,fontSize:9,marginBottom:2}}>{l}</p>
                  <p style={{color:l==="Ret"?(s.ret>=0?A.green:A.red):A.t2,fontSize:11,fontWeight:500}}>{v}</p>
                </div>
              ))}
            </div>
            <Spark data={s.spark} color={s.ret>=0?A.blue:A.red}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ APP SHELL ════════════════════════════════════════════════════════════ */
const NAV_GROUPS=[
  {group:"PORTFOLIO",items:[{id:"portfolio",label:"Portfolio",Icon:Layers},{id:"geo",label:"Geopolitical",Icon:Globe},{id:"drill",label:"Drill-Down",Icon:BarChart2}]},
  {group:"RESEARCH",items:[{id:"screener",label:"Screener",Icon:Search},{id:"heatmap",label:"Valuation Map",Icon:TrendingUp},{id:"consensus",label:"Consensus",Icon:Star},{id:"why",label:"Why Defence?",Icon:BookOpen}]},
  {group:"LIVE",items:[{id:"news",label:"News Feed",Icon:Newspaper}]},
  {group:"AI ANALYST",items:[{id:"ai",label:"Ask Shri",Icon:MessageSquare}]},
  {group:"TOOLS",items:[{id:"calc",label:"Entry Calculator",Icon:Calculator}]},
];

export default function BrahmosCapital(){
  const [tab,setTab]=useState("portfolio");
  const [liveStocks,setLiveStocks]=useState(STOCKS);
  const [priceStatus,setPriceStatus]=useState("loading");

  useEffect(()=>{
    async function fetchPrices(){
      try{
        const res=await fetch("/api/stocks");
        const data=await res.json();
        if(data.ok&&data.prices){
          setLiveStocks(STOCKS.map(s=>{
            const live=data.prices[s.ticker];
            if(!live||!live.px)return s;
            const px=live.px;
            const day=live.day??s.day;
            return{...s,px,day,mktVal:s.shares*px,ret:((px-s.buy)/s.buy)*100,spark:mkSpark(s.seed,px>s.buy)};
          }));
          setPriceStatus("live");
        }else{
          setPriceStatus("error");
        }
      }catch{
        setPriceStatus("error");
      }
    }
    fetchPrices();
    const id=setInterval(fetchPrices,5*60*1000);
    return()=>clearInterval(id);
  },[]);

  const stocks=liveStocks;
  const totVal=stocks.reduce((a,s)=>a+s.mktVal,0);
  const totCost=stocks.reduce((a,s)=>a+s.cost,0);
  const totRet=((totVal-totCost)/totCost)*100;
  const alpha=totRet-BENCH;
  const allItems=NAV_GROUPS.flatMap(g=>g.items);
  const currentLabel=allItems.find(i=>i.id===tab)?.label||"";
  return(
    <div style={{display:"flex",height:"100vh",background:A.bg,fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif",color:A.t1,overflow:"hidden",WebkitFontSmoothing:"antialiased"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}button{font-family:inherit;outline:none;}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(84,84,88,0.5);border-radius:3px;}tr:hover td{background:rgba(255,255,255,0.024)!important;}input[type=range]{height:3px;}input[type=number]{-moz-appearance:textfield;}`}</style>
      {/* SIDEBAR */}
      <div style={{width:210,background:"rgba(10,10,10,0.98)",borderRight:`1px solid ${A.sep}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 16px",borderBottom:`1px solid ${A.sep}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#0A84FF,#007AFF)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 12px ${A.blueGlow}`}}><Activity size={15} color="#fff" strokeWidth={2.5}/></div>
          <div><p style={{fontSize:14,fontWeight:700,letterSpacing:"-0.01em",color:A.t1,lineHeight:1}}>Brahmos</p><p style={{fontSize:10,color:A.t4,marginTop:1}}>Defence Intelligence</p></div>
        </div>
        <nav style={{padding:"8px 8px",flex:1,overflowY:"auto"}}>
          {NAV_GROUPS.map(g=>(
            <div key={g.group} style={{marginBottom:16}}>
              <p style={{fontSize:9,color:g.group==="AI ANALYST"?A.blue:A.t4,letterSpacing:"0.1em",fontWeight:600,padding:"0 10px",marginBottom:4}}>{g.group}</p>
              {g.items.map(n=>(
                <button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,marginBottom:1,background:tab===n.id?(n.id==="ai"?"rgba(10,132,255,0.2)":"rgba(10,132,255,0.15)"):"transparent",border:tab===n.id&&n.id==="ai"?"1px solid rgba(10,132,255,0.4)":"none",color:tab===n.id?A.blue:n.id==="ai"?A.blue:A.t3,fontSize:12,fontWeight:tab===n.id||n.id==="ai"?600:400,cursor:"pointer",transition:"all 0.12s"}}>
                  <n.Icon size={14} strokeWidth={tab===n.id?2.2:1.8}/>
                  <span>{n.label}</span>
                  {tab===n.id&&<ChevronRight size={11} style={{marginLeft:"auto"}}/>}
                  {n.id==="ai"&&tab!==n.id&&<span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:A.green,animation:"pulse 2s infinite"}}/>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${A.sep}`}}>
          <p style={{fontSize:10,color:A.t4,marginBottom:2}}>NSE · India Defence · FY26</p>
          <p style={{fontSize:10,color:A.t4,marginBottom:6}}>Stocks bought March 2025</p>
          <p style={{fontSize:10,color:A.t4}}>Built by <span style={{color:A.blue,fontWeight:600}}>Shri</span></p>
        </div>
      </div>
      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:52,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(10,10,10,0.95)",backdropFilter:"saturate(180%) blur(20px)",borderBottom:`1px solid ${A.sep}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <span style={{fontSize:17,fontWeight:700,letterSpacing:"-0.02em"}}>Brahmos Capital</span>
            <span style={{fontSize:12,color:A.t3}}>· {currentLabel}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <button onClick={()=>setTab("ai")} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 14px",borderRadius:20,background:"rgba(10,132,255,0.15)",border:"1px solid rgba(10,132,255,0.4)",color:A.blue,fontSize:12,fontWeight:600,cursor:"pointer"}}>
              <MessageSquare size={13}/>
              <span>Ask Shri</span>
              <span style={{width:5,height:5,borderRadius:"50%",background:A.green,animation:"pulse 2s infinite"}}/>
            </button>
            <span style={{fontSize:11,color:A.t3,display:"flex",alignItems:"center",gap:7}}>
              {priceStatus==="loading"&&<span style={{color:A.orange,fontSize:10,fontWeight:600}}>⏳ LOADING</span>}
              {priceStatus==="live"   &&<span style={{color:A.green, fontSize:10,fontWeight:600}}>📡 LIVE</span>}
              {priceStatus==="error"  &&<span style={{color:A.orange,fontSize:10,fontWeight:600}}>⚠ OFFLINE</span>}
              <span>NSE · {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
            </span>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(48,209,88,0.1)",borderRadius:20,padding:"4px 12px",border:"1px solid rgba(48,209,88,0.2)"}}><span style={{width:6,height:6,borderRadius:"50%",background:A.green,display:"inline-block",animation:"pulse 1.8s ease-in-out infinite"}}/><span style={{color:A.green,fontSize:11,fontWeight:600,letterSpacing:"0.05em"}}>LIVE</span></div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,padding:"14px 28px",flexShrink:0,borderBottom:`1px solid ${A.sep}`,background:A.bg2}}>
          <KpiCard label="TOTAL VALUE"        value={inr(totVal)}   sub={"Cost basis "+inr(totCost)+" · Mar 2025"} positive={null}/>
          <KpiCard label="TOTAL RETURN"       value={pct(totRet)}   sub={inr(totVal-totCost)+" unrealised gain"} positive={totRet>=0}/>
          <KpiCard label="ALPHA VS NIFTY DEF" value={pct(alpha)}    sub={"Nifty Defence YTD +"+BENCH.toFixed(1)+"%"} positive={alpha>=0}/>
          <KpiCard label="PORTFOLIO STOCKS"   value="25"            sub="9 core + 16 extended positions" positive={null}/>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {tab==="portfolio"&&<PortfolioView onAskAI={()=>setTab("ai")} stocks={stocks}/>}
          {tab==="geo"      &&<GeoView/>}
          {tab==="drill"    &&<DrillView stocks={stocks}/>}
          {tab==="screener" &&<ScreenerView stocks={stocks}/>}
          {tab==="heatmap"  &&<HeatmapView stocks={stocks}/>}
          {tab==="consensus"&&<ConsensusView stocks={stocks}/>}
          {tab==="why"      &&<WhyDefenceView/>}
          {tab==="news"     &&<NewsView/>}
          {tab==="ai"       &&<AskAIView/>}
          {tab==="calc"     &&<EntryCalcView stocks={stocks}/>}
        </div>
        <div style={{padding:"8px 28px",borderTop:`1px solid ${A.sep}`,background:"rgba(10,10,10,0.95)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <p style={{fontSize:11,color:A.t4}}>Brahmos Capital · NSE India Defence Intelligence</p>
          <p style={{fontSize:11,color:A.t4}}>Designed &amp; built by <span style={{color:A.blue,fontWeight:600}}>Shri</span> · Morgan Stanley role is hypothetical · Data as of 11 Mar 2026 · Not investment advice</p>
        </div>
      </div>
    </div>
  );
}
