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

    async function loadFeed(){
      setLoading(true)

      // 1️⃣ prendo chi seguo
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = (follows ?? []).map(f => f.following_id)

      // 2️⃣ aggiungo anche i miei post
      const ids = [user.id, ...followingIds]

      let query = supabase
        .from('posts')
        .select(`
          id, user_id, caption, created_at,
          profiles:profiles(username, avatar_url),
          post_media:post_media(url, media_type, sort_order),
          post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
        `)
        .order('created_at', {ascending:false})
        .limit(30)

      // 3️⃣ filtro utenti seguiti
      if(ids.length > 0){
        query = query.in('user_id', ids)
      }

      const { data, error } = await query

      if(error) console.warn(error)

      let feed = data ?? []

      // 4️⃣ fallback: se feed vuoto mostra ultimi post pubblici
      if(feed.length === 0){
        const { data: explore } = await supabase
          .from('posts')
          .select(`
            id, user_id, caption, created_at,
            profiles:profiles(username, avatar_url),
            post_media:post_media(url, media_type, sort_order),
            post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
          `)
          .order('created_at', {ascending:false})
          .limit(30)

        feed = explore ?? []
      }

      if(!cancelled){
        setPosts(feed.map(p=>({
          ...p,
          post_media: (p.post_media ?? []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)),
        })))
        setLoading(false)
      }
    }

    loadFeed()

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
            <div style={{color:'var(--muted)', marginTop:6}}>
              Segui qualcuno oppure pubblica il tuo primo post.
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
