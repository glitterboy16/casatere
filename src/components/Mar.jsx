import { useEffect, useRef } from 'react'

// ── El mar, grabado a buril ───────────────────────────────────────────────
// Como las marinas de los grabados del XIX: el agua se dibuja con tallas,
// muchas líneas paralelas que siguen la superficie y engordan o adelgazan
// según cómo les da la luz. Debajo hay un único campo de oleaje visto en
// perspectiva, así las crestas nacen en el horizonte y ruedan hacia la
// orilla pasando de una talla a la siguiente.
//
//  · Cinco trenes de olas con dirección propia y la dispersión del agua
//    profunda (ω = √(g·k)): la mar de fondo larga corre más que el rizo.
//  · Perfil de Stokes de segundo orden: crestas apuntadas, senos planos.
//  · Perspectiva real: tallas finas y apretadas en el horizonte, gruesas y
//    separadas en la orilla.
//  · Luz: la talla engorda en la cara de la ola que mira al espectador y en
//    las crestas, y se adelgaza hasta romperse en los senos. Cada talla es
//    una sola forma rellena de grosor variable, como el surco del buril.
//
// Se pausa fuera de pantalla o con la pestaña oculta; con movimiento
// reducido dibuja un único fotograma quieto.
//   color   · tinta en RGB ("255, 255, 255" sobre marino, "2, 30, 80" sobre papel)
//   reflejo · camino de luz del sol con destellos que tiemblan
//   calma   · selector de los textos que van encima: detrás de ellos el mar
//             se aquieta para que se lean bien

const TRENES = [
  { L: 12, A: 1, dir: -0.12, fase: 0 },
  { L: 7.1, A: 0.52, dir: 0.34, fase: 1.7 },
  { L: 4.2, A: 0.3, dir: -0.5, fase: 4.1 },
  { L: 2.4, A: 0.16, dir: 0.78, fase: 2.6 },
  { L: 1.35, A: 0.08, dir: -0.95, fase: 5.3 },
].map((o) => {
  const k = (2 * Math.PI) / o.L
  return { ...o, k, w: Math.sqrt(0.6 * k), dx: Math.sin(o.dir), dz: Math.cos(o.dir) }
})
const STOKES = 0.32
const Z_LEJOS = 14 // profundidad de la talla del horizonte

export default function Mar({ color = '255, 255, 255', reflejo = false, calma = null }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const claro = color === '255, 255, 255'
    let w = 0
    let h = 0
    let tallas = []
    let quietud = null
    let arriba = new Float32Array(0)
    let abajo = new Float32Array(0)
    let raf = 0
    let visible = true
    const t0 = performance.now()

    // Altura (Y) y pendiente hacia el fondo (DZ) del mar en (x, z, t)
    let Y = 0
    let DZ = 0
    const muestra = (x, z, t, trenes) => {
      Y = 0
      DZ = 0
      for (const o of trenes) {
        const th = o.k * (o.dx * x + o.dz * z) + o.w * t + o.fase
        const s = Math.sin(th)
        const c = Math.cos(th)
        Y += o.A * (c + STOKES * 0.5 * (2 * c * c - 1))
        DZ -= o.A * o.k * o.dz * (s + STOKES * 2 * s * c)
      }
    }

    // Zona de calma: la caja que ocupan los textos, en coordenadas del canvas
    const medirCalma = () => {
      quietud = null
      if (!calma) return
      const els = canvas.parentElement?.querySelectorAll(calma)
      if (!els?.length) return
      const rc = canvas.getBoundingClientRect()
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (!r.width) return
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom)
      })
      if (x1 <= x0) return
      quietud = { cx: (x0 + x1) / 2 - rc.left, cy: (y0 + y1) / 2 - rc.top, rx: (x1 - x0) / 2 + 70, ry: (y1 - y0) / 2 + 50 }
    }

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const movil = w < 640
      const n = movil ? 36 : 62
      const trenes = movil ? TRENES.slice(0, 4) : TRENES
      const focal = w * 0.16
      const ampPx = h * 0.03
      const paso = movil ? 5 : Math.min(7, Math.max(4, w / 240))
      const puntos = Math.ceil(w / paso) + 3
      arriba = new Float32Array(puntos)
      abajo = new Float32Array(puntos)

      tallas = Array.from({ length: n }, (_, i) => {
        const p = i / (n - 1) // 0 = horizonte, 1 = orilla
        const z = Math.pow(Z_LEJOS, 1 - p)
        const u = (1 / z - 1 / Z_LEJOS) / (1 - 1 / Z_LEJOS) // 0…1, cercanía
        const base = h * (0.03 + 0.95 * u)
        const alfa = (claro ? 1 : 1.35) * (0.14 + 0.36 * Math.pow(u, 0.75))
        // La tinta se desvanece hacia los bordes: el mar no acaba en una arista
        const grad = ctx.createLinearGradient(0, 0, w, 0)
        grad.addColorStop(0, `rgba(${color},0)`)
        grad.addColorStop(0.12, `rgba(${color},${alfa})`)
        grad.addColorStop(0.88, `rgba(${color},${alfa})`)
        grad.addColorStop(1, `rgba(${color},0)`)
        return { z, u, base, grad, grueso: 0.3 + (movil ? 1.8 : 2.4) * Math.pow(u, 1.15), trenes, focal, ampPx, paso, puntos, semilla: i * 2.399 }
      })
      medirCalma()
    }

    const dibujar = (t) => {
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      for (const l of tallas) {
        const escala = l.z / l.focal
        const amp = l.ampPx / l.z
        for (let k = 0; k < l.puntos; k++) {
          const x = (k - 1) * l.paso
          muestra((x - cx) * escala, l.z, t, l.trenes)
          const y = l.base - Y * amp
          // Luz: cara que mira al espectador (pendiente hacia el fondo) y cresta
          const luz = 0.5 + 0.5 * Math.tanh(DZ * 0.9) + Math.max(0, Y) * 0.22
          let g = l.grueso * (0.12 + 0.88 * Math.min(1.25, luz))
          if (reflejo) g *= 1 + 0.9 * Math.exp(-(((x - cx) / (w * 0.11)) ** 2)) * (0.3 + 0.7 * l.u)
          arriba[k] = y - g / 2
          abajo[k] = y + g / 2
        }
        ctx.beginPath()
        ctx.moveTo(-l.paso, arriba[0])
        for (let k = 1; k < l.puntos; k++) ctx.lineTo((k - 1) * l.paso, arriba[k])
        for (let k = l.puntos - 1; k >= 0; k--) ctx.lineTo((k - 1) * l.paso, abajo[k])
        ctx.closePath()
        ctx.fillStyle = l.grad
        ctx.fill()
        if (reflejo) destellos(l, t, cx, escala, amp)
      }
      // El mar se aquieta detrás de los textos
      if (quietud) {
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.translate(quietud.cx, quietud.cy)
        ctx.scale(quietud.rx, quietud.ry)
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
        g.addColorStop(0, 'rgba(0,0,0,.72)')
        g.addColorStop(0.55, 'rgba(0,0,0,.5)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, 1, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Camino de luz del sol: segmentos cortos sobre la propia ola, que se
    // encienden y apagan con dos ondas que corren en sentidos opuestos
    const destellos = (l, t, cx, escala, amp) => {
      const ancho = w * (0.03 + 0.17 * l.u)
      const largo = 4 + 16 * l.u
      ctx.lineWidth = 0.6 + 1.6 * l.u
      ctx.lineCap = 'round'
      for (let x = cx - ancho; x <= cx + ancho; x += l.paso * 1.2) {
        const brillo = Math.sin(x * 0.11 + t * 2.1 + l.semilla) * Math.sin(x * 0.037 - t * 1.3 + l.semilla * 1.7)
        if (brillo < 0.12) continue
        const d = Math.abs(x - cx) / ancho
        const a = Math.min(0.95, ((brillo - 0.12) / 0.88) * (1 - d * d) * (0.4 + 0.75 * l.u))
        muestra((x - cx) * escala, l.z, t, l.trenes)
        const y0 = l.base - Y * amp
        muestra((x + largo - cx) * escala, l.z, t, l.trenes)
        const y1 = l.base - Y * amp
        ctx.strokeStyle = `rgba(232,163,90,${a.toFixed(3)})`
        ctx.beginPath()
        ctx.moveTo(x, y0)
        ctx.lineTo(x + largo, y1)
        ctx.stroke()
      }
    }

    const bucle = (ahora) => {
      dibujar((ahora - t0) / 1000)
      raf = visible && !document.hidden ? requestAnimationFrame(bucle) : 0
    }
    const arrancar = () => {
      if (!quieto && !raf && visible && !document.hidden) raf = requestAnimationFrame(bucle)
    }
    const parar = () => { cancelAnimationFrame(raf); raf = 0 }
    const reajustar = () => { ajustar(); if (quieto) dibujar(4.2) }

    ajustar()
    if (quieto) dibujar(4.2)
    else arrancar()

    // Los textos cambian de sitio al cargar las fuentes y al acabar su entrada
    document.fonts?.ready.then(() => { medirCalma(); if (quieto) dibujar(4.2) })
    const tardio = setTimeout(() => { medirCalma(); if (quieto) dibujar(4.2) }, 2400)

    const ro = new ResizeObserver(reajustar)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      visible ? arrancar() : parar()
    })
    io.observe(canvas)
    const onVis = () => (document.hidden ? parar() : arrancar())
    document.addEventListener('visibilitychange', onVis)

    return () => {
      parar()
      clearTimeout(tardio)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [color, reflejo, calma])

  return <canvas className="mar" ref={ref} aria-hidden="true" />
}
