import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../admin/AdminContext'
import { confirmarAccion } from '../lib/confirmar'
import { Olas, IconoInstagram, IconoTel, IconoPin } from './shared'
import LoginModal from '../admin/LoginModal'
import logoBlanco from '../assets/logo-blanco.png'

export default function Footer() {
  const { t } = useTranslation()
  const { admin, logout, contacto } = useAdmin()
  const [loginAbierto, setLoginAbierto] = useState(false)

  // Acceso discreto al modo edición: pulsar el nombre de Nacho.
  // Con la sesión abierta, el mismo nombre pide confirmación para cerrarla.
  const clickNombre = async () => {
    if (!admin) setLoginAbierto(true)
    else if (await confirmarAccion('¿Cerrar la sesión de edición?', { confirmar: 'Cerrar sesión' })) logout()
  }

  return (
    <footer className="pie oscuro">
      <div className="wrap pie-grid">
        <Link to="/" className="pie-logo" aria-label={`Casa Tere · ${t('nav.inicio')}`}>
          <img src={logoBlanco} alt="Casa Tere · Restaurante · Playa Honda" width="260" height="139" loading="lazy" />
        </Link>
        <Olas />
        <ul className="pie-datos">
          <li>
            <IconoPin />
            <a href={contacto.mapsUrl} target="_blank" rel="noopener noreferrer">{contacto.direccion} · Lanzarote</a>
          </li>
          <li>
            <IconoTel />
            <a href={contacto.telHref}>{contacto.telefono}</a>
          </li>
          <li>
            <IconoInstagram />
            <a href={contacto.instagram} target="_blank" rel="noopener noreferrer">{contacto.instagramUser}</a>
          </li>
        </ul>
        <div className="pie-legal">
          <p>
            © {new Date().getFullYear()} Casa Tere ·{' '}
            <button className="pie-nombre" onClick={clickNombre}>Nacho González</button>
            {' '}· Lanzarote
          </p>
          <nav aria-label={t('footer.legal')}>
            <Link to="/aviso-legal">{t('footer.aviso')}</Link>
            <Link to="/privacidad">{t('footer.privacidad')}</Link>
            <Link to="/cookies">{t('footer.cookies')}</Link>
          </nav>
        </div>
      </div>
      {loginAbierto && <LoginModal onClose={() => setLoginAbierto(false)} />}
    </footer>
  )
}
