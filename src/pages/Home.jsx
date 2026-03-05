import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'
import PostCard from '../components/PostCard.jsx'

function FeedSkeleton(){
  return (
    <div style={{display:'grid', gap:12}}>
      {[1,2,3].map(i=>(
        <div key={i} className="card">
          <div style={{padding:12}}>
            <div className="row spread" style={{marginBottom:10}}>
              <div className="row" style={{gap:10}}>
                <div className="skeleton" style={{width:36, height:36, borderRadius:14}} />
                <div>
                  <div className="skeleton" style={{height:12, width:120, borderRadius:10}} />
                  <div className="skeleton" style={{height:10, width:80, borderRadius:10, marginTop:6}} />
                </div>
              </div>
              <div className="skeleton" style={{height:22, width:56, borderRadius:999}} />
            </div>

            <div className="skeleton" style={{height:340, borderRadius:16}} />

            <div className="row" style={{gap:10, marginTop:12}}>
              <div className="skeleton" style={{height:34, width:110, borderRadius:999}} />
              <div className="skeleton" style={{height:34, width:120, borderRadius:999}} />
            </div>

            <div className="skeleton" style={{height:14, width:'70%', borderRadius:10, marginTop:10}} />
            <div className="skeleton" style={{height:14, width:'55%', borderRadius:10, marginTop:8}} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home(){
  const { user, signOut } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  async function loadFeed({ silent = false } = {}){
    if(!silent) setLoading(true)
    setErrMsg('')

    // 1) leggo chi seguo
    const { data: fData, error: fErr } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    if (fErr) {
      console.warn('follows error', fErr)
      setErrMsg(`follows: ${fErr.message}`)
      setLoading(false)
      return
    }

    const followingIds = (fData ?? [])
      .map(x => x.following_id)
      .filter(Boolean)

    const ids = Array.from(new Set([user.id, ...followingIds]))

    // 2) post miei + seguiti
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, user_id, caption, created_at, visibility,
        profiles:profiles!posts_user_id_fkey(username, avatar_url),
        post_media:post_media(url, media_type, sort_order),
        post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
      `)
      .in('user_id', ids)
      .order('created_at', {ascending:false})
      .limit(30)

    if(error){
      console.warn('posts error', error)
      setErrMsg(`posts: ${error.message}`)
      setLoading(false)
      return
    }

    const normalized = (data ?? []).map(p=>({
      ...p,
      post_media: (p.post_media ?? []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)),
      post_fishing: Array.isArray(p.post_fishing) ? p.post_fishing : (p.post_fishing ? [p.post_fishing] : []),
    }))

    setPosts(normalized)
    setLoading(false)
  }

  useEffect(()=>{
    let cancelled = false
    ;(async()=>{
      if(cancelled) return
      await loadFeed()
    })()
    return ()=>{ cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  async function refresh(){
    setRefreshing(true)
    await loadFeed({ silent: true })
    setRefreshing(false)
  }

  const empty = !loading && posts.length === 0

  return (
    <>
      <Topbar
        right={
          <div className="row" style={{gap:10}}>
            <button className="btn" onClick={refresh} disabled={refreshing}>
              {refreshing ? 'Aggiorno…' : '↻ Aggiorna'}
            </button>
            <button className="btn" onClick={signOut}>Esci</button>
          </div>
        }
      />

      <main className="container main">
        {loading ? (
          <FeedSkeleton/>
        ) : errMsg ? (
          <div className="card"><div style={{padding:14}}>
            <b>Errore</b>
            <div style={{color:'salmon', marginTop:6, lineHeight:1.45}}>{errMsg}</div>
            <div style={{height:10}} />
            <button className="btn primary" onClick={()=>loadFeed()}>Riprova</button>
          </div></div>
        ) : empty ? (
          <div className="card"><div style={{padding:16}}>
            <div style={{fontSize:18, fontWeight:900}}>Il feed è vuoto</div>
            <div style={{color:'var(--muted)', marginTop:6, lineHeight:1.5}}>
              Segui qualche angler da <b>Esplora</b> oppure pubblica il tuo primo post da <b>Crea</b>.
            </div>
            <div style={{height:12}} />
            <div className="row" style={{gap:10, flexWrap:'wrap'}}>
              <a className="btn primary" href="#/explore">Vai su Esplora</a>
              <a className="btn" href="#/create">Crea un post</a>
            </div>
          </div></div>
        ) : (
          <div style={{display:'grid', gap:12}}>
            {posts.map(p=> <PostCard key={p.id} post={p} me={user} />)}
          </div>
        )}
      </main>
    </>
  )
}
