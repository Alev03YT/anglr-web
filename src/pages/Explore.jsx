import { useEffect, useMemo, useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'
import PostCard from '../components/PostCard.jsx'
import { safeLower } from '../lib/format.js'

export default function Explore(){
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [env, setEnv] = useState('')
  const [bait, setBait] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let cancelled = false

    ;(async()=>{
      setLoading(true)

      // 1) Carico posts + profilo + media (SENZA post_fishing embedded)
      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select(`
          id, user_id, caption, created_at, visibility,
          profiles:profiles(username, avatar_url),
          post_media:post_media(url, media_type, sort_order)
        `)
        .order('created_at', { ascending: false })
        .limit(30)

      if(cancelled) return
      if(postsErr) console.warn(postsErr)

      const base = (postsData ?? []).map(p=>({
        ...p,
        post_media: (p.post_media ?? []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)),
      }))

      // 2) Carico post_fishing separatamente e lo attacco ai post
      const ids = base.map(p=>p.id)
      const fishingMap = new Map()

      if(ids.length){
        const { data: fishingRows, error: fishErr } = await supabase
          .from('post_fishing')
          .select('post_id, environment, technique_text, species_text, bait_kind, bait_color, bait_name, spot_area, spot_privacy')
          .in('post_id', ids)

        if(fishErr) console.warn(fishErr)
        ;(fishingRows ?? []).forEach(r => fishingMap.set(r.post_id, r))
      }

      const merged = base.map(p=>({
        ...p,
        // OGGETTO o null (non array)
        post_fishing: fishingMap.get(p.id) ?? null
      }))

      setPosts(merged)
      setLoading(false)
    })()

    return ()=>{ cancelled = true }
  }, [])

  const filtered = useMemo(()=>{
    const qq = safeLower(q)

    return posts.filter(p=>{
      // adesso è un OGGETTO
      const f = p.post_fishing

      if(env && (f?.environment ?? '') !== env) return false
      if(bait && (f?.bait_kind ?? '') !== bait) return false

      if(!qq) return true

      const blob = [
        p.caption,
        p.profiles?.username,
        f?.species_text,
        f?.technique_text,
        f?.bait_name,
        f?.bait_color,
        f?.spot_area
      ].filter(Boolean).join(' ').toLowerCase()

      return blob.includes(qq)
    })
  }, [posts, q, env, bait])

  return (
    <>
      <Topbar/>
      <main className="container main">
        <div className="card">
          <div style={{padding:14}}>
            <div className="row" style={{gap:10, flexWrap:'wrap'}}>
              <input
                className="input"
                style={{flex:1, minWidth:180}}
                placeholder="Cerca specie, tecnica, esca, zona…"
                value={q}
                onChange={e=>setQ(e.target.value)}
              />
              <select className="input" style={{width:140}} value={env} onChange={e=>setEnv(e.target.value)}>
                <option value="">Ambiente</option>
                <option value="salt">Mare</option>
                <option value="fresh">Interno</option>
              </select>
              <select className="input" style={{width:160}} value={bait} onChange={e=>setBait(e.target.value)}>
                <option value="">Esca</option>
                <option value="artificial">Artificiale</option>
                <option value="natural">Naturale</option>
              </select>
            </div>

            {/* Debug: tienilo 1 minuto per capire se i fishing arrivano, poi puoi toglierlo */}
            <div className="row" style={{gap:8, marginTop:10, flexWrap:'wrap'}}>
              <span className="pill">Post: {posts.length}</span>
              <span className="pill">Con scheda pesca: {posts.filter(p=>p.post_fishing).length}</span>
              <span className="pill">Risultati: {filtered.length}</span>
            </div>
          </div>
        </div>

        <div style={{height:12}} />

        {loading ? (
          <div className="card"><div style={{padding:14}}>Caricamento…</div></div>
        ) : filtered.length === 0 ? (
          <div className="card"><div style={{padding:14}}>
            <b>Nessun risultato</b>
            <div style={{color:'var(--muted)', marginTop:6}}>Prova a cambiare filtri o ricerca.</div>
          </div></div>
        ) : (
          <div style={{display:'grid', gap:12}}>
            {filtered.map(p=> <PostCard key={p.id} post={p} me={user} />)}
          </div>
        )}
      </main>
    </>
  )
}
