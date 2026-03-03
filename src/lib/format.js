export function timeAgo(iso){
  if(!iso) return ''
  const dt = new Date(iso)
  const s = Math.floor((Date.now() - dt.getTime())/1000)
  const m = Math.floor(s/60)
  const h = Math.floor(m/60)
  const d = Math.floor(h/24)
  if(s < 60) return `${s}s`
  if(m < 60) return `${m}m`
  if(h < 24) return `${h}h`
  return `${d}g`
}
export function safeLower(x){
  return (x ?? '').toString().trim().toLowerCase()
}
