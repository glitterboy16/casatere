#!/usr/bin/env node
// ── Grabador ──────────────────────────────────────────────────────────────
// Convierte grabados antiguos (tinta oscura sobre papel) en ilustraciones de
// un solo color sobre fondo transparente, listas para web.
//
//   node grabar.mjs casa-tere.json                 todas las piezas
//   node grabar.mjs casa-tere.json --solo pulpo    solo las indicadas (coma)
//
// Por cada pieza escribe <nombre>.webp (para la web), <nombre>.png (para
// edición) y previas/<nombre>.png sobre el color de fondo, para revisarla.
// Al final deja CREDITOS.md con la procedencia y licencia de cada grabado.

import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import sharp from 'sharp'

sharp.cache(false)

const args = process.argv.slice(2)
const rutaConfig = args.find((a) => !a.startsWith('--'))
if (!rutaConfig) {
  console.error('Uso: node grabar.mjs <config.json> [--solo nombre1,nombre2]')
  process.exit(1)
}
const iSolo = args.indexOf('--solo')
const solo = iSolo >= 0 ? new Set(args[iSolo + 1].split(',')) : null
const detalle = args.includes('--detalle')

const dirConfig = path.dirname(path.resolve(rutaConfig))
const config = JSON.parse(await readFile(rutaConfig, 'utf8'))
const AGENTE = config.agente ?? 'Grabador/1.0 (herramienta de ilustración)'
const CACHE = path.join(dirConfig, 'cache')

const hexARgb = (hex) => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const existe = (p) => access(p).then(() => true, () => false)

// Percentil sobre una muestra de píxeles (rápido y suficiente)
function percentil(datos, p, paso = 3) {
  const m = []
  for (let i = 0; i < datos.length; i += paso) m.push(datos[i])
  m.sort((a, b) => a - b)
  return m[Math.floor((m.length - 1) * p)]
}

// Descarga una vez y guarda en caché (Wikimedia exige un User-Agent con contacto)
async function cargarFuente(fuente) {
  if (!/^https?:\/\//.test(fuente)) return readFile(path.resolve(dirConfig, fuente))
  await mkdir(CACHE, { recursive: true })
  const ext = path.extname(new URL(fuente).pathname).toLowerCase() || '.img'
  const archivo = path.join(CACHE, createHash('sha1').update(fuente).digest('hex').slice(0, 16) + ext)
  if (await existe(archivo)) return readFile(archivo)
  const r = await fetch(fuente, { headers: { 'User-Agent': AGENTE } })
  if (!r.ok) throw new Error(`No se pudo descargar (${r.status}): ${fuente}`)
  const buf = Buffer.from(await r.arrayBuffer())
  await writeFile(archivo, buf)
  return buf
}

// Imagen en escala de grises sobre papel blanco (aplana transparencias)
const gris = (buf) => sharp(buf, { limitInputPixels: false }).flatten({ background: '#ffffff' }).toColourspace('b-w')

// Caja del dibujo: recorta desde los bordes hasta que aparece tinta de verdad,
// ignorando motas sueltas (descarta el 0,15 % de tinta más extremo por lado).
function cajaDelDibujo(datos, ancho, alto, umbral) {
  const cols = new Float64Array(ancho)
  const filas = new Float64Array(alto)
  let total = 0
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (datos[y * ancho + x] < umbral) { cols[x]++; filas[y]++; total++ }
    }
  }
  const corte = total * 0.0015
  const borde = (hist, desdeFinal) => {
    let acc = 0
    for (let k = 0; k < hist.length; k++) {
      const i = desdeFinal ? hist.length - 1 - k : k
      acc += hist[i]
      if (acc > corte) return i
    }
    return desdeFinal ? hist.length - 1 : 0
  }
  return { x0: borde(cols, false), x1: borde(cols, true), y0: borde(filas, false), y1: borde(filas, true) }
}

// Aplanado del papel: en fotos de libros el papel no es uniforme (sombra del
// lomo, manchas, luz de lado). Se estima el blanco del papel por zonas (el
// percentil 90 de cada bloque, dilatado para no confundir manchas de tinta
// con papel), se suaviza y se divide: el papel queda a 255 en toda la imagen.
function aplanarPapel(datos, ancho, alto, fraccion = 0.045) {
  const B = Math.max(10, Math.round(Math.max(ancho, alto) * fraccion))
  const gw = Math.ceil(ancho / B)
  const gh = Math.ceil(alto / B)
  let rejilla = new Float32Array(gw * gh)
  const muestra = []
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      muestra.length = 0
      for (let y = gy * B; y < Math.min(alto, (gy + 1) * B); y += 2) {
        for (let x = gx * B; x < Math.min(ancho, (gx + 1) * B); x += 2) muestra.push(datos[y * ancho + x])
      }
      muestra.sort((a, b) => a - b)
      rejilla[gy * gw + gx] = muestra[Math.floor((muestra.length - 1) * 0.9)] ?? 255
    }
  }
  // Dilatación 5×5 (el papel es lo más claro de la zona) y media 3×3
  const filtro = (src, radio, fn) => {
    const out = new Float32Array(src.length)
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const v = []
        for (let dy = -radio; dy <= radio; dy++) {
          for (let dx = -radio; dx <= radio; dx++) {
            const xx = x + dx, yy = y + dy
            if (xx >= 0 && yy >= 0 && xx < gw && yy < gh) v.push(src[yy * gw + xx])
          }
        }
        out[y * gw + x] = fn(v)
      }
    }
    return out
  }
  rejilla = filtro(rejilla, 2, (v) => Math.max(...v))
  rejilla = filtro(rejilla, 1, (v) => v.reduce((a, b) => a + b, 0) / v.length)
  // Interpolación bilineal de la rejilla a cada píxel
  const papelEn = (x, y) => {
    const fx = Math.min(gw - 1.001, Math.max(0, x / B - 0.5))
    const fy = Math.min(gh - 1.001, Math.max(0, y / B - 0.5))
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    const x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1)
    const tx = fx - x0, ty = fy - y0
    const a = rejilla[y0 * gw + x0] * (1 - tx) + rejilla[y0 * gw + x1] * tx
    const b = rejilla[y1 * gw + x0] * (1 - tx) + rejilla[y1 * gw + x1] * tx
    return a * (1 - ty) + b * ty
  }
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = y * ancho + x
      datos[i] = Math.min(255, Math.round((datos[i] * 255) / Math.max(1, papelEn(x, y))))
    }
  }
}

// Silueta del objeto para el modo positivo. En una rejilla de 4×4 px: la
// tinta se dilata para cerrar el contorno, el papel conectado con el borde
// es el fondo, todo lo demás es el objeto; se deshace la dilatación y se
// suaviza el borde. Devuelve una función (x, y) → 0…1.
function mascaraObjeto(datos, ancho, alto, papel, negro, cierre = 0.012) {
  const f = 4
  const gw = Math.ceil(ancho / f), gh = Math.ceil(alto / f)
  const tinta = new Uint8Array(gw * gh)
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if ((papel - datos[y * ancho + x]) / Math.max(1, papel - negro) > 0.25) tinta[((y / f) | 0) * gw + ((x / f) | 0)] = 1
    }
  }
  const r = Math.max(1, Math.round(Math.max(gw, gh) * cierre))
  const dilatar = (src) => {
    const h = new Uint8Array(src.length), out = new Uint8Array(src.length)
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      let v = 0
      for (let d = -r; d <= r && !v; d++) { const xx = x + d; if (xx >= 0 && xx < gw && src[y * gw + xx]) v = 1 }
      h[y * gw + x] = v
    }
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      let v = 0
      for (let d = -r; d <= r && !v; d++) { const yy = y + d; if (yy >= 0 && yy < gh && h[yy * gw + x]) v = 1 }
      out[y * gw + x] = v
    }
    return out
  }
  const cerrada = dilatar(tinta)
  // Relleno desde los bordes por el papel: eso es el fondo
  const fondo = new Uint8Array(gw * gh)
  const cola = []
  const meter = (x, y) => { const i = y * gw + x; if (!fondo[i] && !cerrada[i]) { fondo[i] = 1; cola.push(i) } }
  for (let x = 0; x < gw; x++) { meter(x, 0); meter(x, gh - 1) }
  for (let y = 0; y < gh; y++) { meter(0, y); meter(gw - 1, y) }
  while (cola.length) {
    const i = cola.pop(), x = i % gw, y = (i / gw) | 0
    if (x > 0) meter(x - 1, y)
    if (x < gw - 1) meter(x + 1, y)
    if (y > 0) meter(x, y - 1)
    if (y < gh - 1) meter(x, y + 1)
  }
  // Deshace la dilatación del contorno y se mete un poco más hacia dentro,
  // para que el borde suave caiga sobre la línea del dibujo y no sobre papel
  const fondoReal = dilatar(dilatar(fondo))
  // Borde suave: media 5×5 de la máscara
  const m = new Float32Array(gw * gh)
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    let s = 0, c = 0
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx >= 0 && yy >= 0 && xx < gw && yy < gh) { s += fondoReal[yy * gw + xx] ? 0 : 1; c++ }
    }
    m[y * gw + x] = s / c
  }
  return (x, y) => {
    const fx = Math.min(gw - 1.001, Math.max(0, x / f - 0.5)), fy = Math.min(gh - 1.001, Math.max(0, y / f - 0.5))
    const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0
    const a = m[y0 * gw + x0] * (1 - tx) + m[y0 * gw + x0 + 1] * tx
    const b = m[(y0 + 1) * gw + x0] * (1 - tx) + m[(y0 + 1) * gw + x0 + 1] * tx
    return a * (1 - ty) + b * ty
  }
}

// Motas: borra el polvo y las manchitas del papel viejo que el enfoque hace
// más visibles. Una mota es una mancha de tinta pequeña (`area` px) y casi
// redonda (lado largo / corto ≤ `alargado`). Se borra si a `radio` px no hay
// ningún trazo de verdad, solo papel u otras motas (el polvo va en grupitos),
// y si la zona no está sombreada: con más de `densidad` de tinta alrededor
// (`vecindad` px) son trazos cortos de un sombreado y se quedan.
// Así respeta los puntos que acompañan a un trazo y las rayas cortas del agua.
//   "motas": { "region": [x0, y0, x1, y1], "area": 60, "radio": 4, "densidad": 0.06 }
function quitarMotas(rgba, ancho, alto, opciones, nombre) {
  const { region = [0, 0, 1, 1], area = 60, radio = 4, alargado = 2.2, umbral = 0.2, densidad = 0.06, vecindad = 14 } = opciones
  const [x0, y0, x1, y1] = [region[0] * ancho, region[1] * alto, region[2] * ancho, region[3] * alto].map(Math.round)
  const corte = umbral * 255
  const tinta = (i) => rgba[i * 4 + 3] > corte
  const marca = new Int32Array(ancho * alto)
  const pila = new Int32Array(ancho * alto)
  const motas = [] // { etiqueta, minX, maxX, minY, maxY }
  const esMota = new Uint8Array(1 << 20)
  let etiqueta = 0
  // 1 · Manchas conectadas (8 vecinos) que caben en una mota
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i0 = y * ancho + x
    if (marca[i0] || !tinta(i0)) continue
    etiqueta++
    let tope = 0, n = 0, minX = x, maxX = x, minY = y, maxY = y
    pila[tope++] = i0; marca[i0] = etiqueta
    while (tope) {
      const i = pila[--tope], cx = i % ancho, cy = (i - cx) / ancho
      n++
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx; if (cy < minY) minY = cy; if (cy > maxY) maxY = cy
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= ancho || ny >= alto) continue
        const j = ny * ancho + nx
        if (!marca[j] && tinta(j)) { marca[j] = etiqueta; pila[tope++] = j }
      }
    }
    const w = maxX - minX + 1, h = maxY - minY + 1
    if (n <= area && Math.max(w, h) / Math.min(w, h) <= alargado) {
      if (etiqueta < esMota.length) esMota[etiqueta] = 1
      motas.push({ etiqueta, minX, maxX, minY, maxY })
    }
  }
  // 2 · Fuera las que no tienen un trazo de verdad cerca
  let borradas = 0
  for (const m of motas) {
    let sola = true
    for (let yy = Math.max(0, m.minY - radio); sola && yy <= Math.min(alto - 1, m.maxY + radio); yy++) {
      for (let xx = Math.max(0, m.minX - radio); xx <= Math.min(ancho - 1, m.maxX + radio); xx++) {
        const j = yy * ancho + xx
        if (!tinta(j)) continue
        const e = marca[j]
        if (e === m.etiqueta || (e && e < esMota.length && esMota[e])) continue
        sola = false; break // tinta de un trazo (o fuera de la región): se queda
      }
    }
    if (!sola) continue
    let total = 0, conTinta = 0
    for (let yy = Math.max(0, m.minY - vecindad); yy <= Math.min(alto - 1, m.maxY + vecindad); yy++) {
      for (let xx = Math.max(0, m.minX - vecindad); xx <= Math.min(ancho - 1, m.maxX + vecindad); xx++) {
        total++
        if (tinta(yy * ancho + xx)) conTinta++
      }
    }
    if (conTinta / total > densidad) continue
    m.borrar = true
    borradas++
  }
  // Se borra después de decidir, para que una mota no cambie el veredicto de otra.
  // Con la mota se va su halo suave (el borde antialias que queda bajo el umbral).
  for (const m of motas) {
    if (!m.borrar) continue
    for (let yy = Math.max(0, m.minY - 1); yy <= Math.min(alto - 1, m.maxY + 1); yy++) {
      for (let xx = Math.max(0, m.minX - 1); xx <= Math.min(ancho - 1, m.maxX + 1); xx++) {
        const j = yy * ancho + xx
        if (marca[j] === m.etiqueta || !tinta(j)) rgba[j * 4 + 3] = 0
      }
    }
  }
  console.log(`  ${nombre}: ${borradas} motas borradas`)
}

async function grabar(pieza) {
  const salida = path.resolve(dirConfig, pieza.salida ?? config.salida ?? 'salida')
  const previas = path.join(dirConfig, 'previas')
  await mkdir(salida, { recursive: true })
  await mkdir(previas, { recursive: true })

  const max = pieza.max ?? config.max ?? 800
  const peso = pieza.peso ?? config.peso ?? 0.9 // < 1 engorda el trazo
  const limpieza = pieza.limpieza ?? config.limpieza ?? 0.08 // borra motas y velo del papel
  const tinta = hexARgb(pieza.tinta ?? config.tinta ?? '#ffffff')
  const nitidez = pieza.nitidez ?? config.nitidez ?? 0

  const buf = await cargarFuente(pieza.fuente)
  const meta = await sharp(buf, { limitInputPixels: false }).metadata()
  const [fx0, fy0, fx1, fy1] = pieza.recorte ?? [0, 0, 1, 1]
  const manual = {
    left: Math.round(fx0 * meta.width),
    top: Math.round(fy0 * meta.height),
    width: Math.round((fx1 - fx0) * meta.width),
    height: Math.round((fy1 - fy0) * meta.height),
  }

  // 1 · Análisis a baja resolución: dónde está el papel, la tinta y el dibujo
  const escA = Math.min(1, 1200 / Math.max(manual.width, manual.height))
  const anal = await gris(buf).extract(manual)
    .resize({ width: Math.round(manual.width * escA), height: Math.round(manual.height * escA) })
    .raw().toBuffer({ resolveWithObject: true })
  if (pieza.aplanar) aplanarPapel(anal.data, anal.info.width, anal.info.height, typeof pieza.aplanar === 'number' ? pieza.aplanar : undefined)
  const papel = percentil(anal.data, 0.97)
  const negro = percentil(anal.data, 0.02)
  const caja = cajaDelDibujo(anal.data, anal.info.width, anal.info.height, papel - (papel - negro) * 0.35)
  const margen = Math.round(Math.max(caja.x1 - caja.x0, caja.y1 - caja.y0) * 0.03)
  const recorte = {
    left: manual.left + Math.max(0, Math.round((caja.x0 - margen) / escA)),
    top: manual.top + Math.max(0, Math.round((caja.y0 - margen) / escA)),
  }
  recorte.width = Math.min(manual.left + manual.width, manual.left + Math.round((caja.x1 + margen) / escA)) - recorte.left
  recorte.height = Math.min(manual.top + manual.height, manual.top + Math.round((caja.y1 + margen) / escA)) - recorte.top

  // 2 · Recorte final y escalado (nunca amplía: un grabado ampliado pierde el buril)
  const { data, info } = await gris(buf).extract(recorte)
    // nunca amplía salvo `ampliar`: para fuentes pequeñas, Lanczos y luego la tinta redefine los bordes
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: !pieza.ampliar, kernel: 'lanczos3' })
    // nitidez: enfoque suave tras reducir, devuelve el filo del buril (sigma en px; 0 = nada)
    .sharpen(nitidez > 0 ? { sigma: nitidez, m1: 0.6, m2: 2.2 } : undefined)
    .raw().toBuffer({ resolveWithObject: true })

  if (pieza.aplanar) aplanarPapel(data, info.width, info.height, typeof pieza.aplanar === 'number' ? pieza.aplanar : undefined)

  // Zonas con limpieza propia (texto que se transparenta, números de lámina…):
  // [x0, y0, x1, y1] en fracciones del recorte manual; limpieza 1 = borrar.
  const zonas = (pieza.zonas ?? []).map((z) => ({ ...z, r: z.rect }))
  const limpiezaEn = (x, y) => {
    if (!zonas.length) return limpieza
    const fx = (recorte.left + (x + 0.5) * (recorte.width / info.width) - manual.left) / manual.width
    const fy = (recorte.top + (y + 0.5) * (recorte.height / info.height) - manual.top) / manual.height
    // las zonas clonadas ya tienen textura: no se vuelven a borrar
    for (const z of zonas) if (!z.clonar && fx >= z.r[0] && fx <= z.r[2] && fy >= z.r[1] && fy <= z.r[3]) return z.limpieza
    return limpieza
  }

  // Viñeta: para grabados con escena (fondo, paisaje), funde los bordes en
  // una elipse, como las viñetas de Bewick. `vineta` = fracción del radio
  // que se desvanece (0,25 = el último cuarto).
  const vineta = (x, y) => {
    const dx = (x + 0.5) / info.width * 2 - 1
    const dy = (y + 0.5) / info.height * 2 - 1
    const d = Math.sqrt(dx * dx + dy * dy)
    const t = Math.min(1, Math.max(0, (1 - d) / pieza.vineta))
    return t * t * (3 - 2 * t)
  }

  // Las zonas con limpieza 1 se pintan de papel antes de nada (firmas del
  // grabador, números de lámina): así desaparecen en los dos modos.
  // Con `clonar`, la zona se rellena con la textura que tiene justo encima
  // (sirve para firmas dentro de un rayado, donde el papel dejaría un hueco).
  for (const z of zonas) {
    if (z.limpieza < 1) continue
    const ex = recorte.width / info.width, ey = recorte.height / info.height
    const x0 = Math.max(0, Math.floor((manual.left + z.r[0] * manual.width - recorte.left) / ex))
    const x1 = Math.min(info.width - 1, Math.ceil((manual.left + z.r[2] * manual.width - recorte.left) / ex))
    const y0 = Math.max(0, Math.floor((manual.top + z.r[1] * manual.height - recorte.top) / ey))
    const y1 = Math.min(info.height - 1, Math.ceil((manual.top + z.r[3] * manual.height - recorte.top) / ey))
    // clonar: true (de arriba) · 'derecha' · 'izquierda' (mejor en mares y
    // cielos: en horizontal la textura conserva la escala de la perspectiva)
    const alto = y1 - y0 + 3, ancho = x1 - x0 + 3
    const dx = z.clonar === 'derecha' ? ancho : z.clonar === 'izquierda' ? -ancho : 0
    const dy = z.clonar === true ? -alto : 0
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const sx = x + dx, sy = y + dy
        const dentro = sx >= 0 && sy >= 0 && sx < info.width && sy < info.height
        data[y * info.width + x] = z.clonar && dentro ? data[sy * info.width + sx] : 255
      }
    }
  }

  // Trazos: borra líneas rectas finas (rumbos punteados de las cartas
  // náuticas, rayas de pliegue) copiando la textura de al lado. Cada trazo:
  // { de: [x, y], a: [x, y], ancho } en fracciones del recorte manual;
  // ancho en fracción del lado mayor de la salida.
  if (pieza.trazos?.length) {
    const ex = recorte.width / info.width, ey = recorte.height / info.height
    const aPx = ([fx, fy]) => [(manual.left + fx * manual.width - recorte.left) / ex, (manual.top + fy * manual.height - recorte.top) / ey]
    for (const tr of pieza.trazos) {
      const copia = Uint8Array.from(data) // cada trazo copia de lo ya limpio
      const [x0, y0] = aPx(tr.de), [x1, y1] = aPx(tr.a)
      const r = Math.max(1.5, (tr.ancho ?? 0.004) * Math.max(info.width, info.height))
      const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1
      // la textura se toma en perpendicular al trazo, a dos anchos de distancia
      const len = Math.sqrt(l2), nx = -dy / len, ny = dx / len, salto = r * 2.4
      const bx0 = Math.max(0, Math.floor(Math.min(x0, x1) - r)), bx1 = Math.min(info.width - 1, Math.ceil(Math.max(x0, x1) + r))
      const by0 = Math.max(0, Math.floor(Math.min(y0, y1) - r)), by1 = Math.min(info.height - 1, Math.ceil(Math.max(y0, y1) + r))
      for (let y = by0; y <= by1; y++) {
        for (let x = bx0; x <= bx1; x++) {
          const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2))
          const qx = x0 + t * dx - x, qy = y0 + t * dy - y
          if (qx * qx + qy * qy > r * r) continue
          const sx = Math.round(x + nx * salto), sy = Math.round(y + ny * salto)
          if (sx >= 0 && sy >= 0 && sx < info.width && sy < info.height) data[y * info.width + x] = copia[sy * info.width + sx]
        }
      }
    }
  }

  // Rumbos automáticos: dentro de una región busca la recta más marcada en un
  // rango de ángulos (transformada de Hough), la borra copiando la textura
  // de al lado y repite hasta que no queden rectas claras.
  //   { region: [x0,y0,x1,y1], angulos: [min,max], ancho, max, umbral }
  //   ángulo: 0° = vertical, 90° = horizontal (rectas que bajan hacia la izquierda)
  for (const rb of pieza.rumbos ?? []) {
    const ex = recorte.width / info.width, ey = recorte.height / info.height
    const rx0 = Math.max(0, Math.round((manual.left + rb.region[0] * manual.width - recorte.left) / ex))
    const ry0 = Math.max(0, Math.round((manual.top + rb.region[1] * manual.height - recorte.top) / ey))
    const rx1 = Math.min(info.width - 1, Math.round((manual.left + rb.region[2] * manual.width - recorte.left) / ex))
    const ry1 = Math.min(info.height - 1, Math.round((manual.top + rb.region[3] * manual.height - recorte.top) / ey))
    const r = Math.max(1.5, (rb.ancho ?? 0.004) * Math.max(info.width, info.height))
    const angs = []
    for (let g = rb.angulos[0]; g <= rb.angulos[1]; g += 0.25) angs.push((g * Math.PI) / 180)
    const rmax = Math.ceil(Math.hypot(info.width, info.height))
    let primero = 0
    for (let it = 0; it < (rb.max ?? 4); it++) {
      const acc = angs.map(() => new Float32Array(rmax * 2))
      for (let y = ry0; y <= ry1; y++) {
        for (let x = rx0; x <= rx1; x++) {
          const tinta = 255 - data[y * info.width + x]
          if (tinta < 90) continue
          for (let k = 0; k < angs.length; k++) acc[k][Math.round(x * Math.sin(angs[k]) + y * Math.cos(angs[k])) + rmax] += tinta / 255
        }
      }
      let mejor = { v: 0 }
      for (let k = 0; k < angs.length; k++) for (let d = 0; d < rmax * 2; d++) if (acc[k][d] > mejor.v) mejor = { v: acc[k][d], t: angs[k], d: d - rmax }
      if (it === 0) primero = mejor.v
      else if (mejor.v < primero * (rb.umbral ?? 0.5)) break
      const s = Math.sin(mejor.t), c = Math.cos(mejor.t), salto = r * 2.6
      const copia = Uint8Array.from(data)
      for (let y = ry0; y <= ry1; y++) {
        for (let x = rx0; x <= rx1; x++) {
          if (Math.abs(x * s + y * c - mejor.d) > r) continue
          const sx = Math.round(x + s * salto), sy = Math.round(y + c * salto)
          if (sx >= 0 && sy >= 0 && sx < info.width && sy < info.height) data[y * info.width + x] = copia[sy * info.width + sx]
        }
      }
      if (detalle) console.log(`  rumbo ${((mejor.t * 180) / Math.PI).toFixed(2)}° · ${mejor.v.toFixed(0)} votos`)
    }
  }

  // 3 · Tinta: el alfa de cada píxel es lo oscuro que es respecto al papel
  const p = percentil(data, 0.97)
  const n = percentil(data, 0.02)
  // Modo positivo (grabados tonales sobre fondo oscuro): se detecta la silueta
  // del objeto y dentro de ella la luz es la tinta, así no sale en negativo.
  const objeto = pieza.modo === 'positivo' ? mascaraObjeto(data, info.width, info.height, p, n, pieza.cierre) : null
  const rgba = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < data.length; i++) {
    const x = i % info.width, y = Math.floor(i / info.width)
    const oscuro = Math.min(1, Math.max(0, (p - data[i]) / Math.max(1, p - n)))
    let a
    if (objeto) {
      const luz = 1 - oscuro
      a = luz < limpieza ? 0 : Math.pow(luz, peso) * objeto(x, y)
    } else {
      const lim = limpiezaEn(x, y)
      a = lim >= 1 || oscuro < lim ? 0 : Math.pow(oscuro, peso) // limpieza 1 borra también el negro puro
    }
    if (pieza.vineta) a *= vineta(x, y)
    rgba[i * 4] = tinta[0]
    rgba[i * 4 + 1] = tinta[1]
    rgba[i * 4 + 2] = tinta[2]
    rgba[i * 4 + 3] = Math.round(a * 255)
  }
  if (pieza.motas) quitarMotas(rgba, info.width, info.height, pieza.motas, pieza.nombre)
  // Giro (`girar`, en grados, sentido horario): orienta el grabado ya hecho
  // tinta, con fondo transparente, y recorta el margen vacío que deja el giro.
  // Sirve para que varias láminas compartan el mismo ángulo en la web.
  let final = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
  if (pieza.girar) {
    const girado = await sharp(final).rotate(pieza.girar, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    final = await sharp(girado).trim({ threshold: 1 }).png().toBuffer()
  }
  const dim = await sharp(final).metadata()

  // Toda la información del grabado está en el canal alfa (el color es plano).
  // Con alfa sin pérdida (100) las líneas finas salen limpias; por debajo, el
  // compresor las emborrona. `calidad` solo afecta al color, que es uniforme.
  const capa = () => sharp(final)
  const calidad = pieza.calidad ?? config.calidad ?? 72
  const alfa = pieza.alfa ?? config.alfa ?? calidad
  const webp = await capa().webp({ quality: calidad, alphaQuality: alfa, effort: 6 }).toBuffer()
  await writeFile(path.join(salida, `${pieza.nombre}.webp`), webp)
  if (config.png !== false) await capa().png({ compressionLevel: 9 }).toFile(path.join(salida, `${pieza.nombre}.png`))

  // Variantes más pequeñas (`variantes: [900]`) para pantallas que no
  // necesitan el tamaño grande: <nombre>-900.webp, reducidas desde el final.
  for (const ancho of pieza.variantes ?? []) {
    if (ancho >= dim.width) continue
    const v = await sharp(final).resize({ width: ancho, kernel: 'lanczos3' }).webp({ quality: calidad, alphaQuality: alfa, effort: 6 }).toBuffer()
    await writeFile(path.join(salida, `${pieza.nombre}-${ancho}.webp`), v)
    console.log(`  variante ${ancho}px · ${Math.round(v.length / 1024)} KB`)
  }

  // 4 · Previa sobre el color de fondo de la web, hecha con el WebP que se
  //     publica: lo que se revisa es exactamente lo que se sirve.
  const pad = 40
  await sharp({ create: { width: dim.width + pad * 2, height: dim.height + pad * 2, channels: 4, background: config.fondoPrevia ?? '#021e50' } })
    .composite([{ input: webp, left: pad, top: pad }])
    .png().toFile(path.join(previas, `${pieza.nombre}.png`))

  const aviso = pieza.ampliar ? ' · ampliado' : Math.max(info.width, info.height) < max ? ` (la fuente no da para ${max}px)` : ''
  const giro = pieza.girar ? ` · girado ${pieza.girar}°` : ''
  console.log(`✓ ${pieza.nombre.padEnd(16)} ${dim.width}×${dim.height} · ${Math.round(webp.length / 1024)} KB${giro}${aviso}`)
  // --detalle: dónde ha caído el recorte automático, en fracciones del
  // recorte manual (las mismas unidades que usan las zonas)
  if (detalle) {
    const f = (v) => v.toFixed(3)
    console.log(`  caja [${f((recorte.left - manual.left) / manual.width)}, ${f((recorte.top - manual.top) / manual.height)}, ${f((recorte.left + recorte.width - manual.left) / manual.width)}, ${f((recorte.top + recorte.height - manual.top) / manual.height)}]`)
  }
}

const piezas = config.piezas.filter((p) => !solo || solo.has(p.nombre))
for (const pieza of piezas) {
  try {
    await grabar(pieza)
  } catch (e) {
    console.error(`✗ ${pieza.nombre}: ${e.message}`)
    process.exitCode = 1
  }
}

// Créditos: obligatorio saber de dónde sale cada grabado y con qué licencia
const lineas = ['# Créditos de los grabados', '', '| Pieza | Obra | Autor | Fecha | Licencia | Fuente |', '|---|---|---|---|---|---|']
for (const p of config.piezas) {
  const c = p.credito ?? {}
  lineas.push(`| ${p.nombre} | ${c.obra ?? '—'} | ${c.autor ?? '—'} | ${c.fecha ?? '—'} | ${c.licencia ?? '—'} | ${c.pagina ?? p.fuente} |`)
}
await writeFile(path.join(dirConfig, 'CREDITOS.md'), lineas.join('\n') + '\n')
