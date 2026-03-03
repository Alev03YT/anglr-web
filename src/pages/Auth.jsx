import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar.jsx'
import { supabase } from '../lib/supabase.js'
import { safeLower } from '../lib/format.js'
import { useAuth } from '../components/AuthProvider.jsx'

export default function Auth(){
  const nav = useNavigate()
  const loc = useLocation()
  const { user } = useAuth()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(()=>{
    if(user){
      nav(loc.state?.from || '/', {replace:true})
    }
  }, [user])

  async function submit(e){
    e.preventDefault()
    setBusy(true)
    try{
      if(mode === 'signup'){
        const u = safeLower(username)
        if(!u || u.length < 3) throw new Error('Username troppo corto (min 3).')
        const { data, error } = await supabase.auth.signUp({ email, password })
        if(error) throw error
        const userId = data.user?.id
        if(!userId) throw new Error('Signup ok ma user non trovato. Riprova.')

        const { error: e2 } = await supabase.from('profiles').insert({
          id: userId,
          username: u,
          display_name: displayName || u,
        })
        if(e2) throw e2

        alert('Account creato! Ora accedi.')
        setMode('login')
      }else{
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if(error) throw error
        nav('/', {replace:true})
      }
    }catch(err){
      alert(err.message || String(err))
    }finally{
      setBusy(false)
    }
  }

  return (
    <>
      <Topbar/>
      <main className="container main">
        <div className="card">
          <div style={{padding:14}}>
            <div className="row spread">
              <div>
                <div style={{fontSize:22, fontWeight:900, marginBottom:6}}>{mode === 'signup' ? 'Crea account' : 'Accedi'}</div>
                <div style={{color:'var(--muted)', fontSize:12}}>ANGLR • social pesca (web)</div>
              </div>
              <button className="btn" type="button" onClick={()=>setMode(mode==='signup'?'login':'signup')}>
                {mode === 'signup' ? 'Ho già un account' : 'Nuovo account'}
              </button>
            </div>

            <div className="hr"></div>

            <form onSubmit={submit} style={{display:'grid', gap:10}}>
              {mode === 'signup' ? (
                <>
                  <div>
                    <label style={{color:'var(--muted)', fontSize:12}}>Username (unico)</label>
                    <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="es: trota_92" />
                  </div>
                  <div>
                    <label style={{color:'var(--muted)', fontSize:12}}>Nome visualizzato</label>
                    <input className="input" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="es: Marco" />
                  </div>
                </>
              ) : null}

              <div>
                <label style={{color:'var(--muted)', fontSize:12}}>Email</label>
                <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.it" />
              </div>
              <div>
                <label style={{color:'var(--muted)', fontSize:12}}>Password</label>
                <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <button className="btn primary" disabled={busy}>
                {busy ? '...' : (mode === 'signup' ? 'Crea account' : 'Entra')}
              </button>
            </form>

            <div className="hr"></div>
            <div style={{color:'var(--muted)', fontSize:12}}>
              Prima di usare ANGLR crea le tabelle in Supabase: <code>supabase/schema.sql</code> + bucket Storage <code>media</code>.
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
