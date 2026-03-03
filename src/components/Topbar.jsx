import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Topbar({right}){
  return (
    <div className="topbar">
      <div className="container topbarInner">
        <Link to="/" className="brand" aria-label="ANGLR">
          <div className="logo"><Logo/></div>
          <div className="brandTitle">
            <b>ANGLR</b>
            <div>pesca • community • tecnica</div>
          </div>
        </Link>
        <div className="row">{right}</div>
      </div>
    </div>
  )
}
