import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'
import PostCard from '../components/PostCard.jsx'

export default function Home(){
  const { user, signOut } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let cancelled = false
    ;(async()=>{
      setLoading(true)

      const { data: fData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const ids = new Set([user.id])
      ;(fData ?? []).forEach(x=>ids.add(x.following_id))

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, user_id, caption, created_at,
          profiles:profiles(username, avatar_url),
          post_media:post_media(url, media_type, sort_order),
          post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
        `)
        .in('user_id', Array.from(ids))
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
  }, [user.id])

  return (
    <>
      <Topbar right={<button className="btn" onClick={signOut}>Esci</button>} />
      <main className="container main">
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
