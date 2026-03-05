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

  // DEBUG
  const [postsErrMsg, setPostsErrMsg] = useState('')
  const [fishErrMsg, setFishErrMsg] = useState('')

  useEffect(()=>{
    let cancelled = false

    ;(async()=>{
      setLoading(true)
      setPostsErrMsg('')
      setFishErrMsg('')

      // 1) posts (senza embed)
      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select('id, user_id, caption, created_at, visibility')
        .order('created_at', { ascending: false })
        .limit(30)

      if(cancelled) return

      if(postsErr){
        console.warn(postsErr)
        setPostsErrMsg(`${postsErr.code ?? ''} ${postsErr.message ?? 'Errore posts'}`.trim())
        setPosts([])
        setLoading(false)
        return
      }

      const base = (postsData ?? [])

      // ✅ FIX 2: se non ci sono post, stop
      if(!base.length){
        setPosts([])
        setLoading(false)
        return
      }

      // 2) fishing
      const ids = base.map(p=>p.id)
      const fishingMap = new Map()

      if(ids.length){
        const { data: fishingRows, error: fishErr } = await supabase
          .from('post_fishing')
          .select('post_id, environment, technique_text, species_text, bait_kind, bait_color, bait_name, spot_area, spot_privacy')
          .in('post_id', ids)

        if(fishErr){
          console.warn(fishErr)
          setFishErrMsg(`${fishErr.code ?? ''} ${fishErr.message ?? 'Errore post_fishing'}`.trim())
        }else{
          ;(fishingRows ?? []).forEach(r => fishingMap.set(r.post_id, r))
        }
      }

      // 3) profili + media (opzionale)
      const userIds = [...new Set(base.map(p=>p.user_id).filter(Boolean))]
      const profilesMap = new Map()
      if(userIds.length){
        const { data: profRows } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)
        ;(profRows ?? []).forEach(r => profilesMap.set(r.id, r))
      }

      const { data: mediaRows } = await supabase
        .from('post_media')
        .select('post_id, url, media_type, sort_order')
        .in('post_id', ids)

      const mediaMap = new Map()
      ;(mediaRows ?? []).forEach(m=>{
        const arr = mediaMap.get(m.post_id) ?? []
        arr.push(m)
        mediaMap.set(m.post_id, arr)
      })

      const merged = base.map(p=>({
        ...p,
        post_fishing: fishingMap.get(p.id) ?? null,
        profiles: profilesMap.get(p.user_id) ?? null,
        post_media: (mediaMap.get(p.id) ?? []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)),
      }))

      setPosts(merged)
      setLoading(false)
    })()

    return ()=>{ cancelled = true }
  }, [])

  const filtered = useMemo(()=>{
    const qq = safeLower(q)

    return posts.filter(p=>{
      const f = p.post_fishing

      // ✅ FIX 1: normalizza valori dal DB (spazi/maiuscole)
      const envDb = safeLower(f?.environment).trim()
      const baitDb = safeLower(f?.bait_kind).trim()

      if(env && envDb !== env) return false
      if(bait && baitDb !== bait) return false

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

            <div className="row" style={{gap:8, marginTop:10, flexWrap:'wrap'}}>
              <span className="pill">Post: {posts.length}</span>
              <span className="pill">Con scheda pesca: {posts.filter(p=>p.post_fishing).length}</span>
              <span className="pill">Risultati: {filtered.length}</span>
            </div>

            {(postsErrMsg || fishErrMsg) ? (
              <div style={{marginTop:10, color:'#ffb4b4', fontSize:13, lineHeight:1.4}}>
                {postsErrMsg ? <div><b>ERRORE POSTS:</b> {postsErrMsg}</div> : null}
                {fishErrMsg ? <div><b>ERRORE POST_FISHING:</b> {fishErrMsg}</div> : null}
              </div>
            ) : null}
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
