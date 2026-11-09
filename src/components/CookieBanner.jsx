import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Guarda la decisión del usuario (all | essential) con fecha. Si algún día se
// añade analítica, se cargará solo cuando el valor guardado sea 'all'.
const STORAGE_KEY = 'casa-tere-cookies'

export function consentimientoCookies() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export default function CookieBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (consentimientoCookies()) return
    const id = setTimeout(() => setVisible(true), 900)
    return () => clearTimeout(id)
  }, [])

  const decidir = (valor) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: valor, fecha: new Date().toISOString() }))
    } catch { /* sin almacenamiento: no bloquea la web */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookies" role="region" aria-live="polite" aria-label={t('footer.cookies')}>
      <p>
        {t('cookies.texto')}{' '}
        <Link to="/cookies">{t('cookies.mas')}</Link>
      </p>
      <div className="cookies-acciones">
        <button className="btn btn-ghost" onClick={() => decidir('essential')}>{t('cookies.rechazar')}</button>
        <button className="btn" onClick={() => decidir('all')}>{t('cookies.aceptar')}</button>
      </div>
    </div>
  )
}
