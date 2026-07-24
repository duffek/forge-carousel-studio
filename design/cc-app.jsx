// ===== App: state, routing, Claude generation, export =====
const { useState, useEffect, useCallback } = React;
const { SlideView, Compose, Lineup, Editor, blankSlide, uid, HAS_IMAGE, generateImage } = window.CC;

const LS_KEY = 'ff-carousel-studio-v1';
const EXPORT_W=1080, EXPORT_H=1350;

function load(){ try{return JSON.parse(localStorage.getItem(LS_KEY)||'null')}catch(e){return null} }

// ---- Claude carousel generation ----
async function generateCarousel({story,points,tone,brand,cta}, onStep){
  onStep && onStep('Reading your story…');
  const system = `You are a senior editorial content designer creating punchy Instagram carousels for a founder-focused brand. You write in a sharp, ${tone.toLowerCase()} voice. You output ONLY valid minified JSON — no markdown, no code fences, no commentary.`;
  const schema = `Return JSON: {"title": string, "slides": Slide[]}.
Slide = {"layout": "cover"|"statement"|"split"|"closer", "kicker"?: string, "headline": string, "body"?: string, "bullets"?: string[], "image"?: {"prompt": string}}.
Rules:
- Exactly ${points+2} slides: first is layout "cover", last is layout "closer", and exactly ${points} point slides between them.
- For the ${points} point slides, alternate between "statement" (text-only, big idea) and "split" (text + image). Aim for a good rhythm; make roughly half "split".
- headline: the punchy hook, UPPERCASE-friendly short phrase, 2-4 words per line, use "\\n" to break lines (max 3 lines). This is the dominant text.
- kicker: a short setup line above the headline (optional, <=6 words).
- body: 1-2 tight sentences that land the point. In body only, wrap ONE key phrase in *asterisks* for emphasis.
- bullets: only on some "split" slides where a list fits (2-4 short items); otherwise omit.
- Every "cover", "split" and "closer" slide MUST include image.prompt: a vivid, moody, cinematic EDITORIAL PHOTO direction for an AI image model (Gemini Nano Banana Pro). Describe subject, lighting, mood, composition. No text/words in the image. ~15-30 words.
- cover: hook the scroll. closer: pay off the story and include this call to action verbatim in the body: "${cta||'Follow for more.'}".
- Keep it provocative and specific to the story. No fluff.`;
  onStep && onStep('Drafting slides & image prompts…');
  const raw = await window.claude.complete({
    model:'claude-sonnet-4-5',
    max_tokens: 4000,
    system,
    messages:[{role:'user',content:`STORY:\n${story}\n\nBRAND: ${brand}\nPOINTS: ${points}\nTONE: ${tone}\n\n${schema}`}]
  });
  onStep && onStep('Assembling carousel…');
  let txt = String(raw||'').trim().replace(/^```(json)?/i,'').replace(/```$/,'').trim();
  const a=txt.indexOf('{'), b=txt.lastIndexOf('}');
  if(a>=0&&b>=0) txt=txt.slice(a,b+1);
  const data = JSON.parse(txt);
  const slides = (data.slides||[]).map(sd=>{
    const layout = ['cover','statement','split','closer'].includes(sd.layout)?sd.layout:'statement';
    const s = { id:uid(), layout, kicker:sd.kicker||'', headline:sd.headline||'', body:sd.body||'',
      bullets:Array.isArray(sd.bullets)?sd.bullets:[], wordmark:(layout==='cover'||layout==='closer') };
    if(HAS_IMAGE[layout]) s.image={prompt:(sd.image&&sd.image.prompt)||'', dataUrl:null, opacity:layout==='closer'?0.3:1};
    return s;
  });
  return { title:data.title||'Untitled carousel', slides };
}

// ---- PNG export via modern-screenshot ----
let _fontCss=null;
async function fontCss(){
  if(_fontCss!=null) return _fontCss;
  try{
    const url='https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap';
    let css=await (await fetch(url)).text();
    const urls=[...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map(m=>m[1]))];
    await Promise.all(urls.map(async u=>{try{const buf=await(await fetch(u)).arrayBuffer();let bin='';const by=new Uint8Array(buf);for(let i=0;i<by.length;i++)bin+=String.fromCharCode(by[i]);css=css.split(u).join('data:font/woff2;base64,'+btoa(bin))}catch(e){}}));
    _fontCss=css;
  }catch(e){_fontCss=''}
  return _fontCss;
}

async function renderPng(slide,index,total,brand){
  const host=document.createElement('div');
  host.style.cssText=`position:fixed;left:-99999px;top:0;width:${EXPORT_W}px;height:${EXPORT_H}px;background:#000;z-index:-1`;
  document.body.appendChild(host);
  const root=ReactDOM.createRoot(host);
  root.render(<SlideView slide={slide} index={index} total={total} brand={brand} editable={false} />);
  try{ await document.fonts.ready; }catch(e){}
  await new Promise(r=>setTimeout(r,180));
  const el=host.querySelector('.slide');
  el.style.width=EXPORT_W+'px'; el.style.height=EXPORT_H+'px'; el.style.aspectRatio='auto';
  const css=await fontCss();
  const lib=window.modernScreenshot||window.ModernScreenshot;
  const dataUrl=await lib.domToPng(el,{width:EXPORT_W,height:EXPORT_H,scale:1,backgroundColor:'#000',font:css?{cssText:css}:undefined,style:{transform:'none'}});
  root.unmount(); host.remove();
  return dataUrl;
}
function download(dataUrl,name){const a=document.createElement('a');a.href=dataUrl;a.download=name;document.body.appendChild(a);a.click();a.remove()}

function App(){
  const saved = load();
  const [view,setView]=useState(saved&&saved.slides&&saved.slides.length?'lineup':'compose');
  const [slides,setSlides]=useState(saved?saved.slides:[]);
  const [meta,setMeta]=useState(saved?saved.meta:{title:'',brand:'FoundersForge',tone:'Provocative',story:'',points:5,tone:'Provocative',cta:''});
  const [current,setCurrent]=useState(0);
  const [busy,setBusy]=useState(false);
  const [busyStep,setStep]=useState('');
  const [error,setError]=useState('');
  const [genIds,setGenIds]=useState({});      // per-slide image gen busy
  const [genAllBusy,setGenAllBusy]=useState(false);
  const [genAllProg,setGenAllProg]=useState('');
  const [exportBusy,setExportBusy]=useState(false);

  useEffect(()=>{ if(slides.length) localStorage.setItem(LS_KEY,JSON.stringify({slides,meta})); },[slides,meta]);

  const patchSlide=useCallback((id,patch)=>setSlides(ss=>ss.map(s=>s.id===id?{...s,...patch}:s)),[]);
  const patchImage=useCallback((id,patch)=>setSlides(ss=>ss.map(s=>s.id===id?{...s,image:{...(s.image||{prompt:'',dataUrl:null,opacity:1}),...patch}}:s)),[]);

  async function onGenerate(cfg){
    setBusy(true); setError('');
    try{
      const {title,slides:sl}=await generateCarousel(cfg,setStep);
      if(!sl.length) throw new Error('No slides returned');
      setSlides(sl);
      setMeta({title,brand:cfg.brand,tone:cfg.tone,story:cfg.story,points:cfg.points,cta:cfg.cta});
      setCurrent(0); setView('lineup');
    }catch(e){ setError('Generation failed: '+(e.message||e)+'. Try again or tweak your story.'); }
    finally{ setBusy(false); setStep(''); }
  }

  async function genImage(id){
    const s=slides.find(x=>x.id===id); if(!s||!s.image)return;
    setGenIds(g=>({...g,[id]:true}));
    try{ const url=await generateImage(s.image.prompt, id); patchImage(id,{dataUrl:url}); }
    catch(e){ setError('Image generation failed: '+(e.message||e)); }
    finally{ setGenIds(g=>{const n={...g};delete n[id];return n}); }
  }
  async function genAll(){
    setGenAllBusy(true);
    const todo=slides.filter(s=>HAS_IMAGE[s.layout]&&!(s.image&&s.image.dataUrl));
    for(let i=0;i<todo.length;i++){
      setGenAllProg(`${i+1}/${todo.length}`);
      try{ const url=await generateImage(todo[i].image.prompt,todo[i].id); patchImage(todo[i].id,{dataUrl:url}); }catch(e){}
    }
    setGenAllBusy(false); setGenAllProg('');
  }

  function uploadImage(id,file){ const r=new FileReader(); r.onload=e=>patchImage(id,{dataUrl:e.target.result}); r.readAsDataURL(file); }

  const addSlide=(layout,at)=>setSlides(ss=>{const n=[...ss];const idx=at==null?n.length:at;n.splice(idx,0,blankSlide(layout));return n});
  const dupSlide=(i)=>setSlides(ss=>{const n=[...ss];n.splice(i+1,0,{...JSON.parse(JSON.stringify(ss[i])),id:uid()});return n});
  const delSlide=(i)=>setSlides(ss=>{ if(ss.length<=1)return ss; const n=ss.filter((_,x)=>x!==i); setCurrent(c=>Math.min(c,n.length-1)); return n; });
  const moveSlide=(from,to)=>setSlides(ss=>{const n=[...ss];const[m]=n.splice(from,1);n.splice(to,0,m);return n});

  async function exportOne(i){ setExportBusy(true); try{ await document.fonts.ready; const u=await renderPng(slides[i],i,slides.length,meta.brand); download(u,`${(meta.title||'carousel').replace(/\s+/g,'-').toLowerCase()}-${window.CC.pad2(i+1)}.png`);}catch(e){setError('Export failed: '+(e.message||e))}finally{setExportBusy(false)} }
  async function exportAll(){ setExportBusy(true); try{ await document.fonts.ready; for(let i=0;i<slides.length;i++){const u=await renderPng(slides[i],i,slides.length,meta.brand);download(u,`${(meta.title||'carousel').replace(/\s+/g,'-').toLowerCase()}-${window.CC.pad2(i+1)}.png`);await new Promise(r=>setTimeout(r,220));}}catch(e){setError('Export failed: '+(e.message||e))}finally{setExportBusy(false)} }

  const openEditor=(i)=>{setCurrent(i);setView('editor')};

  // ---- top bar crumb ----
  const crumb = view==='compose'?<span>New carousel</span>
    : view==='lineup'?<span><b>{meta.title||'Carousel'}</b> · Lineup</span>
    : <span onClick={()=>setView('lineup')} style={{cursor:'pointer'}}><b>{meta.title||'Carousel'}</b> · Editing slide {current+1}</span>;

  return <div className="app">
    <div className="topbar">
      <div className="brand"><img src="images/ff-logo.png" alt="FoundersForge" /><span className="sub">Carousel Studio</span></div>
      <div className="sep"></div>
      <div className="crumb">{crumb}</div>
      <div className="spacer"></div>
      {view==='editor' && <button className="btn ghost sm" onClick={()=>setView('lineup')}>Done editing</button>}
      {view==='lineup' && <span className="meta">{slides.length} slides · 1080×1350</span>}
    </div>

    <div className="view">
      {view==='compose' && <Compose onGenerate={onGenerate} busy={busy} busyStep={busyStep} error={error}
        initial={{story:meta.story,points:meta.points,tone:meta.tone,brand:meta.brand,cta:meta.cta}} />}
      {view==='lineup' && <Lineup slides={slides} meta={meta} onOpen={openEditor}
        onAdd={addSlide} onDup={dupSlide} onDelete={delSlide} onMove={moveSlide}
        onPatchMeta={m=>setMeta(x=>({...x,...m}))}
        onGenAll={genAll} genAllBusy={genAllBusy} genAllProgress={genAllProg}
        onExportAll={exportAll} exportBusy={exportBusy}
        onNewStory={()=>{if(confirm('Start a new carousel? Your current one stays saved in this browser until you generate a new one.')){setView('compose')}}} />}
      {view==='editor' && <Editor slides={slides} meta={meta} current={current} setCurrent={setCurrent}
        onPatch={patchSlide} onPatchImage={patchImage} onGenImage={genImage} genBusy={!!genIds[slides[current]&&slides[current].id]}
        onUpload={uploadImage} onExit={()=>setView('lineup')} onAdd={addSlide} onDup={dupSlide} onDelete={delSlide}
        onExportOne={exportOne} exportBusy={exportBusy} />}
    </div>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
