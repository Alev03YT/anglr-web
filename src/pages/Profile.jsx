import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'

export default function Profile(){
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [following, setFollowing] = useState(false)
  const [counts, setCounts] = useState({followers:0, following:0, posts:0})
  const [posts, setPosts] = useState([])
  const [busy, setBusy] = useState(false)

  const isMe = useMemo(()=> profile?.id && profile.id === user.id, [profile?.id, user.id])

  useEffect(()=>{
    // reset quando cambio profilo (evita “flash” di vecchi dati)
    setProfile(null)
    setPosts([])
    setCounts({followers:0, following:0, posts:0})
    setFollowing(false)

    let cancelled = false
    ;(async()=>{
      const { data: p, error } = await supabase.from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .eq('username', username)
        .single()

      if(error){ console.warn(error); return }
      if(cancelled) return
      setProfile(p)

      const [followers, followingCount, postsCount] = await Promise.all([
        supabase.from('follows').select('*', {count:'exact', head:true}).eq('following_id', p.id),
        supabase.from('follows').select('*', {count:'exact', head:true}).eq('follower_id', p.id),
        supabase.from('posts').select('*', {count:'exact', head:true}).eq('user_id', p.id),
      ]).then(arr=>arr.map(r=>r.count||0))

      if(!cancelled) setCounts({followers, following: followingCount, posts: postsCount})

      const { data: rel } = await supabase.from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('following_id', p.id)
        .maybeSingle()

      if(!cancelled) setFollowing(!!rel)

      // ⚠️ qui prendiamo SOLO quello che serve per la griglia:
      // id + media (prima immagine/video) + created_at
      const { data: feed, error: feedErr } = await supabase
        .from('posts')
        .select(`
          id, created_at,
          post_media:post_media(url, media_type, sort_order)
        `)
        .eq('user_id', p.id)
        .order('created_at', {ascending:false})
        .limit(60)

      if(feedErr) console.warn(feedErr)

      if(!cancelled){
        setPosts((feed ?? []).map(x=>({
          ...x,
          post_media: (x.post_media ?? []).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))
        })))
      }
    })()

    return ()=>{ cancelled = true }
  }, [username, user.id])

  async function toggleFollow(){
    if(isMe || !profile?.id) return
    setBusy(true)
    try{
      if(following){
        const { error } = await supabase.from('follows').delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
        if(error) throw error
        setFollowing(false)
        setCounts(c=>({...c, followers: Math.max(0, c.followers-1)}))
      }else{
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id })
        if(error) throw error
        setFollowing(true)
        setCounts(c=>({...c, followers: c.followers+1}))
      }
    }catch(err){
      alert(err.message || String(err))
    }finally{
      setBusy(false)
    }
  }

  return (
    <>
      <Topbar right={<Link className="btn" to="/explore">Cerca</Link>} />
      <main className="container main">
        {!profile ? (
          <div className="card"><div style={{padding:14}}>Profilo non trovato.</div></div>
        ) : (
          <>
            <div className="card">
  <div style={{padding:20, textAlign:'center'}}>

    <div className="avatar" style={{margin:'0 auto', width:80, height:80}}>
      {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : null}
    </div>

    <div style={{marginTop:12, fontSize:20, fontWeight:900}}>
      {profile.display_name || profile.username}
    </div>

    <div style={{color:'var(--muted)', marginTop:2}}>
      @{profile.username}
    </div>

    <div className="row" style={{justifyContent:'center', gap:16, marginTop:14}}>
      <span className="pill">{counts.posts} post</span>
      <span className="pill">{counts.followers} follower</span>
      <span className="pill">{counts.following} seguiti</span>
    </div>

    <div style={{marginTop:14}}>
      {isMe ? (
        <span className="pill">Questo sei tu</span>
      ) : (
        <button
          className={`btn ${following ? '' : 'primary'}`}
          disabled={busy}
          onClick={toggleFollow}
        >
          {following ? 'Segui già' : 'Segui'}
        </button>
      )}
    </div>

    {profile.bio ? (
      <div style={{marginTop:12, lineHeight:1.5}}>
        {profile.bio}
      </div>
    ) : null}

  </div>
</div>

                {isMe ? (
                  <span className="pill">Questo sei tu</span>
                ) : (
                  <button className={`btn ${following?'':'primary'}`} disabled={busy} onClick={toggleFollow}>
                    {following ? 'Segui già' : 'Segui'}
                  </button>
                )}
              </div>

              {profile.bio ? <div style={{marginTop:10, lineHeight:1.5}}>{profile.bio}</div> : null}

              <div className="hr"></div>
              <div className="row spread">
                <span className="pill">{counts.posts} post</span>
                <span className="pill">{counts.followers} follower</span>
                <span className="pill">{counts.following} seguiti</span>
              </div>
            </div></div>

            <div style={{height:12}} />

            {posts.length === 0 ? (
              <div className="card"><div style={{padding:14, color:'var(--muted)'}}>Nessun post.</div></div>
            ) : (
              <div className="card">
                <div style={{padding:12}}>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
                    {posts.map(p=>{
                      const m = p.post_media?.[0]
                      return (
                        <Link
  key={p.id}
  to={`/p/${p.id}`}
  className="igTile"
>
  {m?.media_type === 'video' ? (
    <video
      src={m.url}
      muted
      playsInline
      preload="metadata"
    />
  ) : (
    <img
      src={m?.url}
      alt=""
      loading="lazy"
    />
  )}

  {/* badge tipo Instagram */}
  {m?.media_type === 'video' && (
    <div className="igTileBadge">🎬</div>
  )}
</Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
