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
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, user_id, caption, created_at,
          profiles:profiles(username, avatar_url),
          post_media:post_media(url, media_type, sort_order),
          post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
        `)
        .order('created_at', {ascending:false})
        .limit(30)

      if(!cancelled){
        if(error) console.warn(error)
        setPosts((data ?? []).map(p=>({
          ...p,
          post_media: (p.post_media ?? []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)),
        })))
        setLoading(false)
      }
    })()
    return ()=>{ cancelled = true }
  }, [])

  const filtered = useMemo(()=>{
    const qq = safeLower(q)
    return posts.filter(p=>{
      const f = p.post_fishing?.[0]
      if(env && f?.environment !== env) return false
      if(bait && f?.bait_kind !== bait) return false
      if(!qq) return true
      const blob = [
        p.caption, p.profiles?.username,
        f?.species_text, f?.technique_text, f?.bait_name, f?.bait_color, f?.spot_area
      ].join(' ').toLowerCase()
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
              <input className="input" style={{flex:1, minWidth:180}} placeholder="Cerca specie, tecnica, esca, zona…" value={q} onChange={e=>setQ(e.target.value)} />
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
