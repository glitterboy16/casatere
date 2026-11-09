import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../admin/AdminContext'
import { IconoTel } from './shared'
import logoBlanco from '../assets/logo-blanco.png'

const IDIOMAS = [
  ['es', 'Español'],
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['it', 'Italiano'],
]

// Raíz de la web: / en Vercel, /casatere/ en GitHub Pages
const BASE = import.meta.env.BASE_URL

// Secciones de la home que marca el scroll-spy (en orden de aparición)
const SECCIONES = ['cocina', 'casa', 'galeria', 'visita']

export default function Nav() {
  const { t, i18n } = useTranslation()
  const { contacto, galeria, admin } = useAdmin()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [seccion, setSeccion] = useState('inicio')
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  const { pathname } = useLocation()
  const enHome = pathname === '/'
  const lang = i18n.language.slice(0, 2)
  const hayGaleria = admin || galeria.length > 0

  // Fuera de la home no hay hero oscuro: la barra va siempre sólida
  useEffect(() => {
    const onScroll = () => setSolid(!enHome || window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enHome])

  useEffect(() => {
    if (!enHome) return
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.35
      let actual = 'inicio'
      for (const id of SECCIONES) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= y) actual = id
      }
      setSeccion(actual)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enHome])

  useEffect(() => setOpen(false), [pathname])

  // Menú móvil abierto: bloquea el scroll de fondo y cierra con Escape
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!langOpen) return
    const onClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('pointerdown', onClick)
    return () => document.removeEventListener('pointerdown', onClick)
  }, [langOpen])

  const close = () => setOpen(false)
  const activa = (id) => (enHome && seccion === id ? 'active' : '')

  return (
    <nav className={`nav${solid ? ' solid' : ''}${open ? ' abierto' : ''}`}>
      <Link
        className="nav-marca"
        to="/"
        aria-label={`Casa Tere · ${t('nav.inicio')}`}
        onClick={() => { close(); if (enHome) window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      >
        <img src={logoBlanco} alt="Casa Tere" width="96" height="51" />
      </Link>

      <div className="nav-links" id="navLinks">
        <a href={`${BASE}#cocina`} className={activa('cocina')} onClick={close}>{t('nav.cocina')}</a>
        <a href={`${BASE}#casa`} className={activa('casa')} onClick={close}>{t('nav.casa')}</a>
        <Link to="/carta" className={pathname === '/carta' ? 'active' : ''} onClick={close}>
          {t('nav.carta')}
        </Link>
        {hayGaleria && <a href={`${BASE}#galeria`} className={activa('galeria')} onClick={close}>{t('nav.galeria')}</a>}
        <a href={`${BASE}#visita`} className={activa('visita')} onClick={close}>{t('nav.visita')}</a>

        <div className="lang" ref={langRef}>
          <button
            className="lang-btn"
            aria-label={t('nav.idioma')}
            aria-expanded={langOpen}
            aria-controls="menuIdiomas"
            onClick={() => setLangOpen(!langOpen)}
          >
            {lang.toUpperCase()}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
          </button>
          {langOpen && (
            <ul className="lang-menu" id="menuIdiomas" aria-label={t('nav.idioma')}>
              {IDIOMAS.map(([code, nombre]) => (
                <li key={code}>
                  <button
                    lang={code}
                    aria-current={code === lang ? 'true' : undefined}
                    className={code === lang ? 'on' : ''}
                    onClick={() => { i18n.changeLanguage(code); setLangOpen(false) }}
                  >
                    {nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sin onClick={close}: en iOS Safari cerrar el menú durante el tap
            cancela la llamada tel:. */}
        <a className="btn nav-cta" href={contacto.telHref}>
          <IconoTel />
          {t('nav.reservar')}
        </a>
      </div>

      <button
        className="burger"
        aria-label={open ? t('nav.cerrar') : t('nav.abrir')}
        aria-expanded={open}
        aria-controls="navLinks"
        onClick={() => setOpen(!open)}
      >
        <span></span><span></span>
      </button>
    </nav>
  )
}
