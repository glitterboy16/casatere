import { jsPDF } from 'jspdf'
import bodoniUrl from '../assets/fonts/bodoni.ttf'
import bodoniItalicUrl from '../assets/fonts/bodoni-italic.ttf'
import montserratUrl from '../assets/fonts/montserrat.ttf'
import montserratMediumUrl from '../assets/fonts/montserrat-medium.ttf'
import logoUrl from '../assets/logo-marino.png'
import { es, en, de, fr, it } from '../i18n/traducciones'
import { CONTACTO } from '../data/casa'

// ── Exporta la carta a PDF con la estética de Casa Tere ──────────────────
// A4 en blanco, tinta azul marino, Bodoni Moda + Montserrat, logo arriba.
// Capítulos numerados, columnas de ración y media, alérgenos por número con
// su leyenda al final y un punto dorado (el sol) en lo que recomienda la casa.

const TRADUCCIONES = { es, en, de, fr, it }

const MARINO = [2, 30, 80]
const TINTA = [13, 28, 54]
const NIEBLA = [90, 101, 121]
const ARENA = [228, 220, 203]
const SOL = [232, 163, 90]

const A4 = { w: 210, h: 297 }
const M = 22

let recursos = null

const aBase64 = (buf) => {
  const b = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000))
  return btoa(s)
}

async function cargarRecursos() {
  if (recursos) return recursos
  const [bodoni, bodoniIt, mont, montMed, logoBlob] = await Promise.all([
    fetch(bodoniUrl).then((r) => r.arrayBuffer()),
    fetch(bodoniItalicUrl).then((r) => r.arrayBuffer()),
    fetch(montserratUrl).then((r) => r.arrayBuffer()),
    fetch(montserratMediumUrl).then((r) => r.arrayBuffer()),
    fetch(logoUrl).then((r) => r.blob()),
  ])
  const logo = await new Promise((res) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result)
    fr.readAsDataURL(logoBlob)
  })
  recursos = { bodoni: aBase64(bodoni), bodoniIt: aBase64(bodoniIt), mont: aBase64(mont), montMed: aBase64(montMed), logo }
  return recursos
}

// `contacto` llega del contexto de edición: si Nacho cambia el teléfono desde
// la web, el PDF que imprime para las mesas tiene que llevar el nuevo, no el
// que está escrito en data/casa.js.
export async function exportarCartaPdf(carta, lang, contacto = CONTACTO) {
  const L = (v) => (v && typeof v === 'object' ? v[lang] || v.es : v)
  const tr = TRADUCCIONES[lang] ?? es
  const r = await cargarRecursos()

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.addFileToVFS('Bodoni.ttf', r.bodoni)
  doc.addFont('Bodoni.ttf', 'Bodoni', 'normal')
  doc.addFileToVFS('BodoniIt.ttf', r.bodoniIt)
  doc.addFont('BodoniIt.ttf', 'Bodoni', 'italic')
  doc.addFileToVFS('Mont.ttf', r.mont)
  doc.addFont('Mont.ttf', 'Montserrat', 'normal')
  doc.addFileToVFS('MontMed.ttf', r.montMed)
  doc.addFont('MontMed.ttf', 'Montserrat', 'medium')

  const pie = () => {
    doc.setFont('Montserrat', 'normal').setFontSize(6.8).setTextColor(...NIEBLA).setCharSpace(0.7)
    doc.text(`CASA TERE · ${contacto.direccion.toUpperCase()} · PLAYA HONDA · ${contacto.telefono}`, A4.w / 2, A4.h - 11, { align: 'center' })
    doc.setCharSpace(0)
  }

  // El sol del logo, como punto dorado
  const sol = (x, yy) => {
    doc.setFillColor(...SOL)
    doc.circle(x, yy, 1.1, 'F')
  }

  const logoW = 70
  const logoH = logoW * (547 / 1023)
  doc.addImage(r.logo, 'PNG', (A4.w - logoW) / 2, 16, logoW, logoH)
  let y = 16 + logoH + 16

  const necesita = (mm) => {
    if (y + mm > A4.h - 20) {
      pie()
      doc.addPage()
      y = M + 4
    }
  }

  let haySol = false
  let hayAlergenos = false

  carta.forEach((cat, ci) => {
    const conMedia = cat.platos.some((p) => p.media)
    const xMedia = A4.w - M
    const xRacion = conMedia ? A4.w - M - 18 : A4.w - M

    necesita(conMedia ? 40 : 34)
    doc.setFont('Montserrat', 'medium').setFontSize(7).setTextColor(...SOL).setCharSpace(1)
    doc.text(String(ci + 1).padStart(2, '0'), A4.w / 2, y, { align: 'center' })
    doc.setCharSpace(0)
    y += 6.5
    doc.setFont('Bodoni', 'normal').setFontSize(17).setTextColor(...MARINO)
    doc.text(String(L(cat.titulo)), A4.w / 2, y, { align: 'center' })
    doc.setDrawColor(...ARENA).setLineWidth(0.3)
    doc.line(A4.w / 2 - 14, y + 3.4, A4.w / 2 + 14, y + 3.4)
    y += 11

    if (cat.nota) {
      doc.setFont('Bodoni', 'italic').setFontSize(9.5).setTextColor(...NIEBLA)
      const lineas = doc.splitTextToSize(String(L(cat.nota)), A4.w - 2 * M)
      necesita(lineas.length * 4.4 + 3)
      doc.text(lineas, A4.w / 2, y, { align: 'center' })
      y += lineas.length * 4.4 + 4
    }

    if (conMedia) {
      doc.setFont('Montserrat', 'medium').setFontSize(6.3).setTextColor(...NIEBLA).setCharSpace(0.6)
      doc.text(String(tr.carta.racion).toUpperCase(), xRacion, y, { align: 'right' })
      doc.text(String(tr.carta.media).toUpperCase(), xMedia, y, { align: 'right' })
      doc.setCharSpace(0)
      y += 5
    }

    for (const p of cat.platos) {
      const nombre = String(L(p.nombre) ?? '')
      const precio = p.precio ? String(L(p.precio)) : null
      const media = p.media ? String(L(p.media)) : null
      const desc = p.desc ? String(L(p.desc)) : null
      const alerg = p.alergenos?.length ? p.alergenos.join(' · ') : null
      const x = M + (p.sol ? 5 : 0)
      if (p.sol) haySol = true
      if (alerg) hayAlergenos = true

      doc.setFont('Montserrat', 'medium').setFontSize(9)
      const anchoPrecios = precio ? A4.w - M - xRacion + doc.getTextWidth(precio) + 6 : 0
      doc.setFont('Bodoni', 'normal').setFontSize(12)
      const lineasNombre = doc.splitTextToSize(nombre, A4.w - M - x - anchoPrecios - 8)
      doc.setFont('Montserrat', 'normal').setFontSize(8.2)
      const lineasDesc = desc ? doc.splitTextToSize(desc, A4.w - M - x - 14) : []
      necesita(lineasNombre.length * 5.2 + lineasDesc.length * 3.9 + (alerg ? 3.6 : 0) + 5)

      if (p.sol) sol(M + 1.2, y - 1.2)
      doc.setFont('Bodoni', 'normal').setFontSize(12).setTextColor(...TINTA)
      doc.text(lineasNombre, x, y)
      if (precio) {
        doc.setFont('Montserrat', 'medium').setFontSize(9).setTextColor(...MARINO)
        doc.text(precio, xRacion, y, { align: 'right' })
        if (media) {
          doc.setTextColor(...NIEBLA)
          doc.text(media, xMedia, y, { align: 'right' })
        }
        const inicioPrecio = xRacion - doc.getTextWidth(precio) - 3
        doc.setFont('Bodoni', 'normal').setFontSize(12)
        const finNombre = x + doc.getTextWidth(lineasNombre[0]) + 3
        if (inicioPrecio > finNombre + 4) {
          doc.setDrawColor(...ARENA).setLineWidth(0.25)
          doc.setLineDashPattern([0.3, 1.3], 0)
          doc.line(finNombre, y - 0.6, inicioPrecio, y - 0.6)
          doc.setLineDashPattern([], 0)
        }
      }
      y += lineasNombre.length * 5.2
      if (lineasDesc.length) {
        doc.setFont('Montserrat', 'normal').setFontSize(8.2).setTextColor(...NIEBLA)
        doc.text(lineasDesc, x, y - 0.4)
        y += lineasDesc.length * 3.9
      }
      if (alerg) {
        doc.setFont('Montserrat', 'normal').setFontSize(6.6).setTextColor(...NIEBLA)
        doc.text(alerg, x, y - 0.4)
        y += 3.6
      }
      y += 3.4
    }
    y += 8
  })

  // Cierre: leyenda del sol, leyenda de alérgenos, nota y despedida
  necesita(46)
  if (haySol) {
    doc.setFont('Montserrat', 'medium').setFontSize(6.8).setTextColor(...NIEBLA).setCharSpace(0.8)
    const texto = String(tr.carta.casa).toUpperCase()
    const ancho = doc.getTextWidth(texto) + texto.length * 0.8
    doc.text(texto, A4.w / 2 + 2, y, { align: 'center' })
    sol(A4.w / 2 + 2 - ancho / 2 - 3.2, y - 1.1)
    doc.setCharSpace(0)
    y += 8
  }
  if (hayAlergenos) {
    doc.setFont('Montserrat', 'normal').setFontSize(6.8).setTextColor(...NIEBLA)
    const leyenda = `${tr.carta.alergenos}: ${tr.carta.alergenosLista.map((n, i) => `${i + 1} ${n}`).join(' · ')}`
    const lineas = doc.splitTextToSize(leyenda, A4.w - 2 * M)
    doc.text(lineas, A4.w / 2, y, { align: 'center' })
    y += lineas.length * 3.6 + 5
  }
  doc.setFont('Bodoni', 'italic').setFontSize(9).setTextColor(...NIEBLA)
  doc.text(`${tr.carta.nota1}${tr.carta.notaLink}${tr.carta.nota2}`, A4.w / 2, y + 2, { align: 'center', maxWidth: A4.w - 2 * M })
  y += 13
  doc.setFont('Bodoni', 'italic').setFontSize(12).setTextColor(...MARINO)
  doc.text(String(tr.carta.despedida), A4.w / 2, y, { align: 'center' })
  pie()

  doc.save(`Casa-Tere-Carta-${lang.toUpperCase()}.pdf`)
}
