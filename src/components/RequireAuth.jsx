import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'

export default function RequireAuth({children}){
  const { user, loading } = useAuth()
  const loc = useLocation()
  if(loading) return <div className="container main"><div className="card"><div style={{padding:14}}>Caricamento…</div></div></div>
  if(!user) return <Navigate to="/auth" state={{from: loc.pathname}} replace />
  return children
}
