import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { timeAgo } from '../lib/format.js'

export default function CommentsModal({open, onClose, postId, user}){
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function reload(){
    const { data, error } = await supabase
      .from('post_comments')
      .select('id, text, created_at, user_id, profiles:profiles(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', {ascending: false})
      .limit(50)
    if(error) console.warn(error)
    setItems(data ?? [])
  }

  useEffect(()=>{
    if(open) reload()
  }, [open, postId])

  async function send(){
    if(!text.trim()) return
    setBusy(true)
    const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, text: text.trim() })
    setBusy(false)
    if(error) return alert('Errore: ' + error.message)
    setText('')
    reload()
  }

  if(!open) return null
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modalPad">
          <div className="row spread">
            <b>Commenti</b>
            <button className="btn" onClick={onClose}>Chiudi</button>
          </div>
          <div className="hr"></div>
          <div className="row" style={{gap:10}}>
            <input className="input" placeholder="Scrivi un commento…" value={text} onChange={e=>setText(e.target.value)} />
            <button className="btn primary" disabled={busy || !text.trim()} onClick={send}>Invia</button>
          </div>
          <div style={{marginTop:12, display:'grid', gap:10}}>
            {items.length === 0 ? (
              <div className="muted" style={{fontSize:12}}>Nessun commento. Sii il primo 🙂</div>
            ) : items.map(c=>(
              <div key={c.id} className="card" style={{background:'rgba(13,28,31,.42)'}}>
                <div style={{padding:12}}>
                  <div className="row" style={{gap:10}}>
                    <div className="avatar" style={{width:34, height:34, borderRadius:12}}>
                      {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt="" /> : null}
                    </div>
                    <div style={{lineHeight:1.1}}>
                      <b style={{fontSize:13}}>@{c.profiles?.username ?? 'utente'}</b>
                      <div className="muted" style={{fontSize:12}}>{timeAgo(c.created_at)}</div>
                    </div>
                  </div>
                  <div style={{marginTop:8, lineHeight:1.5}}>{c.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{height:10}} />
        </div>
      </div>
    </div>
  )
}
