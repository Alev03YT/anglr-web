import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { timeAgo } from '../lib/format.js'
import CommentsModal from './CommentsModal.jsx'

export default function PostCard({ post, me }){
  const nav = useNavigate()
  const isMine = me?.id && post.user_id === me.id

  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // menu (⋯)
  const [menuOpen, setMenuOpen] = useState(false)

  // cuore animato
  const [heartPop, setHeartPop] = useState(false)
  const heartTimer = useRef(null)

  const media = Array.isArray(post.post_media) ? post.post_media[0] : post.post_media
  const fishing = Array.isArray(post.post_fishing) ? post.post_fishing[0] : post.post_fishing

  const username = post?.profiles?.username || null
  const profileHref = username ? `/u/${encodeURIComponent(username)}` : null

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

  function popHeart(){
    setHeartPop(true)
    if(heartTimer.current) clearTimeout(heartTimer.current)
    heartTimer.current = setTimeout(()=> setHeartPop(false), 520)
  }

  async function toggleLike({ forceOn = false } = {}){
    if(!me?.id) return alert('Devi accedere per mettere like.')
    if(busy) return
    setBusy(true)

    try{
      if(liked && !forceOn){
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', me.id)
        if(error) throw error
        setLiked(false)
        setLikesCount(v=>Math.max(0, v-1))
      }else{
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: me.id })

        // se già esiste, ignora
        if(error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error

        if(!liked) setLikesCount(v=>v+1)
        setLiked(true)
        popHeart()
      }
    }catch(err){
      alert(err.message || String(err))
    }finally{
      setBusy(false)
    }
  }

  // ✅ IG behavior: 1 tap apre post, double tap mette like
  const lastTapRef = useRef(0)
  const singleTapTimer = useRef(null)

  function onMediaTap(){
    const now = Date.now()
    const diff = now - lastTapRef.current
    lastTapRef.current = now

    // Double tap
    if(diff > 0 && diff < 320){
      if(singleTapTimer.current) clearTimeout(singleTapTimer.current)
      toggleLike({ forceOn: true })
      return
    }

    // Single tap (aspetta un attimo per capire se arriva il secondo tap)
    if(singleTapTimer.current) clearTimeout(singleTapTimer.current)
    singleTapTimer.current = setTimeout(()=>{
      nav(`/p/${post.id}`)
    }, 420)
  }

  async function editCaption(){
    if(!isMine) return
    const next = prompt('Modifica descrizione:', post.caption ?? '')
    if(next === null) return
    const { error } = await supabase
      .from('posts')
      .update({ caption: next })
      .eq('id', post.id)
    if(error) return alert(error.message)
    post.caption = next
    setMenuOpen(false)
    alert('Descrizione aggiornata ✅')
  }

  async function deletePost(){
    if(!isMine) return
    if(!confirm('Eliminare questo post?')) return
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id)
    if(error) return alert(error.message)
    setMenuOpen(false)
    alert('Post eliminato ✅')
    window.history.back()
  }

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="row spread" style={{padding:'12px 12px 10px'}}>
          {profileHref ? (
            <Link to={profileHref} className="row" style={{gap:10}}>
              <div className="avatar" style={{width:36, height:36, borderRadius:14}}>
                {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" /> : null}
              </div>
              <div style={{lineHeight:1.1}}>
                <b style={{fontSize:13}}>@{username}</b>
                <div className="muted" style={{fontSize:12}}>{timeAgo(post.created_at)}</div>
              </div>
            </Link>
          ) : (
            <div className="row" style={{gap:10}}>
              <div className="avatar" style={{width:36, height:36, borderRadius:14}} />
              <div style={{lineHeight:1.1}}>
                <b style={{fontSize:13}}>@utente</b>
                <div className="muted" style={{fontSize:12}}>{timeAgo(post.created_at)}</div>
              </div>
            </div>
          )}

          <div className="row" style={{gap:8}}>
            <div className="pill">{likesCount} ❤️</div>

            {/* ⋯ SOLO se tuo */}
            {isMine ? (
              <div className="moreWrap">
                <button className="moreBtn" onClick={()=>setMenuOpen(v=>!v)} aria-label="Menu post">⋯</button>
                {menuOpen ? (
                  <div className="moreMenu">
                    <button className="moreItem" onClick={editCaption}>✏️ Modifica</button>
                    <button className="moreItem danger" onClick={deletePost}>🗑 Elimina</button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

{/* Media (tap/double-tap) */}
<div className="postMedia postMediaTap">
  {media?.media_type === 'video'
    ? <video src={media.url} controls playsInline />
    : <img src={media?.url} alt="" loading="lazy" />
  }

  {/* layer sopra che cattura i tap */}
  <div
    className="tapLayer"
    onClick={onMediaTap}
    role="button"
    tabIndex={0}
  />

  <div className={`heartBurst ${heartPop ? 'show' : ''}`}>❤️</div>
</div>

        {/* Body */}
        <div className="postBody">
          <div className="actions">
            <button className={`actionBtn ${liked?'on':''}`} onClick={()=>toggleLike()} disabled={busy}>
              {liked ? '❤️ Liked' : '🤍 Like'}
            </button>
            <button className="actionBtn" onClick={()=>setCommentsOpen(true)}>💬 Commenti</button>
          </div>

          {badges.length ? (
            <div className="badgeRow">
              {badges.map((t,i)=>(<span key={i} className="pill">{t}</span>))}
            </div>
          ) : null}

          {post.caption ? (
            <div style={{marginTop:10}}>
              <span style={{color:'var(--muted)'}}>@{username ?? 'utente'}</span>{' '}
              {post.caption}
            </div>
          ) : null}

          {fishing?.spot_area ? (
            <div style={{marginTop:10}} className="pill">
              📍 {fishing.spot_privacy === 'followers_only'
                ? 'Zona (solo followers)'
                : fishing.spot_privacy === 'private'
                  ? 'Zona (privata)'
                  : 'Zona'
              }: {fishing.spot_area}
            </div>
          ) : null}
        </div>
      </div>

      <CommentsModal open={commentsOpen} onClose={()=>setCommentsOpen(false)} postId={post.id} user={me} />
    </>
  )
}
