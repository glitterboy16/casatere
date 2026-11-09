#!/usr/bin/env node
// Encuentra los grabados dentro de un libro escaneado de archive.org.
//
//   node libro.mjs GoufPa                    libro de Gouffé (1873)
//   node libro.mjs b21526035_0002 --laminas  láminas plegables (Carême)
//
// Baja todas las páginas a 160 px (caché en libros/<id>/), marca las que
// tienen grabado y hace hojas de contacto numeradas en libros/<id>/hojas.
// Con el número de página, la fuente de alta resolución para grabar.mjs es:
//   https://archive.org/download/<id>/page/n<página>_w4000.jpg
//
// Detección: un grabado tiene bloques muy oscuros que el texto no tiene;
// con --laminas busca además páginas apaisadas (láminas desplegables).

import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const AGENTE = process.env.GRABADOR_AGENTE ?? 'Grabador/1.0 (herramienta de ilustración)'
const [id] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const laminas = process.argv.includes('--laminas')
if (!id) { console.error('Uso: node libro.mjs <identificador de archive.org> [--laminas]'); process.exit(1) }

const dir = path.join('libros', id)
await mkdir(path.join(dir, 'pag'), { recursive: true })
await mkdir(path.join(dir, 'hojas'), { recursive: true })
const existe = (p) => access(p).then(() => true, () => false)
const pedir = (url) => fetch(url, { headers: { 'User-Agent': AGENTE } })

const meta = await (await pedir(`https://archive.org/metadata/${id}`)).json()
if (!meta.metadata) { console.error('No existe ese identificador en archive.org'); process.exit(1) }
console.log(`${meta.metadata.title} · ${meta.metadata.date ?? ''} · ${meta.metadata.licenseurl ?? meta.metadata['possible-copyright-status'] ?? 'licencia sin indicar: compruébala'}`)
const zip = meta.files.find((f) => f.name.endsWith('_jp2.zip'))?.name
if (!zip) { console.error('El libro no tiene imágenes de página (_jp2.zip)'); process.exit(1) }
const hojas = ((await (await pedir(`https://archive.org/download/${id}/${zip}/`)).text()).match(/\.jp2</g) || []).length
console.log(`${hojas} páginas`)

const res = []
const una = async (n) => {
  const f = path.join(dir, 'pag', `${String(n).padStart(4, '0')}.jpg`)
  if (!(await existe(f))) {
    const r = await pedir(`https://archive.org/download/${id}/page/n${n}_w160.jpg`)
    if (!r.ok) return
    await writeFile(f, Buffer.from(await r.arrayBuffer()))
  }
  const img = sharp(await readFile(f))
  const m = await img.metadata()
  const { data, info } = await img.greyscale().resize({ width: 64 }).raw().toBuffer({ resolveWithObject: true })
  let minimo = 255
  for (let by = 0; by + 8 <= info.height; by += 8) {
    for (let bx = 0; bx + 8 <= info.width; bx += 8) {
      let s = 0
      for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) s += data[y * info.width + x]
      minimo = Math.min(minimo, s / 64)
    }
  }
  const apaisada = m.width > m.height * 1.05
  if (laminas ? apaisada : minimo < 150) res.push({ n, f })
}
const cola = Array.from({ length: hojas }, (_, i) => i)
await Promise.all(Array.from({ length: 8 }, async () => { while (cola.length) await una(cola.shift()) }))
res.sort((a, b) => a.n - b.n)
console.log(`${res.length} páginas con grabado: ${res.map((r) => r.n).join(' ')}`)

// Hojas de contacto de 44 páginas, con el número de cada una
const T = 160, H = 240, cab = 22, cols = 11
for (let h = 0; h * 44 < res.length; h++) {
  const sel = res.slice(h * 44, h * 44 + 44)
  const tiles = await Promise.all(sel.map(async (r) => {
    const img = await sharp(r.f).resize({ width: T, height: H, fit: 'contain', background: '#fff' }).toBuffer()
    const et = Buffer.from(`<svg width="${T}" height="${cab}"><rect width="100%" height="100%" fill="#000"/><text x="6" y="16" font-size="15" fill="#fff" font-family="Arial">${r.n}</text></svg>`)
    return sharp({ create: { width: T, height: H + cab, channels: 3, background: '#fff' } }).composite([{ input: et, top: 0, left: 0 }, { input: img, top: cab, left: 0 }]).png().toBuffer()
  }))
  const salida = path.join(dir, 'hojas', `hoja-${h + 1}.jpg`)
  await sharp({ create: { width: T * cols, height: (H + cab) * Math.ceil(tiles.length / cols), channels: 3, background: '#fff' } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * T, top: Math.floor(i / cols) * (H + cab) })))
    .jpeg({ quality: 80 }).toFile(salida)
  console.log('✓', salida)
}
