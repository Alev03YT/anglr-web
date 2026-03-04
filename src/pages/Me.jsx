import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'

export default function Me(){
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [counts, setCounts] = useState({followers:0, following:0, posts:0})
  const [myPosts, setMyPosts] = useState([])

  useEffect(()=>{
    let cancelled = false
    ;(async()=>{
      const { data: p } = await supabase.from('profiles').select('id, username, display_name, avatar_url, bio').eq('id', user.id).single()

      const [followers, following, posts] = await Promise.all([
        supabase.from('follows').select('*', {count:'exact', head:true}).eq('following_id', user.id),
        supabase.from('follows').select('*', {count:'exact', head:true}).eq('follower_id', user.id),
        supabase.from('posts').select('*', {count:'exact', head:true}).eq('user_id', user.id),
      ]).then(arr=>arr.map(r=>r.count||0))

      const { data: mp } = await supabase
        .from('posts')
        .select('id, created_at, post_media:post_media(url, media_type, sort_order)')
        .eq('user_id', user.id)
        .order('created_at', {ascending:false})
        .limit(30)

      if(!cancelled){
        setProfile(p)
        setCounts({followers, following, posts})
        setMyPosts((mp ?? []).map(x=>({...x, post_media:(x.post_media??[]).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))})))
      }
    })()
    return ()=>{ cancelled = true }
  }, [user.id])

  return (
    <>
      <Topbar/>
      <main className="container main">
        <div className="card"><div style={{padding:14}}>
          <div className="row spread">
            <div className="row" style={{gap:12}}>
              <div className="avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : null}</div>
              <div>
                <div style={{fontSize:22, fontWeight:900}}>{profile?.display_name ?? 'Io'}</div>
                <div style={{color:'var(--muted)'}}>@{profile?.username ?? 'me'}</div>
              </div>
            </div>
            <Link className="btn" to={`/u/${profile?.username ?? ''}`}>Vedi profilo</Link>
          </div>

          {profile?.bio ? <div style={{marginTop:10, lineHeight:1.5}}>{profile.bio}</div> : null}

          <div className="hr"></div>
          <div className="row spread">
            <span className="pill">{counts.posts} post</span>
            <span className="pill">{counts.followers} follower</span>
            <span className="pill">{counts.following} seguiti</span>
          </div>
        </div></div>

        <div style={{height:12}} />

        <div className="card"><div style={{padding:14}}>
          <b>I miei post</b>
          {myPosts.length === 0 ? (
            <div style={{color:'var(--muted)', marginTop:8}}>Ancora nulla. Vai su “Crea”.</div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginTop:10}}>
              {myPosts.map(p=>{
                const m = p.post_media?.[0]
                return (
                  <div key={p.id} style={{borderRadius:14, overflow:'hidden', border:'1px solid rgba(230,241,243,.08)', background:'rgba(0,0,0,.16)', aspectRatio:'1/1'}}>
                    {m?.media_type === 'video' ? (
                      <video src={m.url} muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : (
                      <img src={m?.url} alt="" loading="lazy" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div></div>
      </main>
    </>
  )
}
