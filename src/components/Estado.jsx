import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../admin/AdminContext'
import { estadoActual } from '../lib/horario'

// "Abierto ahora · hasta las 23:00" / "Cerrado ahora · abre mañana a las 12:00"
// Se recalcula cada minuto, siempre con la hora de Canarias.
export default function Estado({ className = '' }) {
  const { t } = useTranslation()
  const { horario } = useAdmin()
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!horario) return null
  const e = estadoActual(horario, ahora)
  const dias = t('dias', { returnObjects: true })
  let detalle = ''
  if (e.abierto) detalle = t('estado.hasta', { hora: e.hasta })
  else if (e.hora) {
    const cuando = e.offset === 0 ? t('estado.hoy') : e.offset === 1 ? t('estado.manana') : dias[e.dia].toLowerCase()
    detalle = t('estado.abre', { cuando, hora: e.hora })
  }

  return (
    <p className={`estado ${e.abierto ? 'si' : 'no'} ${className}`.trim()}>
      <span className="estado-punto" aria-hidden="true" />
      <strong>{e.abierto ? t('estado.abierto') : t('estado.cerrado')}</strong>
      {detalle && <span> · {detalle}</span>}
    </p>
  )
}
