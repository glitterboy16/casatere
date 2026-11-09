import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdmin, resolver } from '../admin/AdminContext'
import { tipoDe, ilustracionPortada } from './Ilustraciones'
import { Olas, IconoFlecha, useCerca } from './shared'
import marco from '../assets/portada/marco.webp'

// ── Nuestra cocina ────────────────────────────────────────────────────────
// Carrusel automático con tres capítulos de la carta (pescados, carnes y
// entrantes), uno por diapositiva, cada uno con su propio grabado: su
// grabado se «imprime» en tinta marina sobre el papel y al lado van platos
// reales de la carta (primero los que recomienda la casa). Todo sale de los
// datos de la carta, así que cambia solo cuando Nacho la edita.
//
// Se para al pasar el ratón, con el foco dentro, fuera de pantalla y con la
// pestaña oculta; con movimiento reducido arranca
// en pausa. Se cambia de apartado pulsando su nombre o deslizando con el dedo.

// Solo estos tres; el resto de la carta se ve en /carta
const ORDEN = ['pescados', 'carnes', 'entrantes']
const DURACION = 6500

export default function Cocina() {
  const { t, i18n } = useTranslation()
  const { cartaData } = useAdmin()
  const L = resolver(i18n.language.slice(0, 2))

  const diapositivas = cartaData
    .map((cat) => ({ cat, tipo: tipoDe(cat) }))
    .filter((d) => ORDEN.includes(d.tipo) && d.cat.platos.length > 0)
    .sort((a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo))
  const n = diapositivas.length

  const [actual, setActual] = useState(0)
  // Con movimiento reducido no avanza solo: se cambia pulsando los nombres
  const [pausado] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [sobre, setSobre] = useState(false)
  const [foco, setFoco] = useState(false)
  const [fuera, setFuera] = useState(true)
  const [oculto, setOculto] = useState(() => document.hidden)
  const parado = pausado || sobre || foco || fuera || oculto
  const i = n ? actual % n : 0

  const seccion = useRef(null)
  // Los grabados del carrusel y el marco se descargan al acercarse
  const [escenaRef, cerca] = useCerca()
  const barra = useRef(null)
  const progreso = useRef(0)
  const toque = useRef(null)

  const ir = (j) => setActual(((j % n) + n) % n)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setFuera(!e.isIntersecting), { threshold: 0.25 })
    io.observe(seccion.current)
    const onVis = () => setOculto(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // Cada diapositiva empieza con la barra de progreso a cero
  useEffect(() => {
    progreso.current = 0
    barra.current?.style.setProperty('--p', '0')
  }, [i])

  // Reloj del carrusel: avanza solo mientras nada lo retiene, y la barra
  // de progreso va exactamente al mismo ritmo
  useEffect(() => {
    if (parado || n < 2) return
    let raf = 0
    let previo = performance.now()
    const paso = (ahora) => {
      progreso.current += (ahora - previo) / DURACION
      previo = ahora
      if (progreso.current >= 1) { setActual((a) => (a + 1) % n); return }
      barra.current?.style.setProperty('--p', progreso.current.toFixed(4))
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [parado, n, i])

  if (!n) return null

  return (
    <section
      className={`cocina${parado ? ' parado' : ''}`}
      id="cocina"
      ref={seccion}
      aria-roledescription={t('cocina.carrusel')}
      aria-label={t('cocina.eyebrow')}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      onFocus={() => setFoco(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false) }}
    >
      <div className="wrap cocina-grid">
        <div
          className="cocina-escena"
          ref={escenaRef}
          aria-hidden="true"
          onPointerDown={(e) => { toque.current = e.clientX }}
          onPointerUp={(e) => {
            if (toque.current === null) return
            const dx = e.clientX - toque.current
            toque.current = null
            if (Math.abs(dx) > 50) ir(i + (dx < 0 ? 1 : -1))
          }}
        >
          {diapositivas.map((d, j) => (
            <div
              key={d.cat.id}
              className={`cocina-ilus${j === i ? ' on' : ''}${cerca ? '' : ' espera'}`}
              style={cerca ? { '--src': `url(${ilustracionPortada(d.tipo)})` } : undefined}
            />
          ))}
          {/* El marco se queda quieto mientras las láminas cambian dentro */}
          <div className={`cocina-marco${cerca ? '' : ' espera'}`} style={cerca ? { '--marco': `url(${marco})` } : undefined} />
        </div>

        <div className="cocina-textos" aria-live={parado ? 'polite' : 'off'}>
          {diapositivas.map((d, j) => {
            const activa = j === i
            const destacados = [...d.cat.platos.filter((p) => p.sol), ...d.cat.platos.filter((p) => !p.sol)].slice(0, 4)
            return (
              <div
                key={d.cat.id}
                className={`cocina-texto${activa ? ' on' : ''}`}
                role="group"
                aria-roledescription={t('cocina.diapositiva')}
                aria-label={t('cocina.posicion', { i: j + 1, n })}
                aria-hidden={!activa}
                inert={activa ? undefined : ''}
              >
                <span className="eyebrow izq">{t('cocina.eyebrow')}</span>
                <h2>{t(`cocina.titulos.${d.tipo}`)}</h2>
                <Olas />
                <ul className="cocina-platos">
                  {destacados.map((p, k) => <li key={p.id ?? k}>{L(p.nombre)}</li>)}
                </ul>
                <Link className="enlace" to={`/carta#${d.cat.id}`}>
                  {t('cocina.ver', { n: d.cat.platos.length })}<IconoFlecha />
                </Link>
              </div>
            )
          })}
        </div>

        <div className="cocina-control">
          <div className="cocina-indice">
            {diapositivas.map((d, j) => (
              <button key={d.cat.id} className={j === i ? 'on' : ''} aria-current={j === i ? 'true' : undefined} onClick={() => ir(j)}>
                {L(d.cat.titulo)}
                <span className="cocina-barra" ref={j === i ? barra : undefined} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="cocina-botones">
            <Link className="enlace cocina-toda" to="/carta">{t('hero.verCarta')}<IconoFlecha /></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
