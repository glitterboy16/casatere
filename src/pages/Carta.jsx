import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useAdmin, resolver } from '../admin/AdminContext'
import { confirmarAccion } from '../lib/confirmar'
import { useReveal, Olas, Gaviotas, IconoX, IconoMas, IconoSol } from '../components/shared'
import Mar from '../components/Mar'
import { Ilustracion } from '../components/Ilustraciones'
import { useTitulo } from '../lib/titulo'
import QrModal from '../admin/QrModal'
import firmaBlanco from '../assets/firma-blanco.png'

const textoEs = (v) => (v && typeof v === 'object' ? v.es ?? '' : v ?? '')
const numero = (i) => String(i + 1).padStart(2, '0')
// "1, 4, 7" → [1, 4, 7]: solo los 14 alérgenos oficiales, sin repetidos
const leerAlergenos = (texto) =>
  [...new Set(String(texto).split(/[^\d]+/).map(Number).filter((n) => n >= 1 && n <= 14))].sort((a, b) => a - b)

/* ── Un capítulo: cabecera fija a la izquierda, platos en columnas a la derecha ── */
function Categoria({ cat, indice, L, editando, acciones }) {
  const { t } = useTranslation()
  const ref = useReveal()
  const tituloId = `t-${cat.id}`
  const conMedia = cat.platos.some((p) => p.media)
  const alergenos = t('carta.alergenosLista', { returnObjects: true })
  const nombresAlergenos = (nums) => nums.map((n) => alergenos[n - 1]).filter(Boolean).join(' · ')

  return (
    <section className="menu-cat reveal" id={cat.id} aria-labelledby={editando ? undefined : tituloId} ref={ref}>
      <div className="menu-cat-lado">
        <header className="menu-cat-cab">
          <Ilustracion cat={cat} />
          <span className="menu-cat-num" aria-hidden="true">{numero(indice)}</span>
          {editando ? (
            <div className="menu-cat-edit">
              <input
                className="admin-input cat-input"
                defaultValue={cat.titulo.es}
                aria-label="Nombre de la categoría"
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== cat.titulo.es) acciones.editarTitulo(cat.id, v)
                }}
              />
              <button className="mini-btn" title="Eliminar categoría" aria-label="Eliminar categoría" onClick={() => acciones.eliminarCategoria(cat.id)}>
                <IconoX />
              </button>
            </div>
          ) : (
            <h2 id={tituloId}>{L(cat.titulo)}</h2>
          )}
          <Olas />
          {editando ? (
            <input
              className="admin-input nota-input"
              defaultValue={cat.nota?.es ?? ''}
              placeholder="Nota de la categoría (opcional)"
              aria-label="Nota de la categoría"
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v !== (cat.nota?.es ?? '')) acciones.editarNota(cat.id, v)
              }}
            />
          ) : (
            cat.nota && <p className="menu-cat-nota">{L(cat.nota)}</p>
          )}
        </header>
      </div>

      <ul className="platos">
        {conMedia && !editando && (
          <li className="platos-cab" aria-hidden="true">
            <span />
            <span>{t('carta.racion')}</span>
            <span>{t('carta.media')}</span>
          </li>
        )}
        {cat.platos.map((p, i) => {
          const id = p.id ?? i
          if (!editando) {
            return (
              <li key={id} className={`plato${p.precio ? '' : ' sin-precio'}`} style={{ '--i': Math.min(i, 8) }}>
                <span className="plato-nombre">
                  <span className="plato-txt">
                    {p.sol && <IconoSol className="plato-sol" />}
                    {p.sol && <span className="sr-only">{t('carta.casa')}: </span>}
                    {L(p.nombre)}
                  </span>
                </span>
                {p.precio && (
                  <span className="plato-precio">
                    {conMedia && <span className="sr-only">{t('carta.racion')} </span>}
                    {L(p.precio)}
                  </span>
                )}
                {p.media && (
                  <span className="plato-media">
                    <span className="sr-only">{t('carta.media')} </span>
                    {L(p.media)}
                  </span>
                )}
                {p.desc && <p className="plato-desc">{L(p.desc)}</p>}
                {p.alergenos?.length > 0 && (
                  <p className="plato-alerg" title={`${t('carta.alergenos')}: ${p.alergenos.join(', ')}`}>
                    <span className="sr-only">{t('carta.alergenos')}: </span>
                    {nombresAlergenos(p.alergenos)}
                  </p>
                )}
              </li>
            )
          }
          return (
            <li key={id} className="plato plato-admin">
              <div className="plato-fila">
                <button
                  className={`mini-btn sol-btn${p.sol ? ' on' : ''}`}
                  title={t('carta.casa')}
                  aria-label={t('carta.casa')}
                  aria-pressed={!!p.sol}
                  onClick={() => acciones.alternarSol(cat.id, id)}
                >
                  <IconoSol />
                </button>
                <input
                  className="admin-input nombre-input"
                  defaultValue={textoEs(p.nombre)}
                  placeholder="Nombre"
                  aria-label="Nombre"
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v && v !== textoEs(p.nombre)) acciones.editarNombre(cat.id, id, v)
                  }}
                />
                <input
                  className="admin-input precio-input"
                  defaultValue={textoEs(p.precio)}
                  placeholder="Ración"
                  aria-label="Precio de la ración"
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v !== textoEs(p.precio)) acciones.editarPrecio(cat.id, id, v)
                  }}
                />
                <input
                  className="admin-input precio-input"
                  defaultValue={textoEs(p.media)}
                  placeholder="Media"
                  aria-label="Precio de la media ración"
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v !== textoEs(p.media)) acciones.editarMedia(cat.id, id, v)
                  }}
                />
                <button className="mini-btn" title="Eliminar" aria-label="Eliminar" onClick={() => acciones.eliminarPlato(cat.id, id)}>
                  <IconoX />
                </button>
              </div>
              <textarea
                className="admin-input"
                rows={2}
                defaultValue={p.desc?.es ?? ''}
                placeholder="Descripción (opcional)"
                aria-label="Descripción"
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v !== (p.desc?.es ?? '')) acciones.editarDesc(cat.id, id, v)
                }}
              />
              <input
                className="admin-input alerg-input"
                defaultValue={(p.alergenos ?? []).join(', ')}
                placeholder="Alérgenos por número: 1, 4, 7"
                aria-label="Alérgenos"
                onBlur={(e) => {
                  const v = leerAlergenos(e.target.value)
                  if (v.join() !== (p.alergenos ?? []).join()) acciones.editarAlergenos(cat.id, id, v)
                }}
              />
            </li>
          )
        })}
      </ul>
      {editando && (
        <button className="btn btn-ghost add-plato" onClick={() => acciones.añadirPlato(cat.id)}><IconoMas />Añadir plato</button>
      )}
    </section>
  )
}

export default function Carta() {
  const { t, i18n } = useTranslation()
  const {
    admin, cartaData, guardarCarta, vinos, guardarVinos, campoTraducido,
    editandoCarta, setEditandoCarta, guardar, contacto,
  } = useAdmin()
  const { hash } = useLocation()
  const editando = admin && editandoCarta
  const [exportando, setExportando] = useState(false)
  const [qrAbierto, setQrAbierto] = useState(false)
  const [tipo, setTipo] = useState('comida')
  const [activa, setActiva] = useState(null)
  const esVinos = tipo === 'vinos'
  const datos = esVinos ? vinos : cartaData
  const guardarDatos = esVinos ? guardarVinos : guardarCarta
  const mostrarTabs = admin || vinos.length > 0
  const lang = i18n.language.slice(0, 2)
  const L = resolver(lang)
  const haySol = datos.some((c) => c.platos.some((p) => p.sol))
  useTitulo(t('carta.titulo'))
  const alergenosEs = t('carta.alergenosLista', { returnObjects: true, lng: 'es' })

  // Entrada directa a una categoría (/carta#pescados) o arriba del todo
  useEffect(() => {
    // 'instant': con scroll-behavior:smooth global, un scrollTo(0,0) al entrar
    // desde media portada se anima por encima de la carta recién montada.
    if (!hash) { window.scrollTo({ top: 0, behavior: 'instant' }); return }
    const el = document.querySelector(hash)
    if (el) setTimeout(() => el.scrollIntoView(), 60)
  }, [hash])

  // Scroll-spy de las categorías para el índice de la barra fija
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.3
      let actual = datos[0]?.id ?? null
      for (const c of datos) {
        const el = document.getElementById(c.id)
        if (el && el.offsetTop <= y) actual = c.id
      }
      setActiva(actual)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [datos])

  // Mantiene visible el capítulo activo dentro del índice horizontal
  useEffect(() => {
    document.querySelector('.chips .on')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [activa])

  // En modo edición cada plato necesita un id estable
  useEffect(() => {
    if (!editando) return
    if (!datos.some((c) => c.platos.some((p) => !p.id))) return
    guardarDatos((prev) =>
      prev.map((c) => ({ ...c, platos: c.platos.map((p, i) => (p.id ? p : { ...p, id: `${c.id}-${i}-${Date.now()}` })) }))
    )
  }, [editando, tipo]) // eslint-disable-line react-hooks/exhaustive-deps

  const exportarPdf = async () => {
    setExportando(true)
    try {
      const { exportarCartaPdf } = await import('../admin/exportarPdf')
      await toast.promise(exportarCartaPdf(datos, lang, contacto), {
        loading: 'Generando PDF…',
        success: 'Carta exportada en PDF',
        error: 'No se pudo generar el PDF',
      })
    } finally {
      setExportando(false)
    }
  }

  const setPlato = (catId, platoId, fn) =>
    guardarDatos((prev) =>
      prev.map((c) => (c.id !== catId ? c : { ...c, platos: c.platos.map((p, i) => ((p.id ?? i) !== platoId ? p : fn(p))) }))
    )

  // Un precio con cifras se guarda tal cual; si es texto ("Según mercado") se traduce
  const precioOTexto = (texto, aplicar) => {
    if (!texto) return aplicar(undefined)
    if (/\d/.test(texto)) return aplicar(texto)
    campoTraducido(texto, aplicar)
  }

  const acciones = {
    editarTitulo: (catId, texto) =>
      campoTraducido(texto, (obj) => guardarDatos((prev) => prev.map((c) => (c.id === catId ? { ...c, titulo: obj } : c)))),
    editarNota: (catId, texto) => {
      if (!texto) return guardarDatos((prev) => prev.map((c) => (c.id === catId ? { ...c, nota: undefined } : c)))
      campoTraducido(texto, (obj) => guardarDatos((prev) => prev.map((c) => (c.id === catId ? { ...c, nota: obj } : c))))
    },
    editarNombre: (catId, platoId, texto) =>
      esVinos
        ? setPlato(catId, platoId, (p) => ({ ...p, nombre: texto })) // los vinos no se traducen
        : campoTraducido(texto, (obj) => setPlato(catId, platoId, (p) => ({ ...p, nombre: obj }))),
    editarDesc: (catId, platoId, texto) => {
      if (!texto) return setPlato(catId, platoId, (p) => ({ ...p, desc: undefined }))
      campoTraducido(texto, (obj) => setPlato(catId, platoId, (p) => ({ ...p, desc: obj })))
    },
    editarPrecio: (catId, platoId, texto) =>
      precioOTexto(texto, (v) => setPlato(catId, platoId, (p) => ({ ...p, precio: v }))),
    editarMedia: (catId, platoId, texto) =>
      precioOTexto(texto, (v) => setPlato(catId, platoId, (p) => ({ ...p, media: v }))),
    editarAlergenos: (catId, platoId, lista) =>
      setPlato(catId, platoId, (p) => ({ ...p, alergenos: lista.length ? lista : undefined })),
    alternarSol: (catId, platoId) => setPlato(catId, platoId, (p) => ({ ...p, sol: p.sol ? undefined : true })),
    añadirPlato: (catId) => {
      guardarDatos((prev) =>
        prev.map((c) =>
          c.id !== catId
            ? c
            : { ...c, platos: [...c.platos, { id: `p-${Date.now()}`, nombre: esVinos ? 'Nuevo vino' : { es: 'Nuevo plato' } }] }
        )
      )
      toast.success(esVinos ? 'Vino añadido' : 'Plato añadido')
    },
    eliminarPlato: async (catId, platoId) => {
      if (!(await confirmarAccion(esVinos ? '¿Eliminar este vino?' : '¿Eliminar este plato?', { confirmar: 'Eliminar' }))) return
      guardarDatos((prev) => prev.map((c) => (c.id !== catId ? c : { ...c, platos: c.platos.filter((p, i) => (p.id ?? i) !== platoId) })))
    },
    eliminarCategoria: async (catId) => {
      if (!(await confirmarAccion('¿Eliminar la categoría completa?', { confirmar: 'Eliminar' }))) return
      guardarDatos((prev) => prev.filter((c) => c.id !== catId))
    },
  }

  const añadirCategoria = () => {
    guardarDatos((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, titulo: { es: esVinos ? 'Nueva categoría de vinos' : 'Nueva categoría' }, platos: [] },
    ])
  }

  const irA = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <>
      <header className="page-head carta-head">
        <div className="carta-head-sol" aria-hidden="true" />
        <Mar color="2, 30, 80" calma=".carta-lema" />
        <Gaviotas className="carta-gaviotas" />
        <div className="wrap">
          <span className="eyebrow">{t('carta.eyebrow')}</span>
          <h1>{t('carta.titulo')}</h1>
          <Olas />
          <p className="carta-lema">{t('carta.lema')}</p>
        </div>
      </header>

      <div className="carta-barra">
        <div className="wrap carta-barra-in">
          {mostrarTabs && (
            <div className="tabs" role="group" aria-label={t('carta.tipo')}>
              <button aria-pressed={!esVinos} className={!esVinos ? 'on' : ''} onClick={() => setTipo('comida')}>
                {t('carta.comida')}
              </button>
              <button aria-pressed={esVinos} className={esVinos ? 'on' : ''} onClick={() => setTipo('vinos')}>
                {t('carta.vinos')}
              </button>
            </div>
          )}
          <nav className="chips" aria-label={t('carta.indice')}>
            {datos.map((c, i) => (
              <button
                key={c.id}
                className={activa === c.id ? 'on' : ''}
                aria-current={activa === c.id ? 'true' : undefined}
                onClick={() => irA(c.id)}
              >
                <small aria-hidden="true">{numero(i)}</small>
                {L(c.titulo)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className={`carta oscuro${editando ? ' editando' : ''}`}>
        <div className="carta-in">
          {admin && (
            <div className="edit-bar">
              {editando
                ? <button className="btn" onClick={guardar}>Guardar</button>
                : <button className="btn btn-ghost" onClick={() => setEditandoCarta(true)}>Editar carta</button>}
              <button className="btn btn-ghost" onClick={exportarPdf} disabled={exportando}>
                {exportando ? 'Generando…' : `PDF (${lang.toUpperCase()})`}
              </button>
              <button className="btn btn-ghost" onClick={() => setQrAbierto(true)}>QR de mesa</button>
            </div>
          )}
          {editando && (
            <div className="admin-aviso">
              <p>Escribe en español: las traducciones se generan solas al salir de cada campo. El sol marca lo que recomienda la casa.</p>
              <p className="admin-leyenda">{alergenosEs.map((n, i) => `${i + 1} ${n}`).join(' · ')}</p>
            </div>
          )}

          <div className="menu" key={tipo}>
            {datos.map((cat, i) => (
              <Categoria key={cat.id} cat={cat} indice={i} L={L} editando={editando} acciones={acciones} />
            ))}
          </div>
          {esVinos && datos.length === 0 && !editando && (
            <p className="admin-aviso">Aún no hay vinos. Pulsa «Editar carta» para añadirlos.</p>
          )}
          {editando && (
            <button className="btn btn-ghost add-cat" onClick={añadirCategoria}><IconoMas />Añadir categoría</button>
          )}

          <footer className="carta-cierre">
            {haySol && (
              <p className="carta-leyenda"><IconoSol />{t('carta.casa')}</p>
            )}
            <p className="carta-nota">
              {t('carta.nota1')}
              <a href={contacto.telHref}>{t('carta.notaLink')}</a>
              {t('carta.nota2')}
            </p>
            <div className="carta-firma">
              <img src={firmaBlanco} alt="Nacho González" width="220" height="35" loading="lazy" />
              <span>{t('carta.despedida')}</span>
            </div>
          </footer>
        </div>
      </div>
      {qrAbierto && <QrModal url={`${window.location.origin}${import.meta.env.BASE_URL}carta`} onClose={() => setQrAbierto(false)} />}
    </>
  )
}
