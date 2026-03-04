import { useMemo, useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase } from '../lib/supabase.js'
import { safeLower } from '../lib/format.js'

export default function Create(){
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)

  const [environment, setEnvironment] = useState('fresh')
  const [waterType, setWaterType] = useState('river')
  const [speciesText, setSpeciesText] = useState('')
  const [techniqueText, setTechniqueText] = useState('')
  const [baitKind, setBaitKind] = useState('artificial')
  const [baitName, setBaitName] = useState('')
  const [baitColor, setBaitColor] = useState('')
  const [spotArea, setSpotArea] = useState('')
  const [spotPrivacy, setSpotPrivacy] = useState('public_area')

  const ok = useMemo(()=> !!file && !!safeLower(speciesText) && !!safeLower(techniqueText), [file, speciesText, techniqueText])

  function pick(e){
    const f = e.target.files?.[0]
    if(f) setFile(f)
  }

  async function publish(){
    if(!ok) return alert('Mancano campi obbligatori: foto, specie, tecnica.')
    setBusy(true)
    let postId = null
    try{
      const { data: postData, error: e1 } = await supabase
        .from('posts')
        .insert({ user_id: user.id, caption: caption.trim(), visibility: 'public' })
        .select('id')
        .single()
      if(e1) throw e1
      postId = postData.id

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `media/${user.id}/${postId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if(upErr) throw upErr
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)

      const { error: e2 } = await supabase.from('post_media').insert({
        post_id: postId,
        url: pub.publicUrl,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        sort_order: 0,
      })
      if(e2) throw e2

      const { error: e3 } = await supabase.from('post_fishing').insert({
        post_id: postId,
        environment,
        water_type: waterType,
        species_text: speciesText.trim(),
        technique_text: techniqueText.trim(),
        bait_kind: baitKind,
        bait_name: baitName.trim(),
        bait_color: baitKind === 'artificial' ? baitColor.trim() : null,
        spot_area: spotArea.trim() || null,
        spot_privacy: spotArea.trim() ? spotPrivacy : 'private',
      })
      if(e3) throw e3

      alert('Post pubblicato ✅')
      setFile(null); setCaption(''); setSpeciesText(''); setTechniqueText(''); setBaitName(''); setBaitColor(''); setSpotArea('')
    }catch(err){
      if (postId) {
  try {
    await supabase.from('posts').delete().eq('id', postId)
  } catch (e) {
    console.warn('Cleanup delete failed', e)
  }
}
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
            <div style={{fontSize:22, fontWeight:900, marginBottom:6}}>Crea post</div>
            <div style={{color:'var(--muted)', fontSize:12}}>Stile Instagram, ma con scheda pesca.</div>

            <div className="hr"></div>

            <div style={{display:'grid', gap:10}}>
              <div>
                <label style={{color:'var(--muted)', fontSize:12}}>Foto/Video *</label>
                <input className="input" type="file" accept="image/*,video/*" onChange={pick} />
                {file ? <div style={{color:'var(--muted)', fontSize:12, marginTop:8}}>Selezionato: {file.name}</div> : null}
              </div>

              <div>
                <label style={{color:'var(--muted)', fontSize:12}}>Descrizione</label>
                <textarea className="input" value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Racconta la pescata, consigli, recupero…" />
              </div>

              <div className="hr"></div>
              <b>Scheda pesca (rapida)</b>
              <div style={{color:'var(--muted)', fontSize:12}}>Obbligatori: Specie, Tecnica. Consigliato: Ambiente.</div>

              <div className="row" style={{gap:10}}>
                <div style={{flex:1}}>
                  <label style={{color:'var(--muted)', fontSize:12}}>Ambiente</label>
                  <select className="input" value={environment} onChange={e=>setEnvironment(e.target.value)}>
                    <option value="fresh">Acque interne</option>
                    <option value="salt">Mare</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{color:'var(--muted)', fontSize:12}}>Tipo acqua</label>
                  <select className="input" value={waterType} onChange={e=>setWaterType(e.target.value)}>
                    <option value="river">Fiume</option>
                    <option value="lake">Lago</option>
                    <option value="stream">Torrente</option>
                    <option value="canal">Canale</option>
                    <option value="harbor">Porto</option>
                    <option value="rocks">Scogliera</option>
                    <option value="beach">Spiaggia</option>
                    <option value="boat">Barca</option>
                  </select>
                </div>
              </div>

              <div className="row" style={{gap:10}}>
                <div style={{flex:1}}>
                  <label style={{color:'var(--muted)', fontSize:12}}>Specie *</label>
                  <input className="input" value={speciesText} onChange={e=>setSpeciesText(e.target.value)} placeholder="Spigola / Trota / Orata…" />
                </div>
                <div style={{flex:1}}>
                  <label style={{color:'var(--muted)', fontSize:12}}>Tecnica *</label>
                  <input className="input" value={techniqueText} onChange={e=>setTechniqueText(e.target.value)} placeholder="Spinning / Surfcasting / Bolentino…" />
                </div>
              </div>

              <div className="row" style={{gap:10}}>
                <div style={{flex:1}}>
                  <label style={{color:'var(--muted)', fontSize:12}}>Esca</label>
                  <select className="input" value={baitKind} onChange={e=>setBaitKind(e.target.value)}>
                    <option value="artificial">Artificiale</option>
                    <option value="natural">Naturale</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{color:'var(--muted)', fontSize:12}}>Nome esca</label>
                  <input className="input" value={baitName} onChange={e=>setBaitName(e.target.value)} placeholder="minnow / sarda / verme…" />
                </div>
              </div>

              {baitKind === 'artificial' ? (
                <div>
                  <label style={{color:'var(--muted)', fontSize:12}}>Colore artificiale</label>
                  <input className="input" value={baitColor} onChange={e=>setBaitColor(e.target.value)} placeholder="sardina / chartreuse / perla…" />
                </div>
              ) : null}

              <div>
                <label style={{color:'var(--muted)', fontSize:12}}>Zona (NO spot preciso)</label>
                <input className="input" value={spotArea} onChange={e=>setSpotArea(e.target.value)} placeholder="Costa Tirrenica nord / Alto Garda…" />
              </div>

              {spotArea.trim() ? (
                <div>
                  <label style={{color:'var(--muted)', fontSize:12}}>Privacy zona</label>
                  <select className="input" value={spotPrivacy} onChange={e=>setSpotPrivacy(e.target.value)}>
                    <option value="public_area">Mostra zona</option>
                    <option value="followers_only">Solo followers</option>
                    <option value="private">Solo io</option>
                  </select>
                </div>
              ) : null}

              <button className="btn primary" disabled={!ok || busy} onClick={publish}>
                {busy ? 'Pubblico…' : 'Pubblica'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
