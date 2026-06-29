import { useState } from "react";

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_DISPLAY = n => ({'C#':'C#/Db','D#':'D#/Eb','F#':'F#/Gb','G#':'G#/Ab','A#':'A#/Bb'}[n] || n);
const OPEN = [4,9,2,7,11,4];
const STRING_NAMES = ['E','A','D','G','B','e'];
function noteAt(strIdx, fret) { return NOTES[(OPEN[strIdx] + fret) % 12]; }
const MODE_INTERVALS = {
  Ionian:     [0,2,4,5,7,9,11],
  Dorian:     [0,2,3,5,7,9,10],
  Phrygian:   [0,1,3,5,7,8,10],
  Lydian:     [0,2,4,6,7,9,11],
  Mixolydian: [0,2,4,5,7,9,10],
  Aeolian:    [0,2,3,5,7,8,10],
  Locrian:    [0,1,3,5,6,8,10],
};
const MODES = [
  { name:'Ionian', aka:'Major Scale', degree:1, mood:'Bright · Resolved · Confident',
    feel:'This is home base. The sound most people call "happy" or "major." Everything feels settled and intentional. Not much tension — which is exactly why rock players leave it behind when they want edge.',
    sounds_like:'A clean country lead. A pop chorus. The kind of solo that feels triumphant rather than dangerous.',
    players:['Eric Clapton (clean passages)','Chet Atkins','Keith Urban'], color:'#7ec8a4', darkness:1 },
  { name:'Dorian', aka:'Minor with attitude', degree:2, mood:'Cool · Sophisticated · Minor but hopeful',
    feel:'Minor scale but with a raised 6th that keeps it from going fully dark. Has a jazzy, soulful quality. Feels like minor with the lights still on. The most musical and versatile of the minor modes.',
    sounds_like:"Santana's entire career. Also the backbone of a huge amount of funk and R&B lead playing.",
    players:['Carlos Santana','Eric Clapton (Cream era)','John Mayer','Stevie Ray Vaughan'], color:'#7ec8e8', darkness:3 },
  { name:'Phrygian', aka:'The dark one', degree:3, mood:'Dark · Menacing · Spanish · Exotic',
    feel:'That flat 2nd right at the top of the scale — one semitone above the root — is what makes this one dangerous. Has a Spanish flamenco quality but also a heaviness that metal players love. Jake E Lee lived here. Bark at the Moon is Phrygian.',
    sounds_like:'The opening riff of Bark at the Moon. Flamenco guitar. Wherever I May Roam by Metallica. Anything that sounds ancient and slightly threatening.',
    players:['Jake E Lee','James Hetfield','Tony Iommi','Paco de Lucia'], color:'#c85c5c', darkness:6 },
  { name:'Lydian', aka:'The dreamer', degree:4, mood:'Floating · Dreamy · Unresolved · Cinematic',
    feel:"The raised 4th gives it this shimmer that never quite lands. Sounds like something hovering just above the ground. More common in film scores than rock but when rock players use it the effect is immediately distinctive.",
    sounds_like:"Joe Satriani's Flying in a Blue Dream. Steve Vai's more ethereal passages. Film scores that feel like weightlessness.",
    players:['Joe Satriani','Steve Vai','John Petrucci','Frank Zappa'], color:'#a87ec8', darkness:2 },
  { name:'Mixolydian', aka:'The rock mode', degree:5, mood:'Raw · Driving · Major feel with an edge',
    feel:"Major scale with a flat 7th. That one note change is everything — it removes the resolved feeling of the major scale and replaces it with forward momentum. This is the mode underneath more rock and blues than any other.",
    sounds_like:'Sweet Home Chicago. Almost every AC/DC riff. Southern rock in general. The backbone of blues-rock soloing.',
    players:['Angus Young','Duane Allman','Warren Haynes','Eric Clapton','Zakk Wylde'], color:'#c8a84b', darkness:4 },
  { name:'Aeolian', aka:'Natural Minor', degree:6, mood:'Dark · Emotional · Brooding · Powerful',
    feel:"The natural minor scale. This is the emotional core of rock, metal, and most lead guitar playing with any darkness to it. Not as exotic as Phrygian, not as hopeful as Dorian — just straight dark and powerful. Zakk Wylde's home. Most of Ozzy's catalog lives here.",
    sounds_like:"The end of No More Tears. Stairway to Heaven's solo. Virtually every metal ballad ever written. The sound of something that matters.",
    players:['Zakk Wylde','Jimmy Page','Randy Rhoads','Tony Iommi','Jake E Lee'], color:'#e05c5c', darkness:7 },
  { name:'Locrian', aka:'The unstable one', degree:7, mood:'Tense · Dissonant · Unstable · Unresolved',
    feel:'Almost unusable as a full solo mode because it never resolves — the root chord itself is diminished which means nothing feels like home. But used in short bursts it creates a dissonance that is genuinely unsettling.',
    sounds_like:'Brief passages in extreme metal. Horror film scores. The musical equivalent of a question that has no answer.',
    players:['Used sparingly by most metal players for effect','Tosin Abasi','Periphery'], color:'#888', darkness:8 },
];
function Fretboard({root,intervals,startFret=0,numFrets=5}){
  const LEFT=36,RIGHT=32,TOP=28,FRET_H=44,STR_W=36;
  const W=LEFT+5*STR_W+RIGHT,H=TOP+numFrets*FRET_H+8;
  const sx=i=>LEFT+i*STR_W,fy=f=>TOP+f*FRET_H,dotY=f=>TOP+(f-startFret+0.5)*FRET_H,showNut=startFret<=1;
  const rootIdx=NOTES.indexOf(root),dots=[];
  for(let si=0;si<6;si++)for(let f=startFret;f<startFret+numFrets;f++){const note=noteAt(si,f),interval=(NOTES.indexOf(note)-rootIdx+12)%12;if(intervals.includes(interval))dots.push({si,f,isRoot:interval===0});}
  return(<svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',maxWidth:320,margin:'0 auto'}}>
    {STRING_NAMES.map((name,i)=>(<text key={i} x={sx(i)} y={TOP-8} textAnchor="middle" fontSize="11" fill="#666" fontFamily="monospace">{name}</text>))}
    {showNut?<rect x={sx(0)} y={TOP} width={sx(5)-sx(0)} height={5} fill="#bbb" rx={2}/>:<text x={sx(0)-6} y={TOP+FRET_H*0.55} fontSize="10" fill="#555" fontFamily="monospace" textAnchor="end">{startFret}</text>}
    {Array.from({length:numFrets}).map((_,f)=>(<line key={f} x1={sx(0)} y1={fy(f+1)} x2={sx(5)} y2={fy(f+1)} stroke="#3a3a3a" strokeWidth={2}/>))}
    {Array.from({length:6}).map((_,i)=>(<line key={i} x1={sx(i)} y1={TOP+(showNut?5:0)} x2={sx(i)} y2={fy(numFrets)} stroke="#555" strokeWidth={1}/>))}
    {Array.from({length:numFrets}).map((_,f)=>{const fn=startFret+f+1;if(fn<=0)return null;return(<text key={f} x={sx(5)+10} y={fy(f+1)-2} fontSize="10" fill="#555" fontFamily="monospace" dominantBaseline="auto">{fn}</text>);})}
    {dots.map((d,i)=>(<g key={i}><circle cx={sx(d.si)} cy={dotY(d.f)} r={13} fill={d.isRoot?'#e05c5c':'#2a5a3a'} stroke={d.isRoot?'#e05c5c':'#3a8a5a'} strokeWidth={d.isRoot?0:1}/><text x={sx(d.si)} y={dotY(d.f)} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fontFamily="monospace" fill={d.isRoot?'#fff':'#7ec8a4'}>{d.isRoot?'R':''}</text></g>))}
  </svg>);}
function BigPictureFretboard({root,intervals,modeColor}){
  const FRETS=24,FRET_H=32,STR_W=36,LEFT=28,TOP=24;
  const W=LEFT+5*STR_W+20,H=TOP+FRETS*FRET_H+16;
  const sx=i=>LEFT+i*STR_W,fretTop=f=>TOP+(f-1)*FRET_H,dotY=f=>TOP+(f-0.5)*FRET_H;
  const rootIdx=NOTES.indexOf(root),dots=[];
  for(let si=0;si<6;si++)for(let f=1;f<=FRETS;f++){const note=noteAt(si,f),interval=(NOTES.indexOf(note)-rootIdx+12)%12;if(intervals.includes(interval))dots.push({si,f,isRoot:interval===0});}
  return(<svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',maxWidth:W*1.4,margin:'0 auto'}}>
    {STRING_NAMES.map((name,i)=>(<text key={i} x={sx(i)} y={TOP-8} textAnchor="middle" fontSize="11" fill="#666" fontFamily="monospace">{name}</text>))}
    <rect x={sx(0)} y={TOP} width={sx(5)-sx(0)} height={4} fill="#aaa" rx={1}/>
    {Array.from({length:FRETS}).map((_,f)=>(<line key={f} x1={sx(0)} y1={fretTop(f+1)} x2={sx(5)} y2={fretTop(f+1)} stroke="#2e2e2e" strokeWidth={1.5}/>))}
    {Array.from({length:6}).map((_,i)=>(<line key={i} x1={sx(i)} y1={TOP+4} x2={sx(i)} y2={TOP+FRETS*FRET_H} stroke="#333" strokeWidth={1}/>))}
    {Array.from({length:FRETS}).map((_,f)=>(<text key={f} x={sx(5)+10} y={dotY(f+1)} fontSize="9" fill="#444" fontFamily="monospace" dominantBaseline="middle">{f+1}</text>))}
    {[3,5,7,9,15,17,19,21].map(f=>(<circle key={f} cx={sx(2)+STR_W/2} cy={dotY(f)} r={4} fill="#2a2a2a"/>))}
    {[12,24].map(f=>(<g key={f}><circle cx={sx(1)+STR_W/2} cy={dotY(f)} r={4} fill="#2a2a2a"/><circle cx={sx(3)+STR_W/2} cy={dotY(f)} r={4} fill="#2a2a2a"/></g>))}
    {dots.map((d,i)=>(<g key={i}><circle cx={sx(d.si)} cy={dotY(d.f)} r={11} fill={d.isRoot?'#e05c5c':'#1e3a2a'} stroke={d.isRoot?'none':modeColor} strokeWidth={1}/><text x={sx(d.si)} y={dotY(d.f)} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill={d.isRoot?'#fff':modeColor}>{d.isRoot?'R':'.'}</text></g>))}
  </svg>);}
function DarknessMeter({level}){return(<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><span style={{fontSize:'0.68rem',color:'#555',textTransform:'uppercase',letterSpacing:'0.1em',minWidth:52}}>Darkness</span><div style={{display:'flex',gap:3}}>{Array.from({length:8}).map((_,i)=>(<div key={i} style={{width:14,height:14,borderRadius:2,background:i<level?'#e05c5c':'#1e1e1e',border:'1px solid #2e2e2e'}}/>))}</div></div>);}
const KEYS=['C','D','E','F','G','A','B','C#','D#','F#','G#','A#'];
const VIEWS=[{id:'character',label:'Character'},{id:'neck',label:'Full Neck'},{id:'position',label:'By Position'}];
const POSITIONS=[0,2,4,5,7,9,12,14,17,19];
export default function App(){
  const[selMode,setMode]=useState('Aeolian'),[selKey,setKey]=useState('A'),[selView,setView]=useState('character'),[posIdx,setPosIdx]=useState(0);
  const mode=MODES.find(m=>m.name===selMode),intervals=MODE_INTERVALS[selMode];
  return(<div style={{background:'#0e0e0e',minHeight:'100vh',color:'#e8e8e8',fontFamily:'system-ui,sans-serif',padding:16,maxWidth:520,margin:'0 auto'}}>
    <div style={{marginBottom:16,borderBottom:'1px solid #222',paddingBottom:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,color:'#c8a84b',letterSpacing:'0.05em'}}>Mode Explorer</div>
      <div style={{fontSize:'0.75rem',color:'#666',marginTop:2}}>Ear first · Mood first · Theory second</div>
    </div>
    <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>Mode</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>{MODES.map(m=>(<button key={m.name} onClick={()=>setMode(m.name)} style={{fontFamily:'Georgia,serif',fontSize:'0.85rem',fontWeight:600,padding:'6px 12px',borderRadius:6,cursor:'pointer',border:m.name===selMode?`2px solid ${m.color}`:'2px solid #2e2e2e',background:m.name===selMode?`${m.color}22`:'#1a1a1a',color:m.name===selMode?m.color:'#666'}}>{m.name}</button>))}</div>
    <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>Root / Key</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18}}>{KEYS.map(k=>(<button key={k} onClick={()=>setKey(k)} style={{fontFamily:'monospace',fontSize:'0.8rem',padding:'5px 9px',borderRadius:4,cursor:'pointer',minWidth:36,border:k===selKey?'1px solid #7ec8a4':'1px solid #2e2e2e',background:k===selKey?'#7ec8a4':'#1a1a1a',color:k===selKey?'#000':'#888',fontWeight:k===selKey?700:400}}>{NOTE_DISPLAY(k)}</button>))}</div>
    <div style={{display:'flex',gap:0,marginBottom:18,background:'#141414',borderRadius:8,padding:4}}>{VIEWS.map(v=>(<button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,padding:'7px 4px',borderRadius:6,cursor:'pointer',fontSize:'0.78rem',border:'none',background:v.id===selView?'#2a2a2a':'transparent',color:v.id===selView?mode.color:'#666',fontWeight:v.id===selView?600:400}}>{v.label}</button>))}</div>
    {selView==='character'&&(<div>
      <div style={{background:'#1a1a1a',border:`1px solid ${mode.color}33`,borderRadius:10,padding:16,marginBottom:14}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
          <div><div style={{fontFamily:'Georgia,serif',fontSize:'1.8rem',fontWeight:700,color:mode.color,lineHeight:1}}>{mode.name}</div><div style={{fontSize:'0.78rem',color:'#666',marginTop:3,fontStyle:'italic'}}>{mode.aka}</div></div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'0.8rem',color:'#555',textAlign:'right',paddingTop:4}}>{selKey} {mode.name}<br/><span style={{fontSize:'0.7rem'}}>degree {mode.degree}</span></div>
        </div>
        <DarknessMeter level={mode.darkness||1}/>
        <div style={{fontSize:'1rem',fontWeight:600,color:'#e8e8e8',marginBottom:10,lineHeight:1.4}}>{mode.mood}</div>
        <div style={{fontSize:'0.8rem',color:'#aaa',lineHeight:1.7,marginBottom:14}}>{mode.feel}</div>
        <div style={{background:'#141414',borderRadius:8,padding:12,marginBottom:12}}>
          <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:6}}>Sounds like</div>
          <div style={{fontSize:'0.8rem',color:'#aaa',lineHeight:1.6,fontStyle:'italic'}}>{mode.sounds_like}</div>
        </div>
        <div style={{background:'#141414',borderRadius:8,padding:12}}>
          <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:8}}>Players who live here</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{mode.players.map(p=>(<div key={p} style={{fontSize:'0.75rem',padding:'3px 9px',borderRadius:4,background:'#1e1e1e',border:`1px solid ${mode.color}44`,color:mode.color}}>{p}</div>))}</div>
        </div>
      </div>
      <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:14}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'0.85rem',color:'#7ec8a4',marginBottom:10}}>{NOTE_DISPLAY(selKey)} {mode.name} — scale tones</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{intervals.map((interval,i)=>{const note=NOTES[(NOTES.indexOf(selKey)+interval)%12],isRoot=interval===0;return(<div key={i} style={{width:44,height:44,borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:isRoot?'#e05c5c':'#1e1e1e',border:isRoot?'none':`1px solid ${mode.color}44`,flexShrink:0}}><div style={{fontSize:'0.75rem',fontWeight:700,color:isRoot?'#fff':mode.color,fontFamily:'monospace'}}>{NOTE_DISPLAY(note)}</div><div style={{fontSize:'0.55rem',color:isRoot?'#ffffff88':'#555'}}>{ ['R','b2','2','b3','3','4','b5','5','b6','6','b7','7'][interval]}</div></div>);})}</div>
      </div>
    </div>)}
    {selView==='neck'&&(<div>
      <div style={{color:'#aaa',fontSize:'0.78rem',lineHeight:1.6,marginBottom:14}}>Every note of <span style={{color:mode.color}}>{NOTE_DISPLAY(selKey)} {mode.name}</span> across the full neck. Red dots are your root. See the pattern repeat at the 12th fret.</div>
      <div style={{background:'#1a1a1a',border:`1px solid ${mode.color}33`,borderRadius:10,padding:16,marginBottom:14}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'0.88rem',color:mode.color,marginBottom:14}}>{NOTE_DISPLAY(selKey)} {mode.name} · full neck</div>
        <BigPictureFretboard root={selKey} intervals={intervals} modeColor={mode.color}/>
      </div>
      <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:14}}><div style={{fontSize:'0.72rem',color:'#555',lineHeight:1.7}}>Notice how the pattern repeats exactly at fret 12 — same shapes, one octave higher. Once you own the first 12 frets you own the whole neck.</div></div>
    </div>)}
    {selView==='position'&&(<div>
      <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#555',marginBottom:7}}>Position</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>{POSITIONS.map((p,i)=>(<button key={i} onClick={()=>setPosIdx(i)} style={{fontFamily:'monospace',fontSize:'0.78rem',padding:'5px 10px',borderRadius:4,cursor:'pointer',border:i===posIdx?`1px solid ${mode.color}`:'1px solid #2e2e2e',background:i===posIdx?`${mode.color}22`:'#1a1a1a',color:i===posIdx?mode.color:'#888'}}>{p===0?'Open':p===12?'12th':`${p}th`}</button>))}</div>
      <div style={{background:'#1a1a1a',border:`1px solid ${mode.color}33`,borderRadius:10,padding:16,marginBottom:14}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'0.88rem',color:mode.color,marginBottom:14}}>{NOTE_DISPLAY(selKey)} {mode.name} · position {POSITIONS[posIdx]===0?'open':POSITIONS[posIdx]}</div>
        <Fretboard root={selKey} intervals={intervals} startFret={POSITIONS[posIdx]} numFrets={5}/>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.72rem',color:'#aaa'}}><div style={{width:16,height:16,borderRadius:'50%',background:'#e05c5c',flexShrink:0}}/>Root ({NOTE_DISPLAY(selKey)})</div>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.72rem',color:'#aaa'}}><div style={{width:16,height:16,borderRadius:'50%',background:'#1e3a2a',border:`1px solid ${mode.color}`,flexShrink:0}}/>Scale tone</div>
        </div>
      </div>
      <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:14}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'0.8rem',color:'#7ec8a4',marginBottom:8}}>Playing tip</div>
        <div style={{fontSize:'0.78rem',color:'#aaa',lineHeight:1.7}}>Start by finding the root notes — the red dots. Those are your landing zones. Then explore the scale tones around them. Let your ear pull you toward what sounds like {mode.mood.split('·')[0].trim().toLowerCase()}. Don't think about the pattern — think about the feeling.</div>
      </div>
    </div>)}
    <div style={{background:'#1a1a1a',border:'1px solid #2e2e2e',borderRadius:10,padding:14,marginTop:14}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:'0.8rem',color:'#7ec8a4',marginBottom:10}}>All 7 modes · brightness spectrum</div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>{[...MODES].sort((a,b)=>a.darkness-b.darkness).map(m=>(<div key={m.name} onClick={()=>setMode(m.name)} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'6px 8px',borderRadius:6,background:m.name===selMode?'#242424':'transparent'}}><div style={{width:10,height:10,borderRadius:'50%',background:m.color,flexShrink:0}}/><div style={{fontFamily:'Georgia,serif',fontSize:'0.82rem',color:m.name===selMode?m.color:'#888',minWidth:90}}>{m.name}</div><div style={{fontSize:'0.7rem',color:'#555',lineHeight:1.3}}>{m.mood}</div></div>))}</div>
    </div>
  </div>);}
