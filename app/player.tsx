'use client'
import { upload } from '@vercel/blob/client'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
type Track = { id:string; title:string; color:string; url:string; pathname:string; groupId?:string }
type Group = { id:string; title:string; color:string }
type Selected = { kind:'track'; item:Track } | { kind:'group'; item:Group }
const colors = ['#dffb73','#b8e3ff','#ffc5d7','#e7d5ff','#ffd890','#bdf4d6']
const FADE_MS = 3000 // duración del fade out al pausar (mantener igual en .tile.fading de styles.css)
const id = () => crypto.randomUUID()
const textOn = (hex:string) => { const n=parseInt(hex.slice(1),16); return 0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255)>150 ? '#17191d' : '#ffffff' }
export default function Player() {
  const [tracks, setTracks] = useState<Track[]>([]), [groups, setGroups] = useState<Group[]>([]), [admin, setAdmin] = useState(false), [editing, setEditing] = useState(false), [login, setLogin] = useState(false), [password, setPassword] = useState(''), [message, setMessage] = useState(''), [active, setActive] = useState<string | null>(null), [fading, setFading] = useState(false), [selected, setSelected] = useState<Selected | null>(null), [openGroup, setOpenGroup] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null), fadeTimer = useRef<number | null>(null)
  const notify = (text:string) => { setMessage(text); window.setTimeout(()=>setMessage(''), 2600) }
  const applyLibrary = (lib:{tracks?:Track[]; groups?:Group[]}) => { setTracks(lib.tracks || []); setGroups(lib.groups || []) }
  const refresh = async () => { const [t,a] = await Promise.all([fetch('/api/tracks',{cache:'no-store'}),fetch('/api/auth')]); applyLibrary(await t.json()); setAdmin((await a.json()).authenticated) }
  useEffect(() => { refresh() }, [])
  const persist = async (nextTracks:Track[], nextGroups:Group[]) => { setTracks(nextTracks); setGroups(nextGroups); await fetch('/api/tracks',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({tracks:nextTracks,groups:nextGroups})}) }
  const toggleEdit = () => { if (admin) setEditing(!editing); else setLogin(true) }
  const stopFade = () => { if (fadeTimer.current) { window.clearInterval(fadeTimer.current); fadeTimer.current = null } setFading(false) }
  const fadeOut = (a:HTMLAudioElement) => {
    stopFade(); const from=a.volume, start=Date.now(); setFading(true)
    fadeTimer.current = window.setInterval(() => { const t=Math.min((Date.now()-start)/FADE_MS,1); a.volume=from*(1-t)*(1-t); if (t>=1) { stopFade(); a.pause(); a.volume=1 } }, 50)
  }
  const play = (track:Track) => {
    const current = audio.current
    if (current && active===track.id && !current.paused) { if (fading) { stopFade(); current.volume=1; return } fadeOut(current); return }
    stopFade(); if (current) { current.onpause=null; current.onended=null; current.pause() }
    const next = new Audio(track.url); audio.current = next; setActive(track.id)
    next.onended = next.onpause = () => { if (audio.current===next) setActive(null) }
    next.play().catch(() => { if (audio.current===next) { setActive(null); notify('No se pudo reproducir la pista.') } })
  }
  const signIn = async (e:React.FormEvent) => { e.preventDefault(); const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})}); if(!r.ok){notify('Contraseña incorrecta.');return} setAdmin(true);setEditing(true);setLogin(false);setPassword('');notify('Modo edición activado.') }
  const currentGroup = groups.find(g=>g.id===openGroup) || null, gid = currentGroup ? currentGroup.id : null
  const visibleTracks = tracks.filter(t=>(t.groupId||null)===gid)
  const onUpload = async (e:ChangeEvent<HTMLInputElement>) => {
    const files=[...(e.target.files || [])]
    let ok=0
    for (const file of files) {
      try {
        const pathname=`sonora/audio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`
        const blob=await upload(pathname,file,{
          access:'public',
          handleUploadUrl:'/api/upload',
          contentType:file.type||'application/octet-stream'
        })
        const item:Track={id:id(),title:file.name.replace(/\.[^/.]+$/,''),color:colors[(tracks.length+ok)%colors.length],url:blob.url,pathname:blob.pathname,...(gid?{groupId:gid}:{})}
        const r=await fetch('/api/tracks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)})
        if(!r.ok){
          const err=await r.json().catch(()=>({}))
          notify(`No se pudo guardar "${file.name}": ${err.error||'error desconocido'}`)
          continue
        }
        setTracks(v=>[...v,item])
        ok++
      } catch (err) {
        console.error('Error al subir', file.name, err)
        notify(`No se pudo subir "${file.name}": ${err instanceof Error ? err.message : 'error desconocido'}`)
      }
    }
    e.target.value=''
    if (ok>0) notify(ok===1?'Pista guardada en la nube.':`${ok} pistas guardadas en la nube.`)
  }
  const remove = async (track:Track) => { if(!confirm(`¿Eliminar “${track.title}”?`)) return; const r=await fetch('/api/tracks',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:track.id})}); if(!r.ok){notify('No se pudo eliminar la pista.');return} if(active===track.id){stopFade();audio.current?.pause()} applyLibrary(await r.json()); setSelected(null); notify('Pista eliminada.') }
  const removeGroup = async (group:Group) => { if(!confirm(`¿Eliminar el grupo “${group.title}”? Sus pistas volverán al inicio.`)) return; await persist(tracks.map(t=>t.groupId===group.id?{...t,groupId:undefined}:t), groups.filter(g=>g.id!==group.id)); if(openGroup===group.id) setOpenGroup(null); setSelected(null); notify('Grupo eliminado.') }
  const addGroup = async () => { const group:Group={id:id(),title:'Nuevo grupo',color:colors[groups.length%colors.length]}; await persist(tracks,[...groups,group]); setSelected({kind:'group',item:group}) }
  const saveDetails = async (e:React.FormEvent) => { e.preventDefault(); if(!selected) return; if(selected.kind==='track'){const it=selected.item;await persist(tracks.map(t=>t.id===it.id?it:t),groups)} else {const it=selected.item;await persist(tracks,groups.map(g=>g.id===it.id?it:g))} setSelected(null);notify('Botón actualizado.') }
  const moveTrack = async (track:Track, delta:number) => { const other=visibleTracks[visibleTracks.findIndex(t=>t.id===track.id)+delta]; if(!other)return; const next=[...tracks]; const a=next.findIndex(t=>t.id===track.id), b=next.findIndex(t=>t.id===other.id); [next[a],next[b]]=[next[b],next[a]]; await persist(next,groups) }
  const moveGroup = async (from:number, delta:number) => { const to=from+delta; if(to<0||to>=groups.length)return; const next=[...groups]; [next[from],next[to]]=[next[to],next[from]]; await persist(tracks,next) }
  const tools = (onPrev:()=>void, onNext:()=>void, onEdit:()=>void, first:boolean, last:boolean) => <div className="tools"><button onClick={onPrev} disabled={first} aria-label="Mover antes">◀</button><button onClick={onEdit} aria-label="Personalizar">•••</button><button onClick={onNext} disabled={last} aria-label="Mover después">▶</button></div>
  return <main className="app"><header><div className="brand"><i/>sonora</div><button className="pill" onClick={toggleEdit}>{editing?'Listo':'Editar'}</button></header><section className="hero"><h1>Tu música,<br/>en tus manos.</h1><p>Una colección que vive en la nube y se escucha desde cualquier dispositivo.</p></section>
    <section className={'deck '+(editing?'editing':'')}>
      {currentGroup&&<div className="slot"><button className="tile back" onClick={()=>setOpenGroup(null)}><span className="glyph">←</span><strong>Atrás</strong><small>{currentGroup.title}</small></button></div>}
      {!currentGroup&&groups.map((group,index)=><div className="slot" key={group.id}><button className="tile group" style={{background:group.color,color:textOn(group.color)}} onClick={()=>setOpenGroup(group.id)}><span className="glyph">▦</span><strong>{group.title}</strong><small>{tracks.filter(t=>t.groupId===group.id).length} pistas</small></button>{editing&&tools(()=>moveGroup(index,-1),()=>moveGroup(index,1),()=>setSelected({kind:'group',item:{...group}}),index===0,index===groups.length-1)}</div>)}
      {visibleTracks.map((track,index)=><div className="slot" key={track.id}><button className={'tile track '+(active===track.id?'playing ':'')+(active===track.id&&fading?'fading':'')} style={{background:track.color,color:textOn(track.color)}} onClick={()=>play(track)} aria-label={(active===track.id?'Pausar ':'Reproducir ')+track.title}><span className="glyph">{active===track.id?'❚❚':'▶'}</span><strong>{track.title}</strong></button>{editing&&tools(()=>moveTrack(track,-1),()=>moveTrack(track,1),()=>setSelected({kind:'track',item:{...track}}),index===0,index===visibleTracks.length-1)}</div>)}
    </section>
    {!tracks.length&&!groups.length&&<p className="empty">Todavía no hay pistas publicadas.</p>}{currentGroup&&!visibleTracks.length&&<p className="empty">{editing?'Este grupo está vacío. Carga una pista aquí o muévela desde ••• → Grupo.':'Este grupo está vacío.'}</p>}
    {editing&&<div className="adders"><label className="upload">＋ Cargar pista{currentGroup?` en “${currentGroup.title}”`:''}<input type="file" accept="audio/*" multiple onChange={onUpload}/></label>{!currentGroup&&<button className="upload" onClick={addGroup}>＋ Nuevo grupo</button>}</div>}
    {message&&<div className="notice">{message}</div>}
    {login&&<div className="modal"><form className="panel" onSubmit={signIn}><h2>Acceso de edición</h2><p>Introduce la contraseña de administrador para gestionar las pistas.</p><input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" required/><div className="actions"><button type="button" onClick={()=>setLogin(false)}>Cancelar</button><button className="dark">Entrar</button></div></form></div>}
    {selected&&<div className="modal"><form className="panel" onSubmit={saveDetails}><h2>{selected.kind==='track'?'Personalizar botón':'Personalizar grupo'}</h2><label>Título<input value={selected.item.title} maxLength={70} onChange={e=>setSelected({...selected,item:{...selected.item,title:e.target.value}} as Selected)} required/></label><label>Color<input className="color" type="color" value={selected.item.color} onChange={e=>setSelected({...selected,item:{...selected.item,color:e.target.value}} as Selected)}/></label>{selected.kind==='track'&&<label>Grupo<select value={selected.item.groupId||''} onChange={e=>setSelected({kind:'track',item:{...selected.item,groupId:e.target.value||undefined}})}><option value="">Sin grupo</option>{groups.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label>}<div className="actions"><button type="button" className="danger" onClick={()=>selected.kind==='track'?remove(selected.item):removeGroup(selected.item)}>Eliminar</button><button type="button" onClick={()=>setSelected(null)}>Cancelar</button><button className="dark">Guardar</button></div></form></div>}
  </main>
}
