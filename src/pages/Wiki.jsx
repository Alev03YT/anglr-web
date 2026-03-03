import Topbar from '../components/Topbar.jsx'

const sections = [
  {title:'Tecniche', items:['Spinning','Surfcasting','Bolentino','Feeder','Mosca','Traina']},
  {title:'Montature', items:['Finale fluorocarbon','Trave + bracciolo','Drop shot','Bombarda','Sabiki','Piombo guardiano']},
  {title:'Esche', items:['Minnow','Jig','Soft bait','Sarda','Vermone','Bigattino']},
  {title:'Specie', items:['Spigola','Orata','Sarago','Trota','Black bass','Luccio']},
]

export default function Wiki(){
  return (
    <>
      <Topbar/>
      <main className="container main">
        <div className="card"><div style={{padding:14}}>
          <div style={{fontSize:22, fontWeight:900, marginBottom:6}}>Wiki</div>
          <div style={{color:'var(--muted)', fontSize:12}}>Placeholder MVP: poi ci mettiamo guide vere + post correlati.</div>
        </div></div>

        <div style={{height:12}} />

        <div style={{display:'grid', gap:12}}>
          {sections.map(s=>(
            <div key={s.title} className="card">
              <div style={{padding:14}}>
                <b>{s.title}</b>
                <div className="badgeRow">
                  {s.items.map(x=> <span key={x} className="pill">{x}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
