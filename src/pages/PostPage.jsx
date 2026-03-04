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
  const [err, setErr] = useState('')

  useEffect(()=>{
    let cancelled = false

    ;(async()=>{
      setLoading(true)
      setErr('')
      setPost(null)

      try{
        // 1) Post base
        const { data: p, error: pErr } = await supabase
          .from('posts')
          .select('id, user_id, caption, created_at, visibility')
          .eq('id', id)
          .maybeSingle()

        if(pErr) throw pErr
        if(!p){
          if(!cancelled){
            setPost(null)
            setLoading(false)
          }
          return
        }

        // 2) Autore (profilo)
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', p.user_id)
          .maybeSingle()

        if(profErr) throw profErr

        // 3) Media
        const { data: media, error: mErr } = await supabase
          .from('post_media')
          .select('url, media_type, sort_order')
          .eq('post_id', p.id)
          .order('sort_order', { ascending: true })

        if(mErr) throw mErr

        // 4) Scheda pesca
        const { data: fish, error: fErr } = await supabase
          .from('post_fishing')
          .select('environment, bait_kind, bait_color, bait_name, spot_area, spot_privacy, species_text, technique_text')
          .eq('post_id', p.id)
          .maybeSingle()

        if(fErr) throw fErr

        const merged = {
          ...p,
          profiles: prof ?? null,
          post_media: media ?? [],
          post_fishing: fish ?? null,
        }

        if(!cancelled){
          setPost(merged)
          setLoading(false)
        }
      }catch(e){
        console.warn(e)
        if(!cancelled){
          setErr(e?.message || String(e))
          setLoading(false)
        }
      }
    })()

    return ()=>{ cancelled = true }
  }, [id])

  return (
    <>
      <Topbar right={<button className="btn" onClick={()=>nav
