import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useAdmin, resolver } from '../admin/AdminContext'
import { confirmarAccion } from '../lib/confirmar'
import { hoyIndice, tramosATexto, textoATramos } from '../lib/horario'
import {
  useReveal, useCerca, SectionHead, Olas,
  IconoTel, IconoFlecha, IconoPin, IconoReloj, IconoInstagram, IconoX, IconoMas,
} from '../components/shared'
import Mar from '../components/Mar'
import Estado from '../components/Estado'
import Cocina from '../components/Cocina'
import logoBlanco from '../assets/logo-blanco.png'
import firmaMarino from '../assets/firma-marino.png'
import vistaLanzarote from '../assets/casa/casa-vista.webp'
import vistaLanzaroteMovil from '../assets/casa/casa-vista-1200.webp'

/* ─────────────────────────── HERO ─────────────────────────── */
// Seis pulpos grabados (herramientas/grabados, todos con la cabeza arriba).
// Cada carga de la web enseña uno, sin repetir el de la visita anterior.
// Con /?pulpo=09 se fuerza uno concreto para revisarlo.
// Cada pulpo en dos tamaños: el grande (escritorio retina) y uno de 1000 px para móvil.
const PULPOS = {}
for (const [ruta, url] of Object.entries(import.meta.glob('../assets/hero/pulpo-*.webp', { eager: true, import: 'default' }))) {
  const [, id, ancho] = ruta.match(/pulpo-(\d+)(?:-(\d+))?\.webp$/)
  PULPOS[id] = { ...PULPOS[id], [ancho ? 'movil' : 'grande']: url }
}
function elegirPulpo() {
  const ids = Object.keys(PULPOS)
  const pedido = new URLSearchParams(window.location.search).get('pulpo')
  if (pedido && PULPOS[pedido]) return PULPOS[pedido]
  let previo = null
  try { previo = localStorage.getItem('casa-tere-pulpo') } catch { /* sin almacenamiento */ }
  const opciones = ids.length > 1 ? ids.filter((id) => id !== previo) : ids
  const id = opciones[Math.floor(Math.random() * opciones.length)]
  try { localStorage.setItem('casa-tere-pulpo', id) } catch { /* sin almacenamiento */ }
  return PULPOS[id]
}
// Una vez por carga: al volver a la portada sin recargar se mantiene el mismo
const PULPO = elegirPulpo()

// Dos direcciones en prueba (se elige una y se borra la otra):
//   lámina    · (por defecto) el logo a la izquierda y un pulpo grabado enorme
//               con la cabeza hacia la esquina de arriba a la derecha, saliéndose
//               de la pantalla, y los brazos bajando hacia el mar.
//   horizonte · (/?hero=horizonte) sin animales: el sol del logo se pone y su
//               reflejo tiembla sobre el oleaje.
function Hero() {
  const { t } = useTranslation()
  const { contacto } = useAdmin()
  const { search } = useLocation()
  const horizonte = new URLSearchParams(search).get('hero') === 'horizonte'
  return (
    <header className={`hero oscuro ${horizonte ? 'hero-horizonte' : 'hero-lamina'}`}>
      <div className="hero-sol" aria-hidden="true" />
      {!horizonte && (
        // Antes que el mar: sus líneas pasan por encima y lo sumergen
        <figure className="lamina-fig" aria-hidden="true">
          <img
            src={PULPO.grande}
            srcSet={PULPO.movil ? `${PULPO.movil} 1000w, ${PULPO.grande} 1800w` : undefined}
            sizes="(max-width: 960px) 78vw, min(52vw, 860px)"
            alt=""
            decoding="async"
            fetchpriority="high"
          />
        </figure>
      )}
      <Mar reflejo={horizonte} calma=".hero-lema, .hero-ctas" />
      <div className="hero-inner">
        <h1 className="sr-only">{t('hero.titulo')}</h1>
        <img className="hero-logo" src={logoBlanco} alt="Casa Tere · Restaurante · Playa Honda · Nacho González" width="1023" height="547" fetchpriority="high" />
        <p className="hero-lema">{t('hero.lema')}</p>
        <div className="hero-ctas">
          <a className="btn" href={contacto.telHref}><IconoTel />{t('hero.reservar')}</a>
          <Link className="btn btn-ghost" to="/carta">{t('hero.verCarta')}</Link>
        </div>
      </div>
      <div className="hero-pie wrap">
        <Estado />
        <a className="hero-lugar" href={contacto.mapsUrl} target="_blank" rel="noopener noreferrer">
          <IconoPin />{t('hero.lugar')}
        </a>
      </div>
    </header>
  )
}

/* ─────────────────────────── LA CASA ─────────────────────────── */
// Abre con una lámina: «Vues de Lancerote», vista de costa anónima del
// siglo XVIII del Service hydrographique de la Marine (BnF, GE SH 18 PF 111
// DIV 1 P 5 D): Lanzarote a 5 leguas y Fuerteventura a 11. Limpia de rumbos
// y rosa de los vientos con herramientas/grabados.
function Casa() {
  const { t } = useTranslation()
  const laminaRef = useReveal()
  const [imgRef, cerca] = useCerca()
  const copyRef = useReveal()
  return (
    <section className="casa" id="casa">
      <div className="wrap">
        <figure className="casa-lamina reveal" ref={laminaRef}>
          <div
            ref={imgRef}
            className={`casa-lamina-img${cerca ? '' : ' espera'}`}
            style={cerca ? { '--src': `url(${vistaLanzarote})`, '--src-movil': `url(${vistaLanzaroteMovil})` } : undefined}
            aria-hidden="true"
          />
          <figcaption>{t('casa.grabado')}</figcaption>
        </figure>
        <div className="casa-copy reveal" ref={copyRef}>
          <div className="casa-cab">
            <span className="eyebrow izq">{t('casa.eyebrow')}</span>
            <h2>{t('casa.titulo')}</h2>
            <Olas />
            <p className="casa-lead">{t('casa.p1')}</p>
          </div>
          <div className="casa-texto">
            <p>{t('casa.p2')}</p>
            <p>{t('casa.p3')}</p>
            <div className="firma">
              <img src={firmaMarino} alt="Nacho González" width="220" height="35" loading="lazy" />
              <span>{t('casa.firma')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── GALERÍA ─────────────────────────── */
const SIGUIENTE_CLASE = { '': 'wide', wide: 'tall', tall: '' }
const NOMBRE_CLASE = { '': 'normal', wide: 'ancha', tall: 'alta' }

function Galeria() {
  const { t, i18n } = useTranslation()
  const {
    admin, galeria, guardarGaleria, campoTraducido, editandoGaleria, setEditandoGaleria, guardar,
    subirFoto, borrarFoto, contacto,
  } = useAdmin()
  const editando = admin && editandoGaleria
  const ref = useReveal()
  const inputAdd = useRef(null)
  const inputReplace = useRef(null)
  const idReemplazo = useRef(null)
  const L = resolver(i18n.language.slice(0, 2))

  // Sin fotos, la sección no se enseña al público (solo a Nacho, para llenarla)
  if (!admin && galeria.length === 0) return null

  const subir = async (file, aplicar) => {
    if (!file) return
    const id = toast.loading('Subiendo foto…')
    try {
      const res = await subirFoto(file)
      aplicar(res)
      toast.success('Foto guardada', { id })
    } catch {
      toast.error('No se pudo subir la foto', { id })
    }
  }

  const eliminar = async (item) => {
    if (!(await confirmarAccion('¿Eliminar esta foto de la galería?', { confirmar: 'Eliminar' }))) return
    guardarGaleria((prev) => prev.filter((g) => g.id !== item.id))
    borrarFoto(item.path)
  }

  return (
    <section className="galeria" id="galeria">
      <div className="wrap">
        <SectionHead eyebrow={t('galeria.eyebrow')} title={t('galeria.titulo')} />
        {admin && (
          <div className="edit-bar">
            {editando
              ? <button className="btn" onClick={guardar}>Guardar</button>
              : <button className="btn btn-ghost" onClick={() => setEditandoGaleria(true)}>Editar galería</button>}
          </div>
        )}
        <div className="gal-grid reveal" ref={ref}>
          {galeria.map((item) => (
            <figure key={item.id} className={`gal-item ${item.clase || ''}`.trim()}>
              <img src={item.src} alt={L(item.tag) || 'Casa Tere'} loading="lazy" decoding="async" />
              {editando ? (
                <figcaption>
                  <input
                    className="tag-input"
                    placeholder="Título (opcional)"
                    defaultValue={L(item.tag) || ''}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v === (L(item.tag) || '')) return
                      if (!v) return guardarGaleria((prev) => prev.map((g) => (g.id === item.id ? { ...g, tag: {} } : g)))
                      campoTraducido(v, (obj) => guardarGaleria((prev) => prev.map((g) => (g.id === item.id ? { ...g, tag: obj } : g))))
                    }}
                  />
                </figcaption>
              ) : (
                L(item.tag) && <figcaption>{L(item.tag)}</figcaption>
              )}
              {editando && (
                <div className="gal-admin">
                  <button
                    className="mini-btn"
                    title={`Tamaño: ${NOMBRE_CLASE[item.clase || '']}`}
                    onClick={() => guardarGaleria((prev) => prev.map((g) => (g.id === item.id ? { ...g, clase: SIGUIENTE_CLASE[g.clase || ''] } : g)))}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      {(item.clase || '') === '' && <rect x="7" y="7" width="10" height="10" />}
                      {item.clase === 'wide' && <rect x="4" y="8" width="16" height="8" />}
                      {item.clase === 'tall' && <rect x="8" y="4" width="8" height="16" />}
                    </svg>
                  </button>
                  <button className="mini-btn" title="Reemplazar foto" onClick={() => { idReemplazo.current = item.id; inputReplace.current.click() }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 17v3h16v-3M12 4v12M7 9l5-5 5 5" /></svg>
                  </button>
                  <button className="mini-btn" title="Eliminar foto" onClick={() => eliminar(item)}><IconoX /></button>
                </div>
              )}
            </figure>
          ))}
          {editando && (
            <button className="gal-item gal-add" onClick={() => inputAdd.current.click()}>
              <IconoMas />
              Añadir foto
            </button>
          )}
        </div>
        {!editando && galeria.length === 0 && (
          <p className="admin-aviso">La galería está vacía y no se muestra al público. Pulsa «Editar galería» para subir las primeras fotos.</p>
        )}
        <div className="gal-insta">
          <a className="enlace" href={contacto.instagram} target="_blank" rel="noopener noreferrer">
            <IconoInstagram />{t('galeria.instagram')} · {contacto.instagramUser}
          </a>
        </div>
        {editando && (
          <>
            <input
              ref={inputAdd} type="file" accept="image/*" hidden
              onChange={(e) => {
                subir(e.target.files[0], ({ src, path }) =>
                  guardarGaleria((prev) => [...prev, { id: `foto-${Date.now()}`, src, path, tag: {}, clase: '' }]))
                e.target.value = ''
              }}
            />
            <input
              ref={inputReplace} type="file" accept="image/*" hidden
              onChange={(e) => {
                const id = idReemplazo.current
                const anterior = galeria.find((g) => g.id === id)
                subir(e.target.files[0], ({ src, path }) => {
                  guardarGaleria((prev) => prev.map((g) => (g.id === id ? { ...g, src, path } : g)))
                  borrarFoto(anterior?.path)
                })
                e.target.value = ''
              }}
            />
          </>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────── VISITA ─────────────────────────── */
function Visita() {
  const { t } = useTranslation()
  const {
    admin, contacto, guardarContacto, horario, guardarHorario,
    editandoVisita, setEditandoVisita, guardar,
  } = useAdmin()
  const editando = admin && editandoVisita
  const dias = t('dias', { returnObjects: true })
  const hoy = hoyIndice()
  const ref = useReveal()
  const semana = horario ?? Array.from({ length: 7 }, () => [])

  const editarDia = (i, texto) => {
    const tramos = textoATramos(texto)
    if (tramos === null) {
      toast.error('Escribe el horario así: 12:00–16:00, 19:00–23:00 (o «Cerrado»)')
      return
    }
    guardarHorario((prev) => (prev ?? Array.from({ length: 7 }, () => [])).map((d, j) => (j === i ? tramos : d)))
  }

  return (
    <section className="visita" id="visita">
      <div className="wrap">
        <SectionHead eyebrow={t('visita.eyebrow')} title={t('visita.titulo')} />
        {admin && (
          <div className="edit-bar">
            {editando
              ? <button className="btn" onClick={guardar}>Guardar</button>
              : <button className="btn btn-ghost" onClick={() => setEditandoVisita(true)}>Editar horario y teléfono</button>}
          </div>
        )}
        <div className="visita-grid reveal" ref={ref}>
          <div className="visita-bloque">
            <h3><IconoReloj />{t('visita.horario')}</h3>
            <Estado />
            {!horario && !editando ? (
              <p>{t('visita.sinHorario')}</p>
            ) : (
            <table className="horario">
              <tbody>
                {dias.map((nombre, i) => (
                  <tr key={nombre} className={i === hoy ? 'hoy' : ''}>
                    <th scope="row">
                      {nombre}
                      {i === hoy && <span className="sr-only"> ({t('visita.hoy')})</span>}
                    </th>
                    <td>
                      {editando ? (
                        <input
                          className="admin-input"
                          defaultValue={semana[i]?.length ? tramosATexto(semana[i]) : 'Cerrado'}
                          aria-label={`Horario del ${nombre}`}
                          onBlur={(e) => editarDia(i, e.target.value)}
                        />
                      ) : semana[i]?.length ? (
                        tramosATexto(semana[i])
                      ) : (
                        <span className="cerrado">{t('visita.cerrado')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>

          <div className="visita-bloque visita-reservas oscuro">
            <h3><IconoTel />{t('visita.reservas')}</h3>
            {editando ? (
              <input
                className="admin-input admin-osc"
                type="tel"
                inputMode="tel"
                defaultValue={contacto.telefono}
                aria-label="Teléfono de reservas"
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== contacto.telefono) guardarContacto(v)
                }}
              />
            ) : (
              <a className="visita-tel" href={contacto.telHref}>{contacto.telefono}</a>
            )}
            <p>{t('visita.reservasTxt')}</p>
            <a className="btn" href={contacto.telHref}><IconoTel />{t('hero.reservar')}</a>
          </div>

          <div className="visita-bloque">
            <h3><IconoPin />{t('visita.donde')}</h3>
            <address>
              <strong>Casa Tere</strong>
              {contacto.direccion}<br />
              {contacto.direccion2}
            </address>
            <div className="visita-enlaces">
              <a className="enlace" href={contacto.mapsUrl} target="_blank" rel="noopener noreferrer">
                {t('visita.comoLlegar')}<IconoFlecha />
              </a>
              <a className="enlace" href={contacto.instagram} target="_blank" rel="noopener noreferrer">
                <IconoInstagram />{contacto.instagramUser}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── PÁGINA ─────────────────────────── */
export default function Home() {
  const { hash } = useLocation()

  // Si llegamos con /#seccion desde otra página, baja hasta ella
  useEffect(() => {
    if (!hash) return
    const el = document.querySelector(hash)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }, [hash])

  return (
    <>
      <Hero />
      <Cocina />
      <Casa />
      <Galeria />
      <Visita />
    </>
  )
}
