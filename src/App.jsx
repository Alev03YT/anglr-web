import PostPage from './pages/PostPage.jsx'
import { Routes, Route } from 'react-router-dom'
import AuthProvider from './components/AuthProvider.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Tabs from './components/Tabs.jsx'

import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import Create from './pages/Create.jsx'
import Wiki from './pages/Wiki.jsx'
import Me from './pages/Me.jsx'
import Profile from './pages/Profile.jsx'
import Auth from './pages/Auth.jsx'

export default function App(){
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<Auth/>} />
        <Route path="/" element={<RequireAuth><Home/></RequireAuth>} />
        <Route path="/explore" element={<RequireAuth><Explore/></RequireAuth>} />
        <Route path="/create" element={<RequireAuth><Create/></RequireAuth>} />
        <Route path="/wiki" element={<RequireAuth><Wiki/></RequireAuth>} />
        <Route path="/me" element={<RequireAuth><Me/></RequireAuth>} />
        <Route path="/u/:username" element={<RequireAuth><Profile/></RequireAuth>} />
        <Route path="/p/:id" element={<RequireAuth><PostPage/></RequireAuth>} />
      </Routes>
      <Tabs/>
    </AuthProvider>
  )
}
