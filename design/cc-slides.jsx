// ===== Slide render engine + image generation =====
const { useRef, useEffect } = React;

const LAYOUTS = ['cover','statement','split','closer'];
const LAYOUT_LABEL = {cover:'Cover',statement:'Statement',split:'Split · image',closer:'Closer'};
const HAS_IMAGE = {cover:true,statement:false,split:true,closer:true};

function uid(){return 'sl_'+Math.random().toString(36).slice(2,9)}
function pad2(n){return String(n).padStart(2,'0')}

function blankSlide(layout){
  layout = layout||'statement';
  const s = {id:uid(),layout,kicker:'',headline:'',body:'',bullets:[],hScale:1,bScale:1};
  if(HAS_IMAGE[layout]) s.image={prompt:'',dataUrl:null,opacity:layout==='closer'?0.3:1};
  s.wordmark = (layout==='cover'||layout==='closer');
  return s;
}

// parse *emphasis* -> orange italic
function renderEmph(text){
  return String(text||'').split(/(\*[^*]+\*)/g).map((s,i)=>
    s.length>1 && s.startsWith('*') && s.endsWith('*')
      ? <em key={i} className="em">{s.slice(1,-1)}</em> : <span key={i}>{s}</span>);
}

// contentEditable plain-text field
function Editable({value,onChange,className,placeholder,style}){
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current && ref.current.innerText!==(value||'')) ref.current.innerText=value||''; },[value]);
  return <div ref={ref} className={className} style={style} contentEditable suppressContentEditableWarning
    data-ph={placeholder||''} onBlur={e=>onChange(e.currentTarget.innerText)} />;
}

// A text node: editable in edit mode, emphasis-rendered otherwise
function T({slide,field,cls,ph,editable,onPatch}){
  const v = slide[field]||'';
  if(editable) return <Editable className={cls} value={v} placeholder={ph} onChange={t=>onPatch(field,t)} />;
  return <div className={cls}>{renderEmph(v)}</div>;
}

const SWIPE = <svg className="arrow" viewBox="0 0 60 50" fill="none"><path d="M55 42 C 38 42, 20 32, 10 12 M10 12 L 4 22 M10 12 L 20 16" stroke="#F08030" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ---- image element (photo or editorial placeholder) ----
const PH_PALETTES=[['#2a211a','#0a0806'],['#1c2026','#05070a'],['#20150c','#07040a'],['#1a1a1f','#060607'],['#241016','#080306'],['#12211c','#050a08']];
function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0}return Math.abs(h)}

function ImageArea({image,className}){
  if(image && image.dataUrl){
    return <img className={"user-img "+(className||'')} src={image.dataUrl} alt="" style={{opacity:image.opacity!=null?image.opacity:1}} />;
  }
  const pal = PH_PALETTES[hashStr(image&&image.prompt||'x')%PH_PALETTES.length];
  return <div className={"ph "+(className||'')} style={{['--ph-a']:pal[0],['--ph-b']:pal[1]}}>
    <div className="stripes"></div><div className="grain"></div><div className="frame"></div>
    <div className="pcorner">Nano Banana Pro</div>
    <div className="plabel">{image&&image.prompt ? '“'+image.prompt+'”' : 'No image yet — add a prompt below and Generate'}</div>
  </div>;
}

// ---- the slide ----
function SlideView({slide,index,total,brand,editable,onPatch}){
  const svStyle={['--hscale']:slide.hScale!=null?slide.hScale:1,['--bscale']:slide.bScale!=null?slide.bScale:1};
  const wm = <img className="wordmark-logo" src="images/ff-logo.png" alt={brand||'FoundersForge'} />;
  const counter = <div className="counter">{pad2(index+1)} / {pad2(total)}</div>;
  const swipe = index<total-1 ? <div className="swipe">{SWIPE}swipe</div> : null;
  const p = (f,t)=>onPatch&&onPatch(f,t);

  if(slide.layout==='cover'){
    return <div className="slide" data-layout="cover" style={svStyle}>
      <div className="cover">
        <div className="photo"><ImageArea image={slide.image} /></div>
        <div className="inner">
          <T slide={slide} field="kicker" cls="kicker" ph="Kicker line" editable={editable} onPatch={p} />
          <T slide={slide} field="headline" cls="accent xxl" ph="BIG HEADLINE" editable={editable} onPatch={p} />
          <T slide={slide} field="body" cls="body small" ph="Supporting line…" editable={editable} onPatch={p} />
        </div>
        {slide.wordmark && wm}
        <div className="swipe" style={{left:'auto',right:'5.5cqw'}}>swipe</div>
      </div>
      {counter}
    </div>;
  }
  if(slide.layout==='statement'){
    return <div className="slide" data-layout="statement" style={svStyle}>
      <div className="beat">
        <T slide={slide} field="kicker" cls="body" ph="Setup line" editable={editable} onPatch={p} />
        <T slide={slide} field="headline" cls="accent xl" ph="THE BOLD POINT" editable={editable} onPatch={p} />
        <T slide={slide} field="body" cls="body" ph="Land the point…" editable={editable} onPatch={p} />
      </div>
      {swipe}{counter}
    </div>;
  }
  if(slide.layout==='split'){
    return <div className="slide" data-layout="split" style={svStyle}>
      <div className="composite">
        <div className="top">
          <T slide={slide} field="kicker" cls="body" ph="Setup line" editable={editable} onPatch={p} />
          <T slide={slide} field="headline" cls="accent md" ph="THE POINT" editable={editable} onPatch={p} />
          <T slide={slide} field="body" cls="body small" ph="Supporting detail…" editable={editable} onPatch={p} />
          {slide.bullets && slide.bullets.length>0 &&
            <div className="bullets">{slide.bullets.map((b,i)=><div className="brow" key={i}>{renderEmph(b)}</div>)}</div>}
        </div>
        <div className="photo"><ImageArea image={slide.image} /></div>
      </div>
      {swipe}{counter}
    </div>;
  }
  // closer
  return <div className="slide" data-layout="closer" style={svStyle}>
    <div className="cover closer">
      <div className="photo"><ImageArea image={slide.image} /></div>
      <div className="inner">
        <T slide={slide} field="headline" cls="accent xl" ph="CLOSING LINE" editable={editable} onPatch={p} />
        <div className="divider"></div>
        <T slide={slide} field="body" cls="body small" ph="Call to action…" editable={editable} onPatch={p} />
      </div>
      {slide.wordmark && wm}
    </div>
    {counter}
  </div>;
}

// ===== Nano Banana Pro image generation =====
// Deterministic editorial synth used as the in-prototype stand-in for the API.
function synthImage(prompt,seed){
  const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d');const h=hashStr((prompt||'')+'|'+(seed||0));
  const pal=PH_PALETTES[h%PH_PALETTES.length];
  const g=x.createLinearGradient(0,0,W*0.3,H);g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1]);
  x.fillStyle=g;x.fillRect(0,0,W,H);
  const glow=(cx,cy,r,col,a)=>{const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=a;x.fillStyle=rg;x.fillRect(0,0,W,H);x.globalAlpha=1};
  const rnd=(n=>()=>((n=(n*9301+49297)%233280)/233280))(h||1);
  glow(W*(0.25+rnd()*0.5),H*(0.2+rnd()*0.4),W*(0.5+rnd()*0.4),'rgba(255,120,50,0.28)',1);
  glow(W*(0.2+rnd()*0.6),H*(0.5+rnd()*0.4),W*(0.4+rnd()*0.5),'rgba(255,255,255,0.10)',1);
  glow(W*rnd(),H*rnd(),W*0.5,'rgba(30,40,60,0.4)',1);
  // soft diagonal streaks
  x.globalAlpha=0.05;x.strokeStyle='#fff';x.lineWidth=1;
  for(let i=0;i<40;i++){x.beginPath();const o=i*40-400;x.moveTo(o,0);x.lineTo(o+H*0.6,H);x.stroke()}
  x.globalAlpha=1;
  // grain
  const id=x.getImageData(0,0,W,H),d=id.data;
  for(let i=0;i<d.length;i+=4){const n=(rnd()-0.5)*26;d[i]+=n;d[i+1]+=n;d[i+2]+=n}
  x.putImageData(id,0,0);
  // vignette
  const v=x.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,0.55)');
  x.fillStyle=v;x.fillRect(0,0,W,H);
  return c.toDataURL('image/jpeg',0.82);
}

async function generateImage(prompt,seed){
  // ===== Gemini Nano Banana Pro integration point =====
  // Production: proxy through your backend to keep the key server-side, e.g.
  //   const r = await fetch('/api/nano-banana', {method:'POST',
  //     headers:{'content-type':'application/json'},
  //     body: JSON.stringify({ model:'gemini-3-pro-image', prompt })});
  //   const { dataUrl } = await r.json(); return dataUrl;
  // In this prototype we synthesize an on-brand editorial image so the flow is fully working.
  await new Promise(r=>setTimeout(r, 850 + Math.random()*750));
  return synthImage(prompt, seed);
}

window.CC = Object.assign(window.CC||{}, {
  SlideView, ImageArea, Editable, renderEmph, blankSlide, uid, pad2,
  LAYOUTS, LAYOUT_LABEL, HAS_IMAGE, generateImage
});
