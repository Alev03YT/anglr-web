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

  const recoveryFromUrl = new URLSearchParams(loc.search).get('mode') === 'reset'
  const [mode, setMode] = useState(recoveryFromUrl ? 'reset' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(()=>{
    if(recoveryFromUrl) setMode('reset')
  }, [recoveryFromUrl])

  useEffect(()=>{
    if(user && mode !== 'reset'){
      nav(loc.state?.from || '/', {replace:true})
    }
  }, [user, mode, nav, loc.state])

  function switchMode(next){
    setNotice('')
    setPassword('')
    setPassword2('')
    setMode(next)
  }

  async function submit(e){
    e.preventDefault()
    setBusy(true)
    setNotice('')

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

        setNotice('Account creato. Ora puoi accedere.')
        switchMode('login')
        return
      }

      if(mode === 'forgot'){
        const cleanEmail = email.trim()
        if(!cleanEmail) throw new Error('Inserisci la tua email.')

        const redirectTo = `${window.location.origin}${window.location.pathname}#/auth?mode=reset`
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo })
        if(error) throw error

        setNotice('Email di recupero inviata. Apri il link ricevuto e scegli una nuova password.')
        return
      }

      if(mode === 'reset'){
        if(!user?.id) throw new Error('Il link di recupero non è ancora pronto. Attendi qualche secondo e riprova, oppure riapri il link ricevuto via email.')
        if(password.length < 6) throw new Error('La nuova password deve contenere almeno 6 caratteri.')
        if(password !== password2) throw new Error('Le due password non coincidono.')

        const { error } = await supabase.auth.updateUser({ password })
        if(error) throw error

        alert('Password aggiornata ✅')
        nav('/', {replace:true})
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if(error) throw error
      nav('/', {replace:true})
    }catch(err){
      alert(err.message || String(err))
    }finally{
      setBusy(false)
    }
  }

  const title = mode === 'signup'
    ? 'Crea account'
    : mode === 'forgot'
      ? 'Recupera password'
      : mode === 'reset'
        ? 'Nuova password'
        : 'Accedi'

  return (
    <>
      <Topbar/>
      <main className="container main">
        <div className="card">
          <div style={{padding:14}}>
            <div className="row spread" style={{alignItems:'flex-start', flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:22, fontWeight:900, marginBottom:6}}>{title}</div>
                <div style={{color:'var(--muted)', fontSize:12}}>ANGLR • social pesca (web)</div>
              </div>

              {mode === 'login' || mode === 'signup' ? (
                <button className="btn" type="button" onClick={()=>switchMode(mode === 'signup' ? 'login' : 'signup')}>
                  {mode === 'signup' ? 'Ho già un account' : 'Nuovo account'}
                </button>
              ) : (
                <button className="btn" type="button" onClick={()=>switchMode('login')}>
                  Torna ad accedere
                </button>
              )}
            </div>

            <div className="hr"></div>

            {notice ? (
              <div style={{marginBottom:12, padding:12, borderRadius:14, background:'rgba(31,111,120,.14)', border:'1px solid rgba(31,111,120,.35)', lineHeight:1.45}}>
                {notice}
              </div>
            ) : null}

            {mode === 'reset' && !user ? (
              <div style={{marginBottom:12, color:'var(--muted)', fontSize:12, lineHeight:1.45}}>
                Sto verificando il link di recupero. Se il pulsante resta disabilitato, riapri il link ricevuto via email.
              </div>
            ) : null}

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

              {mode !== 'reset' ? (
                <div>
                  <label style={{color:'var(--muted)', fontSize:12}}>Email</label>
                  <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.it" autoComplete="email" />
                </div>
              ) : null}

              {mode === 'login' || mode === 'signup' ? (
                <div>
                  <label style={{color:'var(--muted)', fontSize:12}}>Password</label>
                  <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                </div>
              ) : null}

              {mode === 'reset' ? (
                <>
                  <div>
                    <label style={{color:'var(--muted)', fontSize:12}}>Nuova password</label>
                    <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Almeno 6 caratteri" autoComplete="new-password" />
                  </div>
                  <div>
                    <label style={{color:'var(--muted)', fontSize:12}}>Ripeti nuova password</label>
                    <input className="input" type="password" value={password2} onChange={e=>setPassword2(e.target.value)} placeholder="Ripeti la password" autoComplete="new-password" />
                  </div>
                </>
              ) : null}

              <button className="btn primary" disabled={busy || (mode === 'reset' && !user)}>
                {busy
                  ? '...'
                  : mode === 'signup'
                    ? 'Crea account'
                    : mode === 'forgot'
                      ? 'Invia email di recupero'
                      : mode === 'reset'
                        ? 'Salva nuova password'
                        : 'Entra'}
              </button>

              {mode === 'login' ? (
                <button
                  className="btn"
                  type="button"
                  onClick={()=>switchMode('forgot')}
                  style={{justifyContent:'center'}}
                >
                  Password dimenticata?
                </button>
              ) : null}
            </form>

            <div className="hr"></div>
            <div style={{color:'var(--muted)', fontSize:12}}>
              Il recupero password usa l'email associata al tuo account ANGLR.
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
