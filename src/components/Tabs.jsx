import { NavLink } from 'react-router-dom'

const Icon = ({d}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Tabs(){
  const items = [
    {to:'/', label:'Home', d:'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z'},
    {to:'/explore', label:'Esplora', d:'M21 21l-4.3-4.3m1.3-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z'},
    {to:'/create', label:'Crea', d:'M12 5v14m-7-7h14'},
    {to:'/wiki', label:'Wiki', d:'M4 19a2 2 0 0 1 2-2h14V5H6a2 2 0 0 0-2 2v12Z'},
    {to:'/me', label:'Profilo', d:'M20 21a7 7 0 0 0-14 0m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'},
  ]
  return (
    <div className="tabs">
      <div className="tabsInner">
        {items.map(it=>(
          <NavLink key={it.to} to={it.to} className={({isActive})=>`tab ${isActive?'active':''}`}>
            <Icon d={it.d}/>
            <div>{it.label}</div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
