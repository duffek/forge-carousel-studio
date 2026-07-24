// ===== Lineup (gallery) view =====
const { useState:useStateL, useRef:useRefL } = React;

function Lineup(props){
  const { slides, meta, onOpen, onAdd, onDup, onDelete, onMove, onPatchMeta,
          onGenAll, genAllBusy, genAllProgress, onExportAll, exportBusy, onNewStory } = props;
  const { SlideView, HAS_IMAGE, LAYOUT_LABEL } = window.CC;
  const [dragI,setDragI]=useStateL(-1);
  const [overI,setOverI]=useStateL(-1);
  const missing = slides.filter(s=>HAS_IMAGE[s.layout] && !(s.image&&s.image.dataUrl)).length;

  const drop = (to)=>{ if(dragI>=0 && dragI!==to) onMove(dragI,to); setDragI(-1); setOverI(-1); };

  return <div className="lineup">
    <div className="lineup-head">
      <div>
        <div className="ttl" contentEditable suppressContentEditableWarning
          onBlur={e=>onPatchMeta({title:e.currentTarget.innerText})}
          dangerouslySetInnerHTML={{__html:meta.title||'Untitled carousel'}} />
        <div className="sub">{slides.length} slides · {meta.tone} tone{missing>0?` · ${missing} image${missing>1?'s':''} to generate`:' · all images ready'}</div>
      </div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn ghost" onClick={onNewStory}>New story</button>
        <button className="btn" disabled={exportBusy} onClick={onExportAll}>{exportBusy&&<span className="spinner"></span>}Export all PNGs</button>
      </div>
    </div>

    <div className="toolbar">
      <button className="btn primary" disabled={genAllBusy||missing===0} onClick={onGenAll}>
        {genAllBusy&&<span className="spinner dark"></span>}
        {genAllBusy?`Generating ${genAllProgress}…`:missing===0?'All images generated':`Generate all images (${missing})`}
      </button>
      <span className="topbar meta" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'11px',color:'var(--muted-2)'}}>Nano Banana Pro</span>
      <span className="spacer"></span>
      <button className="btn ghost sm" onClick={()=>onAdd('statement')}>+ Statement</button>
      <button className="btn ghost sm" onClick={()=>onAdd('split')}>+ Split</button>
    </div>

    <div className="grid">
      {slides.map((s,i)=>(
        <div key={s.id}
          className={"card"+(dragI===i?' dragging':'')+(overI===i?' drag-over':'')}
          draggable
          onDragStart={()=>setDragI(i)}
          onDragOver={e=>{e.preventDefault();setOverI(i)}}
          onDragLeave={()=>setOverI(o=>o===i?-1:o)}
          onDrop={()=>drop(i)}
          onDragEnd={()=>{setDragI(-1);setOverI(-1)}}>
          <div className="thumb" onClick={()=>onOpen(i)}>
            <span className="badge">{window.CC.pad2(i+1)} · {LAYOUT_LABEL[s.layout]}</span>
            <SlideView slide={s} index={i} total={slides.length} brand={meta.brand} editable={false} />
            <div className="go"><span className="btn primary sm">Open editor</span></div>
          </div>
          <div className="foot">
            <span className="lay">{LAYOUT_LABEL[s.layout]}</span>
            <button className="mini" title="Duplicate" onClick={()=>onDup(i)}>⧉</button>
            <button className="mini" title="Delete" onClick={()=>onDelete(i)}>✕</button>
          </div>
        </div>
      ))}
      <div className="card add" onClick={()=>onAdd('statement')}>
        <span className="plus">+</span>
        <span>Add slide</span>
      </div>
    </div>
  </div>;
}

window.CC = Object.assign(window.CC||{}, { Lineup });
