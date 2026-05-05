import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

// ── CONFIG ──────────────────────────────────────────────────
const SUPABASE_URL      = "https://qzgbpeyyeqfjppxbinho.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Z2JwZXl5ZXFmanBweGJpbmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDA2NzEsImV4cCI6MjA5MzQ3NjY3MX0.MJu9-k-6ihCbsrzT7LKOKW9iouxPzeKmvAzTdywo-4s";
const supabase  = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const IS_MOCK   = SUPABASE_URL.includes("VOTRE_URL");

// ── TYPES ────────────────────────────────────────────────────
interface LBEntry  {
  id: string; pseudo: string; clicks: number;
  spent?: number; combos?: number;
  chaleur?: number; aides?: number; labo?: number; catalyseur?: number;
  token?: string; code?: string;
}
interface Bubble   { id: number; x: number; size: number; speed: number; opacity: number; wobble: number }
interface FloatEl  { id: number; x: number; y: number; text: string }

// ── MOCK ─────────────────────────────────────────────────────
const MOCK_LB: LBEntry[] = [
  { id:"1",  pseudo:"gary",        clicks:48201 },
  { id:"2",  pseudo:"hxr_void",    clicks:31087 },
  { id:"3",  pseudo:"anon_003",    clicks:22943 },
  { id:"4",  pseudo:"quelquun",    clicks:17654 },
  { id:"5",  pseudo:"the_last",    clicks: 9821 },
  { id:"6",  pseudo:"nebula_x",    clicks: 7103 },
  { id:"7",  pseudo:"silent_cog",  clicks: 5440 },
  { id:"8",  pseudo:"00111010",    clicks: 3820 },
  { id:"9",  pseudo:"dr_placebo",  clicks: 2917 },
  { id:"10", pseudo:"pharmakos",   clicks: 1803 },
  { id:"11", pseudo:"user_null",   clicks: 1244 },
  { id:"12", pseudo:"effervesc",   clicks:  908 },
  { id:"13", pseudo:"monsieur_b",  clicks:  622 },
  { id:"14", pseudo:"tablet_7",    clicks:  380 },
  { id:"15", pseudo:"newbie",      clicks:  105 },
];

// ── GAMEPLAY CONSTANTS ───────────────────────────────────────
const CLICKS_TO_DISSOLVE = 20;

// ── Eau chaude : 15 niv, base 5800ms → plancher 80ms au niv 15 ─────────────
const CHALEUR_COSTS = [
  0,         // niv 0 (base)
  124,       // niv 1  → 4.30s
  384,       // niv 2  → 3.19s
  1191,      // niv 3  → 2.36s
  3694,      // niv 4  → 1.75s
  11451,     // niv 5  → 1.30s
  35500,     // niv 6  → 961ms
  110050,    // niv 7  → 712ms
  341156,    // niv 8  → 528ms
  1057584,   // niv 9  → 391ms
  3278513,   // niv 10 → 290ms
  10163390,  // niv 11 → 215ms
  31506511,  // niv 12 → 159ms
  97670185,  // niv 13 → 118ms
  302777574, // niv 14 → 87ms
  615439618, // niv 15 → 80ms ✓
];

// ── Catalyseur : 3 niveaux, coûts et gains fixes ─────────────────────────
const CAT_COSTS   = [0, 2000, 200000, 2000000];
const CAT_CACHETS = [1, 3, 4, 5];  // cachets/clic (valeur FIXE selon palier)

// ── Labo R&D : coûts exacts par niveau ─────────────────────────────────────
const LABO_COSTS = [
  0,           // niv 0 (base)
  900,         // niv 1  → ×1.5
  4050,        // niv 2  → ×2.0
  18225,       // niv 3  → ×2.5
  82012,       // niv 4  → ×3.0
  369056,      // niv 5  → ×3.5
  1660753,     // niv 6  → ×4.0
  7473389,     // niv 7  → ×4.5
  33630250,    // niv 8  → ×5.0
  151336128,   // niv 9  → ×5.5
  405477000,   // niv 10 → ×6.0
];

// ── Aide-soignant : table hardcodée 25 niveaux (80 × 1.52^n) ────────────────
const AIDE_COSTS = [
         122,  // niv  1/25 → 2000ms
         185,  // niv  2/25 → 1000ms
         282,  // niv  3/25 → 666ms
         428,  // niv  4/25 → 500ms
         651,  // niv  5/25 → 400ms
         990,  // niv  6/25 → 333ms
        1505,  // niv  7/25 → 285ms
        2287,  // niv  8/25 → 250ms
        3476,  // niv  9/25 → 222ms
        5284,  // niv 10/25 → 200ms
        8031,  // niv 11/25 → 181ms
       12207,  // niv 12/25 → 166ms
       18555,  // niv 13/25 → 153ms
       28203,  // niv 14/25 → 142ms
       42868,  // niv 15/25 → 133ms
       65160,  // niv 16/25 → 125ms
       99043,  // niv 17/25 → 117ms
      150545,  // niv 18/25 → 111ms
      228828,  // niv 19/25 → 105ms
      347818,  // niv 20/25 → 100ms
      528683,  // niv 21/25 → 95ms
      803598,  // niv 22/25 → 90ms
     1221468,  // niv 23/25 → 86ms
     1856631,  // niv 24/25 → 83ms
     2822079,  // niv 25/25 → 80ms
];

const UPGRADES = [
  {
    id: "chaleur", label: "Eau chaude", icon: "🌡",
    // base 5800ms × 0.7411^niv → 80ms au niv 15 (plancher exact)
    desc: (lvl:number) => {
      const ms = Math.max(80, Math.round(5800 * Math.pow(0.7411, lvl)));
      return ms >= 1000 ? `recharge ${(ms/1000).toFixed(2)}s · niv ${lvl}/15`
                        : `recharge ${ms}ms · niv ${lvl}/15`;
    },
    cost: (lvl:number) => CHALEUR_COSTS[lvl + 1] ?? 9_999_999_999,
    maxLevel: 15,
  },
  {
    id: "aide", label: "Aide-soignant", icon: "🩺",
    // 80 × 1.52^niv → niv 25 = plancher 80ms (MAX)
    desc: (lvl:number) => lvl > 0 ? `×${lvl} actif${lvl>1?"s":""} · auto-clic` : "clique à ta place",
    cost: (lvl:number) => AIDE_COSTS[lvl] ?? 9_999_999_999,
    maxLevel: 25,
  },
  {
    id: "labo", label: "Labo R&D", icon: "🔬",
    desc: (lvl:number) => lvl > 0 ? `+${lvl} cachet${lvl>1?"s":""} par dissolution` : "multiplie les gains",
    cost: (lvl:number) => LABO_COSTS[lvl + 1] ?? 9_999_999_999,
    maxLevel: 10,
    minPhase: 1,
  },
  {
    id: "catalyseur", label: "Catalyseur", icon: "⚡",
    desc: (lvl:number) => lvl < 3
      ? `→ ${CAT_CACHETS[lvl+1]} cachets/clic auto · niv ${lvl+1}/3`
      : `${CAT_CACHETS[3]} cachets/clic auto · niv 3/3`,
    cost: (lvl:number) => CAT_COSTS[lvl+1] ?? 9_999_999_999,
    maxLevel: 3,
    minPhase: 1,
  },
];

const autoClickInterval = (aides:number) =>
  aides === 0 ? 0 : Math.max(80, Math.floor(2000 / aides));

const PHASES = [
  { label:"DISSOLUTION",    sub:"dissoudre. répéter." },
  { label:"AUTOMATISATION", sub:"les machines prennent le relais." },
  { label:"INDUSTRIE",      sub:"plus rien n'est manuel." },
  { label:"SINGULARITÉ",    sub:"le monde ne souffre plus." },
];

// ── UTILS ────────────────────────────────────────────────────
function throttle<T extends (...a: Parameters<T>) => void>(fn: T, ms: number): T {
  let last = 0, timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    const now = Date.now(), left = ms - (now - last);
    if (left <= 0) { if (timer) { clearTimeout(timer); timer=null; } last=now; fn(...args); }
    else if (!timer) { timer=setTimeout(()=>{ last=Date.now(); timer=null; fn(...args); },left); }
  }) as T;
}

const fmtNum  = (n:number) =>
  n>=1_000_000?(n/1_000_000).toFixed(1)+"M":n>=1_000?(n/1_000).toFixed(1)+"K":String(n);
// Entier complet avec séparateur fr-FR (espace insécable → ex: 2 000 000)
const fmtFull = (n:number) => Math.round(n).toLocaleString("fr-FR");

// ── ASPIRINE SVG ─────────────────────────────────────────────
const AspirinPill = React.memo(function AspirinPill({ dissolve, recharging }: { dissolve:number; recharging:boolean }) {
  const d  = dissolve;
  const op = recharging ? 1 : 1 - d * 0.8;
  const sc = recharging ? 1 : 1 - d * 0.45;
  const bl = d * 3;
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{width:"100%",height:"100%",overflow:"visible"}}>
      <defs>
        <radialGradient id="body2" cx="36%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="35%"  stopColor="#f4f1ec" stopOpacity="0.97"/>
          <stop offset="75%"  stopColor="#e2ddd6" stopOpacity="0.93"/>
          <stop offset="100%" stopColor="#c9c4bb" stopOpacity="0.88"/>
        </radialGradient>
        <radialGradient id="bevel2" cx="50%" cy="20%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9"/>
          <stop offset="60%"  stopColor="#d0cbc3" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#a09890" stopOpacity="0.7"/>
        </radialGradient>
        <radialGradient id="iShadow2" cx="50%" cy="82%" r="55%">
          <stop offset="0%"   stopColor="#00000018"/>
          <stop offset="100%" stopColor="#00000000"/>
        </radialGradient>
        <radialGradient id="gloss2" cx="33%" cy="20%" r="38%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <filter id="drop2"><feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#00000028"/></filter>
        <clipPath id="cL2"><rect x="0"   y="0" width="100" height="200"/></clipPath>
        <clipPath id="cR2"><rect x="100" y="0" width="100" height="200"/></clipPath>
      </defs>
      <ellipse cx="100" cy="190" rx={58*sc} ry={6*sc} fill="#00000014"
        style={{transformOrigin:"100px 190px",transform:`scale(1,${sc})`}}/>
      {([["L",-d*14,-d*12,66],["R",d*14,d*12,134]] as const).map(([side,ox,rot,ox0])=>(
        <g key={side} style={{transform:`translate(${ox}px,${d*4}px) rotate(${rot}deg)`,
          transformOrigin:`${ox0}px 100px`,opacity:op,filter:bl>0?`blur(${bl*0.6}px)`:undefined}}>
          <g style={{transform:`scale(${sc})`,transformOrigin:"100px 100px"}}>
            <circle cx="100" cy="100" r="82" stroke="url(#bevel2)" strokeWidth="10"
              fill="none" clipPath={`url(#c${side}2)`} filter="url(#drop2)"/>
            <circle cx="100" cy="100" r="77" fill="url(#body2)" clipPath={`url(#c${side}2)`}/>
            <circle cx="100" cy="100" r="77" fill="url(#iShadow2)" clipPath={`url(#c${side}2)`}/>
          </g>
        </g>
      ))}
      <g style={{transform:`scale(${sc})`,transformOrigin:"100px 100px",opacity:op*(1-d*0.6)}}>
        <line x1="100" y1="24" x2="100" y2="176" stroke="#9a958e" strokeWidth="4.5" strokeLinecap="round"/>
        <line x1="101.8" y1="25" x2="101.8" y2="175" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.55"/>
      </g>
      <g style={{transform:`scale(${sc})`,transformOrigin:"100px 100px",opacity:op}}>
        <ellipse cx="74" cy="62" rx="34" ry="20" fill="url(#gloss2)"/>
      </g>
      {d>0.2 && [{cx:62,cy:45,dx:-d*18,dy:-d*22},{cx:148,cy:38,dx:d*20,dy:-d*18},
        {cx:155,cy:150,dx:d*16,dy:d*20},{cx:50,cy:158,dx:-d*14,dy:d*22}].map((p,i)=>(
        <circle key={i} cx={p.cx+p.dx} cy={p.cy+p.dy} r={3+i}
          fill="url(#body2)" opacity={op*(1-d*0.5)}
          style={{filter:bl>0?`blur(${bl}px)`:undefined}}/>
      ))}
      {recharging&&(
        <motion.circle cx="100" cy="100" r="86" fill="none" stroke="#4682C8" strokeWidth="5" opacity="0.3"
          initial={{scale:0.25,opacity:0}} animate={{scale:1.05,opacity:[0,0.5,0]}}
          transition={{duration:0.7,ease:[0.16,1,0.3,1]}} style={{transformOrigin:"100px 100px"}}/>
      )}
    </svg>
  );
});

// ── WAVE PANEL ────────────────────────────────────────────────
const WavePanel = React.memo(function WavePanel({ ratio, isDissolving, bubbles }: {
  ratio:number; isDissolving:boolean; bubbles: Bubble[];
}) {
  const wl = ratio;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{borderRadius:"inherit"}}>
      <motion.div
        className="absolute left-0 right-0 bottom-0"
        animate={{ height: `${wl * 100}%` }}
        transition={{ type:"spring", stiffness:55, damping:18 }}
        style={{
          willChange:"height",
          background: isDissolving
            ? "linear-gradient(180deg,rgba(100,180,255,0.52) 0%,rgba(60,140,230,0.78) 100%)"
            : "linear-gradient(180deg,rgba(150,200,252,0.36) 0%,rgba(95,160,235,0.62) 100%)",
        }}
      />
      <motion.div
        className="absolute left-0 right-0"
        animate={{ bottom: `${wl * 100}%` }}
        transition={{ type:"spring", stiffness:55, damping:18 }}
        style={{ height:36, marginBottom:-18, willChange:"bottom" }}
      >
        <svg viewBox="0 0 400 36" preserveAspectRatio="none" style={{width:"100%",height:"100%",display:"block"}}>
          <motion.path
            fill={isDissolving ? "rgba(100,180,255,0.72)" : "rgba(150,200,252,0.58)"}
            animate={{d:[
              "M0,18 C60,4 120,32 180,18 C240,4 300,32 360,18 C380,10 392,14 400,18 L400,36 L0,36 Z",
              "M0,10 C60,28 120,4 180,20 C240,30 300,6 360,20 C380,28 392,22 400,10 L400,36 L0,36 Z",
              "M0,18 C60,4 120,32 180,18 C240,4 300,32 360,18 C380,10 392,14 400,18 L400,36 L0,36 Z",
            ]}}
            transition={{duration:3.2,repeat:Infinity,ease:"easeInOut"}}
          />
          <motion.path
            fill={isDissolving ? "rgba(80,160,245,0.42)" : "rgba(120,185,245,0.30)"}
            animate={{d:[
              "M0,24 C70,10 140,36 210,22 C280,8 340,34 400,24 L400,36 L0,36 Z",
              "M0,14 C70,30 140,10 210,26 C280,36 340,14 400,14 L400,36 L0,36 Z",
              "M0,24 C70,10 140,36 210,22 C280,8 340,34 400,24 L400,36 L0,36 Z",
            ]}}
            transition={{duration:2.6,repeat:Infinity,ease:"easeInOut",delay:0.8}}
          />
        </svg>
      </motion.div>
      <motion.div
        className="absolute left-0 right-0"
        animate={{ bottom: `${wl * 100}%` }}
        transition={{ type:"spring", stiffness:55, damping:18 }}
        style={{ height:55, opacity:0.16, willChange:"bottom",
          background:"linear-gradient(180deg,rgba(255,255,255,0.0) 0%,rgba(255,255,255,0.8) 100%)" }}
      />
      <div className="absolute inset-0 overflow-hidden" style={{borderRadius:"inherit"}}>
        <AnimatePresence>
          {bubbles.map(b=>(
            <motion.div key={b.id} className="absolute rounded-full"
              style={{
                left:`${b.x}%`,
                bottom:`${wl * 82}%`,
                width:b.size, height:b.size,
                background:"rgba(255,255,255,0.68)",
                border:"1px solid rgba(255,255,255,0.90)",
                boxShadow:"inset 0 1px 3px rgba(255,255,255,0.95)",
                willChange:"transform,opacity",
              }}
              initial={{y:0,opacity:b.opacity,x:0}}
              animate={{y:"-220%",opacity:0,x:[0,b.wobble,-b.wobble*0.6,b.wobble*0.3]}}
              transition={{
                y:{duration:b.speed*1.4,ease:"easeOut"},
                opacity:{duration:b.speed*1.4,ease:"easeOut",delay:b.speed*0.65},
                x:{duration:b.speed*1.4,ease:"easeInOut"},
              }}
              exit={{opacity:0}}/>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {isDissolving&&Array.from({length:22}).map((_,i)=>{
            const angle=(i/22)*360, dist=58+Math.random()*52;
            return(
              <motion.div key={i} className="absolute rounded-full"
                style={{left:"50%",top:"50%",width:3+Math.random()*8,height:3+Math.random()*8,
                  background:"rgba(255,255,255,0.90)",border:"1px solid rgba(150,200,248,0.85)"}}
                initial={{x:0,y:0,opacity:1,scale:1}}
                animate={{x:Math.cos(angle*Math.PI/180)*dist,y:Math.sin(angle*Math.PI/180)*dist,opacity:0,scale:0}}
                transition={{duration:0.72,ease:"easeOut"}}/>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ── UPGRADE CARD ──────────────────────────────────────────────
function UpCard({
  label, icon, desc, hint, cost, canBuy, maxed, autoEnabled, onBuy, onToggleAuto, dark,
}:{
  label:string; icon:string; desc:string; hint:string; cost:number; canBuy:boolean;
  maxed?:boolean; autoEnabled:boolean; onBuy:()=>void; onToggleAuto:()=>void; dark?:boolean;
}) {
  const dk   = dark ?? false;
  const tx   = dk ? "#E8EEFF"                   : "rgba(8,18,40,0.88)";
  const sub  = dk ? "rgba(180,200,255,0.65)"    : "rgba(0,0,0,0.48)";
  const faint= dk ? "rgba(180,200,255,0.40)"    : "rgba(0,0,0,0.30)";
  const bgC  = dk ? "rgba(255,255,255,0.04)"    : "rgba(0,0,0,0.03)";
  const bgL  = dk ? "rgba(40,90,180,0.35)"     : "rgba(60,130,220,0.09)";
  const bgM  = dk ? "rgba(60,130,220,0.08)"     : "rgba(60,130,220,0.04)";
  const brd  = dk ? "rgba(255,255,255,0.12)"    : "rgba(0,0,0,0.09)";
  const swBg = dk ? "rgba(255,255,255,0.20)"    : "rgba(0,0,0,0.16)";
  const btnBg= dk ? "rgba(255,255,255,0.10)"    : "rgba(0,0,0,0.06)";
  const btnTx= dk ? "rgba(180,200,255,0.55)"    : "rgba(0,0,0,0.26)";
  const lit = !maxed && canBuy;
  return (
    <div style={{
      display:"flex", flexDirection:"column", gap:8,
      padding:"14px 16px", borderRadius:14,
      background: lit ? bgL : maxed ? bgM : bgC,
      border:`1.5px solid ${lit?"rgba(60,130,220,0.45)":maxed?"rgba(60,130,220,0.20)":brd}`,
      opacity:!canBuy&&!maxed?0.48:1,
      transition:"all 0.18s",
      flex:"1 1 0", minWidth:0,
    }}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:"1rem"}}>{icon}</span>
          <span style={{fontSize:"0.84rem",fontWeight:900,color:tx,lineHeight:1.2}}>{label}</span>
        </div>
        {maxed
          ? <span style={{fontSize:"0.60rem",fontWeight:900,color:dk?"rgba(120,170,255,0.80)":"rgba(60,130,220,0.65)",letterSpacing:"0.2em",textTransform:"uppercase",marginTop:2}}>MAX</span>
          : lit && <motion.span animate={{opacity:[0.4,1,0.4]}} transition={{duration:1.2,repeat:Infinity}}
              style={{fontSize:"0.72rem",color:"rgba(60,130,220,0.9)",fontWeight:900,flexShrink:0}}>▲</motion.span>
        }
      </div>
      <div style={{fontSize:"0.70rem",fontWeight:700,color:dk?"rgba(200,220,255,0.85)":"rgba(0,0,0,0.62)",lineHeight:1.4}}>{desc}</div>
      <div style={{
        fontSize:"0.62rem", fontWeight:700, color:dk?"rgba(140,180,255,0.90)":"rgba(40,80,180,0.68)",
        lineHeight:1.4, fontStyle:"italic",
        borderLeft:`2px solid ${dk?"rgba(100,150,255,0.30)":"rgba(40,100,220,0.20)"}`,
        paddingLeft:6, marginTop:-2,
      }}>{hint}</div>
      {!maxed && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:2}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:"0.88rem",fontWeight:900,letterSpacing:"-0.02em",
              color:canBuy?(dk?"rgba(140,185,255,0.95)":"rgba(25,95,215,0.95)"):(dk?"rgba(180,200,255,0.40)":"rgba(0,0,0,0.32)")}}>{fmtNum(cost)}</span>
            <span style={{fontSize:"0.58rem",fontWeight:800,color:dk?"rgba(160,185,255,0.65)":"rgba(0,0,0,0.40)",letterSpacing:"0.1em",textTransform:"uppercase"}}>cachets</span>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",userSelect:"none"}}
            onClick={e=>{e.stopPropagation();onToggleAuto();}}>
            <span style={{fontSize:"0.58rem",fontWeight:800,color:dk?"rgba(180,205,255,0.75)":"rgba(0,0,0,0.50)",letterSpacing:"0.1em",textTransform:"uppercase"}}>auto</span>
            <div style={{position:"relative",width:30,height:16,borderRadius:8,
              background:autoEnabled?"rgba(60,130,220,0.88)":swBg,transition:"background 0.2s",flexShrink:0}}>
              <motion.div animate={{x:autoEnabled?15:2}} transition={{type:"spring",stiffness:500,damping:28}}
                style={{position:"absolute",top:2,width:12,height:12,borderRadius:"50%",
                  background:"white",boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
            </div>
          </label>
        </div>
      )}
      {!maxed && (
        <motion.button onClick={canBuy?onBuy:undefined}
          whileHover={lit?{scale:1.02}:{}} whileTap={lit?{scale:0.96}:{}}
          style={{width:"100%",padding:"6px 0",borderRadius:8,border:"none",
            background:lit?"rgba(55,125,215,0.88)":btnBg,
            color:lit?"white":btnTx,
            fontSize:"0.65rem",fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",
            cursor:lit?"pointer":"default",transition:"all 0.15s"}}>
          {lit?"acheter":"insuffisant"}
        </motion.button>
      )}
    </div>
  );
}

// ── ICÔNE ÉDITION SUPPRIMÉE (sécurité auth) ─────────────────────

// ── MAIN ─────────────────────────────────────────────────────
export default function GlobalClicker() {
  // ── Auth states ────────────────────────────────────────────
  const [pseudo, setPseudo]               = useState("");
  // editingPseudo/editPseudoVal supprimés — édition pseudo désactivée pour sécurité
  // Auth modal
  type AuthStep = "hidden"|"pseudo"|"create"|"login"|"error";
  const [authStep, setAuthStep]           = useState<AuthStep>("hidden");
  const [authPseudo, setAuthPseudo]       = useState("");
  const [authCode, setAuthCode]           = useState("");
  const [authError, setAuthError]         = useState("");
  const [authLoading, setAuthLoading]     = useState(false);

  // ── Vérification token au démarrage ────────────────────────
  // On utilise un state pour savoir si l'init est terminée
  const [authReady, setAuthReady]         = useState(false);
  const [darkMode,  setDarkMode]          = useState(()=>localStorage.getItem("gc_dark")==="1");

  const [globalScore, setGlobalScore]   = useState(0);
  const [leaderboard, setLeaderboard]   = useState<LBEntry[]>([]);
  const [onlineCount, setOnlineCount]   = useState(1);

  const [dissolveClicks, setDissolveClicks] = useState(0);
  const [isDissolving, setIsDissolving]     = useState(false);
  const [recharging, setRecharging]         = useState(false);
  const [combos, setCombos]                 = useState(0);
  const [cooldownMs, setCooldownMs]         = useState(0);   // ms restantes affichées

  const game = useRef({total:0, spent:0});
  const [displayTotal, setDisplayTotal] = useState(0);
  const [displaySpent, setDisplaySpent] = useState(0);
  const available = displayTotal - displaySpent;

  const [chaleur,    setChaleur]    = useState(0);
  const [aides,      setAides]      = useState(0);
  const [catalyseur, setCatalyseur] = useState(0);
  const [labo,       setLabo]       = useState(0);

  const [autoChAchat,   setAutoChAchat]   = useState(false);
  const [autoAideAchat, setAutoAideAchat] = useState(false);
  const [autoLaboAchat, setAutoLaboAchat] = useState(false);
  const [autoCatAchat,  setAutoCatAchat]  = useState(false);

  const [phase, setPhase]           = useState(0);
  const [phaseFlash, setPhaseFlash] = useState<number|null>(null);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [floats,  setFloats]  = useState<FloatEl[]>([]);
  const [introIdx, setIntroIdx] = useState(0);
  const words = ["une","aspirine.","|","une","de","plus."];

  const floatId      = useRef(0);
  const bubbleId     = useRef(0);
  const pending         = useRef(0);  // cachets accumulés non encore flushés
  const lastFlushed     = useRef(0);  // total au moment du dernier flush réussi
  const laboMultRef     = useRef(1);
  const cooldownTimer   = useRef<ReturnType<typeof setInterval>|null>(null);
  // Cleanup du timer cooldown au démontage
  useEffect(()=>()=>{ if(cooldownTimer.current) clearTimeout(cooldownTimer.current as unknown as ReturnType<typeof setTimeout>); },[]);
  const busy         = useRef(false);
  const dissolveRef  = useRef(0);
  const pseudoRef    = useRef(pseudo);
  const flushFn         = useRef<((c:number,p:string,t:number)=>void)|null>(null);
  const saveProgressFn  = useRef<(()=>void)|null>(null);
  const channelRef   = useRef<RealtimeChannel|null>(null);
  // editInputRef supprimé — plus d'édition pseudo inline

  useEffect(()=>{ pseudoRef.current=pseudo; },[pseudo]);
  // Presence trackée directement dans le canal (useEffect [pseudo])
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("gc_dark", darkMode ? "1" : "0");
  },[darkMode]);

  // ── Init : restaurer session depuis localStorage ──────────
  useEffect(()=>{
    const token  = localStorage.getItem("gc_token");
    const stored = localStorage.getItem("gc_pseudo");
    if(token && stored) {
      // Token trouvé → connexion silencieuse
      setPseudo(stored);
      loadScore(stored).then(()=>setAuthReady(true));
    } else {
      // Pas de token → afficher le modal de connexion
      setAuthStep("pseudo");
      setAuthReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);  // une seule fois au montage
  useEffect(()=>{ laboMultRef.current = labo; },[labo]);

  // Refs upgrades pour saveProgress (lecture dans closures throttlées)
  const chaleurRef    = useRef(0);
  const aidesRef      = useRef(0);
  const laboRef       = useRef(0);
  const catalyseurRef = useRef(0);
  const combosRef     = useRef(0);
  useEffect(()=>{ chaleurRef.current=chaleur; },[chaleur]);
  useEffect(()=>{ aidesRef.current=aides; },[aides]);
  useEffect(()=>{ laboRef.current=labo; },[labo]);
  useEffect(()=>{ catalyseurRef.current=catalyseur; },[catalyseur]);
  useEffect(()=>{ combosRef.current=combos; },[combos]);

  const rechargeMs          = Math.max(80, Math.round(5800 * Math.pow(0.7411, chaleur)));
  const cachetsPerAutoClick = CAT_CACHETS[catalyseur] ?? 1;
  const autoClickMs         = autoClickInterval(aides);
  const dissolveRatio       = dissolveClicks / CLICKS_TO_DISSOLVE;
  const myRank              = pseudo ? leaderboard.findIndex(e=>e.pseudo.toLowerCase()===pseudo.toLowerCase()) : -1;
  const autoLabel           = autoClickMs>0 ? (autoClickMs>=1000 ? `/${Math.round(autoClickMs/1000)}s` : `/${autoClickMs}ms`) : null;
  const cps                 = autoClickMs>0 ? (1000/autoClickMs*cachetsPerAutoClick).toFixed(1) : "0";

  const addCachets = useCallback((n:number, applyMult=false)=>{
    const actual = applyMult ? Math.ceil(n * laboMultRef.current) : n;
    game.current.total += actual;
    setDisplayTotal(game.current.total);
    setGlobalScore(s=>s+actual);
    pending.current += actual;
    // Ne flusher que si un pseudo est défini (évite d'envoyer pendant le chargement)
    if(pseudoRef.current) flushFn.current?.(pending.current, pseudoRef.current, game.current.total);
  },[]);

  const spendCachets = useCallback((cost:number, fn:()=>void):boolean=>{
    const avail = game.current.total - game.current.spent;
    if (avail<cost) return false;
    game.current.spent += cost;
    setDisplaySpent(game.current.spent);
    fn();
    return true;
  },[]);

  const goPhase = useCallback((p:number)=>{
    setPhase(p); setPhaseFlash(p);
    setTimeout(()=>setPhaseFlash(null),3000);
  },[]);

  useEffect(()=>{
    if(introIdx>=words.length) return;
    const d=words[introIdx]==="|"?250:introIdx<2?500:650;
    const t=setTimeout(()=>setIntroIdx(i=>i+1),d);
    return()=>clearTimeout(t);
  },[introIdx]);

  useEffect(()=>{
    const ratio=dissolveClicks/CLICKS_TO_DISSOLVE;
    // Fréquence min 200ms en end-game pour limiter la charge GPU
    const freq = Math.max(200, 500 - ratio*400);
    const iv=setInterval(()=>{
      if(isDissolving||recharging||ratio<0.06) return;
      // Max 3 bulles par tick, plafond total à 20 (au lieu de 40)
      const count = ratio < 0.2 ? 1 : Math.min(3, Math.floor(1+ratio*4));
      const nb:Bubble[]=Array.from({length:count},()=>({
        id:++bubbleId.current, x:28+Math.random()*44, size:3+Math.random()*12,
        speed:1.2+Math.random()*2.4, opacity:0.28+Math.random()*0.55, wobble:(Math.random()-0.5)*24,
      }));
      setBubbles(b=>[...b.slice(-20),...nb]);
      setTimeout(()=>setBubbles(b=>b.filter(bb=>!nb.find(n=>n.id===bb.id))),3400);
    },freq);
    return()=>clearInterval(iv);
  },[dissolveClicks,isDissolving,recharging]);

  const dissolve = useCallback(()=>{
    if(busy.current) return;
    busy.current=true;
    dissolveRef.current=0;
    setIsDissolving(true);
    setCombos(c=>{
      const next=c+1;
      combosRef.current=next;
      // Sauvegarder toutes les 10 dissolutions
      if(next%10===0) setTimeout(()=>saveProgressFn.current?.(),50);
      return next;
    });
    // Bonus de dissolution Labo R&D — Option B : +lvl cachets par dissolution
    if(laboMultRef.current > 0) {
      addCachets(laboMultRef.current, false);
    }
    setTimeout(()=>{
      setIsDissolving(false);
      setRecharging(true);
      setDissolveClicks(0);
      setBubbles([]);
      // ── Compte à rebours cooldown ──────────────────────────────
      const startMs = Date.now();
      const endMs   = startMs + rechargeMs;
      setCooldownMs(rechargeMs);
      if(cooldownTimer.current) cancelAnimationFrame(cooldownTimer.current as unknown as number);
      const rafTick = () => {
        const left = Math.max(0, endMs - Date.now());
        setCooldownMs(left);
        if(left > 0) {
          cooldownTimer.current = setTimeout(rafTick, 16) as unknown as ReturnType<typeof setInterval>;
        } else {
          cooldownTimer.current = null;
        }
      };
      cooldownTimer.current = setTimeout(rafTick, 16) as unknown as ReturnType<typeof setInterval>;
      setTimeout(()=>{ setRecharging(false); busy.current=false; }, rechargeMs);
    },750);
  },[rechargeMs, addCachets]);

  // ── Code Konami ↑↑↓↓←→←→ba = +20 000 cachets ──────────
  useEffect(()=>{
    const SEQ=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx=0;
    const handler=(e:KeyboardEvent)=>{
      if(e.key===SEQ[idx]){idx++;if(idx===SEQ.length){addCachets(20000);idx=0;}}
      else{idx=e.key===SEQ[0]?1:0;}
    };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[addCachets]);

  const cachetsPerAutoClickRef=useRef(cachetsPerAutoClick);
  useEffect(()=>{ cachetsPerAutoClickRef.current=cachetsPerAutoClick; },[cachetsPerAutoClick]);

  useEffect(()=>{
    if(autoClickMs===0) return;
    const iv=setInterval(()=>{
      if(busy.current) return;
      addCachets(cachetsPerAutoClickRef.current);
      const next=dissolveRef.current+1;
      dissolveRef.current=next;
      if(next>=CLICKS_TO_DISSOLVE) dissolve();
      else setDissolveClicks(next);
    },autoClickMs);
    return()=>clearInterval(iv);
  },[autoClickMs,addCachets,dissolve]);

  useEffect(()=>{
    const iv=setInterval(()=>{
      const avail=game.current.total-game.current.spent;
      let upgraded=false;
      if(autoChAchat&&chaleur<15){ const c=UPGRADES[0].cost(chaleur); if(avail>=c){ spendCachets(c,()=>setChaleur(p=>p+1)); upgraded=true; } }
      if(autoAideAchat&&aides<25){ const c=UPGRADES[1].cost(aides); if(avail>=c){ spendCachets(c,()=>setAides(p=>{ if(p===0&&phase<1) goPhase(1); return p+1; })); upgraded=true; } }
      if(autoLaboAchat&&labo<10){ const c=UPGRADES[2].cost(labo); if(avail>=c){ spendCachets(c,()=>{ setLabo(p=>p+1); if(labo===0&&phase<2) goPhase(2); }); upgraded=true; } }
      if(autoCatAchat&&catalyseur<3){ const cc=CAT_COSTS[catalyseur+1]; if(cc&&avail>=cc){ spendCachets(cc,()=>setCatalyseur(p=>{ if(p===0&&phase<3) goPhase(3); return p+1; })); upgraded=true; } }
      if(upgraded) setTimeout(()=>saveProgressFn.current?.(),50);
    },800);
    return()=>clearInterval(iv);
  },[autoChAchat,autoAideAchat,autoLaboAchat,autoCatAchat,chaleur,aides,labo,catalyseur,phase,spendCachets,goPhase,addCachets]);

  useEffect(()=>{
    if(IS_MOCK) return;  // pas de Supabase en démo locale
    (async()=>{
      // Charger le score mondial initial
      const {data:gs}=await supabase.from("global_score").select("score").eq("id",1).single();
      if(gs?.score !== undefined) setGlobalScore(gs.score);
      // Charger le classement initial
      const {data:lb}=await supabase.from("leaderboard")
        .select("id,pseudo,clicks").order("clicks",{ascending:false}).limit(15);
      if(lb) setLeaderboard(lb);
    })();
  },[]);

  const loadScore=useCallback(async(p:string)=>{
    if(IS_MOCK||!p) return;
    const {data}=await supabase.from("leaderboard")
      .select("clicks,spent,combos,chaleur,aides,labo,catalyseur")
      .eq("pseudo",p).single();
    if(!data) return;
    // ── Restaurer la monnaie ─────────────────────────────
    const total  = data.clicks  ?? 0;
    const spent  = data.spent   ?? 0;
    game.current.total = total;
    game.current.spent = spent;
    setDisplayTotal(total);
    setDisplaySpent(spent);
    lastFlushed.current = total;
    pending.current     = 0;
    // ── Restaurer les upgrades ───────────────────────────
    const ch = data.chaleur    ?? 0;
    const ai = data.aides      ?? 0;
    const la = data.labo       ?? 0;
    const ca = data.catalyseur ?? 0;
    const co = data.combos     ?? 0;
    if(ch > 0) setChaleur(ch);
    if(ai > 0) { setAides(ai); setPhase(prev=>Math.max(prev,1)); }
    if(la > 0) { setLabo(la);  setPhase(prev=>Math.max(prev,2)); }
    if(ca > 0) { setCatalyseur(ca); setPhase(prev=>Math.max(prev,3)); }
    if(co > 0) { setCombos(co); combosRef.current=co; }
  },[]);
  // loadScore appelé uniquement à l'init token et à handleAuthLogin — pas ici (évite les doubles flush)

  useEffect(()=>{
    if(IS_MOCK) return;
    // Nettoyer l'ancien canal si existe
    if(channelRef.current) { channelRef.current.unsubscribe(); channelRef.current=null; }
    channelRef.current=supabase.channel("aspirine_realtime", {
      config: { broadcast: { self: false }, presence: { key: pseudo || `anon_${Math.random().toString(36).slice(2,8)}` } }
    })
      // Score mondial — mis à jour en temps réel
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"global_score"},
        (payload) => { if(payload.new?.score !== undefined) setGlobalScore(payload.new.score as number); }
      )
      // Leaderboard — re-fetch complet à chaque changement pour garantir l'ordre
      .on("postgres_changes",{event:"*",schema:"public",table:"leaderboard"},async()=>{
        const {data}=await supabase.from("leaderboard")
          .select("id,pseudo,clicks").order("clicks",{ascending:false}).limit(15);
        if(data) setLeaderboard(data);
      })
      // Presence — compter les joueurs connectés en temps réel
      .on("presence",{event:"sync"},()=>{
        const state=channelRef.current?.presenceState()??{};
        setOnlineCount(Object.keys(state).length);
      })
      .on("presence",{event:"join"},()=>{
        const state=channelRef.current?.presenceState()??{};
        setOnlineCount(Object.keys(state).length);
      })
      .on("presence",{event:"leave"},()=>{
        const state=channelRef.current?.presenceState()??{};
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async(status)=>{
        if(status === "SUBSCRIBED") {
          // Annoncer sa présence dès la connexion
          await channelRef.current?.track({ pseudo: pseudo||"anon", online_at: new Date().toISOString() });
        }
      });
    return()=>{ channelRef.current?.unsubscribe(); channelRef.current=null; };
  },[pseudo]);  // se re-souscrit quand le pseudo est défini

  const flush=useCallback(throttle(async(count:number,p:string,total:number)=>{
    if(!p) return;
    const delta = total - lastFlushed.current;
    if(delta <= 0) return;
    if(!IS_MOCK) {
      await supabase.rpc("increment_global_score",{amount:delta});
      // Sauvegarder monnaie uniquement (upgrades sauvegardés séparément)
      await supabase.from("leaderboard").upsert(
        { pseudo:p, clicks:total, spent:game.current.spent },
        { onConflict:"pseudo" }
      );
    }
    lastFlushed.current = total;
    pending.current = 0;
  },900),[]);
  useEffect(()=>{ flushFn.current=flush; },[flush]);

  // ── Sauvegarde des upgrades (throttle 1500ms) ────────────
  const saveProgress=useCallback(throttle(async()=>{
    const p=pseudoRef.current;
    if(IS_MOCK||!p) return;
    await supabase.from("leaderboard").upsert({
      pseudo:     p,
      clicks:     game.current.total,
      spent:      game.current.spent,
      combos:     combosRef.current,
      chaleur:    chaleurRef.current,
      aides:      aidesRef.current,
      labo:       laboRef.current,
      catalyseur: catalyseurRef.current,
    },{ onConflict:"pseudo" });
  },1500),[]);
  useEffect(()=>{ saveProgressFn.current=saveProgress; },[saveProgress]);

  const handleClick=useCallback((e:React.MouseEvent<HTMLButtonElement>)=>{
    if(isDissolving||recharging) return;
    if(!pseudo){ setAuthStep("pseudo"); return; }
    const {clientX:x,clientY:y}=e;
    const fid=++floatId.current;
    setFloats(f=>[...f,{id:fid,x,y,text:"+1"}]);
    setTimeout(()=>setFloats(f=>f.filter(o=>o.id!==fid)),780);
    addCachets(1);
    const next=dissolveRef.current+1;
    dissolveRef.current=next;
    if(next>=CLICKS_TO_DISSOLVE) dissolve();
    else setDissolveClicks(next);
  },[pseudo,isDissolving,recharging,addCachets,dissolve]);

  const buyChaleur    = ()=>{ spendCachets(UPGRADES[0].cost(chaleur),()=>setChaleur(c=>c+1)); setTimeout(()=>saveProgressFn.current?.(),50); };
  const buyAide       = ()=>{ spendCachets(UPGRADES[1].cost(aides),()=>setAides(a=>{ if(a===0&&phase<1) goPhase(1); return a+1; })); setTimeout(()=>saveProgressFn.current?.(),50); };
  const buyLabo       = ()=>{ spendCachets(UPGRADES[2].cost(labo),()=>{ setLabo(l=>{ if(l===0&&phase<2) goPhase(2); return l+1; }); }); setTimeout(()=>saveProgressFn.current?.(),50); };
  const buyCatalyseur = ()=>{ const cc=CAT_COSTS[catalyseur+1]; if(!cc) return; spendCachets(cc,()=>setCatalyseur(p=>{ if(p===0&&phase<3) goPhase(3); return p+1; })); setTimeout(()=>saveProgressFn.current?.(),50); };

  // ── Génère un UUID v4 simple ─────────────────────────────
  const genToken = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
  });

  // ── Étape 1 : vérifier si le pseudo existe ────────────────
  const handleAuthPseudo = async () => {
    const p = authPseudo.trim().toLowerCase();
    if(!p) return;
    setAuthLoading(true); setAuthError("");
    if(IS_MOCK) {
      // Mode démo : création directe
      const token = genToken();
      localStorage.setItem("gc_token",token);
      localStorage.setItem("gc_pseudo",p);
      setPseudo(p); setAuthStep("hidden"); setAuthLoading(false);
      return;
    }
    const {data} = await supabase.from("leaderboard").select("token").eq("pseudo",p).single();
    setAuthLoading(false);
    if(!data) { setAuthStep("create"); }  // nouveau joueur
    else       { setAuthStep("login");  }  // joueur existant
  };

  // ── Étape 2a : Créer un compte ────────────────────────────
  const handleAuthCreate = async () => {
    if(authCode.length!==4||!/^\d{4}$/.test(authCode)) {
      setAuthError("Le code doit être 4 chiffres."); return;
    }
    setAuthLoading(true); setAuthError("");
    const p = authPseudo.trim().toLowerCase();
    const token = genToken();
    if(!IS_MOCK) {
      const {error} = await supabase.from("leaderboard").insert({
        pseudo:p, token, code:authCode,
        clicks:0, spent:0, combos:0,
        chaleur:0, aides:0, labo:0, catalyseur:0,
      });
      if(error) { setAuthError("Pseudo déjà pris. Essaies-en un autre."); setAuthLoading(false); return; }
    }
    localStorage.setItem("gc_token",token);
    localStorage.setItem("gc_pseudo",p);
    setPseudo(p); setAuthStep("hidden"); setAuthLoading(false);
    setAuthCode(""); setAuthPseudo("");
  };

  // ── Étape 2b : Se connecter (pseudo existant) ─────────────
  const handleAuthLogin = async () => {
    if(authCode.length!==4) { setAuthError("Code à 4 chiffres requis."); return; }
    setAuthLoading(true); setAuthError("");
    const p = authPseudo.trim().toLowerCase();
    const {data} = await supabase.from("leaderboard").select("token,code").eq("pseudo",p).single();
    if(!data || data.code !== authCode) {
      setAuthError("Code incorrect. Réessaie."); setAuthLoading(false); return;
    }
    localStorage.setItem("gc_token",data.token);
    localStorage.setItem("gc_pseudo",p);
    setPseudo(p); setAuthStep("hidden"); setAuthLoading(false);
    setAuthCode(""); setAuthPseudo("");
    await loadScore(p);
  };

  // ── Déconnexion : efface le token et remet le modal auth ────
  const handleDeconnect = () => {
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_pseudo");
    // Réinitialiser tout le state de jeu
    setPseudo("");
    game.current = {total:0, spent:0};
    setDisplayTotal(0); setDisplaySpent(0);
    setChaleur(0); setAides(0); setLabo(0); setCatalyseur(0);
    setCombos(0); setPhase(0); setDissolveClicks(0);
    dissolveRef.current=0; pending.current=0; lastFlushed.current=0;
    laboMultRef.current=0; busy.current=false;
    chaleurRef.current=0; aidesRef.current=0; laboRef.current=0;
    catalyseurRef.current=0; combosRef.current=0;
    setAutoChAchat(false); setAutoAideAchat(false);
    setAutoLaboAchat(false); setAutoCatAchat(false);
    setAuthPseudo(""); setAuthCode(""); setAuthError("");
    setAuthStep("pseudo");
  };

  // ── toggle dark + palette ────────────────────────────
  const toggleDark=()=>setDarkMode(d=>{const n=!d;localStorage.setItem('gc_dark',n?'1':'0');return n;});
  const C=darkMode?{bg:'#0F1117',bgPanel:'rgba(255,255,255,0.07)',bgPanelHi:'rgba(255,255,255,0.10)',border:'rgba(255,255,255,0.11)',text:'rgba(230,238,255,0.88)',textSub:'rgba(230,238,255,0.42)',textFaint:'rgba(230,238,255,0.28)',score:'#E8EEFF',blur:'rgba(15,17,23,0.97)',sep:'rgba(255,255,255,0.09)'}:{bg:'#EEEAE2',bgPanel:'rgba(255,255,255,0.55)',bgPanelHi:'rgba(255,255,255,0.60)',border:'rgba(255,255,255,0.88)',text:'rgba(8,18,52,0.82)',textSub:'rgba(8,18,52,0.42)',textFaint:'rgba(8,18,52,0.28)',score:'#080e1e',blur:'rgba(238,234,226,0.97)',sep:'rgba(8,18,52,0.07)'};

  // Attendre que l'init soit terminée (évite le flash)
  if(!authReady) return (
    <div className="fixed inset-0" style={{background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <motion.div animate={{opacity:[0.3,1,0.3]}} transition={{duration:1.4,repeat:Infinity}}
        style={{width:48,height:48}}>
        <AspirinPill dissolve={0} recharging={false}/>
      </motion.div>
    </div>
  );

  return (
    <div className={`fixed inset-0${darkMode?" dark-mode":""}`}
      style={{fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",background:C.bg,transition:"background 0.3s",overflowY:"auto",overflowX:"hidden",minHeight:"100vh",minHeight:"-webkit-fill-available"}}>

      <div className="fixed inset-0 pointer-events-none opacity-[0.022]"
        style={{backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,backgroundSize:"200px"}}/>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full blur-3xl blob1" style={{width:"55vw",height:"55vw",top:"-15%",right:"-8%",opacity:darkMode?0.10:0.55,background:darkMode?"radial-gradient(circle,#2a4a8f,transparent)":"radial-gradient(circle,#dde8f5,transparent)"}}/>
        <div className="absolute rounded-full blur-3xl blob2" style={{width:"40vw",height:"40vw",bottom:"-12%",left:"-5%",opacity:darkMode?0.08:0.40,background:darkMode?"radial-gradient(circle,#1a3a6a,transparent)":"radial-gradient(circle,#d0dff0,transparent)"}}/>
      </div>

      <AnimatePresence>
        {phaseFlash!==null&&(
          <motion.div className="fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none"
            style={{background:"rgba(238,234,226,0.97)",backdropFilter:"blur(24px)"}}
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.3}}>
            <motion.div className="text-center"
              initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
              transition={{duration:0.5,ease:[0.16,1,0.3,1]}}>
              <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.45em",color:"rgba(0,0,50,0.32)",textTransform:"uppercase",marginBottom:"0.8rem"}}>nouvelle phase</div>
              <div style={{fontSize:"clamp(2.5rem,9vw,5.5rem)",fontWeight:900,letterSpacing:"-0.04em",lineHeight:1,color:"#080e1e"}}>
                {PHASES[phaseFlash].label}
              </div>
              <div style={{fontSize:"0.9rem",color:"rgba(0,0,50,0.42)",marginTop:"0.8rem"}}>
                {PHASES[phaseFlash].sub}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {floats.map(o=>(
          <motion.div key={o.id} className="fixed pointer-events-none z-50 font-black select-none"
            style={{left:o.x-14,top:o.y-20,color:"#0d1830",fontSize:"1.1rem",letterSpacing:"-0.02em"}}
            initial={{opacity:1,y:0,scale:1}} animate={{opacity:0,y:-60,scale:1.2}}
            transition={{duration:0.82,ease:[0.16,1,0.3,1]}}
          >{o.text}</motion.div>
        ))}
      </AnimatePresence>

      <div className="relative p-3 md:p-4 flex flex-col gap-3" style={{minHeight:"100vh",paddingTop:"max(12px, env(safe-area-inset-top, 12px))",paddingBottom:"max(16px, env(safe-area-inset-bottom, 16px))"}}>

        {/* TOP BAR */}
        <div className="flex-shrink-0 flex items-center justify-between px-1 topbar">
          <div className="font-black leading-none" style={{fontSize:"clamp(0.88rem,2.2vw,1.3rem)",letterSpacing:"-0.03em",color:C.text}}>
            {words.filter(w=>w!=="|").map((w,i)=>(
              <AnimatePresence key={i}>
                {introIdx>i&&(
                  <motion.span initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
                    transition={{duration:0.24,ease:[0.16,1,0.3,1]}}
                    style={{marginRight:"0.28em",display:"inline-block"}}>{w}</motion.span>
                )}
              </AnimatePresence>
            ))}
          </div>
          {/* Pseudo + Dark mode + Déconnexion */}
          <div className="flex items-center gap-2">
              <motion.div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{background:pseudo?"rgba(40,80,200,0.72)":"rgba(10,20,60,0.22)"}}
                animate={{opacity:pseudo?[1,0.3,1]:1}} transition={{duration:2,repeat:Infinity}}/>
              {/* Pseudo affiché en readonly — non cliquable pour éviter l'usurpation */}
              <span style={{fontSize:"0.92rem",fontWeight:800,letterSpacing:"0.04em",
                color:pseudo?C.text:C.textFaint}}>
                {pseudo||"…"}
              </span>
              {/* Bouton déconnexion — uniquement si connecté */}
              {pseudo&&(
                <button onClick={handleDeconnect}
                  style={{background:"rgba(200,60,60,0.07)",border:"1px solid rgba(200,60,60,0.18)",
                    borderRadius:6,padding:"3px 7px",cursor:"pointer",
                    fontSize:"0.52rem",fontWeight:800,letterSpacing:"0.18em",textTransform:"uppercase",
                    color:"rgba(200,60,60,0.65)",transition:"all 0.15s"}}
                  title="Se déconnecter">
                  quitter
                </button>
              )}
              {/* Bouton dark mode */}
              <button onClick={()=>setDarkMode(d=>!d)}
                title={darkMode?"Mode clair":"Mode sombre"}
                style={{width:22,height:22,borderRadius:6,border:"1px solid rgba(8,18,52,0.15)",
                  background:darkMode?"rgba(255,255,255,0.12)":"rgba(8,18,52,0.06)",
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"0.75rem",transition:"all 0.2s",flexShrink:0}}>
                {darkMode ? "☀️" : "🌙"}
              </button>
          </div>
        </div>

        {/* BENTO GRID */}
        <div className="grid gap-3 bento-grid"
          style={{gridTemplateColumns:"repeat(12,1fr)",gridTemplateRows:"repeat(12,1fr)",minHeight:"60vh"}}>

          {/* ── A : Score mondial ── */}
          <div className="rounded-2xl p-5 flex flex-col justify-between overflow-hidden score-mondial"
            style={{gridColumn:"1/8",gridRow:"1/4",
              background:C.bgPanel,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
              border:`1.5px solid ${C.border}`,boxShadow:"0 2px 20px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.05)"}}>
            <div>
              <div style={{fontSize:"0.62rem",fontWeight:darkMode?900:800,letterSpacing:"0.35em",color:C.textSub,textTransform:"uppercase",marginBottom:"0.5rem"}}>
                cachets dissous · monde
              </div>
              <motion.div key={Math.floor(globalScore/50)}
                initial={{scale:1.03}} animate={{scale:1}} transition={{duration:0.2}}
                style={{fontSize:"clamp(2.5rem,7vw,6rem)",fontWeight:900,letterSpacing:"-0.05em",color:C.score,lineHeight:1}}>
                {globalScore.toLocaleString("fr-FR")}
              </motion.div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div className="w-2 h-2 rounded-full" style={{background:"rgba(40,80,200,0.52)"}}
                animate={{opacity:[1,0.15,1]}} transition={{duration:1.4,repeat:Infinity}}/>
              <span style={{fontSize:"0.58rem",fontWeight:700,letterSpacing:"0.28em",color:C.textSub,textTransform:"uppercase"}}>
                {IS_MOCK?"démo":"live"} · {onlineCount} actif{onlineCount>1?"s":""}
              </span>
            </div>
          </div>

          {/* ── B : Stats perso — NOUVELLE ORGANISATION ── */}
          {/*
              Layout :
              ┌─────────────────────────────────────────┐
              │ pseudo                            #rang  │
              ├─────────────────────────────────────────┤
              │         TOTAL POSSÉDÉS (encadré)         │  ← mis en évidence
              ├──────────────┬──────────┬────────────────┤
              │  disponible  │ dissolut.│    cachets/s   │  ← 3 stats côte à côte
              └──────────────┴──────────┴────────────────┘
          */}
          <div className="rounded-2xl p-5 flex flex-col gap-3 overflow-hidden stats-panel"
            style={{gridColumn:"8/13",gridRow:"1/4",
              background:C.bgPanelHi,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
              border:`1.5px solid ${C.border}`,
              boxShadow:"0 4px 28px rgba(40,80,200,0.07),inset 0 1px 0 rgba(255,255,255,0.05)"}}>

            {/* Pseudo + rang */}
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontSize:"clamp(0.95rem,1.8vw,1.25rem)",fontWeight:900,letterSpacing:"-0.01em",color:C.text,lineHeight:1}}>
                {pseudo||"—"}
              </span>
              {myRank>=0&&(
                <span style={{fontSize:"0.62rem",fontWeight:700,color:"rgba(40,80,180,0.52)",letterSpacing:"0.12em"}}>
                  #{myRank+1}
                </span>
              )}
            </div>

            {/* Encadré TOTAL POSSÉDÉS — mis en évidence */}
            <div style={{
              background:"rgba(30,90,220,0.07)",borderRadius:14,
              border:"2px solid rgba(40,100,220,0.22)",
              padding:"10px 14px",flexShrink:0,
            }}>
              <div style={{fontSize:"0.52rem",fontWeight:darkMode?900:800,letterSpacing:"0.30em",color:darkMode?"rgba(120,160,255,0.80)":"rgba(40,80,180,0.55)",textTransform:"uppercase",marginBottom:3}}>
                total possédés
              </div>
              <motion.div
                key={displayTotal}
                animate={{opacity:[0.7,1]}}
                transition={{duration:0.18,ease:"easeOut"}}
                className="total-value" style={{fontSize:"clamp(1.7rem,4vw,2.8rem)",fontWeight:900,letterSpacing:"-0.05em",color:"rgba(22,82,215,0.95)",lineHeight:1}}>
                {fmtFull(displayTotal)}
              </motion.div>
            </div>

            {/* Ligne basse : Disponible | Dissolutions | Cachets/s */}
            <div style={{display:"flex",alignItems:"flex-end",gap:0,flex:1,minHeight:0}}>
              {/* Disponible */}
              <div style={{flex:1}}>
                <div style={{fontSize:darkMode?"0.58rem":"0.50rem",fontWeight:900,letterSpacing:"0.25em",color:darkMode?"#A8C8FF":"rgba(8,18,52,0.38)",textTransform:"uppercase",marginBottom:2}}>
                  disponible
                </div>
                <motion.div key={Math.floor(available/3)}
                  initial={{scale:1.08}} animate={{scale:1}} transition={{duration:0.15}}
                  className="stat-value" style={{fontSize:"clamp(1.05rem,2.2vw,1.5rem)",fontWeight:900,letterSpacing:"-0.04em",color:darkMode?"rgba(200,220,255,0.90)":"rgba(8,18,52,0.70)",lineHeight:1}}>
                  {fmtFull(available)}
                </motion.div>
              </div>

              <div style={{width:1,height:32,background:"rgba(8,18,52,0.09)",flexShrink:0,margin:"0 10px"}}/>

              {/* Dissolutions */}
              <div style={{flex:1}}>
                <div style={{fontSize:darkMode?"0.58rem":"0.50rem",fontWeight:900,letterSpacing:"0.22em",color:darkMode?"#A8C8FF":"rgba(8,18,52,0.38)",textTransform:"uppercase",marginBottom:2}}>
                  dissolutions
                </div>
                <motion.div key={combos}
                  initial={{scale:1.28,color:"rgba(100,160,255,0.9)"}} animate={{scale:1,color:darkMode?"rgba(200,220,255,0.90)":"rgba(8,18,52,0.72)"}}
                  transition={{duration:0.38,ease:[0.16,1,0.3,1]}}
                  style={{fontSize:"clamp(1.05rem,2.2vw,1.5rem)",fontWeight:900,letterSpacing:"-0.04em",lineHeight:1}}>
                  {fmtFull(combos)}
                </motion.div>
              </div>

              <div style={{width:1,height:32,background:"rgba(8,18,52,0.09)",flexShrink:0,margin:"0 10px"}}/>

              {/* Cachets/s */}
              <div style={{flex:1}}>
                <div style={{fontSize:darkMode?"0.58rem":"0.50rem",fontWeight:900,letterSpacing:"0.22em",color:darkMode?"#A8C8FF":"rgba(8,18,52,0.38)",textTransform:"uppercase",marginBottom:2}}>
                  cachets/s
                </div>
                <motion.div key={cps}
                  initial={{scale:1.15}} animate={{scale:1}} transition={{duration:0.28}}
                  style={{fontSize:"clamp(1.05rem,2.2vw,1.5rem)",fontWeight:900,letterSpacing:"-0.04em",color:darkMode?"rgba(120,180,255,0.95)":"rgba(40,100,210,0.80)",lineHeight:1}}>
                  {cps}
                </motion.div>
              </div>
            </div>

          </div>

          {/* ── D : ASPIRINE + VAGUE ── */}
          <div className="aspirine-panel" style={{
            gridColumn:"1/8", gridRow:"4/13",
            position:"relative", overflow:"hidden", borderRadius:"1rem",
            background:darkMode?"rgba(30,50,80,0.40)":"rgba(215,232,250,0.38)",
            backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
            border:"1.5px solid rgba(255,255,255,0.84)",
            boxShadow:"0 2px 22px rgba(40,100,220,0.07),inset 0 1px 0 rgba(255,255,255,0.88)",
          }}>
            <WavePanel ratio={dissolveRatio} isDissolving={isDissolving} bubbles={bubbles}/>
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-5 gap-5">
              {/* ── Zone aspirine + overlay cooldown ── */}
              <div className="aspirine-btn" style={{position:"relative",width:"clamp(96px,16vmin,160px)",height:"clamp(96px,16vmin,160px)"}}>
                <motion.button onClick={handleClick}
                  className="outline-none border-none bg-transparent cursor-pointer"
                  style={{width:"100%",height:"100%"}}
                  whileHover={(!isDissolving&&!recharging)?{scale:1.05}:{}}
                  animate={isDissolving?{scale:[1,0.25],opacity:[1,0]}:recharging?{scale:[0,1.1,1],opacity:[0,1,1]}:{}}
                  transition={isDissolving?{duration:0.75,ease:[0.4,0,1,1]}:recharging?{duration:0.7,ease:[0.16,1,0.3,1]}:{type:"spring",stiffness:300,damping:20}}>
                  <AspirinPill dissolve={dissolveRatio} recharging={recharging}/>
                </motion.button>

                {/* Overlay cooldown — visible uniquement pendant la reformation */}
                <AnimatePresence>
                  {recharging && (
                    <motion.div
                      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      transition={{duration:0.18}}
                      style={{
                        position:"absolute", inset:0,
                        borderRadius:"50%",
                        background:"rgba(220,232,252,0.72)",
                        backdropFilter:"blur(4px)",
                        display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center",
                        gap:2, pointerEvents:"none",
                      }}>
                      {/* Icône horloge */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(40,90,210,0.55)" strokeWidth="1.8"/>
                        <path d="M12 6v6l4 2" stroke="rgba(40,90,210,0.75)" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {/* Temps restant */}
                      <span style={{
                        fontSize:"0.72rem", fontWeight:900,
                        color:"rgba(20,70,200,0.88)",
                        letterSpacing:"-0.02em", lineHeight:1,
                      }}>
                        {cooldownMs >= 1000
                          ? `${(cooldownMs/1000).toFixed(1)}s`
                          : `${cooldownMs}ms`}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full max-w-[180px] flex flex-col items-center gap-2">
                {/* Barre de progression dissolution */}
                <div style={{width:"100%",height:4,borderRadius:2,background:"rgba(255,255,255,0.45)",overflow:"hidden"}}>
                  <motion.div style={{height:"100%",borderRadius:2,
                    background: recharging ? "rgba(40,90,210,0.35)" : "rgba(45,115,210,0.72)"}}
                    animate={{width: recharging
                      ? `${(1 - cooldownMs / Math.max(1, rechargeMs)) * 100}%`
                      : `${dissolveRatio*100}%`}}
                    transition={{type:"spring",stiffness:200,damping:25}}/>
                </div>
                <div style={{
                  fontSize:"0.60rem", fontWeight:800, letterSpacing:"0.28em",
                  color: recharging ? "rgba(80,140,255,0.80)" : C.textSub,
                  textTransform:"uppercase",
                }}>
                  {isDissolving ? "libération !"
                   : recharging  ? (cooldownMs>=1000 ? `${(cooldownMs/1000).toFixed(1)}s…` : `${cooldownMs}ms…`)
                   : dissolveClicks===0 ? "cliquer pour dissoudre"
                   : `${CLICKS_TO_DISSOLVE-dissolveClicks} clics`}
                </div>
              </div>
              <div style={{fontSize:"0.62rem",fontWeight:800,color:C.textFaint,letterSpacing:"0.05em"}}>
                {combos} cachet{combos!==1?"s":""} dissous
              </div>
            </div>
          </div>

          {/* ── C : Leaderboard Top 15 — pleine hauteur, sans stats parasites ── */}
          <div className="rounded-2xl flex flex-col overflow-hidden leaderboard-panel"
            style={{gridColumn:"8/13",gridRow:"4/13",
              background:C.bgPanel,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
              border:`1.5px solid ${C.border}`,boxShadow:"0 2px 20px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,0.05)"}}>

            <div style={{padding:"14px 18px 10px",flexShrink:0,borderBottom:`1px solid ${C.sep}`}}>
              <span style={{fontSize:"0.62rem",fontWeight:800,letterSpacing:"0.32em",color:C.textSub,textTransform:"uppercase"}}>
                classement · top 15
              </span>
            </div>

            {/* Liste animée */}
            <div style={{flex:1,overflowY:"auto",scrollbarWidth:"none",padding:"6px 16px 14px"}}>
              <AnimatePresence initial={false}>
              {leaderboard.slice(0,15).map((e,i)=>{
                const isMe=pseudo&&e.pseudo.toLowerCase()===pseudo.toLowerCase();
                const rankColor=i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32"
                  :(darkMode?"rgba(180,200,255,0.45)":"rgba(8,18,52,0.30)");
                const nameColor=isMe
                  ?(darkMode?"#7EB8FF":"rgba(22,82,215,0.95)")
                  :(darkMode?"rgba(220,235,255,0.92)":"rgba(8,18,52,0.80)");
                const scoreColor=isMe
                  ?(darkMode?"#7EB8FF":"rgba(22,82,215,0.95)")
                  :(darkMode?"rgba(200,218,255,0.80)":"rgba(8,18,52,0.55)");
                const bgRow=isMe
                  ?(darkMode?"rgba(80,130,255,0.12)":"rgba(22,82,215,0.06)")
                  :"transparent";
                return(
                  <motion.div key={e.id}
                    layout
                    initial={{opacity:0,x:20}}
                    animate={{opacity:1,x:0}}
                    exit={{opacity:0,x:-20}}
                    transition={{duration:0.32,ease:[0.16,1,0.3,1]}}
                    style={{
                      display:"flex",alignItems:"center",gap:10,
                      padding:"8px 10px",marginBottom:4,
                      borderRadius:10,
                      background:bgRow,
                      border:isMe?`1px solid ${darkMode?"rgba(100,160,255,0.25)":"rgba(22,82,215,0.15)"}`:"1px solid transparent",
                    }}>
                    {/* Rang */}
                    <div style={{
                      width:28,flexShrink:0,textAlign:"center",
                      fontWeight:900,
                      fontSize:i<3?"1rem":"0.72rem",
                      color:rankColor,
                      lineHeight:1,
                    }}>
                      {i<3?["🥇","🥈","🥉"][i]:i+1}
                    </div>
                    {/* Pseudo */}
                    <span style={{
                      flex:1,fontWeight:isMe?900:700,
                      fontSize:"0.76rem",
                      color:nameColor,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    }}>
                      {e.pseudo}{isMe&&(
                        <span style={{fontSize:"0.55rem",fontWeight:700,
                          color:darkMode?"rgba(120,170,255,0.70)":"rgba(22,82,215,0.55)",
                          marginLeft:4,letterSpacing:"0.1em"}}>← toi</span>
                      )}
                    </span>
                    {/* Score */}
                    <motion.span
                      key={e.clicks}
                      initial={{scale:1.18,color:darkMode?"#7EB8FF":"rgba(22,82,215,0.95)"}}
                      animate={{scale:1,color:scoreColor}}
                      transition={{duration:0.35}}
                      style={{
                        fontWeight:900,fontSize:"0.78rem",flexShrink:0,
                        fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap",
                      }}>
                      {fmtFull(e.clicks)}
                    </motion.span>
                  </motion.div>
                );
              })}
              </AnimatePresence>
              {!leaderboard.length&&(
                <div style={{fontWeight:700,textAlign:"center",padding:"32px 0",fontSize:"0.58rem",
                  letterSpacing:"0.3em",color:C.textFaint,textTransform:"uppercase"}}>aucune donnée</div>
              )}
            </div>
          </div>

        </div>

        {/* ── AMÉLIORATIONS — section indépendante sous la grille ── */}
        <div className="flex-shrink-0 rounded-2xl px-5 py-4 upgrades-section safe-bottom"
          style={{
            background:darkMode?"transparent":C.bgPanel,
            backdropFilter:darkMode?"none":"blur(16px)",WebkitBackdropFilter:darkMode?"none":"blur(16px)",
            border:darkMode?"none":`1.5px solid ${C.border}`,
            boxShadow:darkMode?"none":"0 2px 14px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.95)",
          }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontSize:"0.68rem",fontWeight:darkMode?900:800,letterSpacing:"0.32em",color:darkMode?"#A8C8FF":C.textSub,textTransform:"uppercase"}}>
              améliorations
            </span>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:"0.92rem",fontWeight:900,color:darkMode?"rgba(120,170,255,0.95)":"rgba(22,82,215,0.90)",letterSpacing:"-0.02em"}}>{fmtNum(available)}</span>
              <span style={{fontSize:"0.55rem",fontWeight:darkMode?800:700,color:darkMode?"#A8C8FF":"rgba(8,18,52,0.32)",letterSpacing:"0.12em",textTransform:"uppercase"}}>cachets dispo</span>
            </div>
          </div>
          <div className="upgrades-row" style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <UpCard dark={darkMode}
              label="Eau chaude" icon="🌡"
              desc={UPGRADES[0].desc(chaleur)}
              hint="Réduit le temps de reformation du cachet. Plus chaud = plus vite."
              cost={UPGRADES[0].cost(chaleur)}
              canBuy={chaleur<15&&available>=UPGRADES[0].cost(chaleur)}
              maxed={chaleur>=15}
              autoEnabled={autoChAchat}
              onBuy={buyChaleur}
              onToggleAuto={()=>setAutoChAchat(v=>!v)}
            />
            <UpCard dark={darkMode}
              label="Aide-soignant" icon="🩺"
              desc={aides>0?`×${aides} actif${aides>1?"s":""}·auto ${autoLabel||""} · niv ${aides}/25` : "clique à ta place · niv 0/25"}
              hint="Clique automatiquement. Chaque niveau = 1 cliqueur de plus. Le Catalyseur multiplie leurs cachets par clic."
              cost={UPGRADES[1].cost(aides)}
              canBuy={aides<25&&available>=UPGRADES[1].cost(aides)}
              maxed={aides>=25}
              autoEnabled={autoAideAchat}
              onBuy={buyAide}
              onToggleAuto={()=>setAutoAideAchat(v=>!v)}
            />
            <AnimatePresence>
              {phase>=1&&(
                <motion.div initial={{opacity:0,x:14}} animate={{opacity:1,x:0}}
                  transition={{duration:0.32,ease:[0.16,1,0.3,1]}}
                  style={{display:"contents"}}>
                  <UpCard dark={darkMode}
                    label="Labo R&D" icon="🔬"
                    desc={labo>0?`+${labo} cachet${labo>1?"s":""}/dissolution · niv ${labo}/10`:"+1 cachet/dissolution au niv 1 · niv 0/10"}
                    hint="Cadeau bonus à chaque dissolution : niv 1 = +1 cachet, niv 5 = +5, niv 10 = +10. Indépendant des clics."
                    cost={UPGRADES[2].cost(labo)}
                    canBuy={labo<10&&available>=UPGRADES[2].cost(labo)}
                    maxed={labo>=10}
                    autoEnabled={autoLaboAchat}
                    onBuy={buyLabo}
                    onToggleAuto={()=>setAutoLaboAchat(v=>!v)}
                  />
                  <UpCard dark={darkMode}
                    label="Catalyseur" icon="⚡"
                    desc={UPGRADES[3].desc(catalyseur)}
                    hint="Chaque clic automatique rapporte plus de cachets. Le clic manuel reste à 1. Toujours 20 clics pour dissoudre."
                    cost={CAT_COSTS[catalyseur+1]??0}
                    canBuy={catalyseur<3&&available>=(CAT_COSTS[catalyseur+1]??Infinity)}
                    maxed={catalyseur>=3}
                    autoEnabled={autoCatAchat}
                    onBuy={buyCatalyseur}
                    onToggleAuto={()=>setAutoCatAchat(v=>!v)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ── MODAL AUTH ── */}
      <AnimatePresence>
        {authStep!=="hidden"&&(
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{background:darkMode?"rgba(15,17,23,0.97)":"rgba(238,234,226,0.96)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)"}}>
            <motion.div
              initial={{scale:0.94,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}}
              exit={{scale:0.97,opacity:0}} transition={{duration:0.24,ease:[0.16,1,0.3,1]}}
              style={{background:darkMode?"rgba(25,28,38,0.97)":"rgba(255,255,255,0.90)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
                border:`1.5px solid ${C.border}`,
                boxShadow:"0 12px 64px rgba(40,80,200,0.13),inset 0 1px 0 rgba(255,255,255,0.05)",
                borderRadius:22,padding:"2.2rem",width:"100%",maxWidth:340}}>

              {/* Aspirine animée */}
              <div style={{width:42,height:42,marginBottom:20}}>
                <AspirinPill dissolve={0} recharging={false}/>
              </div>

              {/* ── ÉTAPE 1 : saisie du pseudo ── */}
              {authStep==="pseudo"&&(<>
                <div style={{fontSize:"clamp(1.2rem,3.5vw,1.65rem)",fontWeight:900,letterSpacing:"-0.04em",color:"#080e1e",marginBottom:6}}>
                  qui es-tu ?
                </div>
                <div style={{fontSize:"0.72rem",fontWeight:600,color:"rgba(8,18,52,0.45)",marginBottom:24}}>
                  Entre ton pseudo pour commencer ou reprendre.
                </div>
                <input type="text" value={authPseudo}
                  onChange={e=>{ setAuthPseudo(e.target.value); setAuthError(""); }}
                  onKeyDown={e=>e.key==="Enter"&&handleAuthPseudo()}
                  placeholder="ex: hxr_void…" maxLength={20} autoFocus
                  style={{width:"100%",padding:"0 0 10px",fontWeight:900,fontSize:"1.1rem",
                    border:"none",borderBottom:"2px solid rgba(8,18,52,0.15)",outline:"none",
                    marginBottom:24,background:"transparent",letterSpacing:"-0.02em",
                    color:"#080e1e",caretColor:"rgba(40,90,210,0.8)"}}/>
                <button onClick={handleAuthPseudo} disabled={!authPseudo.trim()||authLoading}
                  style={{width:"100%",padding:"14px 0",fontWeight:900,fontSize:"0.82rem",
                    letterSpacing:"0.2em",textTransform:"uppercase",
                    background:authPseudo.trim()&&!authLoading?"#080e1e":"transparent",
                    color:authPseudo.trim()&&!authLoading?"white":"#080e1e",
                    border:"2px solid #080e1e",borderRadius:12,
                    cursor:authPseudo.trim()&&!authLoading?"pointer":"default",
                    opacity:authPseudo.trim()&&!authLoading?1:0.22,transition:"all 0.15s"}}>
                  {authLoading?"…":"continuer"}
                </button>
              </>)}

              {/* ── ÉTAPE 2a : création ── */}
              {authStep==="create"&&(<>
                <div style={{fontSize:"clamp(1.2rem,3.5vw,1.65rem)",fontWeight:900,letterSpacing:"-0.04em",color:"#080e1e",marginBottom:6}}>
                  bienvenue,<br/><span style={{color:"rgba(40,90,210,0.85)"}}>{authPseudo}</span> !
                </div>
                <div style={{fontSize:"0.72rem",fontWeight:600,color:"rgba(8,18,52,0.45)",marginBottom:24}}>
                  Choisis un code à 4 chiffres.<br/>
                  <span style={{color:"rgba(200,80,60,0.8)",fontWeight:700}}>Note-le bien — il protège ta partie.</span>
                </div>
                <input type="text" inputMode="numeric" maxLength={4} value={authCode}
                  onChange={e=>{ setAuthCode(e.target.value.replace(/\D/g,"")); setAuthError(""); }}
                  onKeyDown={e=>e.key==="Enter"&&handleAuthCreate()}
                  placeholder="0000" autoFocus
                  style={{width:"100%",padding:"0 0 10px",fontWeight:900,fontSize:"2rem",
                    textAlign:"center",letterSpacing:"0.5em",
                    border:"none",borderBottom:"2px solid rgba(8,18,52,0.15)",outline:"none",
                    marginBottom:authError?8:24,background:"transparent",
                    color:"#080e1e",caretColor:"rgba(40,90,210,0.8)"}}/>
                {authError&&<div style={{fontSize:"0.65rem",fontWeight:700,color:"rgba(200,60,60,0.85)",marginBottom:16}}>{authError}</div>}
                <button onClick={handleAuthCreate} disabled={authCode.length!==4||authLoading}
                  style={{width:"100%",padding:"14px 0",fontWeight:900,fontSize:"0.82rem",
                    letterSpacing:"0.2em",textTransform:"uppercase",
                    background:authCode.length===4&&!authLoading?"#080e1e":"transparent",
                    color:authCode.length===4&&!authLoading?"white":"#080e1e",
                    border:"2px solid #080e1e",borderRadius:12,
                    cursor:authCode.length===4&&!authLoading?"pointer":"default",
                    opacity:authCode.length===4&&!authLoading?1:0.22,transition:"all 0.15s"}}>
                  {authLoading?"création…":"créer ma partie"}
                </button>
                <button onClick={()=>{ setAuthStep("pseudo"); setAuthCode(""); setAuthError(""); }}
                  style={{width:"100%",marginTop:8,padding:"8px 0",fontWeight:700,
                    fontSize:"0.62rem",letterSpacing:"0.25em",textTransform:"uppercase",
                    background:"none",border:"none",cursor:"pointer",color:"rgba(8,18,52,0.30)"}}>
                  ← retour
                </button>
              </>)}

              {/* ── ÉTAPE 2b : connexion ── */}
              {authStep==="login"&&(<>
                <div style={{fontSize:"clamp(1.2rem,3.5vw,1.65rem)",fontWeight:900,letterSpacing:"-0.04em",color:"#080e1e",marginBottom:6}}>
                  content de te revoir,<br/><span style={{color:"rgba(40,90,210,0.85)"}}>{authPseudo}</span> !
                </div>
                <div style={{fontSize:"0.72rem",fontWeight:600,color:"rgba(8,18,52,0.45)",marginBottom:24}}>
                  Entre ton code à 4 chiffres pour reprendre.
                </div>
                <input type="text" inputMode="numeric" maxLength={4} value={authCode}
                  onChange={e=>{ setAuthCode(e.target.value.replace(/\D/g,"")); setAuthError(""); }}
                  onKeyDown={e=>e.key==="Enter"&&handleAuthLogin()}
                  placeholder="0000" autoFocus
                  style={{width:"100%",padding:"0 0 10px",fontWeight:900,fontSize:"2rem",
                    textAlign:"center",letterSpacing:"0.5em",
                    border:"none",borderBottom:"2px solid rgba(8,18,52,0.15)",outline:"none",
                    marginBottom:authError?8:24,background:"transparent",
                    color:"#080e1e",caretColor:"rgba(40,90,210,0.8)"}}/>
                {authError&&<div style={{fontSize:"0.65rem",fontWeight:700,color:"rgba(200,60,60,0.85)",marginBottom:16}}>{authError}</div>}
                <button onClick={handleAuthLogin} disabled={authCode.length!==4||authLoading}
                  style={{width:"100%",padding:"14px 0",fontWeight:900,fontSize:"0.82rem",
                    letterSpacing:"0.2em",textTransform:"uppercase",
                    background:authCode.length===4&&!authLoading?"#080e1e":"transparent",
                    color:authCode.length===4&&!authLoading?"white":"#080e1e",
                    border:"2px solid #080e1e",borderRadius:12,
                    cursor:authCode.length===4&&!authLoading?"pointer":"default",
                    opacity:authCode.length===4&&!authLoading?1:0.22,transition:"all 0.15s"}}>
                  {authLoading?"connexion…":"rejoindre"}
                </button>
                <button onClick={()=>{ setAuthStep("pseudo"); setAuthCode(""); setAuthError(""); }}
                  style={{width:"100%",marginTop:8,padding:"8px 0",fontWeight:700,
                    fontSize:"0.62rem",letterSpacing:"0.25em",textTransform:"uppercase",
                    background:"none",border:"none",cursor:"pointer",color:"rgba(8,18,52,0.30)"}}>
                  ce n'est pas moi ←
                </button>
              </>)}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
