import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'
import PostCard from '../components/PostCard.jsx'

export default function PostPage(){
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let cancelled = false
    ;(async()=>{
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, user_id, caption, created_at, visibility,
          profiles:profiles(username, avatar_url),
          post_media:post_media(url, media_type, sort_order),
          post_fishing:post_fishing(environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text)
        `)
        .eq('id', id)
        .single()

      if(cancelled) return
      if(error){ console.warn(error); setPost(null) }
      else setPost({
        ...data,
        post_media: (data.post_media ?? []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)),
      })
      setLoading(false)
    })()
    return ()=>{ cancelled = true }
  }, [id])

  return (
    <>
      <Topbar right={<button className="btn" onClick={()=>nav(-1)}>Indietro</button>} />
      <main className="container main">
        {loading ? (
          <div className="card"><div style={{padding:14}}>Caricamento…</div></div>
        ) : !post ? (
          <div className="card"><div style={{padding:14}}>Post non trovato (o non visibile).</div></div>
        ) : (
          <PostCard post={post} me={user} />
        )}
      </main>
    </>
  )
}
