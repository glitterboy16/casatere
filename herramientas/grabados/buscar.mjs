#!/usr/bin/env node
// Busca grabados de dominio público en Wikimedia Commons.
//
//   node buscar.mjs "octopus engraving"
//   node buscar.mjs "Laitue Vilmorin-Andrieux 1904" --min 1500
//   node buscar.mjs --categoria "Category:Octopus vulgaris illustrations"
//   node buscar.mjs --archivo "File:Champignon_de_couche_Vilmorin-Andrieux_1904.png"
//
// Lista título, tamaño, licencia, autor, fecha y la URL del original. Por
// defecto solo muestra dominio público y CC0 (uso comercial sin permisos).

const AGENTE = process.env.GRABADOR_AGENTE ?? 'Grabador/1.0 (herramienta de ilustración)'
const args = process.argv.slice(2)
const opcion = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const min = Number(opcion('--min') ?? 0)
const todas = args.includes('--todas')

const api = async (params) => {
  const url = 'https://commons.wikimedia.org/w/api.php?format=json&origin=*&' + new URLSearchParams(params)
  const r = await fetch(url, { headers: { 'User-Agent': AGENTE } })
  if (!r.ok) throw new Error(`Commons respondió ${r.status}`)
  return r.json()
}
const limpiar = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 70)
const libre = (lic) => /public domain|cc0|no restrictions|pd/i.test(lic)

const info = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist|DateTimeOriginal|ObjectName' }
let consulta
if (opcion('--categoria')) consulta = { action: 'query', generator: 'categorymembers', gcmtitle: opcion('--categoria'), gcmtype: 'file', gcmlimit: 80, ...info }
else if (opcion('--archivo')) consulta = { action: 'query', titles: opcion('--archivo'), ...info }
else consulta = { action: 'query', generator: 'search', gsrnamespace: 6, gsrlimit: 30, gsrsearch: args.filter((a) => !a.startsWith('--') && a !== opcion('--min')).join(' '), ...info }

const j = await api(consulta)
const paginas = Object.values(j.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
let n = 0
for (const p of paginas) {
  const ii = p.imageinfo?.[0]
  if (!ii || !/image\/(jpeg|png|tiff)/.test(ii.mime)) continue
  const m = ii.extmetadata ?? {}
  const lic = limpiar(m.LicenseShortName?.value) || '?'
  if (!todas && !libre(lic)) continue
  if (Math.max(ii.width, ii.height) < min) continue
  n++
  console.log(`\n${p.title.replace('File:', '')}`)
  console.log(`  ${ii.width}×${ii.height} · ${lic} · ${limpiar(m.Artist?.value) || 'autor desconocido'} · ${limpiar(m.DateTimeOriginal?.value) || 's. f.'}`)
  console.log(`  ${ii.url}`)
  console.log(`  ${ii.descriptionurl}`)
}
console.log(`\n${n} resultado(s)`)
