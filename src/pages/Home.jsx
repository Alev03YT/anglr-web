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

      // 1) Prendo chi seguo
      const { data: fData, error: fErr } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (fErr) console.warn('follows error:', fErr)

      const followingIds = (fData ?? [])
        .map(x => x.following_id)
        .filter(Boolean)

      // 2) Creo lista utenti del feed: io + seguiti
      const idList = Array.from(new Set([user.id, ...followingIds]))

      // 3) Provo a caricare feed (io + seguiti)
      let feed = []
      let feedErr = null

      if (idList.length > 0){
        const res = await supabase
          .from('posts')
          .select(`
            id, user_id, caption, created_at, visibility,
            profiles:profiles(username, avatar_url),
            post_media:post_media(url, media_type, sort_order),
            post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
          `)
          .in('user_id', idList)
          // se hai policy "solo public", questa riga aiuta a non perdere i tuoi post privati
          .or(`visibility.eq.public,user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(30)

        feed = res.data ?? []
        feedErr = res.error ?? null
      }

      if (feedErr) console.warn('feed error:', feedErr)

      // 4) Fallback: se feed vuoto, mostra ultimi post pubblici (tipo "per te")
      if (!feed || feed.length === 0){
        const res2 = await supabase
          .from('posts')
          .select(`
            id, user_id, caption, created_at, visibility,
            profiles:profiles(username, avatar_url),
            post_media:post_media(url, media_type, sort_order),
            post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
          `)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(30)

        if (res2.error) console.warn('fallback error:', res2.error)
        feed = res2.data ?? []
      }

      // 5) Normalizzo media/ fishing e setto UI
      const normalized = (feed ?? []).map(p => ({
        ...p,
        post_media: (Array.isArray(p.post_media) ? p.post_media : (p.post_media ? [p.post_media] : []))
          .sort((a,b)=>(a.sort_order ?? 0) - (b.sort_order ?? 0)),
        post_fishing: Array.isArray(p.post_fishing) ? p.post_fishing : (p.post_fishing ? [p.post_fishing] : []),
      }))

      if (!cancelled){
        setPosts(normalized)
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
              Non ci sono post da mostrare. Prova a pubblicare oppure vai su “Esplora”.
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
