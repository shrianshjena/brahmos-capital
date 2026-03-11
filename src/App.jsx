import { useState } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Layers, Zap, Globe, BarChart2,
  ChevronRight, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight,
  Activity
} from "lucide-react";

const A = {
  bg:"#000000", bg2:"#0A0A0A",
  card:"#1C1C1E", card2:"#2C2C2E", card3:"#3A3A3C",
  sep:"rgba(84,84,88,0.55)", sepLight:"rgba(84,84,88,0.28)",
  blue:"#0A84FF",   blueGlow:"rgba(10,132,255,0.18)",
  green:"#30D158",  greenGlow:"rgba(48,209,88,0.15)",
  red:"#FF453A",    redGlow:"rgba(255,69,58,0.15)",
  orange:"#FF9F0A", orangeGlow:"rgba(255,159,10,0.15)",
  yellow:"#FFD60A", purple:"#BF5AF2", teal:"#32ADE6",
  t1:"#FFFFFF", t2:"rgba(235,235,245,0.60)",
  t3:"rgba(235,235,245,0.30)", t4:"rgba(235,235,245,0.18)",
};

function rng(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};}
function mkSpark(seed,trending){
  const r=rng(seed);const pts=[100];
  for(let i=1;i<24;i++)pts.push(Math.max(68,pts[i-1]+(trending?0.5:-0.2)+(r()-0.46)*4));
  return pts.map(v=>({v}));
}

const BASE=[
  {ticker:"HAL",        name:"Hindustan Aeronautics",    sub:"Aerospace · MRO",        shares:50,  buy:3200, px:3979.40,day:-1.10,pe:30.2,mc:"₹2.97T",seed:1001},
  {ticker:"BEL",        name:"Bharat Electronics",       sub:"Electronics · C4ISR",    shares:500, buy:310,  px:454.60, day:-2.96,pe:65.1,mc:"₹2.92T",seed:1002},
  {ticker:"MAZDOCK",    name:"Mazagon Dock Shipbuilders", sub:"Naval · Submarines",     shares:80,  buy:1800, px:2371.00,day:-4.08,pe:47.3,mc:"₹1.00T",seed:1003},
  {ticker:"COCHINSHIP", name:"Cochin Shipyard",           sub:"Naval · Shipbuilding",   shares:120, buy:1100, px:1457.10,day:-2.23,pe:30.5,mc:"₹0.44T",seed:1004},
  {ticker:"GRSE",       name:"Garden Reach Shipbuilders", sub:"Naval · Patrol Vessels", shares:60,  buy:1900, px:2470.90,day:-2.07,pe:42.1,mc:"₹0.29T",seed:1005},
  {ticker:"BDL",        name:"Bharat Dynamics",           sub:"Missiles · Munitions",   shares:150, buy:900,  px:1313.60,day:-3.18,pe:83.5,mc:"₹0.55T",seed:1006},
  {ticker:"DATAPATTNS", name:"Data Patterns India",       sub:"Defence Electronics",    shares:30,  buy:2500, px:3470.90,day:-0.58,pe:75.2,mc:"₹0.10T",seed:1007},
  {ticker:"PARAS",      name:"Paras Defence & Space",     sub:"Optics · Space",         shares:200, buy:500,  px:721.45, day:-3.72,pe:70.8,mc:"₹0.06T",seed:1008},
  {ticker:"ZENTEC",     name:"Zen Technologies",           sub:"Training · Anti-Drone",  shares:100, buy:900,  px:1413.00,day:-0.97,pe:45.1,mc:"₹0.07T",seed:1009},
];

const STOCKS=BASE.map(s=>({...s,mktVal:s.shares*s.px,cost:s.shares*s.buy,ret:((s.px-s.buy)/s.buy)*100,spark:mkSpark(s.seed,s.px>s.buy)}));
const TOTVAL=STOCKS.reduce((a,s)=>a+s.mktVal,0);
const TOTCOST=STOCKS.reduce((a,s)=>a+s.cost,0);
const TOTRET=((TOTVAL-TOTCOST)/TOTCOST)*100;
const BENCH=19.0; const ALPHA=TOTRET-BENCH;
STOCKS.forEach(s=>{s.wt=(s.mktVal/TOTVAL)*100;});

const PCHART=[
  {d:"Mar '25",p:100,b:100},{d:"Apr",p:96,b:97},{d:"May",p:104,b:100},
  {d:"Jun",p:111,b:103},{d:"Jul",p:117,b:107},{d:"Aug",p:113,b:105},
  {d:"Sep",p:120,b:108},{d:"Oct",p:126,b:111},{d:"Nov",p:132,b:114},
  {d:"Dec",p:135,b:116},{d:"Jan '26",p:129,b:113},{d:"Feb",p:125,b:112},
  {d:"Mar",p:138,b:119},
];

const SIGNALS=[
  {id:1,ticker:"HAL",       type:"STRONG BUY",cat:"Gov",   conf:88,date:"4 Mar 2026",
   title:"MoD Awards ₹5,083 Cr Contract",
   detail:"6 ALH Mk-III helicopters for Coast Guard (₹2,901 Cr) + Shtil naval missiles for Indian Navy (₹2,182 Cr). Strengthens HAL's already-robust order book."},
  {id:2,ticker:"BDL",       type:"STRONG BUY",cat:"Geo",   conf:85,date:"10 Mar 2026",
   title:"Indonesia Signs BrahMos Deal",
   detail:"India's largest-ever defence export signed. BDL is key propulsion and warhead supplier — direct, near-term revenue uplift with strong repeat-order potential."},
  {id:3,ticker:"MAZDOCK",   type:"BUY",       cat:"Gov",   conf:74,date:"5 Mar 2026",
   title:"₹99,000 Cr Submarine Pipeline",
   detail:"Indian Navy nearing decision on 6 P-75I advanced submarines with Thyssenkrupp Marine Systems. Transformative, decade-long contract for MDL if finalised."},
  {id:4,ticker:"GRSE",      type:"BUY",       cat:"Market",conf:70,date:"1 Mar 2026",
   title:"Record Q3 Execution Momentum",
   detail:"Record quarterly delivery on next-gen patrol vessels. Order book at ₹22,500 Cr provides 3+ year revenue visibility. Multiple analyst target upgrades."},
  {id:5,ticker:"ZENTEC",    type:"BUY",       cat:"Geo",   conf:72,date:"8 Mar 2026",
   title:"Anti-Drone Tailwind: Op. Sindoor",
   detail:"Emergency C-UAV procurement accelerated following operational learnings. ZENTEC is the primary domestic beneficiary for counter-drone and simulator systems."},
  {id:6,ticker:"COCHINSHIP",type:"BUY",       cat:"Market",conf:68,date:"7 Mar 2026",
   title:"Compelling Valuation vs Peers",
   detail:"Trades at P/E 30.5x vs sector avg 52x. Strong NGOPV order execution and margin recovery makes this one of the most attractively priced names in the sector."},
  {id:7,ticker:"BEL",       type:"HOLD",      cat:"Market",conf:55,date:"6 Mar 2026",
   title:"Stretched Valuation Caps Upside",
   detail:"₹570 Bn FY26 order inflow target looks achievable (QRSAM included), but P/E of 65x limits near-term upside. Ideal entry zone: ₹380–400."},
  {id:8,ticker:"DATAPATTNS",type:"REDUCE",    cat:"Market",conf:63,date:"3 Mar 2026",
   title:"P/E 75x Prices in Perfection",
   detail:"Strong avionics and radar franchise. However HDFC Securities flags execution risk at current multiples. Consider trimming 20–30% of position on any rally."},
  {id:9,ticker:"HAL",       type:"WATCH",     cat:"Gov",   conf:40,date:"23 Feb 2026",
   title:"Tejas Ground Incident — Monitor",
   detail:"Minor technical incident on LCA Tejas during ground testing. HAL confirmed no crash. Maintains world-class safety record. Watch for export pipeline impact."},
];

const GEO=[
  {id:1,impact:"BULLISH",score:9, region:"South-East Asia",color:A.green, date:"10 Mar 2026",
   title:"Indonesia Signs BrahMos Missile Deal",
   detail:"India's largest defence export formalised. Direct catalyst for HAL, BEL, BDL across propulsion, guidance, and electronics sub-systems.",
   tickers:["HAL","BEL","BDL"]},
  {id:2,impact:"BULLISH",score:8, region:"Indian Ocean",   color:A.blue,  date:"6 Mar 2026",
   title:"US Sinks Iranian Warship Near Sri Lanka",
   detail:"First US naval combat action since WWII in India's strategic backyard. Accelerates Indian Navy procurement timelines for P-75I submarines and OPVs.",
   tickers:["MAZDOCK","COCHINSHIP","GRSE"]},
  {id:3,impact:"BULLISH",score:10,region:"India",          color:A.green, date:"1 Feb 2026",
   title:"Record Defence Budget: ₹7.85L Cr (+15.2%)",
   detail:"Capital expenditure surges 20.1% to ₹2.31L Cr — the largest allocation in recent history. Broad-based tailwind for all domestic defence manufacturers.",
   tickers:["HAL","BEL","BDL","MAZDOCK"]},
  {id:4,impact:"LT BULL", score:7, region:"India",         color:A.orange,date:"20 Feb 2026",
   title:"AMCA Program: 3 Consortia Shortlisted",
   detail:"BEL–L&T consortium among final 3 for AMCA avionics package. Long-gestation but potentially transformative for domestic electronics and sensor suppliers.",
   tickers:["BEL","HAL","DATAPATTNS"]},
  {id:5,impact:"BULLISH",score:8, region:"India",          color:A.green, date:"3 Feb 2026",
   title:"India Targets 2.5% of GDP on Defence",
   detail:"Government signals long-term commitment to NATO-equivalent defence spending. Structural tailwind for the entire domestic defence ecosystem over the next decade.",
   tickers:["SECTOR-WIDE"]},
  {id:6,impact:"NEUTRAL", score:3, region:"India",         color:A.card3, date:"23 Feb 2026",
   title:"Tejas Ground Technical Incident",
   detail:"Minor airframe incident during ground testing. No crash — pilot safe. HAL confirmed the event; LCA Tejas maintains one of the world's best combat safety records.",
   tickers:["HAL"]},
];

const SECTORS=[
  {name:"Naval / Shipbuilding", keys:["MAZDOCK","COCHINSHIP","GRSE"],color:A.blue},
  {name:"Electronics / C4ISR",  keys:["BEL"],                        color:A.purple},
  {name:"Aerospace / MRO",      keys:["HAL"],                        color:A.orange},
  {name:"Missiles / Munitions", keys:["BDL"],                        color:A.red},
  {name:"Defence Electronics",  keys:["DATAPATTNS"],                 color:A.teal},
  {name:"Optics / Space",       keys:["PARAS"],                      color:A.yellow},
  {name:"Training / Anti-Drone",keys:["ZENTEC"],                     color:A.green},
].map(sec=>({
  ...sec,
  val:sec.keys.reduce((a,k)=>a+(STOCKS.find(s=>s.ticker===k)?.mktVal||0),0),
  ret:(()=>{const v=sec.keys.map(k=>STOCKS.find(s=>s.ticker===k)?.ret||0);return v.reduce((a,x)=>a+x,0)/v.length;})(),
}));

const pct=v=>`${v>=0?"+":""}${v.toFixed(2)}%`;
const inr=v=>`₹${(v/100000).toFixed(2)}L`;
const money=v=>`₹${v.toLocaleString("en-IN",{maximumFractionDigits:2})}`;

const BADGE_CFG={
  "STRONG BUY":{bg:"rgba(48,209,88,0.18)", color:A.green, border:"rgba(48,209,88,0.4)"},
  "BUY":       {bg:"rgba(48,209,88,0.10)", color:A.green, border:"rgba(48,209,88,0.25)"},
  "HOLD":      {bg:"rgba(255,159,10,0.15)",color:A.orange,border:"rgba(255,159,10,0.3)"},
  "REDUCE":    {bg:"rgba(255,69,58,0.15)", color:A.red,   border:"rgba(255,69,58,0.3)"},
  "WATCH":     {bg:"rgba(10,132,255,0.15)",color:A.blue,  border:"rgba(10,132,255,0.3)"},
};

function ChartTip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:A.card2,border:`1px solid ${A.sep}`,borderRadius:10,padding:"10px 14px"}}>
      <p style={{color:A.t3,fontSize:11,marginBottom:6}}>{label}</p>
      {payload.map(p=>(
        <p key={p.dataKey} style={{color:p.dataKey==="p"?A.blue:A.green,fontSize:13,fontWeight:500}}>
          {p.dataKey==="p"?"Portfolio":"Nifty Defence"}: {p.value}
        </p>
      ))}
    </div>
  );
}

function Spark({data,color}){
  return(
    <div style={{width:72,height:28}}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{top:2,right:2,left:2,bottom:2}}>
          <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Badge({type}){
  const c=BADGE_CFG[type]||BADGE_CFG["HOLD"];
  return(
    <span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,
      borderRadius:6,fontSize:10,fontWeight:700,padding:"3px 9px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>
      {type}
    </span>
  );
}

function KpiCard({label,value,sub,positive}){
  return(
    <div style={{background:A.card,borderRadius:16,padding:"20px 22px",border:`1px solid ${A.sepLight}`,flex:1}}>
      <p style={{fontSize:11,color:A.t3,marginBottom:8,letterSpacing:"0.04em",fontWeight:500}}>{label}</p>
      <p style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",lineHeight:1,marginBottom:6,
        color:positive===false?A.red:positive===true?A.green:A.t1}}>{value}</p>
      <p style={{fontSize:12,color:A.t3}}>{sub}</p>
    </div>
  );
}

function PortfolioView(){
  return(
    <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:A.card,borderRadius:16,padding:"22px 24px",border:`1px solid ${A.sepLight}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <p style={{fontSize:13,fontWeight:600,color:A.t1,marginBottom:3}}>Portfolio vs Nifty India Defence</p>
            <p style={{fontSize:12,color:A.t3}}>Normalised to 100 · Mar 2025 – Mar 2026</p>
          </div>
          <div style={{display:"flex",gap:20}}>
            {[{l:"Portfolio",c:A.blue},{l:"Nifty Defence",c:A.green}].map(({l,c})=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{width:20,height:2,background:c,borderRadius:1,display:"inline-block"}}/>
                <span style={{fontSize:12,color:A.t2}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={PCHART} margin={{top:5,right:4,left:-18,bottom:0}}>
            <defs>
              <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={A.blue}  stopOpacity={0.3}/>
                <stop offset="95%" stopColor={A.blue}  stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={A.green} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={A.green} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="d" tick={{fill:A.t4,fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis domain={[80,150]} tick={{fill:A.t4,fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip/>}/>
            <Area type="monotone" dataKey="b" stroke={A.green} strokeWidth={1.5} fill="url(#gB)" dot={false}/>
            <Area type="monotone" dataKey="p" stroke={A.blue}  strokeWidth={2}   fill="url(#gP)" dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:A.card,borderRadius:16,border:`1px solid ${A.sepLight}`,overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:`1px solid ${A.sepLight}`}}>
          <p style={{fontSize:13,fontWeight:600,color:A.t1}}>Positions</p>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:920}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${A.sepLight}`}}>
                {["Ticker","Company","Sector","Shares","Avg Cost","Price","Mkt Value","Weight","Return","Today","Trend"].map(h=>(
                  <th key={h} style={{padding:"10px 16px",
                    textAlign:["Ticker","Company","Sector"].includes(h)?"left":"right",
                    fontSize:11,color:A.t3,fontWeight:500,whiteSpace:"nowrap",letterSpacing:"0.02em"}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STOCKS.map((s,i)=>(
                <tr key={s.ticker} style={{borderBottom:`1px solid ${A.sepLight}`,
                  background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}>
                  <td style={{padding:"11px 16px"}}><span style={{color:A.blue,fontSize:13,fontWeight:600}}>{s.ticker}</span></td>
                  <td style={{padding:"11px 16px",color:A.t1,fontSize:13,whiteSpace:"nowrap"}}>{s.name}</td>
                  <td style={{padding:"11px 16px",color:A.t3,fontSize:12}}>{s.sub}</td>
                  <td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{s.shares}</td>
                  <td style={{padding:"11px 16px",color:A.t3,fontSize:12,textAlign:"right"}}>{money(s.buy)}</td>
                  <td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{money(s.px)}</td>
                  <td style={{padding:"11px 16px",color:A.t1,fontSize:13,textAlign:"right"}}>{inr(s.mktVal)}</td>
                  <td style={{padding:"11px 16px",color:A.t3,fontSize:12,textAlign:"right"}}>{s.wt.toFixed(1)}%</td>
                  <td style={{padding:"11px 16px",textAlign:"right"}}><span style={{color:s.ret>=0?A.green:A.red,fontSize:12,fontWeight:500}}>{pct(s.ret)}</span></td>
                  <td style={{padding:"11px 16px",textAlign:"right"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}>
                      {s.day>=0?<ArrowUpRight size={12} color={A.green}/>:<ArrowDownRight size={12} color={A.red}/>}
                      <span style={{color:s.day>=0?A.green:A.red,fontSize:12}}>{pct(s.day)}</span>
                    </div>
                  </td>
                  <td style={{padding:"8px 16px"}}><Spark data={s.spark} color={s.ret>=0?A.blue:A.red}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SignalsView(){
  const [filter,setFilter]=useState("All");
  const cats=["All","Gov","Geo","Market"];
  const items=SIGNALS.filter(s=>filter==="All"||s.cat===filter);
  const catColor={Gov:A.blue,Geo:A.orange,Market:A.t3};
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"flex",gap:8,marginBottom:22,alignItems:"center"}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{
            padding:"6px 18px",borderRadius:20,
            border:`1px solid ${filter===c?A.blue:A.sep}`,
            background:filter===c?"rgba(10,132,255,0.15)":"transparent",
            color:filter===c?A.blue:A.t3,
            fontSize:13,cursor:"pointer",fontWeight:filter===c?600:400,transition:"all 0.15s"}}>
            {c}
          </button>
        ))}
        <span style={{marginLeft:"auto",fontSize:12,color:A.t4}}>{items.length} active signal{items.length!==1?"s":""}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {items.map(sig=>(
          <div key={sig.id} style={{background:A.card,border:`1px solid ${A.sepLight}`,
            borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:18}}>
            <div style={{minWidth:120,paddingTop:1}}>
              <p style={{color:A.blue,fontSize:14,fontWeight:600,marginBottom:8}}>{sig.ticker}</p>
              <Badge type={sig.type}/>
            </div>
            <div style={{flex:1}}>
              <p style={{color:A.t1,fontSize:13,fontWeight:600,marginBottom:6,lineHeight:1.4}}>{sig.title}</p>
              <p style={{color:A.t3,fontSize:12,lineHeight:1.6}}>{sig.detail}</p>
            </div>
            <div style={{minWidth:140,display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
              <span style={{
                background:sig.cat==="Gov"?"rgba(10,132,255,0.15)":sig.cat==="Geo"?"rgba(255,159,10,0.15)":"rgba(255,255,255,0.06)",
                color:catColor[sig.cat]||A.t3,
                borderRadius:6,fontSize:10,fontWeight:600,padding:"3px 9px",letterSpacing:"0.05em"}}>
                {sig.cat}
              </span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:72,height:3,background:A.sep,borderRadius:2}}>
                  <div style={{width:`${sig.conf}%`,height:"100%",borderRadius:2,
                    background:sig.conf>=75?A.green:sig.conf>=55?A.blue:A.orange}}/>
                </div>
                <span style={{fontSize:11,color:A.t3}}>{sig.conf}%</span>
              </div>
              <p style={{fontSize:11,color:A.t4}}>{sig.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeoView(){
  return(
    <div style={{padding:"24px 28px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {GEO.map(e=>(
          <div key={e.id} style={{background:A.card,border:`1px solid ${A.sepLight}`,
            borderRadius:16,padding:22,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg,${e.color},transparent)`,borderRadius:"16px 16px 0 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{flex:1,paddingRight:16}}>
                <p style={{color:A.t1,fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8}}>{e.title}</p>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:e.color,display:"inline-block"}}/>
                  <span style={{fontSize:11,color:A.t3}}>{e.impact}</span>
                  <span style={{fontSize:11,color:A.t4}}>· {e.region}</span>
                </div>
              </div>
              <div style={{textAlign:"center",background:A.card2,borderRadius:10,padding:"8px 12px",minWidth:48}}>
                <p style={{fontSize:24,fontWeight:700,color:e.color,lineHeight:1,letterSpacing:"-0.02em"}}>{e.score}</p>
                <p style={{fontSize:9,color:A.t4,marginTop:2,letterSpacing:"0.05em"}}>IMPACT</p>
              </div>
            </div>
            <p style={{color:A.t2,fontSize:12,lineHeight:1.65,marginBottom:14}}>{e.detail}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {e.tickers.map(t=>(
                <span key={t} style={{background:"rgba(10,132,255,0.12)",color:A.blue,
                  borderRadius:6,fontSize:10,fontWeight:600,padding:"2px 8px"}}>{t}</span>
              ))}
            </div>
            <p style={{fontSize:11,color:A.t4,textAlign:"right"}}>{e.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrillView(){
  const [open,setOpen]=useState(null);
  const sorted=[...SECTORS].sort((a,b)=>b.val-a.val);
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
                <div style={{width:`${w}%`,height:"100%",background:sec.color,borderRadius:2,transition:"width 0.4s ease"}}/>
              </div>
              {open===sec.name&&(
                <div style={{marginTop:10,padding:"10px 12px",background:A.bg2,borderRadius:10,border:`1px solid ${A.sepLight}`}}>
                  {sec.keys.map(k=>{
                    const s=STOCKS.find(x=>x.ticker===k);
                    if(!s)return null;
                    return(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:6,gap:10,alignItems:"center"}}>
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
              {[["P/E",`${s.pe}x`],["Cap",s.mc],["Return",pct(s.ret)]].map(([l,v])=>(
                <div key={l}>
                  <p style={{color:A.t4,fontSize:9,marginBottom:2,letterSpacing:"0.04em"}}>{l}</p>
                  <p style={{color:l==="Return"?(s.ret>=0?A.green:A.red):A.t2,fontSize:11,fontWeight:500}}>{v}</p>
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

const NAV=[
  {id:"portfolio",label:"Portfolio",   Icon:Layers},
  {id:"signals",  label:"Signals",     Icon:Zap},
  {id:"drill",    label:"Drill-Down",  Icon:BarChart2},
  {id:"geo",      label:"Geopolitical",Icon:Globe},
];

export default function BrahmosCapital(){
  const [tab,setTab]=useState("portfolio");
  return(
    <div style={{display:"flex",height:"100vh",background:A.bg,
      fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif",
      color:A.t1,overflow:"hidden",WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:inherit;outline:none;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(84,84,88,0.5);border-radius:3px;}
        tr:hover td{background:rgba(255,255,255,0.024)!important;}
      `}</style>

      {/* SIDEBAR */}
      <div style={{width:200,background:"rgba(18,18,18,0.96)",borderRight:`1px solid ${A.sep}`,
        display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"20px 18px",borderBottom:`1px solid ${A.sep}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,
            background:`linear-gradient(135deg,${A.blue},#007AFF)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 2px 10px ${A.blueGlow}`}}>
            <Activity size={14} color="#fff" strokeWidth={2.5}/>
          </div>
          <span style={{fontSize:15,fontWeight:700,letterSpacing:"-0.01em",color:A.t1}}>Brahmos</span>
        </div>
        <nav style={{padding:"10px 8px",flex:1}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,
              padding:"9px 12px",borderRadius:10,marginBottom:2,
              background:tab===n.id?"rgba(10,132,255,0.15)":"transparent",
              border:"none",color:tab===n.id?A.blue:A.t3,
              fontSize:13,fontWeight:tab===n.id?600:400,cursor:"pointer",transition:"all 0.15s",
              WebkitTapHighlightColor:"transparent"}}>
              <n.Icon size={15} strokeWidth={tab===n.id?2.2:1.8}/>
              <span>{n.label}</span>
              {tab===n.id&&<ChevronRight size={12} style={{marginLeft:"auto"}}/>}
            </button>
          ))}
        </nav>
        <div style={{padding:"14px 18px",borderTop:`1px solid ${A.sep}`}}>
          <p style={{fontSize:11,color:A.t4,marginBottom:2}}>NSE · India Defence</p>
          <p style={{fontSize:11,color:A.t4,marginBottom:8}}>FY 2025–26</p>
          <p style={{fontSize:10,color:A.t4,lineHeight:1.5}}>
            Built by <span style={{color:A.blue,fontWeight:600}}>Shriansh Jena</span>
          </p>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{height:54,padding:"0 28px",display:"flex",alignItems:"center",
          justifyContent:"space-between",background:"rgba(18,18,18,0.88)",
          backdropFilter:"saturate(180%) blur(20px)",borderBottom:`1px solid ${A.sep}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <span style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em"}}>Brahmos Capital</span>
            <span style={{fontSize:13,color:A.t3,fontWeight:400}}>Defence Investment Intelligence</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:12,color:A.t3}}>Updated 11 Mar 2026</span>
            <div style={{display:"flex",alignItems:"center",gap:6,
              background:"rgba(48,209,88,0.1)",borderRadius:20,
              padding:"4px 12px",border:"1px solid rgba(48,209,88,0.2)"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:A.green,
                display:"inline-block",animation:"pulse 1.8s ease-in-out infinite"}}/>
              <span style={{color:A.green,fontSize:11,fontWeight:600,letterSpacing:"0.05em"}}>LIVE</span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",
          gap:16,padding:"16px 28px",flexShrink:0,borderBottom:`1px solid ${A.sep}`,background:A.bg2}}>
          <KpiCard label="TOTAL VALUE"        value={inr(TOTVAL)}      sub={`Cost basis ${inr(TOTCOST)}`}                   positive={null}/>
          <KpiCard label="TOTAL RETURN"       value={pct(TOTRET)}      sub={`${inr(TOTVAL-TOTCOST)} unrealised gain`}        positive={TOTRET>=0}/>
          <KpiCard label="ALPHA VS NIFTY DEF" value={pct(ALPHA)}       sub={`Nifty Defence YTD +${BENCH.toFixed(1)}%`}      positive={ALPHA>=0}/>
          <KpiCard label="ACTIVE SIGNALS"     value={String(SIGNALS.length)} sub="Gov · Geo · Market"                       positive={null}/>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto"}}>
          {tab==="portfolio"&&<PortfolioView/>}
          {tab==="signals"  &&<SignalsView/>}
          {tab==="drill"    &&<DrillView/>}
          {tab==="geo"      &&<GeoView/>}
        </div>

        {/* Footer */}
        <div style={{padding:"10px 28px",borderTop:`1px solid ${A.sep}`,
          background:"rgba(18,18,18,0.88)",backdropFilter:"blur(20px)",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <p style={{fontSize:11,color:A.t4}}>Brahmos Capital · NSE India Defence Intelligence</p>
          <p style={{fontSize:11,color:A.t4}}>
            Designed &amp; built by <span style={{color:A.blue,fontWeight:600}}>Shriansh Jena</span>
            {" "}· Data as of 11 Mar 2026 · For informational purposes only
          </p>
        </div>
      </div>
    </div>
  );
}
