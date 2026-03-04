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

    async function load(){

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if(!postData){
        setPost(null)
        setLoading(false)
        return
      }

      const { data: media } = await supabase
        .from('post_media')
        .select('*')
        .eq('post_id', id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', postData.user_id)
        .maybeSingle()

      const merged = {
        ...postData,
        profiles: profile,
        post_media: media ?? []
      }

      if(!cancelled){
        setPost(merged)
        setLoading(false)
      }
    }

    load()

    return ()=>{ cancelled = true }

  }, [id])


  return (
    <>
      <Topbar right={<button className="btn" onClick={()=>nav(-1)}>Indietro</button>} />

      <main className="container main">

        {loading && (
          <div className="card">
            <div style={{padding:14}}>Caricamento…</div>
          </div>
        )}

        {!loading && !post && (
          <div className="card">
            <div style={{padding:14}}>Post non trovato.</div>
          </div>
        )}

        {!loading && post && (
          <PostCard post={post} me={user} />
        )}

      </main>
    </>
  )
}
