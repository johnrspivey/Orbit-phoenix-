import { useState } from "react";

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_DISPLAY = n => ({'C#':'C#','D#':'Db','F#':'F#','G#':'Ab','A#':'Bb'}[n] || n);
const OPEN = [4,9,2,7,11,4];
const STRING_NAMES = ['E','A','D','G','B','e'];
function noteAt(strIdx, fret) { return NOTES[(OPEN[strIdx] + fret) % 12]; }
function toneType(note, root) {
  const interval = (NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12;
  if (interval === 0) return 'root'; if (interval === 4) return 'third'; if (interval === 7) return 'fifth'; return null;
}
const DOT_COLORS = { root:'#e05c5c', third:'#c8a84b', fifth:'#5ca8e0' };
const DOT_TEXT   = { root:'R', third:'3', fifth:'5' };
const DOT_FG     = { root:'#fff', third:'#000', fifth:'#fff' };
const SHAPES = {
  E: { rootStr:0, f:[{o:0,t:'root'},{o:2,t:'fifth'},{o:2,t:'root'},{o:1,t:'third'},{o:0,t:'fifth'},{o:0,t:'root'}] },
  A: { rootStr:1, f:[{o:null,t:'mute'},{o:0,t:'root'},{o:2,t:'fifth'},{o:2,t:'root'},{o:2,t:'third'},{o:0,t:'fifth'}] },
  G: { rootStr:0, f:[{o:3,t:'root'},{o:2,t:'third'},{o:0,t:'fifth'},{o:0,t:'root'},{o:0,t:'third'},{o:3,t:'root'}] },
  C: { rootStr:1, f:[{o:null,t:'mute'},{o:3,t:'root'},{o:2,t:'third'},{o:0,t:'fifth'},{o:1,t:'root'},{o:0,t:'third'}] },
  D: { rootStr:2, f:[{o:null,t:'mute'},{o:null,t:'mute'},{o:0,t:'root'},{o:2,t:'fifth'},{o:3,t:'root'},{o:2,t:'third'}] },
};
function getRootFret(shape,key){const f=(NOTES.indexOf(key)-OPEN[shape.rootStr]+12)%12;return f===0?12:f;}
function getBaseFret(shape,key){return getRootFret(shape,key)-shape.f[shape.rootStr].o;}
function Fretboard({dots,mutes=[],startFret,numFrets=5,allSixStrings=false,activeStrings=null}){
  const showStrings=allSixStrings?[0,1,2,3,4,5]:(activeStrings||[...new Set(dots.map(d=>d.strIdx).concat(mutes))].sort((a,b)=>a-b));
  const LEFT=36,RIGHT=32,TOP=28,FRET_H=44,STR_W=36,n=showStrings.length;
  const W=LEFT+(n-1)*STR_W+RIGHT,H=TOP+numFrets*FRET_H+8;
  const sx=i=>LEFT+showStrings.indexOf(i)*STR_W,fy=f=>TOP+f*FRET_H,dotY=f=>TOP+(f-startFret+0.5)*FRET_H,showNut=startFret<=1;
  return(<svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',maxWidth:340,margin:'0 auto'}}>
    {showStrings.map((si,i)=>(<text key={si} x={LEFT+i*STR_W} y={TOP-8} textAnchor="middle" fontSize="11" fill="#666" fontFamily="monospace">{STRING_NAMES[si]}</text>))}
    {showNut?<rect x={LEFT} y={TOP} width={(n-1)*STR_W} height={5} fill="#bbb" rx={2}/>:<text x={LEFT-6} y={TOP+FRET_H*0.55} fontSize="10" fill="#555" fontFamily="monospace" textAnchor="end">{startFret}</text>}
    {Array.from({length:numFrets}).map((_,f)=>(<line key={f} x1={LEFT} y1={fy(f+1)} x2={LEFT+(n-1)*STR_W} y2={fy(f+1)} stroke="#3a3a3a" strokeWidth={2}/>))}
    {showStrings.map((si,i)=>(<line key={si} x1={LEFT+i*STR_W} y1={TOP+(showNut?5:0)} x2={LEFT+i*STR_W} y2={fy(numFrets)} stroke="#555" strokeWidth={1}/>))}
    {Array.from({length:numFrets}).map((_,f)=>{const fn=startFret+f+1;if(fn<=0)return null;return(<text key={f} x={LEFT+(n-1)*STR_W+10} y={fy(f+1)-2} fontSize="10" fill="#555" fontFamily="monospace" dominantBaseline="auto">{fn}</text>);})}
    {mutes.map(si=>!showStrings.includes(si)?null:(<text key={si} x={sx(si)} y={TOP-8} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#888">x</text>))}
    {dots.map((d,idx)=>!showStrings.includes(d.strIdx)?null:(<g key={idx}><circle cx={sx(d.strIdx)} cy={dotY(d.fret)} r={13} fill={DOT_COLORS[d.type]}/><text x={sx(d.strIdx)} y={dotY(d.fret)} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fontFamily="monospace" fill={DOT_FG[d.type]}>{DOT_TEXT[d.type]}</text></g>))}
  </svg>);}
function getDoubleStops(sA,sB,key,startFret){const results=[];for(let fA=startFret;fA<=startFret+4;fA++)for(let fB=startFret;fB<=startFret+4;fB++){if(Math.abs(fA-fB)>3)continue;const tA=toneType(noteAt(sA,fA),key),tB=toneType(noteAt(sB,fB),key);if(tA&&tB)results.push({fA,fB,tA,tB});}return results;}
function getTriads(strings,key,startFret){const[sA,sB,sC]=strings,results=[],seen=new Set();for(let fA=startFret;fA<=startFret+5;fA++)for(let fB=startFret;fB<=startFret+5;fB++)for(let fC=startFret;fC<=startFret+5;fC++){if(Math.max(fA,fB,fC)-Math.min(fA,fB,fC)>4)continue;const tA=toneType(noteAt(sA,fA),key),tB=toneType(noteAt(sB,fB),key),tC=toneType(noteAt(sC,fC),key),types=new Set([tA,tB,tC]);if(types.has('root')&&types.has('third')&&types.has('fifth')){const sig=`${fA}-${fB}-${fC}`;if(!seen.has(sig)){seen.add(sig);results.push({frets:[fA,fB,fC],types:[tA,tB,tC]});}}}return results;}
function Legend({selKey}){const ki=NOTES.indexOf(selKey),third=NOTES[(ki+4)%12],fifth=NOTES[(ki+7)%12];return(<div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:16}}>{[['root',`Root (${selKey})`],['third',`3rd (${third})`],['fifth',`5th (${fifth})`]].map(([t,lbl])=>(<div key={t} style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.72rem',color:'#aaa'}}><div style={{width:18,height:18,borderRadius:'50%',background:DOT_COLORS[t],display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:700,color:DOT_FG[t],flexShrink:0}}>{DOT_TEXT[t]}</div>{lbl}</div>))}</div>);}
function DiagramCard({title,children}){return(<div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:16,marginBottom:14}}>{title&&<div style={{fontFamily:'Georgia,serif',fontSize:'0.88rem',color:'#c8a84b',letterSpacing:'0.04em',marginBottom:12}}>{title}</div>}{children}</div>);}
function Pager({index,total,onPrev,onNext,label}){return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10}}><button onClick={onPrev} disabled={index===0} style={{padding:'5px 14px',borderRadius:5,cursor:'pointer',fontSize:'0.8rem',border:'1px solid #2e2e2e',background:'#141414',color:index===0?'#333':'#aaa'}}>Prev</button><span style={{fontSize:'0.72rem',color:'#555',fontFamily:'monospace'}}>{label}</span><button onClick={onNext} disabled={index===total-1} style={{padding:'5px 14px',borderRadius:5,cursor:'pointer',fontSize:'0.8rem',border:'1px solid #2e2e2e',background:'#141414',color:index===total-1?'#333':'#aaa'}}>Next</button></div>);}
const NECK_POSITIONS=[0,2,4,5,7,9,11,12,14,16,19];
const STRING_PAIRS=[[0,1],[1,2],[2,3],[3,4],[4,5]];
const TRIAD_SETS=[[0,1,2],[1,2,3],[2,3,4],[3,4,5]];
function ViewByKey({selKey}){
  const[mode,setMode]=useState('double'),[posIdx,setPosIdx]=useState(0),[itemIdx,setItemIdx]=useState(0);
  const start=NECK_POSITIONS[posIdx],items=[];
  if(mode==='double'){STRING_PAIRS.forEach(([sA,sB])=>{getDoubleStops(sA,sB,selKey,start).slice(0,2).forEach(d=>{const mutes=[0,1,2,3,4,5].filter(s=>s!==sA&&s!==sB);items.push({title:`${STRING_NAMES[sA]} + ${STRING_NAMES[sB]} strings`,dots:[{strIdx:sA,fret:d.fA,type:d.tA},{strIdx:sB,fret:d.fB,type:d.tB}],mutes,startFret:Math.max(0,Math.min(d.fA,d.fB)-1),numFrets:4,allSixStrings:true});});});}
  else{TRIAD_SETS.forEach(strings=>{getTriads(strings,selKey,start).slice(0,2).forEach(tri=>{items.push({title:`${strings.map(s=>STRING_NAMES[s]).join(' + ')} strings`,dots:tri.frets.map((f,i)=>({strIdx:strings[i],fret:f,type:tri.types[i]})),mutes:[0,1,2,3,4,5].filter(s=>!strings.includes(s)),startFret:Math.max(0,Math.min(...tri.frets)-1),numFrets:5,allSixStrings:true});});});}
  const safeIdx=Math.min(itemIdx,Math.max(0,items.length-1)),cur=items[safeIdx]||null;
  return(<div>
    <div style={{display:'flex',gap:8,marginBottom:14}}>{['double','triad'].map(m=>(<button key={m} onClick={()=>{setMode(m);setItemIdx(0);}} style={{padding:'6px 16px',borderRadius:6,cursor:'pointer',fontSize:'0.8rem',border:m===mode?'1px solid #c8a84b':'1px solid #2e2e2e',background:m===mode?'rgba(200,168,75,0.15)':'#1a1a1a',color:m===mode?'#c8a84b':'#666'}}>{m==='double'?'Double Stops':'Triads'}</button>))}</div>
    <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>Neck Position</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>{NECK_POSITIONS.map((p,i)=>(<button key={i} onClick={()=>{setPosIdx(i);setItemIdx(0);}} style={{fontFamily:'monospace',fontSize:'0.78rem',padding:'5px 10px',borderRadius:4,cursor:'pointer',border:i===posIdx?'1px solid #7ec8a4':'1px solid #2e2e2e',background:i===posIdx?'#7ec8a4':'#1a1a1a',color:i===posIdx?'#000':'#888'}}>{p===0?'Open':p===12?'12th':`${p}th`}</button>))}</div>
    {cur?(<DiagramCard title={`${NOTE_DISPLAY(selKey)} Major · ${cur.title}`}><Fretboard dots={cur.dots} mutes={cur.mutes||[]} startFret={cur.startFret} numFrets={cur.numFrets} allSixStrings={true}/><Pager index={safeIdx} total={items.length} onPrev={()=>setItemIdx(i=>Math.max(0,i-1))} onNext={()=>setItemIdx(i=>Math.min(items.length-1,i+1))} label={`${safeIdx+1} of ${items.length}`}/></DiagramCard>
    ):(<div style={{color:'#555',fontSize:'0.8rem',padding:16}}>No {mode==='double'?'double stops':'triads'} found. Try another position.</div>)}
  </div>);}
function ViewByStringSet({selKey}){
  const[mode,setMode]=useState('double'),[strSel,setStrSel]=useState('4-5'),[itemIdx,setItemIdx]=useState(0);
  const doublePairs=[{id:'0-1',label:'E+A',strings:[0,1]},{id:'1-2',label:'A+D',strings:[1,2]},{id:'2-3',label:'D+G',strings:[2,3]},{id:'3-4',label:'G+B',strings:[3,4]},{id:'4-5',label:'B+e',strings:[4,5]}];
  const triadSets=[{id:'0-1-2',label:'E+A+D',strings:[0,1,2]},{id:'1-2-3',label:'A+D+G',strings:[1,2,3]},{id:'2-3-4',label:'D+G+B',strings:[2,3,4]},{id:'3-4-5',label:'G+B+e',strings:[3,4,5]}];
  const options=mode==='double'?doublePairs:triadSets,selOpt=options.find(o=>o.id===strSel)||options[0],items=[];
  NECK_POSITIONS.forEach(start=>{if(mode==='double'){const[sA,sB]=selOpt.strings;getDoubleStops(sA,sB,selKey,start).slice(0,1).forEach(d=>{items.push({title:`fret ${start===0?'open':start}`,dots:[{strIdx:sA,fret:d.fA,type:d.tA},{strIdx:sB,fret:d.fB,type:d.tB}],mutes:[0,1,2,3,4,5].filter(s=>s!==sA&&s!==sB),startFret:Math.max(0,Math.min(d.fA,d.fB)-1),numFrets:4,allSixStrings:true});});}else{getTriads(selOpt.strings,selKey,start).slice(0,1).forEach(tri=>{items.push({title:`fret ${start===0?'open':start}`,dots:tri.frets.map((f,i)=>({strIdx:selOpt.strings[i],fret:f,type:tri.types[i]})),mutes:[0,1,2,3,4,5].filter(s=>!selOpt.strings.includes(s)),startFret:Math.max(0,Math.min(...tri.frets)-1),numFrets:5,allSixStrings:true});});}});
  const safeIdx=Math.min(itemIdx,Math.max(0,items.length-1)),cur=items[safeIdx]||null;
  return(<div>
    <div style={{display:'flex',gap:8,marginBottom:14}}>{['double','triad'].map(m=>(<button key={m} onClick={()=>{setMode(m);setStrSel(m==='double'?'4-5':'3-4-5');setItemIdx(0);}} style={{padding:'6px 16px',borderRadius:6,cursor:'pointer',fontSize:'0.8rem',border:m===mode?'1px solid #c8a84b':'1px solid #2e2e2e',background:m===mode?'rgba(200,168,75,0.15)':'#1a1a1a',color:m===mode?'#c8a84b':'#666'}}>{m==='double'?'Double Stops':'Triads'}</button>))}</div>
    <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>String Set</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>{options.map(o=>(<button key={o.id} onClick={()=>{setStrSel(o.id);setItemIdx(0);}} style={{fontFamily:'monospace',fontSize:'0.8rem',padding:'5px 12px',borderRadius:4,cursor:'pointer',border:o.id===selOpt.id?'1px solid #7ec8a4':'1px solid #2e2e2e',background:o.id===selOpt.id?'#7ec8a4':'#1a1a1a',color:o.id===selOpt.id?'#000':'#888'}}>{o.label}</button>))}</div>
    {cur?(<DiagramCard title={`${NOTE_DISPLAY(selKey)} Major · ${selOpt.label} · ${cur.title}`}><Fretboard dots={cur.dots} mutes={cur.mutes||[]} startFret={cur.startFret} numFrets={cur.numFrets} allSixStrings={true}/><Pager index={safeIdx} total={items.length} onPrev={()=>setItemIdx(i=>Math.max(0,i-1))} onNext={()=>setItemIdx(i=>Math.min(items.length-1,i+1))} label={`Position ${safeIdx+1} of ${items.length}`}/></DiagramCard>
    ):(<div style={{color:'#555',fontSize:'0.8rem',padding:16}}>Nothing found. Try another string set.</div>)}
  </div>);}
function ViewByCAGED({selKey}){
  const[selShape,setSelShape]=useState('E'),[itemIdx,setItemIdx]=useState(0),[mode,setMode]=useState('both');
  const shape=SHAPES[selShape],base=getBaseFret(shape,selKey);
  const activeDots=shape.f.map((s,i)=>({strIdx:i,fret:s.o===null?null:base+s.o,type:s.t,offset:s.o})).filter(d=>d.fret!==null);
  const mutes=shape.f.map((s,i)=>s.o===null?i:null).filter(x=>x!==null);
  const minFret=Math.min(...activeDots.map(d=>d.fret)),maxOffset=Math.max(...shape.f.filter(s=>s.o!==null).map(s=>s.o));
  const items=[{title:`Full ${selShape} shape — ${NOTE_DISPLAY(selKey)} Major`,dots:activeDots.map(d=>({strIdx:d.strIdx,fret:d.fret,type:d.type})),mutes,startFret:Math.max(0,minFret-1),numFrets:maxOffset+2,allSixStrings:true,isShape:true}];
  if(mode!=='triad'){for(let i=0;i<activeDots.length-1;i++){const a=activeDots[i],b=activeDots[i+1];if(b.strIdx-a.strIdx===1){items.push({title:`Double stop · ${STRING_NAMES[a.strIdx]}+${STRING_NAMES[b.strIdx]} · ${DOT_TEXT[a.type]}+${DOT_TEXT[b.type]}`,dots:[{strIdx:a.strIdx,fret:a.fret,type:a.type},{strIdx:b.strIdx,fret:b.fret,type:b.type}],mutes:[0,1,2,3,4,5].filter(s=>s!==a.strIdx&&s!==b.strIdx),startFret:Math.max(0,Math.min(a.fret,b.fret)-1),numFrets:4,allSixStrings:true});}}}
  if(mode!=='double'){for(let i=0;i<activeDots.length-2;i++){const a=activeDots[i],b=activeDots[i+1],c=activeDots[i+2];if(c.strIdx-a.strIdx===2){const types=new Set([a.type,b.type,c.type]);if(types.has('root')&&types.has('third')&&types.has('fifth')){items.push({title:`Triad · ${[a,b,c].map(d=>STRING_NAMES[d.strIdx]).join('+')} strings`,dots:[a,b,c].map(d=>({strIdx:d.strIdx,fret:d.fret,type:d.type})),mutes:[0,1,2,3,4,5].filter(s=>s!==a.strIdx&&s!==b.strIdx&&s!==c.strIdx),startFret:Math.max(0,Math.min(a.fret,b.fret,c.fret)-1),numFrets:5,allSixStrings:true});}}}}
  const safeIdx=Math.min(itemIdx,items.length-1),cur=items[safeIdx];
  return(<div>
    <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>CAGED Shape</div>
    <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:14}}>{Object.keys(SHAPES).map(k=>(<button key={k} onClick={()=>{setSelShape(k);setItemIdx(0);}} style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,padding:'7px 14px',borderRadius:6,cursor:'pointer',border:k===selShape?'2px solid #c8a84b':'2px solid #2e2e2e',background:k===selShape?'#c8a84b':'#1a1a1a',color:k===selShape?'#000':'#888'}}>{k}</button>))}</div>
    <div style={{display:'flex',gap:6,marginBottom:16}}>{[['both','All'],['double','Double Stops'],['triad','Triads']].map(([m,lbl])=>(<button key={m} onClick={()=>{setMode(m);setItemIdx(m==='both'?0:1);}} style={{padding:'5px 12px',borderRadius:5,cursor:'pointer',fontSize:'0.75rem',border:m===mode?'1px solid #c8a84b':'1px solid #2e2e2e',background:m===mode?'rgba(200,168,75,0.15)':'#1a1a1a',color:m===mode?'#c8a84b':'#666'}}>{lbl}</button>))}</div>
    {cur&&(<DiagramCard title={cur.title}><Fretboard dots={cur.dots} mutes={cur.mutes||[]} startFret={cur.startFret} numFrets={cur.numFrets} allSixStrings={cur.allSixStrings||false} activeStrings={cur.activeStrings||null}/><Pager index={safeIdx} total={items.length} onPrev={()=>setItemIdx(i=>Math.max(0,i-1))} onNext={()=>setItemIdx(i=>Math.min(items.length-1,i+1))} label={`${safeIdx+1} of ${items.length}`}/></DiagramCard>)}
    <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:14,marginTop:4}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:'0.8rem',color:'#7ec8a4',marginBottom:10}}>{NOTE_DISPLAY(selKey)} Major across all shapes</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>{Object.keys(SHAPES).map(k=>{const bf=getBaseFret(SHAPES[k],selKey),active=k===selShape;return(<div key={k} onClick={()=>{setSelShape(k);setItemIdx(0);}} style={{cursor:'pointer',padding:'8px 4px',borderRadius:6,textAlign:'center',border:active?'1px solid #c8a84b':'1px solid #2e2e2e',background:active?'rgba(200,168,75,0.1)':'#1e1e1e'}}><div style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,color:active?'#c8a84b':'#888'}}>{k}</div><div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#555'}}>fret {bf===0?'open':bf}</div></div>);})}</div>
    </div>
  </div>);}
const PAIR_INFO=[{id:'0-1',label:'E + A',strings:[0,1],tuning:'4th apart (standard)'},{id:'1-2',label:'A + D',strings:[1,2],tuning:'4th apart (standard)'},{id:'2-3',label:'D + G',strings:[2,3],tuning:'4th apart (standard)'},{id:'3-4',label:'G + B',strings:[3,4],tuning:'3rd apart — the odd one'},{id:'4-5',label:'B + e',strings:[4,5],tuning:'4th apart (standard)'}];
function BigPictureFretboard({strings,keyNote}){
  const[sA,sB]=strings,FRETS=24,FRET_H=32,STR_W=36,LEFT=28,TOP=24;
  const W=LEFT+5*STR_W+20,H=TOP+FRETS*FRET_H+16;
  const DISPLAY_ORDER=[0,1,2,3,4,5];
  const sx=si=>LEFT+DISPLAY_ORDER.indexOf(si)*STR_W,fretTop=f=>TOP+(f-1)*FRET_H,dotY=f=>TOP+(f-0.5)*FRET_H;
  const allDots={};DISPLAY_ORDER.forEach(si=>{allDots[si]=[];for(let f=1;f<=FRETS;f++){const t=toneType(noteAt(si,f),keyNote);if(t)allDots[si].push({f,t});}});
  const pairs=[];allDots[sA].forEach(a=>{allDots[sB].forEach(b=>{if(Math.abs(a.f-b.f)<=3)pairs.push({fA:a.f,fB:b.f});});});
  const isActive=si=>si===sA||si===sB;
  return(<svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',maxWidth:W*1.4,margin:'0 auto'}}>
    {DISPLAY_ORDER.map(si=>(<text key={si} x={sx(si)} y={TOP-8} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={isActive(si)?'#e8e8e8':'#333'}>{STRING_NAMES[si]}</text>))}
    <rect x={LEFT} y={TOP} width={5*STR_W} height={4} fill="#aaa" rx={1}/>
    {Array.from({length:FRETS}).map((_,f)=>(<line key={f} x1={LEFT} y1={fretTop(f+1)} x2={LEFT+5*STR_W} y2={fretTop(f+1)} stroke="#2e2e2e" strokeWidth={1.5}/>))}
    {DISPLAY_ORDER.map(si=>(<line key={si} x1={sx(si)} y1={TOP+4} x2={sx(si)} y2={TOP+FRETS*FRET_H} stroke={isActive(si)?'#666':'#222'} strokeWidth={1}/>))}
    {Array.from({length:FRETS}).map((_,f)=>(<text key={f} x={LEFT-5} y={dotY(f+1)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#444" fontFamily="monospace">{f+1}</text>))}
    {[3,5,7,9,15,17,19,21].map(f=>(<circle key={f} cx={LEFT+2.5*STR_W} cy={dotY(f)} r={4} fill="#2a2a2a"/>))}
    {[12,24].map(f=>(<g key={f}><circle cx={LEFT+1.5*STR_W} cy={dotY(f)} r={4} fill="#2a2a2a"/><circle cx={LEFT+3.5*STR_W} cy={dotY(f)} r={4} fill="#2a2a2a"/></g>))}
    {pairs.map((p,i)=>(<line key={i} x1={sx(sA)} y1={dotY(p.fA)} x2={sx(sB)} y2={dotY(p.fB)} stroke="#444" strokeWidth={2}/>))}
    {DISPLAY_ORDER.filter(si=>!isActive(si)).map(si=>allDots[si].map((d,i)=>(<circle key={`${si}-${i}`} cx={sx(si)} cy={dotY(d.f)} r={10} fill="#222" stroke="#333" strokeWidth={1}/>)))}
    {[sA,sB].map(si=>allDots[si].map((d,i)=>(<g key={`${si}-${i}`}><circle cx={sx(si)} cy={dotY(d.f)} r={13} fill={DOT_COLORS[d.t]}/><text x={sx(si)} y={dotY(d.f)} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fontFamily="monospace" fill={DOT_FG[d.t]}>{DOT_TEXT[d.t]}</text></g>)))}
  </svg>);}
function ViewBigPicture({selKey}){
  const[selPair,setPair]=useState('4-5');
  const pair=PAIR_INFO.find(p=>p.id===selPair)||PAIR_INFO[0];
  const ki=NOTES.indexOf(selKey),third=NOTES[(ki+4)%12],fifth=NOTES[(ki+7)%12];
  return(<div>
    <div style={{color:'#aaa',fontSize:'0.8rem',lineHeight:1.6,marginBottom:14}}>Every chord tone on both strings across the whole neck. Lines connect valid double stop pairs.</div>
    <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>String Pair</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>{PAIR_INFO.map(p=>(<button key={p.id} onClick={()=>setPair(p.id)} style={{fontFamily:'monospace',fontSize:'0.8rem',padding:'5px 12px',borderRadius:4,cursor:'pointer',border:p.id===selPair?'1px solid #7ec8a4':'1px solid #2e2e2e',background:p.id===selPair?'#7ec8a4':'#1a1a1a',color:p.id===selPair?'#000':'#888'}}>{p.label}</button>))}</div>
    <div style={{fontSize:'0.72rem',color:'#555',marginBottom:12,fontFamily:'monospace'}}>{pair.tuning}{pair.id==='3-4'&&<span style={{color:'#e05c5c'}}> — shapes differ from other pairs here</span>}</div>
    <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:'14px 8px',marginBottom:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:'0.88rem',color:'#c8a84b',marginBottom:12,paddingLeft:8}}>{NOTE_DISPLAY(selKey)} Major · {pair.label} strings · full neck</div>
      <BigPictureFretboard strings={pair.strings} keyNote={selKey}/>
    </div>
    <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:'0.85rem',color:'#7ec8a4',marginBottom:10}}>How to read this</div>
      <div style={{fontSize:'0.78rem',color:'#aaa',lineHeight:1.7}}>
        Every <span style={{color:DOT_COLORS.root,fontWeight:700}}>red R</span> is a root ({selKey}). Every <span style={{color:DOT_COLORS.third,fontWeight:700}}>gold 3</span> is the major 3rd ({third}). Every <span style={{color:DOT_COLORS.fifth,fontWeight:700}}>blue 5</span> is the 5th ({fifth}).<br/><br/>
        Lines connect dots close enough to finger together — those are your double stops. Notice how the pattern repeats every 12 frets.
      </div>
    </div>
  </div>);}
const KEYS=['C','D','E','F','G','A','B','C#','D#','F#','G#','A#'];
const VIEWS=[{id:'big',label:'Big Picture'},{id:'key',label:'By Key'},{id:'string',label:'By String'},{id:'caged',label:'By CAGED'}];
export default function App(){
  const[selKey,setKey]=useState('C'),[selView,setView]=useState('big');
  return(<div style={{background:'#0e0e0e',minHeight:'100vh',color:'#e8e8e8',fontFamily:'system-ui,sans-serif',padding:16,maxWidth:520,margin:'0 auto'}}>
    <div style={{marginBottom:16,borderBottom:'1px solid #222',paddingBottom:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,color:'#c8a84b',letterSpacing:'0.05em'}}>Double Stops & Triads</div>
      <div style={{fontSize:'0.75rem',color:'#666',marginTop:2}}>Every string set · Every position · Connected to CAGED</div>
    </div>
    <div style={{display:'flex',gap:0,marginBottom:16,background:'#141414',borderRadius:8,padding:4}}>{VIEWS.map(v=>(<button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,padding:'7px 4px',borderRadius:6,cursor:'pointer',fontSize:'0.78rem',border:'none',background:v.id===selView?'#2a2a2a':'transparent',color:v.id===selView?'#c8a84b':'#666',fontWeight:v.id===selView?600:400}}>{v.label}</button>))}</div>
    <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>Chord / Key</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>{KEYS.map(k=>(<button key={k} onClick={()=>setKey(k)} style={{fontFamily:'monospace',fontSize:'0.8rem',padding:'5px 9px',borderRadius:4,cursor:'pointer',minWidth:36,border:k===selKey?'1px solid #7ec8a4':'1px solid #2e2e2e',background:k===selKey?'#7ec8a4':'#1a1a1a',color:k===selKey?'#000':'#888',fontWeight:k===selKey?700:400}}>{NOTE_DISPLAY(k)}</button>))}</div>
    <Legend selKey={selKey}/>
    {selView==='big'&&<ViewBigPicture selKey={selKey}/>}
    {selView==='key'&&<ViewByKey selKey={selKey}/>}
    {selView==='string'&&<ViewByStringSet selKey={selKey}/>}
    {selView==='caged'&&<ViewByCAGED selKey={selKey}/>}
  </div>);}
