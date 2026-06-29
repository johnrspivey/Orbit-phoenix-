import { useState } from "react";

// Music Theory
const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_DISPLAY = n => ({'C#':'C#','D#':'Db','F#':'F#','G#':'Ab','A#':'Bb'}[n] || n);
const OPEN = [4,9,2,7,11,4];

function rootFret(rootStrIdx, keyNote) {
  const f = (NOTES.indexOf(keyNote) - OPEN[rootStrIdx] + 12) % 12;
  return f === 0 ? 12 : f;
}

const SHAPES = {
  E: { label:'E', youKnow:true, rootStr:0, tip:'Root on low E string. Your home base — the classic barre chord.',
    f:[{o:0,t:'root'},{o:2,t:'fifth'},{o:2,t:'root'},{o:1,t:'third'},{o:0,t:'fifth'},{o:0,t:'root'}] },
  A: { label:'A', youKnow:false, rootStr:1, tip:'Root on A string. Low E muted. D/G/B cluster 2 frets above root.',
    f:[{o:null,t:'mute'},{o:0,t:'root'},{o:2,t:'fifth'},{o:2,t:'root'},{o:2,t:'third'},{o:0,t:'fifth'}] },
  G: { label:'G', youKnow:false, rootStr:0, tip:'Root on low E and high e. Pinky stretches 3 frets above index.',
    f:[{o:3,t:'root'},{o:2,t:'third'},{o:0,t:'fifth'},{o:0,t:'root'},{o:0,t:'third'},{o:3,t:'root'}] },
  C: { label:'C', youKnow:false, rootStr:1, tip:'Root on A string. Low E muted. Fingers spread across 3 frets.',
    f:[{o:null,t:'mute'},{o:3,t:'root'},{o:2,t:'third'},{o:0,t:'fifth'},{o:1,t:'root'},{o:0,t:'third'}] },
  D: { label:'D', youKnow:false, rootStr:2, tip:'Root on D string. Low E and A muted. Compact shape on top 4 strings.',
    f:[{o:null,t:'mute'},{o:null,t:'mute'},{o:0,t:'root'},{o:2,t:'fifth'},{o:3,t:'root'},{o:2,t:'third'}] },
};

function getBaseFret(shape, key) {
  return rootFret(shape.rootStr, key) - shape.f[shape.rootStr].o;
}

const STRING_NAMES = ['E','A','D','G','B','e'];
const DOT_COLORS = { root:'#e05c5c', third:'#c8a84b', fifth:'#5ca8e0' };
const DOT_TEXT   = { root:'R', third:'3', fifth:'5' };

function Fretboard({ shape, keyNote }) {
  const base = getBaseFret(shape, keyNote);
  const maxOff = Math.max(...shape.f.filter(s=>s.o!==null).map(s=>s.o));
  const numFrets = Math.max(maxOff + 1, 4);
  const LEFT=36, RIGHT=32, TOP=28, FRET_H=44, STR_W=36, nStrings=6;
  const W = LEFT + (nStrings-1)*STR_W + RIGHT;
  const H = TOP + numFrets*FRET_H + 8;
  const sx = i => LEFT + i*STR_W;
  const fy = f => TOP + f*FRET_H;
  const dotY = f => TOP + (f+0.5)*FRET_H;
  const showNut = base <= 1;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',maxWidth:320,margin:'0 auto'}}>
      {STRING_NAMES.map((name,i)=>(
        <text key={i} x={sx(i)} y={TOP-8} textAnchor="middle" fontSize="11" fill="#666" fontFamily="monospace">{name}</text>
      ))}
      {showNut ? <rect x={sx(0)} y={TOP} width={sx(5)-sx(0)} height={5} fill="#bbb" rx={2}/>
        : <text x={sx(0)-6} y={TOP+FRET_H*0.55} fontSize="10" fill="#555" fontFamily="monospace" textAnchor="end">{base}</text>}
      {Array.from({length:numFrets}).map((_,f)=>(
        <line key={f} x1={sx(0)} y1={fy(f+1)} x2={sx(5)} y2={fy(f+1)} stroke="#3a3a3a" strokeWidth={2}/>
      ))}
      {Array.from({length:nStrings}).map((_,i)=>(
        <line key={i} x1={sx(i)} y1={TOP+(showNut?5:0)} x2={sx(i)} y2={fy(numFrets)} stroke="#555" strokeWidth={1}/>
      ))}
      {Array.from({length:numFrets}).map((_,f)=>{
        const fn=base+f; if(!showNut||fn>0) return (
          <text key={f} x={sx(5)+10} y={fy(f+1)-2} fontSize="10" fill="#555" fontFamily="monospace" dominantBaseline="auto">{fn}</text>
        ); return null;
      })}
      {shape.f.map((s,i)=>s.o===null?(
        <text key={i} x={sx(i)} y={dotY(0)} fontSize="13" fill="#888" textAnchor="middle" dominantBaseline="middle">x</text>
      ):null)}
      {shape.f.map((s,i)=>s.o===null?null:(
        <g key={i}>
          <circle cx={sx(i)} cy={dotY(s.o)} r={13} fill={DOT_COLORS[s.t]}/>
          <text x={sx(i)} y={dotY(s.o)} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontWeight="700" fontFamily="monospace" fill={s.t==='third'?'#000':'#fff'}>{DOT_TEXT[s.t]}</text>
        </g>
      ))}
    </svg>
  );
}

const KEYS = ['C','D','E','F','G','A','B','C#','D#','F#','G#','A#'];

export default function CAGEDExplorer() {
  const [selShape, setShape] = useState('E');
  const [selKey,   setKey]   = useState('C');
  const shape=SHAPES[selShape], ki=NOTES.indexOf(selKey);
  const third=NOTES[(ki+4)%12], fifth=NOTES[(ki+7)%12];
  const base=getBaseFret(shape,selKey), rf=rootFret(shape.rootStr,selKey);
  return (
    <div style={{background:'#0e0e0e',minHeight:'100vh',color:'#e8e8e8',fontFamily:'system-ui,sans-serif',padding:16,maxWidth:480,margin:'0 auto'}}>
      <div style={{marginBottom:16,borderBottom:'1px solid #222',paddingBottom:14}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,color:'#c8a84b',letterSpacing:'0.05em'}}>CAGED Explorer</div>
        <div style={{fontSize:'0.75rem',color:'#666',marginTop:2}}>Every major chord · Every shape · Every position</div>
      </div>
      <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>Shape</div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:16}}>
        {Object.keys(SHAPES).map(k=>(
          <button key={k} onClick={()=>setShape(k)} style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,
            padding:'7px 14px',borderRadius:6,cursor:'pointer',
            border:k===selShape?'2px solid #c8a84b':'2px solid #2e2e2e',
            background:k===selShape?'#c8a84b':'#1a1a1a',color:k===selShape?'#000':'#888'}}>
            {k}{SHAPES[k].youKnow?' *':''}
          </button>
        ))}
      </div>
      <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>Chord</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18}}>
        {KEYS.map(k=>(
          <button key={k} onClick={()=>setKey(k)} style={{fontFamily:'monospace',fontSize:'0.8rem',
            padding:'5px 9px',borderRadius:4,cursor:'pointer',minWidth:36,
            border:k===selKey?'1px solid #7ec8a4':'1px solid #2e2e2e',
            background:k===selKey?'#7ec8a4':'#1a1a1a',color:k===selKey?'#000':'#888',fontWeight:k===selKey?700:400}}>
            {NOTE_DISPLAY(k)}
          </button>
        ))}
      </div>
      <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:'12px 14px',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:14,flexWrap:'wrap',marginBottom:10}}>
          <div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'2.2rem',fontWeight:700,color:'#e8e8e8',lineHeight:1}}>{NOTE_DISPLAY(selKey)} Major</div>
            <div style={{display:'inline-block',marginTop:5,padding:'2px 9px',border:'1px solid #c8a84b',borderRadius:4,color:'#c8a84b',fontSize:'0.78rem',fontFamily:'Georgia,serif'}}>
              {shape.label} Shape{shape.youKnow?' · * Your home base':''}
            </div>
          </div>
          <div style={{marginBottom:8,textAlign:'center'}}>
            <div style={{fontSize:'0.65rem',color:'#555',fontFamily:'monospace'}}>base fret</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'2rem',color:'#c8a84b',lineHeight:1}}>{base===0?'open':base}</div>
          </div>
        </div>
        {[['Root',<span style={{color:'#e05c5c',fontWeight:700}}>{selKey} - {STRING_NAMES[shape.rootStr]} string, fret {rf}</span>],
          ['3rd', <span style={{color:'#c8a84b'}}>{third}</span>],
          ['5th', <span style={{color:'#5ca8e0'}}>{fifth}</span>],
          ['Tip', <span style={{color:'#aaa'}}>{shape.tip}</span>]].map(([label,val])=>(
          <div key={label} style={{display:'flex',gap:8,marginBottom:6,fontSize:'0.8rem',lineHeight:1.5}}>
            <span style={{color:'#c8a84b',fontFamily:'monospace',fontSize:'0.72rem',minWidth:44,paddingTop:1,flexShrink:0}}>{label}</span>
            {val}
          </div>
        ))}
      </div>
      <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:16,marginBottom:14}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'0.95rem',color:'#c8a84b',letterSpacing:'0.05em',marginBottom:14}}>
          {NOTE_DISPLAY(selKey)} Major · {shape.label} Shape · position {base===0?'open':base}
        </div>
        <Fretboard shape={shape} keyNote={selKey}/>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
          {[['#e05c5c','#fff','R',`Root (${selKey})`],['#c8a84b','#000','3',`3rd (${third})`],['#5ca8e0','#fff','5',`5th (${fifth})`]].map(([bg,fg,sym,lbl])=>(
            <div key={lbl} style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.72rem',color:'#aaa'}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',fontWeight:700,color:fg,flexShrink:0}}>{sym}</div>
              {lbl}
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.72rem',color:'#aaa'}}><span style={{color:'#888',fontSize:'0.95rem'}}>x</span> Muted</div>
        </div>
      </div>
      <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:14}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'0.85rem',color:'#7ec8a4',letterSpacing:'0.05em',marginBottom:10}}>All 5 positions for {NOTE_DISPLAY(selKey)} Major</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>
          {Object.keys(SHAPES).map(k=>{
            const bf=getBaseFret(SHAPES[k],selKey), active=k===selShape;
            return (
              <div key={k} onClick={()=>setShape(k)} style={{cursor:'pointer',padding:'8px 4px',borderRadius:6,textAlign:'center',
                border:active?'1px solid #c8a84b':'1px solid #2e2e2e',background:active?'rgba(200,168,75,0.1)':'#1e1e1e'}}>
                <div style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,color:active?'#c8a84b':'#888'}}>{k}</div>
                <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#555'}}>fret {bf===0?'open':bf}</div>
                {SHAPES[k].youKnow&&<div style={{fontSize:'0.55rem',color:'#e05c5c',marginTop:2}}>* yours</div>}
              </div>
            );
          })}
        </div>
        <p style={{fontSize:'0.7rem',color:'#444',marginTop:10,lineHeight:1.5}}>Same {NOTE_DISPLAY(selKey)} chord — 5 different neck positions. Tap any to explore.</p>
      </div>
    </div>
  );
}
