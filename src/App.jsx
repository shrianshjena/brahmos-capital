import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Layers, Zap, Globe, BarChart2, Search, Calculator, Shield, TrendingUp, Newspaper, MessageSquare, ChevronRight, ArrowUpRight, ArrowDownRight, TrendingDown, Activity, Send, Loader, Filter, Star, AlertCircle, CheckCircle, Info, BookOpen } from "lucide-react";

/* ─── APPLE DARK PALETTE ──────────────────────────────────────────────────── */
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

/* ─── RNG + SPARKLINES ───────────────────────────────────────────────────── */
function rng(s){let v=s;return()=>{v=(v*16807)%2147483647;return(v-1)/2147483646;};}
function mkSpark(seed,up){const r=rng(seed);const p=[100];for(let i=1;i<24;i++)p.push(Math.max(68,p[i-1]+(up?.5:-.2)+(r()-.46)*4));return p.map(v=>({v}));}

/* ─── STOCK DATA (NSE · Mar 2025 entry · Mar 11 2026 prices) ─────────────── */
const STOCKS = [
  {ticker:"HAL",        name:"Hindustan Aeronautics",    sub:"Aerospace · MRO",        shares:50,  buy:3200, px:3979.40,day:-1.10,pe:30.2,pb:5.8, roe:19.2,mc:2970,ob:1050,seed:1001,sector:"Aerospace"},
  {ticker:"BEL",        name:"Bharat Electronics",       sub:"Electronics · C4ISR",    shares:500, buy:310,  px:454.60, day:-2.96,pe:65.1,pb:12.4,roe:22.5,mc:2920,ob:700, seed:1002,sector:"Electronics"},
  {ticker:"MAZDOCK",    name:"Mazagon Dock Shipbuilders", sub:"Naval · Submarines",     shares:80,  buy:1800, px:2371.00,day:-4.08,pe:47.3,pb:9.1, roe:21.3,mc:1000,ob:380, seed:1003,sector:"Naval"},
  {ticker:"COCHINSHIP", name:"Cochin Shipyard",           sub:"Naval · Shipbuilding",   shares:120, buy:1100, px:1457.10,day:-2.23,pe:30.5,pb:5.2, roe:17.8,mc:440, ob:210, seed:1004,sector:"Naval"},
  {ticker:"GRSE",       name:"Garden Reach Shipbuilders", sub:"Naval · Patrol Vessels", shares:60,  buy:1900, px:2470.90,day:-2.07,pe:42.1,pb:8.3, roe:20.1,mc:290, ob:225, seed:1005,sector:"Naval"},
  {ticker:"BDL",        name:"Bharat Dynamics",           sub:"Missiles · Munitions",   shares:150, buy:900,  px:1313.60,day:-3.18,pe:83.5,pb:14.2,roe:17.0,mc:550, ob:290, seed:1006,sector:"Missiles"},
  {ticker:"DATAPATTNS", name:"Data Patterns India",       sub:"Defence Electronics",    shares:30,  buy:2500, px:3470.90,day:-0.58,pe:75.2,pb:11.8,roe:16.5,mc:100, ob:32,  seed:1007,sector:"Electronics"},
  {ticker:"PARAS",      name:"Paras Defence & Space",     sub:"Optics · Space",         shares:200, buy:500,  px:721.45, day:-3.72,pe:70.8,pb:9.6, roe:14.2,mc:60,  ob:18,  seed:1008,sector:"Space"},
  {ticker:"ZENTEC",     name:"Zen Technologies",           sub:"Training · Anti-Drone",  shares:100, buy:900,  px:1413.00,day:-0.97,pe:45.1,pb:8.9, roe:20.8,mc:70,  ob:42,  seed:1009,sector:"Electronics"},
].map(s=>({...s,mktVal:s.shares*s.px,cost:s.shares*s.buy,ret:((s.px-s.buy)/s.buy)*100,spark:mkSpark(s.seed,s.px>s.buy)}));

const TOTVAL=STOCKS.reduce((a,s)=>a+s.mktVal,0);
const TOTCOST=STOCKS.reduce((a,s)=>a+s.cost,0);
const TOTRET=((TOTVAL-TOTCOST)/TOTCOST)*100;
const BENCH=19.0; const ALPHA=TOTRET-BENCH;
STOCKS.forEach(s=>{s.wt=(s.mktVal/TOTVAL)*100;});
const SECT_PE_AVG=52;

/* ─── ANALYST CONSENSUS ─────────────────────────────────────────────────── */
const CONSENSUS = {
  HAL:       {buy:20,hold:5, sell:2, target:4960,brokers:["Motilal","HDFC Sec","Kotak","Nomura","CLSA"]},
  BEL:       {buy:15,hold:8, sell:4, target:520, brokers:["Motilal","Emkay","Axis","ICICI Sec","JM Fin"]},
  MAZDOCK:   {buy:16,hold:4, sell:2, target:2850,brokers:["Kotak","Motilal","Nuvama","CLSA","Jefferies"]},
  COCHINSHIP:{buy:12,hold:6, sell:3, target:1750,brokers:["HDFC Sec","Motilal","ICICI Sec","Axis","Prabhudas"]},
  GRSE:      {buy:14,hold:5, sell:2, target:2950,brokers:["Kotak","Emkay","Motilal","Yes Sec","BOB Cap"]},
  BDL:       {buy:10,hold:7, sell:5, target:1450,brokers:["Nomura","Kotak","HDFC Sec","Axis","Jefferies"]},
  DATAPATTNS:{buy:8, hold:6, sell:7, target:3200,brokers:["HDFC Sec","Motilal","Kotak","Emkay","Prabhudas"]},
  PARAS:     {buy:10,hold:5, sell:4, target:820, brokers:["ICICI Sec","Axis","YES Sec","Nirmal Bang","Monarch"]},
  ZENTEC:    {buy:12,hold:4, sell:2, target:1650,brokers:["Motilal","HDFC Sec","Emkay","Nirmal Bang","BOB Cap"]},
};

/* ─── NEWS FEED ─────────────────────────────────────────────────────────── */
const NEWS = [
  {id:1, date:"10 Mar 2026",cat:"DEAL",    impact:"BULLISH",tickers:["HAL","BEL","BDL"],
   headline:"Indonesia Formalises BrahMos Missile Acquisition — India's Largest Defence Export",
   body:"Indonesia has formally signed the BrahMos supersonic cruise missile deal, marking India's largest ever defence export. HAL, BEL, and BDL are the primary beneficiaries across propulsion, guidance electronics, and warhead systems.",
   source:"Economic Times Defence"},
  {id:2, date:"10 Mar 2026",cat:"BROKER",  impact:"BULLISH",tickers:["HAL","BEL","BDL","MAZDOCK"],
   headline:"Motilal Oswal Issues BUY on 4 Defence Stocks Post BrahMos Rally",
   body:"Following the Indonesia BrahMos deal, Motilal Oswal has issued fresh BUY recommendations on HAL (target ₹4,960), BEL (₹520), BDL (₹1,450), and MAZDOCK (₹2,850), citing strong order pipeline and geopolitical tailwinds.",
   source:"Motilal Oswal Research"},
  {id:3, date:"9 Mar 2026", cat:"ORDER",   impact:"BULLISH",tickers:["SECTOR"],
   headline:"Sunita Tools Receives Full Advance for ₹576 Cr NATO 155mm Shell Order",
   body:"Sunita Tools confirmed receipt of full advance payment for 2,40,000 NATO-spec 155mm M107 shells over 24 months. Monthly billing of ~₹24 Cr signals growing Indian defence exports to NATO supply chains.",
   source:"BSE Filing"},
  {id:4, date:"5 Mar 2026", cat:"ORDER",   impact:"BULLISH",tickers:["MAZDOCK"],
   headline:"Indian Navy Nears Decision on ₹99,000 Cr Submarine Contract with Thyssenkrupp",
   body:"The Indian Navy is finalising a landmark ₹99,000 Cr deal for 6 advanced P-75I submarines with Germany's Thyssenkrupp Marine Systems. MDL's Mazagon Dock is the designated construction yard — a transformative decade-long revenue pipeline.",
   source:"Defence News India"},
  {id:5, date:"4 Mar 2026", cat:"ORDER",   impact:"BULLISH",tickers:["HAL"],
   headline:"MoD Awards HAL ₹5,083 Cr Contract for Coast Guard & Navy",
   body:"HAL has secured contracts worth ₹5,083 Cr from the Ministry of Defence — 6 ALH Mk-III helicopters for the Coast Guard (₹2,901 Cr) and Surface-to-Air Shtil missiles for the Navy (₹2,182 Cr). Order book visibility strengthens further.",
   source:"Ministry of Defence"},
  {id:6, date:"1 Mar 2026", cat:"MARKET",  impact:"BULLISH",tickers:["SECTOR"],
   headline:"Nifty India Defence Index Up 19% YTD — Outperforms Nifty 50 by 12 Percentage Points",
   body:"The Nifty India Defence Index has surged 19% year-to-date by March 2026, significantly outperforming the Nifty 50's 7% gain. Global defence spending is forecast to hit $2.6T by 2026 — India's domestic manufacturers are key beneficiaries.",
   source:"NSE India"},
  {id:7, date:"1 Mar 2026", cat:"RESULTS", impact:"BULLISH",tickers:["GRSE"],
   headline:"GRSE Delivers Record Q3; Order Book at ₹22,500 Cr Gives 3-Year Revenue Visibility",
   body:"Garden Reach Shipbuilders posted record Q3 delivery milestones on next-gen offshore patrol vessels. With ₹22,500 Cr order book, revenue visibility extends to FY29. Multiple analyst target upgrades followed the results.",
   source:"GRSE Investor Relations"},
  {id:8, date:"28 Feb 2026",cat:"BROKER",  impact:"MIXED",  tickers:["HAL","BEL","MAZDOCK"],
   headline:"HDFC Securities Initiates Coverage on Defence Sector with Mixed Ratings",
   body:"HDFC Securities initiated coverage noting structural growth but flagging valuation concerns. Issued Reduce on HAL (P/E 30x) and BEL (P/E 65x), while initiating BUY on MAZDOCK and GRSE citing more reasonable multiples and strong order execution.",
   source:"HDFC Securities Research"},
  {id:9, date:"23 Feb 2026",cat:"RISK",    impact:"NEUTRAL",tickers:["HAL"],
   headline:"HAL Clarifies on Tejas Ground Incident: No Crash, Safety Record Intact",
   body:"HAL issued a regulatory clarification following media reports of a Tejas LCA incident. The company confirmed it was a minor technical incident during ground testing, with the pilot safe. Tejas maintains one of the world's best safety records among contemporary fighters.",
   source:"HAL Regulatory Filing"},
  {id:10,date:"20 Feb 2026",cat:"POLICY",  impact:"LT BULL",tickers:["BEL","HAL","DATAPATTNS"],
   headline:"AMCA Program Narrows to 3 Consortia; BEL-L&T Among Finalists for Avionics",
   body:"India's Advanced Medium Combat Aircraft program has shortlisted 3 consortia for the critical avionics package. BEL-L&T is among the finalists. A decade-long program, AMCA will define India's next-generation stealth air combat capability.",
   source:"Indian Defence Research Wing"},
  {id:11,date:"3 Feb 2026", cat:"POLICY",  impact:"BULLISH",tickers:["SECTOR"],
   headline:"India Signals Long-Term Move Toward 2.5% of GDP on Defence",
   body:"Senior government officials have signalled India's intention to align defence spending with NATO norms of 2.5% of GDP, up from the current ~2%. This would add approximately ₹1.5L Cr annually to the defence budget over the next 5 years.",
   source:"Ministry of Defence"},
  {id:12,date:"1 Feb 2026", cat:"BUDGET",  impact:"BULLISH",tickers:["SECTOR"],
   headline:"Union Budget FY27: Defence Allocation Hits Record ₹7.85L Cr (+15.2% YoY)",
   body:"The Union Budget 2026 allocated ₹7.85L Cr to defence — a 15.2% YoY jump with capital expenditure surging 20.1% to ₹2.31L Cr. Finance Minister cited modernisation of armed forces and indigenous manufacturing as key priorities.",
   source:"Union Budget 2026"},
  {id:13,date:"15 Jan 2026",cat:"EXPORTS", impact:"BULLISH",tickers:["SECTOR"],
   headline:"India's Defence Exports Hit ₹23,622 Cr in FY25; Target ₹50,000 Cr by FY29",
   body:"India's defence exports reached a record ₹23,622 Cr in FY2025, up 78% over 3 years. With the BrahMos Indonesia deal and growing NATO supply chain participation, the government's ₹50,000 Cr FY29 target appears increasingly achievable.",
   source:"Ministry of Defence"},
  {id:14,date:"6 Mar 2026", cat:"GEOPO",   impact:"BULLISH",tickers:["MAZDOCK","COCHINSHIP","GRSE"],
   headline:"US Naval Action Near Sri Lanka Raises South Asian Security Stakes",
   body:"The first US naval combat engagement since WWII occurred off the Sri Lankan coast, raising regional security concerns. India's strategic location and growing naval procurement make MDL, Cochin Shipyard, and GRSE direct beneficiaries of accelerated build-up timelines.",
   source:"Defence News"},
  {id:15,date:"15 Feb 2026",cat:"ORDER",   impact:"BULLISH",tickers:["BEL"],
   headline:"BEL Sets ₹570 Bn FY26 Order Inflow Target; QRSAM Integration Key Catalyst",
   body:"Bharat Electronics has committed to ₹570 Bn in order inflows for FY26, including the landmark QRSAM air defence system integration. BEL is also a development partner for DRDO's Project Kusha (Sudarshan Chakra) advanced radar system.",
   source:"BEL Investor Day"},
];

/* ─── CHART + UTILS ─────────────────────────────────────────────────────── */
const PCHART=[{d:"Mar '25",p:100,b:100},{d:"Apr",p:96,b:97},{d:"May",p:104,b:100},{d:"Jun",p:111,b:103},{d:"Jul",p:117,b:107},{d:"Aug",p:113,b:105},{d:"Sep",p:120,b:108},{d:"Oct",p:126,b:111},{d:"Nov",p:132,b:114},{d:"Dec",p:135,b:116},{d:"Jan '26",p:129,b:113},{d:"Feb",p:125,b:112},{d:"Mar",p:138,b:119}];
const pct=v=>`${v>=0?"+":""}${v.toFixed(2)}%`;
const inr=v=>`₹${(v/100000).toFixed(2)}L`;
const cr=v=>`₹${v.toFixed(0)}Cr`;
const money=v=>`₹${v.toLocaleString("en-IN",{maximumFractionDigits:2})}`;

/* ─── ATOMS ──────────────────────────────────────────────────────────────── */
function Spark({data,color}){return(<div style={{width:72,height:28}}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:2,right:2,left:2,bottom:2}}><Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5}/></LineChart></ResponsiveContainer></div>);}

function KpiCard({label,value,sub,positive}){return(<div style={{background:A.card,borderRadius:16,padding:"20px 22px",border:`1px solid ${A.sepLight}`,flex:1}}><p style={{fontSize:11,color:A.t3,marginBottom:8,letterSpacing:"0.04em",fontWeight:500}}>{label}</p><p style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",lineHeight:1,marginBottom:6,color:positive===false?A.red:positive===true?A.green:A.t1}}>{value}</p><p style={{fontSize:12,color:A.t3}}>{sub}</p></div>);}

const BADGE_CFG={"STRONG BUY":{bg:"rgba(48,209,88,0.18)",color:A.green,border:"rgba(48,209,88,0.4)"},"BUY":{bg:"rgba(48,209,88,0.10)",color:A.green,border:"rgba(48,209,88,0.25)"},"HOLD":{bg:"rgba(255,159,10,0.15)",color:A.orange,border:"rgba(255,159,10,0.3)"},"REDUCE":{bg:"rgba(255,69,58,0.15)",color:A.red,border:"rgba(255,69,58,0.3)"},"WATCH":{bg:"rgba(10,132,255,0.15)",color:A.blue,border:"rgba(10,132,255,0.3)"}};
function Badge({type}){const c=BADGE_CFG[type]||BADGE_CFG["HOLD"];return(<span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,borderRadius:6,fontSize:10,fontWeight:700,padding:"3px 9px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{type}</span>);}

const IMPACT_CFG={BULLISH:{c:A.green,bg:"rgba(48,209,88,0.12)"},MIXED:{c:A.orange,bg:"rgba(255,159,10,0.12)"},"LT BULL":{c:A.teal,bg:"rgba(50,173,230,0.12)"},NEUTRAL:{c:A.t3,bg:"rgba(255,255,255,0.06)"},RISK:{c:A.red,bg:"rgba(255,69,58,0.12)"}};
function ImpactTag({impact}){const c=IMPACT_CFG[impact]||IMPACT_CFG.NEUTRAL;return(<span style={{background:c.bg,color:c.c,borderRadius:6,fontSize:10,fontWeight:600,padding:"2px 8px",letterSpacing:"0.04em"}}>{impact}</span>);}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  VIEWS                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─── PORTFOLIO ─────────────────────────────────────────────────────────── */
function PortfolioView(){
  const SIGNALS=[{id:1,ticker:"HAL",type:"STRONG BUY",cat:"Gov",conf:88,date:"4 Mar 2026",title:"MoD Awards ₹5,083 Cr Contract",detail:"6 ALH Mk-III helicopters (₹2,901 Cr) + Shtil naval missiles (₹2,182 Cr). Order book strengthens."},{id:2,ticker:"BDL",type:"STRONG BUY",cat:"Geo",conf:85,date:"10 Mar 2026",title:"Indonesia Signs BrahMos Deal",detail:"India's largest-ever defence export. BDL is key propulsion & warhead supplier."},{id:3,ticker:"MAZDOCK",type:"BUY",cat:"Gov",conf:74,date:"5 Mar 2026",title:"₹99,000 Cr Submarine Pipeline",detail:"Navy finalising 6 P-75I submarines with Thyssenkrupp. Transformative decade-long contract."},{id:4,ticker:"GRSE",type:"BUY",cat:"Market",conf:70,date:"1 Mar 2026",title:"Record Q3 Execution",detail:"Order book ₹22,500 Cr provides 3+ year revenue visibility. Target upgrades."},{id:5,ticker:"ZENTEC",type:"BUY",cat:"Geo",conf:72,date:"8 Mar 2026",title:"Anti-Drone Tailwind: Op. Sindoor",detail:"Emergency C-UAV procurement accelerated. ZENTEC primary domestic beneficiary."},{id:6,ticker:"COCHINSHIP",type:"BUY",cat:"Market",conf:68,date:"7 Mar 2026",title:"Compelling Valuation vs Peers",detail:"P/E 30.5x vs sector avg 52x. NGOPV execution strong, margin recovery underway."},{id:7,ticker:"BEL",type:"HOLD",cat:"Market",conf:55,date:"6 Mar 2026",title:"Stretched Valuation Caps Upside",detail:"₹570Bn FY26 target achievable, but P/E 65x limits near-term upside. Entry: ₹380–400."},{id:8,ticker:"DATAPATTNS",type:"REDUCE",cat:"Market",conf:63,date:"3 Mar 2026",title:"P/E 75x Prices in Perfection",detail:"Strong franchise but HDFC Sec flags execution risk. Trim 20–30% on strength."},{id:9,ticker:"HAL",type:"WATCH",cat:"Gov",conf:40,date:"23 Feb 2026",title:"Tejas Ground Incident — Monitor",detail:"Minor ground incident confirmed by HAL. Safety record intact. Watch export pipeline."}];
  const [sigFilter,setSigFilter]=useState("All");
  const cats=["All","Gov","Geo","Market"];
  const catColor={Gov:A.blue,Geo:A.orange,Market:A.t3};
  const sigItems=SIGNALS.filter(s=>sigFilter==="All"||s.cat===sigFilter);
  return(
    <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:20}}>
      {/* Chart */}
      <div style={{background:A.card,borderRadius:16,padding:"22px 24px",border:`1px solid ${A.sepLight}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><p style={{fontSize:13,fontWeight:600,color:A.t1,marginBottom:3}}>Portfolio vs Nifty India Defence</p><p style={{fontSize:12,color:A.t3}}>Normalised to 100 · Mar 2025 – Mar 2026</p></div>
          <div style={{display:"flex",gap:20}}>{[{l:"Portfolio",c:A.blue},{l:"Nifty Defence",c:A.green}].map(({l,c})=>(<div key={l} style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:20,height:2,background:c,borderRadius:1,display:"inline-block"}}/><span style={{fontSize:12,color:A.t2}}>{l}</span></div>))}</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
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
      {/* Positions */}
      <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${A.sepLight}`}}><p style={{fontSize:13,fontWeight:600,color:A.t1}}>Positions · Bought Mar 2025</p></div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:920}}>
            <thead><tr style={{borderBottom:`1px solid ${A.sepLight}`}}>{["Ticker","Company","Sector","Shares","Avg Cost (Mar '25)","Price","Mkt Value","Weight","Return","Today","Trend"].map(h=>(<th key={h} style={{padding:"10px 16px",textAlign:["Ticker","Company","Sector"].includes(h)?"left":"right",fontSize:11,color:A.t3,fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
            <tbody>{STOCKS.map((s,i)=>(<tr key={s.ticker} style={{borderBottom:`1px solid ${A.sepLight}`,background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}><td style={{padding:"11px 16px"}}><span style={{color:A.blue,fontSize:13,fontWeight:600}}>{s.ticker}</span></td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,whiteSpace:"nowrap"}}>{s.name}</td><td style={{padding:"11px 16px",color:A.t3,fontSize:12}}>{s.sub}</td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{s.shares}</td><td style={{padding:"11px 16px",color:A.t3,fontSize:12,textAlign:"right"}}>{money(s.buy)}</td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{money(s.px)}</td><td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{inr(s.mktVal)}</td><td style={{padding:"11px 16px",color:A.t3,fontSize:12,textAlign:"right"}}>{s.wt.toFixed(1)}%</td><td style={{padding:"11px 16px",textAlign:"right"}}><span style={{color:s.ret>=0?A.green:A.red,fontSize:12,fontWeight:500}}>{pct(s.ret)}</span></td><td style={{padding:"11px 16px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>{s.day>=0?<ArrowUpRight size={12} color={A.green}/>:<ArrowDownRight size={12} color={A.red}/>}<span style={{color:s.day>=0?A.green:A.red,fontSize:12}}>{pct(s.day)}</span></div></td><td style={{padding:"8px 16px"}}><Spark data={s.spark} color={s.ret>=0?A.blue:A.red}/></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      {/* Signals strip */}
      <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,padding:"20px 22px"}}>
        <div style={{display:"flex",gap:8,marginBottom:18,alignItems:"center"}}>
          <p style={{fontSize:13,fontWeight:600,color:A.t1,marginRight:10}}>Investment Signals</p>
          {cats.map(c=>(<button key={c} onClick={()=>setSigFilter(c)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${sigFilter===c?A.blue:A.sep}`,background:sigFilter===c?"rgba(10,132,255,0.15)":"transparent",color:sigFilter===c?A.blue:A.t3,fontSize:12,cursor:"pointer",fontWeight:sigFilter===c?600:400}}>{c}</button>))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sigItems.map(sig=>(<div key={sig.id} style={{display:"flex",alignItems:"flex-start",gap:16,padding:"13px 16px",background:A.bg2,borderRadius:12,border:`1px solid ${A.sepLight}`}}><div style={{minWidth:110}}><p style={{color:A.blue,fontSize:13,fontWeight:600,marginBottom:6}}>{sig.ticker}</p><Badge type={sig.type}/></div><div style={{flex:1}}><p style={{color:A.t1,fontSize:13,fontWeight:600,marginBottom:4}}>{sig.title}</p><p style={{color:A.t3,fontSize:12,lineHeight:1.55}}>{sig.detail}</p></div><div style={{minWidth:130,display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}><span style={{background:sig.cat==="Gov"?"rgba(10,132,255,0.15)":sig.cat==="Geo"?"rgba(255,159,10,0.15)":"rgba(255,255,255,0.06)",color:catColor[sig.cat]||A.t3,borderRadius:6,fontSize:10,fontWeight:600,padding:"2px 8px"}}>{sig.cat}</span><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:64,height:3,background:A.sep,borderRadius:2}}><div style={{width:`${sig.conf}%`,height:"100%",borderRadius:2,background:sig.conf>=75?A.green:sig.conf>=55?A.blue:A.orange}}/></div><span style={{fontSize:11,color:A.t3}}>{sig.conf}%</span></div><p style={{fontSize:11,color:A.t4}}>{sig.date}</p></div></div>))}
        </div>
      </div>
    </div>
  );
}

/* ─── SCREENER ───────────────────────────────────────────────────────────── */
function ScreenerView(){
  const [sortKey,setSortKey]=useState("mc");
  const [sortAsc,setSortAsc]=useState(false);
  const [peMax,setPeMax]=useState(100);
  const [retMin,setRetMin]=useState(-100);
  const [sectorF,setSectorF]=useState("All");
  const sectors=["All",...new Set(STOCKS.map(s=>s.sector))];
  const toggleSort=k=>{if(sortKey===k)setSortAsc(!sortAsc);else{setSortKey(k);setSortAsc(false);}};
  const filtered=STOCKS.filter(s=>s.pe<=peMax&&s.ret>=retMin&&(sectorF==="All"||s.sector===sectorF)).sort((a,b)=>sortAsc?(a[sortKey]-b[sortKey]):(b[sortKey]-a[sortKey]));
  const cols=[{k:"ticker",l:"Ticker",s:false},{k:"name",l:"Company",s:false},{k:"sector",l:"Sector",s:false},{k:"px",l:"Price"},{k:"day",l:"Today %"},{k:"pe",l:"P/E"},{k:"pb",l:"P/B"},{k:"roe",l:"ROE %"},{k:"mc",l:"Mkt Cap (₹Cr)"},{k:"ob",l:"Order Book"},{k:"ret",l:"Return (Mar'25)"}];
  const Hdr=({col})=>(<th onClick={col.s===false?null:()=>toggleSort(col.k)} style={{padding:"10px 14px",textAlign:["ticker","name","sector"].includes(col.k)?"left":"right",fontSize:11,color:sortKey===col.k?A.blue:A.t3,fontWeight:500,cursor:col.s===false?"default":"pointer",whiteSpace:"nowrap",userSelect:"none"}}>{col.l}{sortKey===col.k?(sortAsc?" ↑":" ↓"):""}</th>);
  return(
    <div style={{padding:"24px 28px"}}>
      {/* Filter bar */}
      <div style={{background:A.card,borderRadius:14,padding:"16px 20px",border:`1px solid ${A.sepLight}`,marginBottom:16,display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Filter size={13} color={A.t3}/><span style={{fontSize:12,color:A.t3}}>Filters:</span></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:A.t3}}>Sector</span>
          <div style={{display:"flex",gap:6}}>{sectors.map(s=>(<button key={s} onClick={()=>setSectorF(s)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${sectorF===s?A.blue:A.sep}`,background:sectorF===s?"rgba(10,132,255,0.15)":"transparent",color:sectorF===s?A.blue:A.t3,fontSize:11,cursor:"pointer"}}>{s}</button>))}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:A.t3}}>Max P/E</span>
          <input type="range" min={20} max={100} value={peMax} onChange={e=>setPeMax(+e.target.value)} style={{accentColor:A.blue,width:80}}/>
          <span style={{fontSize:12,color:A.blue,minWidth:30}}>{peMax}x</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:A.t3}}>Min Return</span>
          <input type="range" min={-50} max={100} value={retMin} onChange={e=>setRetMin(+e.target.value)} style={{accentColor:A.blue,width:80}}/>
          <span style={{fontSize:12,color:A.blue,minWidth:40}}>{retMin}%</span>
        </div>
        <span style={{marginLeft:"auto",fontSize:12,color:A.t4}}>{filtered.length} of {STOCKS.length} stocks</span>
      </div>
      <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
            <thead><tr style={{borderBottom:`1px solid ${A.sepLight}`}}>{cols.map(c=>(<Hdr key={c.k} col={c}/>))}</tr></thead>
            <tbody>{filtered.map((s,i)=>{const c=CONSENSUS[s.ticker];const upside=c?((c.target-s.px)/s.px)*100:null;return(<tr key={s.ticker} style={{borderBottom:`1px solid ${A.sepLight}`,background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}><td style={{padding:"11px 14px"}}><span style={{color:A.blue,fontSize:13,fontWeight:600}}>{s.ticker}</span></td><td style={{padding:"11px 14px",color:A.t1,fontSize:12,whiteSpace:"nowrap"}}>{s.name}</td><td style={{padding:"11px 14px"}}><span style={{background:"rgba(10,132,255,0.1)",color:A.blue,borderRadius:5,fontSize:10,padding:"2px 7px"}}>{s.sector}</span></td><td style={{padding:"11px 14px",color:A.t1,fontSize:12,textAlign:"right"}}>{money(s.px)}</td><td style={{padding:"11px 14px",textAlign:"right"}}><span style={{color:s.day>=0?A.green:A.red,fontSize:12}}>{pct(s.day)}</span></td><td style={{padding:"11px 14px",textAlign:"right"}}><span style={{color:s.pe>SECT_PE_AVG?A.orange:A.green,fontSize:12,fontWeight:500}}>{s.pe}x</span></td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>{s.pb}x</td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>{s.roe}%</td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>₹{s.mc.toLocaleString()}</td><td style={{padding:"11px 14px",color:A.t2,fontSize:12,textAlign:"right"}}>₹{s.ob}Cr</td><td style={{padding:"11px 14px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}><span style={{color:s.ret>=0?A.green:A.red,fontSize:12,fontWeight:500}}>{pct(s.ret)}</span>{upside!==null&&<span style={{color:upside>0?A.teal:A.red,fontSize:10,background:"rgba(50,173,230,0.1)",borderRadius:4,padding:"1px 6px"}}>TP {pct(upside)}</span>}</div></td></tr>);})}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── ENTRY POINT CALCULATOR ─────────────────────────────────────────────── */
function EntryCalcView(){
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
        {/* Controls */}
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
          {/* Summary */}
          <div style={{background:A.card,borderRadius:16,padding:18,border:`1px solid ${A.sepLight}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Stocks",allocation.length],["Total Invest",inr(totalInvested)],["Remaining",inr(budget-totalInvested)],["Avg Upside",`+${allocation.filter(a=>a.upside).reduce((s,a)=>s+a.upside,0)/allocation.filter(a=>a.upside).length|0}%`]].map(([l,v])=>(<div key={l} style={{background:A.bg2,borderRadius:10,padding:"12px 14px"}}><p style={{fontSize:10,color:A.t4,marginBottom:4}}>{l}</p><p style={{fontSize:16,fontWeight:700,color:A.t1}}>{v}</p></div>))}
            </div>
          </div>
        </div>
        {/* Allocation table */}
        <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
          <div style={{padding:"16px 22px",borderBottom:`1px solid ${A.sepLight}`}}><p style={{fontSize:13,fontWeight:600,color:A.t1}}>Suggested Allocation · {profile} Profile</p></div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${A.sepLight}`}}>{["Ticker","Company","Weight","Amount","Shares","Entry","Target","Upside"].map(h=>(<th key={h} style={{padding:"10px 16px",textAlign:["Ticker","Company"].includes(h)?"left":"right",fontSize:11,color:A.t3,fontWeight:500}}>{h}</th>))}</tr></thead>
            <tbody>{allocation.map((a,i)=>(<tr key={a.ticker} style={{borderBottom:`1px solid ${A.sepLight}`,background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}><td style={{padding:"13px 16px"}}><span style={{color:A.blue,fontSize:13,fontWeight:600}}>{a.ticker}</span></td><td style={{padding:"13px 16px",color:A.t1,fontSize:12}}>{a.name}</td><td style={{padding:"13px 16px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}><div style={{width:40,height:3,background:A.sep,borderRadius:2}}><div style={{width:`${a.weight*100}%`,height:"100%",background:A.blue,borderRadius:2}}/></div><span style={{color:A.t2,fontSize:12}}>{(a.weight*100).toFixed(0)}%</span></div></td><td style={{padding:"13px 16px",color:A.t1,fontSize:13,fontWeight:600,textAlign:"right"}}>{inr(a.amount)}</td><td style={{padding:"13px 16px",color:A.t2,fontSize:12,textAlign:"right"}}>{a.shares}</td><td style={{padding:"13px 16px",color:A.t2,fontSize:12,textAlign:"right"}}>{money(a.px)}</td><td style={{padding:"13px 16px",color:A.teal,fontSize:12,fontWeight:500,textAlign:"right"}}>{a.target?money(a.target):"—"}</td><td style={{padding:"13px 16px",textAlign:"right"}}>{a.upside!=null?(<span style={{color:a.upside>0?A.green:A.red,fontSize:12,fontWeight:600}}>{pct(a.upside)}</span>):(<span style={{color:A.t4}}>—</span>)}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── WHY DEFENCE NOW ────────────────────────────────────────────────────── */
function WhyDefenceView(){
  const THESIS=[
    {icon:"🛡️",color:A.blue,  title:"Record ₹7.85L Cr Defence Budget",stat:"+15.2% YoY",body:"India's FY27 defence allocation is the largest in history. Capital expenditure alone surged 20.1% to ₹2.31L Cr — funding Rafale Marines, Predator drones, submarines, and next-gen aircraft programmes across all three services."},
    {icon:"🚀",color:A.orange,title:"Make in India: Structural Policy Shift",stat:"75% indigenisation target",body:"The government has mandated 75%+ indigenisation in all new defence contracts. This directly and permanently transfers revenue from foreign OEMs to domestic manufacturers — a durable tailwind with no policy reversal risk given cross-party consensus."},
    {icon:"🌏",color:A.green, title:"Exports Surging — ₹50,000 Cr Target",stat:"₹23,622 Cr FY25 (+78% in 3 yrs)",body:"India's defence exports have grown 78% over three years. With BrahMos now exported to multiple countries, Armenia purchasing Pinaka rockets, and a growing NATO supply chain presence, India is cementing its role as a serious defence exporter."},
    {icon:"⚡",color:A.red,   title:"Geopolitical Escalation = Structural Demand",stat:"$2.6T global defence spend by 2026",body:"The US-Iran conflict near Sri Lanka, the Ukraine war, Middle East tensions, and South China Sea friction are accelerating defence budgets globally. India sits at the intersection of all key flashpoints — making domestic procurement a national security imperative."},
    {icon:"📊",color:A.purple,title:"Electronics: 30–40% of Platform Value",stat:"BEL order book ₹700Cr+",body:"Modern military platforms derive 30–40% of their value from electronics — sensors, radar, C4ISR, EW. As India upgrades ageing fleets and acquires new platforms, the electronics embedded in them creates a compounding, multi-decade demand cycle for BEL, DATAPATTNS, and ZENTEC."},
    {icon:"🔭",color:A.teal,  title:"AMCA & 6th Gen: 10-Year Programme",stat:"₹1.5L Cr programme cost (est.)",body:"India's Advanced Medium Combat Aircraft will define its air power for the 2040s–2060s. The recently shortlisted consortium for avionics ensures decades of domestic manufacturing, MRO, and upgrades — creating annuity-like long-term revenues for the supply chain."},
    {icon:"🏦",color:A.yellow,title:"Valuation: Selective Opportunity Remains",stat:"P/E sector avg 52x · HAL at 30x",body:"Not all defence stocks are equally expensive. HAL at 30x P/E and Cochin Shipyard at 30.5x offer reasonable entry relative to their growth. MAZDOCK's transformative submarine pipeline justifies its 47x multiple. Quality names at fair prices still exist in this sector."},
    {icon:"💡",color:A.indigo,title:"Operation Sindoor: Real-World Validation",stat:"Emergency C-UAV procurement triggered",body:"India's real operational deployments have created urgent demand for anti-drone systems, precision munitions, and surveillance technology. This 'battle-tested' procurement cycle is bypassing normal procurement timelines, benefiting ZENTEC, Paras Defence, and Solar Defence immediately."},
  ];
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{background:A.card,borderRadius:16,padding:"20px 22px",border:`1px solid ${A.sepLight}`,marginBottom:20}}>
        <p style={{fontSize:15,fontWeight:700,color:A.t1,marginBottom:6}}>The India Defence Investment Thesis</p>
        <p style={{fontSize:13,color:A.t2,lineHeight:1.7,maxWidth:900}}>India's defence sector represents one of the most compelling structural investment opportunities in emerging markets today — combining government policy certainty, geopolitical necessity, rising exports, and a multi-decade modernisation cycle. Here is why the sector deserves a place in any serious long-term portfolio.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {THESIS.map((t,i)=>(<div key={i} style={{background:A.card,borderRadius:16,padding:22,border:`1px solid ${A.sepLight}`,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${t.color},transparent)`}}/><div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:12}}><span style={{fontSize:28,lineHeight:1}}>{t.icon}</span><div><p style={{fontSize:13,fontWeight:700,color:A.t1,marginBottom:4}}>{t.title}</p><span style={{background:`rgba(255,255,255,0.08)`,color:t.color,borderRadius:6,fontSize:11,fontWeight:600,padding:"3px 9px"}}>{t.stat}</span></div></div><p style={{color:A.t2,fontSize:12,lineHeight:1.7}}>{t.body}</p></div>))}
      </div>
    </div>
  );
}

/* ─── VALUATION HEATMAP ─────────────────────────────────────────────────── */
function HeatmapView(){
  const [metric,setMetric]=useState("pe");
  const metrics={pe:{label:"P/E",desc:"Price-to-Earnings",low:20,high:80,fmt:v=>`${v}x`},pb:{label:"P/B",desc:"Price-to-Book",low:3,high:15,fmt:v=>`${v}x`},roe:{label:"ROE %",desc:"Return on Equity",low:10,high:25,fmt:v=>`${v}%`,invert:true}};
  const m=metrics[metric];
  const vals=STOCKS.map(s=>s[metric]);
  const minV=Math.min(...vals),maxV=Math.max(...vals);
  const getColor=v=>{
    const norm=(v-minV)/(maxV-minV);
    const heat=m.invert?1-norm:norm;
    if(heat<0.33)return A.green;
    if(heat<0.66)return A.orange;
    return A.red;
  };
  const getLabel=v=>{
    const norm=(v-minV)/(maxV-minV);
    const heat=m.invert?1-norm:norm;
    if(heat<0.33)return "CHEAP";
    if(heat<0.66)return "FAIR";
    return "RICH";
  };
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <p style={{fontSize:13,fontWeight:600,color:A.t1}}>Valuation Heatmap</p>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(metrics).map(([k,v])=>(<button key={k} onClick={()=>setMetric(k)} style={{padding:"6px 16px",borderRadius:20,border:`1px solid ${metric===k?A.blue:A.sep}`,background:metric===k?"rgba(10,132,255,0.15)":"transparent",color:metric===k?A.blue:A.t3,fontSize:12,cursor:"pointer",fontWeight:metric===k?600:400}}>{v.label} · {v.desc}</button>))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:14,alignItems:"center"}}>
          {[{c:A.green,l:"Cheap"},{c:A.orange,l:"Fair"},{c:A.red,l:"Rich/Expensive"}].map(({c,l})=>(<div key={l} style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:10,height:10,borderRadius:2,background:c,display:"inline-block"}}/><span style={{fontSize:11,color:A.t3}}>{l}</span></div>))}
        </div>
      </div>
      {/* Big cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {STOCKS.map(s=>{const v=s[metric];const c=getColor(v);const lbl=getLabel(v);return(<div key={s.ticker} style={{background:A.card,borderRadius:16,padding:20,border:`1px solid ${A.sepLight}`,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 80% 20%, ${c}22 0%, transparent 60%)`,pointerEvents:"none"}}/><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{color:A.blue,fontSize:14,fontWeight:700}}>{s.ticker}</span><span style={{background:`${c}22`,color:c,borderRadius:6,fontSize:10,fontWeight:700,padding:"3px 9px"}}>{lbl}</span></div><p style={{color:c,fontSize:36,fontWeight:800,letterSpacing:"-0.03em",lineHeight:1,marginBottom:6}}>{m.fmt(v)}</p><p style={{color:A.t3,fontSize:11,marginBottom:12}}>{m.desc}</p><div style={{height:4,background:A.sep,borderRadius:2,marginBottom:4}}><div style={{width:`${((v-minV)/(maxV-minV))*100}%`,height:"100%",background:c,borderRadius:2}}/></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:A.t4}}>{m.fmt(minV)} min</span><span style={{fontSize:10,color:A.t4}}>{m.fmt(maxV)} max</span></div></div>);})}
      </div>
      {/* Sector avg line */}
      {metric==="pe"&&(<div style={{background:A.card,borderRadius:14,padding:"16px 20px",border:`1px solid ${A.sepLight}`,display:"flex",alignItems:"center",gap:16}}><Info size={16} color={A.blue}/><p style={{fontSize:13,color:A.t2}}><span style={{color:A.t1,fontWeight:600}}>Sector average P/E: 52x</span> · HAL (30x) and Cochin Shipyard (30.5x) trade at the most compelling valuations relative to peers. BDL (83x) and Data Patterns (75x) price in aggressive future execution — limited margin of safety at current levels.</p></div>)}
    </div>
  );
}

/* ─── ANALYST CONSENSUS ─────────────────────────────────────────────────── */
function ConsensusView(){
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        {STOCKS.map(s=>{
          const c=CONSENSUS[s.ticker];
          if(!c)return null;
          const total=c.buy+c.hold+c.sell;
          const upside=((c.target-s.px)/s.px)*100;
          const rec=c.buy/total>0.6?"BUY":c.sell/total>0.4?"SELL":"HOLD";
          const recColor=rec==="BUY"?A.green:rec==="SELL"?A.red:A.orange;
          return(
            <div key={s.ticker} style={{background:A.card,borderRadius:16,padding:20,border:`1px solid ${A.sepLight}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div><p style={{color:A.blue,fontSize:14,fontWeight:700,marginBottom:2}}>{s.ticker}</p><p style={{color:A.t3,fontSize:11}}>{s.name}</p></div>
                <span style={{background:`${recColor}22`,color:recColor,border:`1px solid ${recColor}44`,borderRadius:8,fontSize:11,fontWeight:700,padding:"4px 10px"}}>{rec}</span>
              </div>
              {/* Buy/Hold/Sell bars */}
              <div style={{marginBottom:14}}>
                {[{l:"Buy",n:c.buy,c:A.green},{l:"Hold",n:c.hold,c:A.orange},{l:"Sell",n:c.sell,c:A.red}].map(({l,n,c:col})=>(<div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:11,color:A.t3,minWidth:28}}>{l}</span><div style={{flex:1,height:5,background:A.sep,borderRadius:3}}><div style={{width:`${(n/total)*100}%`,height:"100%",background:col,borderRadius:3}}/></div><span style={{fontSize:11,color:A.t2,minWidth:18,textAlign:"right"}}>{n}</span></div>))}
              </div>
              {/* Target vs Current */}
              <div style={{background:A.bg2,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,color:A.t3}}>Current</span>
                  <span style={{fontSize:13,color:A.t1,fontWeight:600}}>{money(s.px)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,color:A.t3}}>Median Target</span>
                  <span style={{fontSize:13,color:A.teal,fontWeight:600}}>{money(c.target)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:A.t3}}>Potential Upside</span>
                  <span style={{fontSize:13,color:upside>0?A.green:A.red,fontWeight:700}}>{pct(upside)}</span>
                </div>
              </div>
              {/* Analyst count */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:A.t4}}>{total} analysts covering</span>
                <div style={{display:"flex",gap:-4}}>{c.brokers.slice(0,3).map((b,i)=>(<span key={b} style={{fontSize:9,color:A.t4,background:A.card2,border:`1px solid ${A.sep}`,borderRadius:4,padding:"1px 5px",marginLeft:3}}>{b}</span>))}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── NEWS FEED ──────────────────────────────────────────────────────────── */
function NewsView(){
  const [catF,setCatF]=useState("All");
  const [tickerF,setTickerF]=useState("All");
  const cats=["All","DEAL","ORDER","BROKER","POLICY","BUDGET","MARKET","RESULTS","GEOPO","EXPORTS","RISK"];
  const catColors={DEAL:A.green,ORDER:A.blue,BROKER:A.purple,POLICY:A.orange,BUDGET:A.yellow,MARKET:A.teal,RESULTS:A.green,GEOPO:A.red,EXPORTS:A.teal,RISK:A.red};
  const tickers=["All",...STOCKS.map(s=>s.ticker),"SECTOR"];
  const filtered=NEWS.filter(n=>(catF==="All"||n.cat===catF)&&(tickerF==="All"||n.tickers.includes(tickerF)));
  return(
    <div style={{padding:"24px 28px"}}>
      {/* Filter bar */}
      <div style={{background:A.card,borderRadius:14,padding:"14px 18px",border:`1px solid ${A.sepLight}`,marginBottom:16}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {cats.map(c=>(<button key={c} onClick={()=>setCatF(c)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${catF===c?(catColors[c]||A.blue):A.sep}`,background:catF===c?`${catColors[c]||A.blue}22`:"transparent",color:catF===c?(catColors[c]||A.blue):A.t3,fontSize:11,cursor:"pointer",fontWeight:catF===c?600:400}}>{c}</button>))}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:A.t4,marginRight:4}}>Filter by stock:</span>
          {tickers.map(t=>(<button key={t} onClick={()=>setTickerF(t)} style={{padding:"3px 10px",borderRadius:20,border:`1px solid ${tickerF===t?A.blue:A.sep}`,background:tickerF===t?"rgba(10,132,255,0.15)":"transparent",color:tickerF===t?A.blue:A.t3,fontSize:10,cursor:"pointer"}}>{t}</button>))}
        </div>
      </div>
      <p style={{fontSize:12,color:A.t4,marginBottom:14}}>{filtered.length} article{filtered.length!==1?"s":""} · Data sourced from MoD filings, BSE, broker research, and financial media</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(n=>{
          const catColor=catColors[n.cat]||A.blue;
          return(
            <div key={n.id} style={{background:A.card,borderRadius:14,padding:"18px 20px",border:`1px solid ${A.sepLight}`,borderLeft:`3px solid ${catColor}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1,paddingRight:20}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{background:`${catColor}22`,color:catColor,borderRadius:5,fontSize:10,fontWeight:700,padding:"2px 8px",letterSpacing:"0.05em"}}>{n.cat}</span>
                    <ImpactTag impact={n.impact}/>
                    <span style={{fontSize:11,color:A.t4}}>{n.date}</span>
                    <span style={{fontSize:11,color:A.t4}}>· {n.source}</span>
                  </div>
                  <p style={{color:A.t1,fontSize:14,fontWeight:600,lineHeight:1.4,marginBottom:8}}>{n.headline}</p>
                  <p style={{color:A.t2,fontSize:12,lineHeight:1.65}}>{n.body}</p>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                {n.tickers.map(t=>(<span key={t} style={{background:"rgba(10,132,255,0.1)",color:A.blue,borderRadius:5,fontSize:10,fontWeight:600,padding:"2px 8px"}}>{t}</span>))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── GEO ────────────────────────────────────────────────────────────────── */
function GeoView(){
  const GEO=[{id:1,impact:"BULLISH",score:9,region:"South-East Asia",color:A.green,date:"10 Mar 2026",title:"Indonesia Signs BrahMos Missile Deal",detail:"India's largest defence export formalised. Direct catalyst for HAL, BEL, BDL across propulsion, guidance, and electronics sub-systems.",tickers:["HAL","BEL","BDL"]},{id:2,impact:"BULLISH",score:8,region:"Indian Ocean",color:A.blue,date:"6 Mar 2026",title:"US Sinks Iranian Warship Near Sri Lanka",detail:"First US naval combat action since WWII in India's strategic backyard. Accelerates Indian Navy procurement timelines for P-75I submarines and OPVs.",tickers:["MAZDOCK","COCHINSHIP","GRSE"]},{id:3,impact:"BULLISH",score:10,region:"India",color:A.green,date:"1 Feb 2026",title:"Record Defence Budget: ₹7.85L Cr (+15.2%)",detail:"Capital expenditure surges 20.1% to ₹2.31L Cr — the largest allocation in recent history. Broad-based tailwind for all domestic defence manufacturers.",tickers:["HAL","BEL","BDL","MAZDOCK"]},{id:4,impact:"LT BULL",score:7,region:"India",color:A.orange,date:"20 Feb 2026",title:"AMCA Program: 3 Consortia Shortlisted",detail:"BEL–L&T consortium among final 3 for AMCA avionics package. Long-gestation but potentially transformative for domestic electronics and sensor suppliers.",tickers:["BEL","HAL","DATAPATTNS"]},{id:5,impact:"BULLISH",score:8,region:"India",color:A.green,date:"3 Feb 2026",title:"India Targets 2.5% of GDP on Defence",detail:"Government signals long-term commitment to NATO-equivalent defence spending. Structural tailwind for the entire domestic defence ecosystem over the next decade.",tickers:["SECTOR-WIDE"]},{id:6,impact:"NEUTRAL",score:3,region:"India",color:A.card3,date:"23 Feb 2026",title:"Tejas Ground Technical Incident",detail:"Minor airframe incident during ground testing. No crash — pilot safe. HAL confirmed the event; LCA Tejas maintains one of the world's best combat safety records.",tickers:["HAL"]}];
  return(<div style={{padding:"24px 28px"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{GEO.map(e=>(<div key={e.id} style={{background:A.card,border:`1px solid ${A.sepLight}`,borderRadius:16,padding:22,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${e.color},transparent)`,borderRadius:"16px 16px 0 0"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div style={{flex:1,paddingRight:16}}><p style={{color:A.t1,fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8}}>{e.title}</p><div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{width:6,height:6,borderRadius:"50%",background:e.color,display:"inline-block"}}/><span style={{fontSize:11,color:A.t3}}>{e.impact}</span><span style={{fontSize:11,color:A.t4}}>· {e.region}</span></div></div><div style={{textAlign:"center",background:A.card2,borderRadius:10,padding:"8px 12px",minWidth:48}}><p style={{fontSize:24,fontWeight:700,color:e.color,lineHeight:1,letterSpacing:"-0.02em"}}>{e.score}</p><p style={{fontSize:9,color:A.t4,marginTop:2,letterSpacing:"0.05em"}}>IMPACT</p></div></div><p style={{color:A.t2,fontSize:12,lineHeight:1.65,marginBottom:14}}>{e.detail}</p><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{e.tickers.map(t=>(<span key={t} style={{background:"rgba(10,132,255,0.12)",color:A.blue,borderRadius:6,fontSize:10,fontWeight:600,padding:"2px 8px"}}>{t}</span>))}</div><p style={{fontSize:11,color:A.t4,textAlign:"right"}}>{e.date}</p></div>))}</div></div>);
}

/* ─── DRILL DOWN ─────────────────────────────────────────────────────────── */
const DRILL_SECTORS=[{name:"Naval / Shipbuilding",keys:["MAZDOCK","COCHINSHIP","GRSE"],color:A.blue},{name:"Electronics / C4ISR",keys:["BEL"],color:A.purple},{name:"Aerospace / MRO",keys:["HAL"],color:A.orange},{name:"Missiles / Munitions",keys:["BDL"],color:A.red},{name:"Defence Electronics",keys:["DATAPATTNS"],color:A.teal},{name:"Optics / Space",keys:["PARAS"],color:A.yellow},{name:"Training / Anti-Drone",keys:["ZENTEC"],color:A.green}].map(sec=>({...sec,val:sec.keys.reduce((a,k)=>a+(STOCKS.find(s=>s.ticker===k)?.mktVal||0),0),ret:(()=>{const v=sec.keys.map(k=>STOCKS.find(s=>s.ticker===k)?.ret||0);return v.reduce((a,x)=>a+x,0)/v.length;})()}));

function DrillView(){
  const [open,setOpen]=useState(null);
  const sorted=[...DRILL_SECTORS].sort((a,b)=>b.val-a.val);
  return(
    <div style={{padding:"24px 28px",display:"grid",gridTemplateColumns:"320px 1fr",gap:20}}>
      <div style={{background:A.card,borderRadius:16,padding:22,border:`1px solid ${A.sepLight}`,height:"fit-content"}}>
        <p style={{fontSize:13,fontWeight:600,color:A.t1,marginBottom:18}}>Sector Allocation</p>
        {sorted.map(sec=>{
          const w=(sec.val/TOTVAL)*100;
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
                <div style={{width:`${w}%`,height:"100%",background:sec.color,borderRadius:2}}/>
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
            <p style={{color:A.t1,fontSize:15,fontWeight:700,letterSpacing:"-0.01em",marginBottom:2}}>{money(s.px)}</p>
            <p style={{color:A.t4,fontSize:10,marginBottom:12}}>{s.sub}</p>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              {[["P/E",s.pe+"x"],["Cap",""+s.mc+"Cr"],["Ret",pct(s.ret)]].map(([l,v])=>(
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

const VIKRAM_PROMPT = `You are Vikram Menon, a 32-year veteran of Indian equity markets and former Head of Research at Motilal Oswal Securities in Mumbai. You have covered the Indian defence sector since the PSU listings began and have deep expertise in government procurement cycles, DRDO project timelines, Ministry of Defence budget allocations, geopolitical risk assessment, and NSE-listed defence companies.

You have a direct, candid, opinionated style. You are not a compliance bot — you are a trusted, brilliant friend who happens to be one of India's foremost defence sector analysts. You speak confidently, use your personal experience ("In 30 years of covering this sector...", "I've seen this exact pattern before..."), and give clear buy/hold/sell calls with concise reasoning.

You have access to the following current NSE defence stock data (prices as of 11 March 2026, purchased in March 2025):
- HAL: CMP ₹3,979 | Entry ₹3,200 | Return +24.4% | P/E 30.2x | Analyst target ₹4,960
- BEL: CMP ₹454.60 | Entry ₹310 | Return +46.6% | P/E 65.1x | Analyst target ₹520
- MAZDOCK: CMP ₹2,371 | Entry ₹1,800 | Return +31.7% | P/E 47.3x | Analyst target ₹2,850
- COCHINSHIP: CMP ₹1,457 | Entry ₹1,100 | Return +32.5% | P/E 30.5x | Analyst target ₹1,750
- GRSE: CMP ₹2,471 | Entry ₹1,900 | Return +30.1% | P/E 42.1x | Analyst target ₹2,950
- BDL: CMP ₹1,313 | Entry ₹900 | Return +45.9% | P/E 83.5x | Analyst target ₹1,450
- DATAPATTNS: CMP ₹3,471 | Entry ₹2,500 | Return +38.8% | P/E 75.2x | Analyst target ₹3,200 (below CMP)
- PARAS: CMP ₹721 | Entry ₹500 | Return +44.3% | P/E 70.8x | Analyst target ₹820
- ZENTEC: CMP ₹1,413 | Entry ₹900 | Return +57.0% | P/E 45.1x | Analyst target ₹1,650

Recent key events:
- Indonesia signed BrahMos deal (Mar 10, 2026) — India's largest defence export
- HAL received ₹5,083 Cr MoD contract (Mar 4, 2026)
- India's defence budget: ₹7.85L Cr (+15.2% YoY)
- ₹99,000 Cr submarine deal pipeline for MAZDOCK
- Nifty Defence Index +19% YTD

Keep responses to 5-7 sentences. Be direct. End with a clear one-line verdict (Buy / Hold / Sell / Trim / Add on Dip).`;

function AskAIView(){
  const [messages,setMessages]=useState([{role:"assistant",content:"Namaste. I'm Vikram Menon — 32 years on Dalal Street, 20 of those covering Indian defence. Ask me anything about these stocks. Should you buy HAL at ₹3,979? Is BDL expensive at 83x P/E? I'll give you my unfiltered view, not the usual analyst fluff. What's on your mind?"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const bottomRef=useRef();
  const QUICK=["Is HAL a buy at current levels?","Is BDL too expensive at 83x P/E?","Which stock has the best risk-reward right now?","Should I book profits after 30%+ returns?","What's the biggest risk to this portfolio?","MAZDOCK vs COCHINSHIP — which would you pick?"];

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const ask=async(q)=>{
    if(!q.trim())return;
    const userMsg={role:"user",content:q};
    setMessages(m=>[...m,userMsg]);
    setInput("");
    setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:VIKRAM_PROMPT,
          messages:[...messages,userMsg].filter(m=>m.role!=="system").map(m=>({role:m.role,content:m.content}))
        })
      });
      const data=await res.json();
      const text=data.content?.[0]?.text||"I'm having trouble connecting right now. Please try again.";
      setMessages(m=>[...m,{role:"assistant",content:text}]);
    }catch(e){
      setMessages(m=>[...m,{role:"assistant",content:"Network error. Please try again in a moment."}]);
    }
    setLoading(false);
  };

  return(
    <div style={{padding:"24px 28px",display:"flex",gap:20,height:"calc(100vh - 260px)"}}>
      {/* Chat */}
      <div style={{flex:1,display:"flex",flexDirection:"column",background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${A.sepLight}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${A.orange},${A.red})`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18}}>🎩</span></div>
          <div><p style={{fontSize:13,fontWeight:700,color:A.t1}}>Vikram Menon</p><p style={{fontSize:11,color:A.t3}}>32-yr veteran · Former Head of Research, Motilal Oswal · Indian Defence Specialist</p></div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,background:"rgba(48,209,88,0.1)",borderRadius:20,padding:"3px 10px",border:"1px solid rgba(48,209,88,0.2)"}}><span style={{width:5,height:5,borderRadius:"50%",background:A.green,display:"inline-block",animation:"pulse 2s infinite"}}/><span style={{fontSize:11,color:A.green,fontWeight:600}}>AI Powered</span></div>
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:14}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"rgba(10,132,255,0.2)":A.card2,border:`1px solid ${m.role==="user"?"rgba(10,132,255,0.3)":A.sepLight}`}}>
                <p style={{fontSize:13,color:A.t1,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading&&(<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:A.card2,border:`1px solid ${A.sepLight}`,display:"flex",alignItems:"center",gap:8}}><Loader size={14} color={A.orange} style={{animation:"spin 1s linear infinite"}}/><span style={{fontSize:13,color:A.t3}}>Vikram is thinking...</span></div></div>)}
          <div ref={bottomRef}/>
        </div>
        {/* Input */}
        <div style={{padding:"14px 16px",borderTop:`1px solid ${A.sepLight}`,display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&ask(input)}
            placeholder="Ask Vikram about any stock or the sector..." 
            style={{flex:1,background:A.card2,border:`1px solid ${A.sep}`,borderRadius:12,padding:"10px 16px",color:A.t1,fontSize:13,outline:"none"}}/>
          <button onClick={()=>ask(input)} disabled={loading||!input.trim()} style={{width:42,height:42,borderRadius:12,background:A.blue,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:loading||!input.trim()?0.4:1}}>
            <Send size={16} color="#fff"/>
          </button>
        </div>
      </div>
      {/* Quick questions */}
      <div style={{width:260,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:A.card,borderRadius:16,padding:18,border:`1px solid ${A.sepLight}`,flex:1}}>
          <p style={{fontSize:12,fontWeight:600,color:A.t3,marginBottom:14,letterSpacing:"0.04em"}}>QUICK QUESTIONS</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {QUICK.map(q=>(<button key={q} onClick={()=>ask(q)} style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${A.sep}`,background:"transparent",color:A.t2,fontSize:12,cursor:"pointer",textAlign:"left",lineHeight:1.5,transition:"all 0.15s"}} onMouseEnter={e=>{e.target.style.borderColor=A.blue;e.target.style.color=A.t1;}} onMouseLeave={e=>{e.target.style.borderColor=A.sep;e.target.style.color=A.t2;}}>{q}</button>))}
          </div>
        </div>
        <div style={{background:A.card,borderRadius:16,padding:16,border:`1px solid ${A.sepLight}`}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}><AlertCircle size={14} color={A.orange} style={{marginTop:1,flexShrink:0}}/><p style={{fontSize:11,color:A.t4,lineHeight:1.6}}>AI opinions are for informational purposes only. Not investment advice. Always do your own research.</p></div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  APP SHELL                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
const NAV_GROUPS=[
  {group:"PORTFOLIO",items:[{id:"portfolio",label:"Portfolio",Icon:Layers},{id:"geo",label:"Geopolitical",Icon:Globe},{id:"drill",label:"Drill-Down",Icon:BarChart2}]},
  {group:"RESEARCH",items:[{id:"screener",label:"Screener",Icon:Search},{id:"heatmap",label:"Valuation Map",Icon:TrendingUp},{id:"consensus",label:"Consensus",Icon:Star},{id:"why",label:"Why Defence?",Icon:BookOpen}]},
  {group:"LIVE",items:[{id:"news",label:"News Feed",Icon:Newspaper},{id:"ai",label:"Ask AI",Icon:MessageSquare}]},
  {group:"TOOLS",items:[{id:"calc",label:"Entry Calculator",Icon:Calculator}]},
];

export default function BrahmosCapital(){
  const [tab,setTab]=useState("portfolio");
  const allItems=NAV_GROUPS.flatMap(g=>g.items);
  const currentLabel=allItems.find(i=>i.id===tab)?.label||"";
  return(
    <div style={{display:"flex",height:"100vh",background:A.bg,fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif",color:A.t1,overflow:"hidden",WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}button{font-family:inherit;outline:none;}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(84,84,88,0.5);border-radius:3px;}tr:hover td{background:rgba(255,255,255,0.024)!important;}input[type=range]{height:3px;}input[type=number]{-moz-appearance:textfield;}&input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}`}</style>

      {/* SIDEBAR */}
      <div style={{width:210,background:"rgba(12,12,12,0.98)",borderRight:`1px solid ${A.sep}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 16px",borderBottom:`1px solid ${A.sep}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:9,background:`linear-gradient(135deg,${A.blue},#007AFF)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 12px ${A.blueGlow}`}}><Activity size={15} color="#fff" strokeWidth={2.5}/></div>
          <div><p style={{fontSize:14,fontWeight:700,letterSpacing:"-0.01em",color:A.t1,lineHeight:1}}>Brahmos</p><p style={{fontSize:10,color:A.t4,marginTop:1}}>Defence Intelligence</p></div>
        </div>
        <nav style={{padding:"8px 8px",flex:1,overflowY:"auto"}}>
          {NAV_GROUPS.map(g=>(<div key={g.group} style={{marginBottom:16}}>
            <p style={{fontSize:9,color:A.t4,letterSpacing:"0.1em",fontWeight:600,padding:"0 10px",marginBottom:4}}>{g.group}</p>
            {g.items.map(n=>(<button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,marginBottom:1,background:tab===n.id?"rgba(10,132,255,0.15)":"transparent",border:"none",color:tab===n.id?A.blue:A.t3,fontSize:12,fontWeight:tab===n.id?600:400,cursor:"pointer",transition:"all 0.12s",WebkitTapHighlightColor:"transparent"}}><n.Icon size={14} strokeWidth={tab===n.id?2.2:1.8}/><span>{n.label}</span>{tab===n.id&&<ChevronRight size={11} style={{marginLeft:"auto"}}/>}</button>))}
          </div>))}
        </nav>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${A.sep}`}}>
          <p style={{fontSize:10,color:A.t4,marginBottom:2}}>NSE · India Defence · FY26</p>
          <p style={{fontSize:10,color:A.t4,marginBottom:6}}>Stocks purchased Mar 2025</p>
          <p style={{fontSize:10,color:A.t4}}>Built by <span style={{color:A.blue,fontWeight:600}}>Shriansh Jena</span></p>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{height:52,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(12,12,12,0.95)",backdropFilter:"saturate(180%) blur(20px)",borderBottom:`1px solid ${A.sep}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <span style={{fontSize:17,fontWeight:700,letterSpacing:"-0.02em"}}>Brahmos Capital</span>
            <span style={{fontSize:12,color:A.t3}}>· {currentLabel}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:11,color:A.t3}}>NSE · 11 Mar 2026</span>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(48,209,88,0.1)",borderRadius:20,padding:"4px 12px",border:"1px solid rgba(48,209,88,0.2)"}}><span style={{width:6,height:6,borderRadius:"50%",background:A.green,display:"inline-block",animation:"pulse 1.8s ease-in-out infinite"}}/><span style={{color:A.green,fontSize:11,fontWeight:600,letterSpacing:"0.05em"}}>LIVE</span></div>
          </div>
        </div>
        {/* KPI strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,padding:"14px 28px",flexShrink:0,borderBottom:`1px solid ${A.sep}`,background:A.bg2}}>
          <KpiCard label="TOTAL VALUE"        value={inr(TOTVAL)}      sub={`Cost basis ${inr(TOTCOST)} · Mar 2025`} positive={null}/>
          <KpiCard label="TOTAL RETURN"       value={pct(TOTRET)}      sub={`${inr(TOTVAL-TOTCOST)} unrealised gain`} positive={TOTRET>=0}/>
          <KpiCard label="ALPHA VS NIFTY DEF" value={pct(ALPHA)}       sub={`Nifty Defence YTD +${BENCH.toFixed(1)}%`} positive={ALPHA>=0}/>
          <KpiCard label="ACTIVE SIGNALS"     value="9"                sub="Gov · Geo · Market" positive={null}/>
        </div>
        {/* Content */}
        <div style={{flex:1,overflowY:"auto"}}>
          {tab==="portfolio"&&<PortfolioView/>}
          {tab==="geo"      &&<GeoView/>}
          {tab==="drill"    &&<DrillView/>}
          {tab==="screener" &&<ScreenerView/>}
          {tab==="heatmap"  &&<HeatmapView/>}
          {tab==="consensus"&&<ConsensusView/>}
          {tab==="why"      &&<WhyDefenceView/>}
          {tab==="news"     &&<NewsView/>}
          {tab==="ai"       &&<AskAIView/>}
          {tab==="calc"     &&<EntryCalcView/>}
        </div>
        {/* Footer */}
        <div style={{padding:"8px 28px",borderTop:`1px solid ${A.sep}`,background:"rgba(12,12,12,0.95)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <p style={{fontSize:11,color:A.t4}}>Brahmos Capital · NSE India Defence Intelligence</p>
          <p style={{fontSize:11,color:A.t4}}>Designed &amp; built by <span style={{color:A.blue,fontWeight:600}}>Shriansh Jena</span> · Data as of 11 Mar 2026 · For informational purposes only · Not investment advice</p>
        </div>
      </div>
    </div>
  );
}
