#!/usr/bin/env node
// ── Enmarcador ────────────────────────────────────────────────────────────
// Monta un marco de verdad a partir de una moldura grabada, como un
// enmarcador: la tira se repite a lo largo de cada lado y las cuatro piezas
// se cortan a inglete (45°) en las esquinas.
//
//   node marco.mjs <moldura.webp> --ancho 1600 --alto 1280 --grosor 72 --salida marco.webp
//
// La moldura es una pieza ya procesada con grabar.mjs (tinta sobre
// transparente), recortada en horizontal con el canto exterior arriba.
// El periodo del motivo se detecta solo (autocorrelación del perfil de la
// tira) para que la repetición no deje costuras.

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const opcion = (n, def) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : def }
const entrada = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true)
const W = Number(opcion('--ancho', 1600))
const H = Number(opcion('--alto', 1280))
const g = Number(opcion('--grosor', 72))
const salida = opcion('--salida', 'marco.webp')
const previa = opcion('--previa', path.join('previas', path.basename(salida).replace(/\.\w+$/, '.png')))
const tinta = opcion('--tinta', '#021e50')
const papel = opcion('--papel', '#f3f1eb')
if (!entrada) { console.error('Uso: node marco.mjs <moldura> --ancho W --alto H --grosor G --salida marco.webp'); process.exit(1) }

// 1 · Tira a la altura del grosor del marco
const tira = await sharp(entrada).ensureAlpha().resize({ height: g }).raw().toBuffer({ resolveWithObject: true })
const tw = tira.info.width

// 2 · Periodo del motivo: autocorrelación del perfil de tinta por columnas
const perfil = new Float64Array(tw)
for (let x = 0; x < tw; x++) { let s = 0; for (let y = 0; y < g; y++) s += tira.data[(y * tw + x) * 4 + 3]; perfil[x] = s }
const media = perfil.reduce((a, b) => a + b, 0) / tw
let periodo = 0, mejor = -Infinity
for (let L = Math.round(g * 0.35); L <= Math.floor(tw / 2); L++) {
  let s = 0
  for (let x = 0; x + L < tw; x++) s += (perfil[x] - media) * (perfil[x + L] - media)
  s /= tw - L
  if (s > mejor * 1.04) { mejor = s; periodo = L } // el primer máximo claro, no un múltiplo
}
const repeticiones = Math.max(1, Math.floor(tw / periodo))
const motivo = await sharp(tira.data, { raw: { width: tw, height: g, channels: 4 } })
  .extract({ left: 0, top: 0, width: periodo * repeticiones, height: g }).png().toBuffer()

// 3 · Cada lado: la tira repetida a lo largo, centrada para que las
//     esquinas queden simétricas
const lado = async (largo) => {
  const desfase = Math.round(((largo - periodo * repeticiones) / 2) % (periodo * repeticiones))
  const ancho = largo + periodo * repeticiones * 2
  const base = await sharp({ create: { width: ancho, height: g, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: motivo, tile: true, left: 0, top: 0 }]).png().toBuffer()
  return sharp(base).extract({ left: periodo * repeticiones - desfase, top: 0, width: largo, height: g }).png().toBuffer()
}
const arriba = await lado(W)
const abajo = await sharp(await lado(W)).rotate(180).png().toBuffer()
const derecha = await sharp(await lado(H)).rotate(90).png().toBuffer()
const izquierda = await sharp(await lado(H)).rotate(270).png().toBuffer()

// 4 · Inglete: cada pieza se recorta con su trapecio
const pieza = async (img, left, top, puntos) => {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><polygon points="${puntos}" fill="#fff"/></svg>`)
  const capa = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: img, left, top }]).png().toBuffer()
  return sharp(capa).composite([{ input: svg, blend: 'dest-in' }]).png().toBuffer()
}
const capas = await Promise.all([
  pieza(arriba, 0, 0, `0,0 ${W},0 ${W - g},${g} ${g},${g}`),
  pieza(abajo, 0, H - g, `0,${H} ${W},${H} ${W - g},${H - g} ${g},${H - g}`),
  pieza(izquierda, 0, 0, `0,0 ${g},${g} ${g},${H - g} 0,${H}`),
  pieza(derecha, W - g, 0, `${W},0 ${W},${H} ${W - g},${H - g} ${W - g},${g}`),
])
const marco = sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(capas.map((input) => ({ input })))
const png = await marco.png().toBuffer()
await mkdir(path.dirname(path.resolve(salida)), { recursive: true })
await writeFile(salida, await sharp(png).webp({ quality: 80, alphaQuality: 100, effort: 6 }).toBuffer()) // tinta sin pérdida: el marco sale nítido

// 5 · Previa: el marco en tinta sobre el papel
await mkdir(path.dirname(path.resolve(previa)), { recursive: true })
const { data } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const [ti, pa] = [hex(tinta), hex(papel)]
const rgb = Buffer.alloc(W * H * 3)
for (let i = 0; i < W * H; i++) {
  const a = data[i * 4 + 3] / 255
  for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.round(ti[c] * a + pa[c] * (1 - a))
}
await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).png().toFile(previa)
console.log(`✓ marco ${W}×${H}, grosor ${g}px · motivo cada ${periodo}px (${repeticiones} en la tira) → ${salida}`)
