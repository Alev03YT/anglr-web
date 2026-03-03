import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export default function AuthProvider({children}){
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let alive = true
    supabase.auth.getSession().then(({data})=>{
      if(!alive) return
      setSession(data.session ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s)=>setSession(s))
    return ()=>{ alive = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  const value = useMemo(()=>({
    session,
    user: session?.user ?? null,
    loading,
    signOut: ()=>supabase.auth.signOut(),
  }), [session, loading])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
