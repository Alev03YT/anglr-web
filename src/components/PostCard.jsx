import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { timeAgo } from '../lib/format.js'
import CommentsModal from './CommentsModal.jsx'

export default function PostCard({post, me}){
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const media = post.post_media?.[0]
  const fishing = post.post_fishing?.[0]

  const badges = useMemo(()=>{
    if(!fishing) return []
    const b = []
    if(fishing.environment) b.push(fishing.environment === 'salt' ? '🌊 Mare' : '🏞️ Interno')
    if(fishing.technique_text) b.push(`🎣 ${fishing.technique_text}`)
    if(fishing.species_text) b.push(`🐟 ${fishing.species_text}`)
    if(fishing.bait_kind) b.push(fishing.bait_kind === 'artificial' ? '🧲 Artificiale' : '🪱 Naturale')
    if(fishing.bait_color) b.push(`🎨 ${fishing.bait_color}`)
    return b.slice(0,5)
  }, [fishing])

  useEffect(()=>{
    let cancelled = false
    if(!me?.id) return
    ;(async()=>{
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', post.id)
        .eq('user_id', me.id)
        .maybeSingle()
      if(!cancelled){
        if(error && error.code !== 'PGRST116') console.warn(error)
        setLiked(!!data)
      }
    })()
    return ()=>{ cancelled = true }
  }, [post.id, me?.id])

  async function toggleLike(){
    if(!me?.id) return alert('Devi accedere per mettere like.')
    if(busy) return
    setBusy(true)
    if(liked){
      const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', me.id)
      if(!error){
        setLiked(false)
        setLikesCount(v=>Math.max(0, v-1))
      }else alert(error.message)
    }else{
      const { error } = await supabase.from('post_likes').insert({post_id: post.id, user_id: me.id})
      if(!error){
        setLiked(true)
        setLikesCount(v=>v+1)
      }else alert(error.message)
    }
    setBusy(false)
  }

  return (
    <>
      <div className="card">
        <div className="row spread" style={{padding:'12px 12px 10px'}}>
          <div className="row" style={{gap:10}}>
            <div className="avatar" style={{width:36, height:36, borderRadius:14}}>
              {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" /> : null}
            </div>
            <div style={{lineHeight:1.1}}>
              <b style={{fontSize:13}}>@{post.profiles?.username ?? 'utente'}</b>
              <div className="muted" style={{fontSize:12}}>{timeAgo(post.created_at)}</div>
            </div>
          </div>
          <div className="pill">{likesCount} ❤️</div>
        </div>

        <div className="postMedia">
          {media?.media_type === 'video' ? <video src={media.url} controls playsInline /> : <img src={media?.url} alt="" loading="lazy" />}
        </div>

        <div className="postBody">
          <div className="actions">
            <button className={`actionBtn ${liked?'on':''}`} onClick={toggleLike} disabled={busy}>
              {liked ? '❤️ Liked' : '🤍 Like'}
            </button>
            <button className="actionBtn" onClick={()=>setCommentsOpen(true)}>💬 Commenti</button>
          </div>

          {badges.length ? <div className="badgeRow">{badges.map((t,i)=>(<span key={i} className="pill">{t}</span>))}</div> : null}

          {post.caption ? (
            <div style={{marginTop:10, lineHeight:1.55}}>
              <span style={{color:'var(--muted)'}}>@{post.profiles?.username ?? 'utente'}</span>{' '}
              {post.caption}
            </div>
          ) : null}

          {fishing?.spot_area ? (
            <div style={{marginTop:10}} className="pill">
              📍 {fishing.spot_privacy === 'followers_only' ? 'Zona (solo followers)' : fishing.spot_privacy === 'private' ? 'Zona (privata)' : 'Zona'}: {fishing.spot_area}
            </div>
          ) : null}
        </div>
      </div>

      <CommentsModal open={commentsOpen} onClose={()=>setCommentsOpen(false)} postId={post.id} user={me} />
    </>
  )
}
