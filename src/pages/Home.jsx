import { useEffect, useMemo, useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'
import PostCard from '../components/PostCard.jsx'

export default function Home(){
  const { user, signOut } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  // DEBUG
  const [followCount, setFollowCount] = useState(0)
  const [idsUsed, setIdsUsed] = useState([])
  const [errMsg, setErrMsg] = useState('')

  useEffect(()=>{
    let cancelled = false
    ;(async()=>{
      setLoading(true)
      setErrMsg('')
      setPosts([])
      setFollowCount(0)
      setIdsUsed([])

      // 1) leggo chi seguo
      const { data: fData, error: fErr } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (fErr) {
        console.warn('follows error', fErr)
        if (!cancelled) {
          setErrMsg(`follows: ${fErr.message}`)
          setLoading(false)
        }
        return
      }

      const followingIds = (fData ?? [])
        .map(x => x.following_id)
        .filter(Boolean)

      const ids = Array.from(new Set([user.id, ...followingIds]))

      if(!cancelled){
        setFollowCount(followingIds.length)
        setIdsUsed(ids)
      }

      // 2) leggo post miei + dei seguiti
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

      if(!cancelled){
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
    })()

    return ()=>{ cancelled = true }
  }, [user.id])

  return (
    <>
      <Topbar right={<button className="btn" onClick={signOut}>Esci</button>} />
      <main className="container main">

        {/* DEBUG BOX */}
        <div className="card">
          <div style={{padding:14}}>
            <div className="row" style={{gap:10, flexWrap:'wrap'}}>
              <span className="pill">follows trovati: {followCount}</span>
              <span className="pill">ids usati: {idsUsed.length}</span>
              <span className="pill">post ricevuti: {posts.length}</span>
            </div>
            {errMsg ? (
              <div style={{marginTop:10, color:'salmon', fontSize:12, lineHeight:1.4}}>
                ERRORE: {errMsg}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{height:12}} />

        {loading ? (
          <div className="card"><div style={{padding:14}}>Caricamento feed…</div></div>
        ) : posts.length === 0 ? (
          <div className="card"><div style={{padding:14}}>
            <b>Feed vuoto</b>
            <div style={{color:'var(--muted)', marginTop:6}}>Segui qualcuno oppure pubblica il tuo primo post.</div>
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
