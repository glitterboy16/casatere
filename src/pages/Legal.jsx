import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LEGAL, TITULAR } from '../data/legal'
import { useAdmin } from '../admin/AdminContext'
import { useTitulo } from '../lib/titulo'

function useLegal() {
  const { i18n } = useTranslation()
  return LEGAL[(i18n.language || 'es').slice(0, 2)] || LEGAL.es
}

function Block({ b }) {
  const [kind, a, c] = b
  if (kind === 'h') return <h2>{a}</h2>
  if (kind === 'p') return <p>{a}</p>
  if (kind === 'ul') return <ul>{a.map((x, i) => <li key={i}>{x}</li>)}</ul>
  if (kind === 'table') {
    return (
      <div className="legal-tabla">
        <table>
          <thead><tr>{a.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
          <tbody>{c.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
  }
  return null
}

function LegalLayout({ L, titulo, children }) {
  const { t } = useTranslation()
  useTitulo(titulo)
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <>
      <header className="page-head oscuro">
        <div className="wrap">
          <span className="eyebrow">{L.eyebrow}</span>
          <h1>{titulo}</h1>
        </div>
      </header>
      <article className="legal">
        {children}
        <p className="legal-fecha">{L.updated}</p>
        <p className="legal-nav">
          <Link to="/aviso-legal">{t('footer.aviso')}</Link> · <Link to="/privacidad">{t('footer.privacidad')}</Link> · <Link to="/cookies">{t('footer.cookies')}</Link>
        </p>
      </article>
    </>
  )
}

export function AvisoLegal() {
  const L = useLegal()
  const { contacto } = useAdmin()
  const d = L.aviso
  return (
    <LegalLayout L={L} titulo={d.title}>
      <p>{d.intro}</p>
      <h2>{d.idHead}</h2>
      <ul>
        <li><strong>{L.labels.titular}:</strong> {TITULAR.razon}</li>
        <li><strong>{L.labels.comercial}:</strong> {TITULAR.comercial}</li>
        <li><strong>{L.labels.nif}:</strong> {TITULAR.nif}</li>
        <li><strong>{L.labels.domicilio}:</strong> {TITULAR.domicilio}</li>
        <li><strong>{L.labels.telefono}:</strong> {contacto.telefono}</li>
        <li><strong>{L.labels.email}:</strong> {TITULAR.email}</li>
        <li><strong>{L.labels.web}:</strong> {TITULAR.web}</li>
        <li><strong>{L.labels.actividad}:</strong> {L.labels.actividadVal}</li>
      </ul>
      {d.blocks.map((b, i) => <Block key={i} b={b} />)}
    </LegalLayout>
  )
}

export function Privacidad() {
  const L = useLegal()
  const { contacto } = useAdmin()
  const d = L.privacidad
  return (
    <LegalLayout L={L} titulo={d.title}>
      <p>{d.intro}</p>
      <h2>{d.respHead}</h2>
      <ul>
        <li><strong>{L.labels.responsable}:</strong> {TITULAR.razon}</li>
        <li><strong>{L.labels.nif}:</strong> {TITULAR.nif}</li>
        <li><strong>{L.labels.domicilio}:</strong> {TITULAR.domicilio}</li>
        <li><strong>{L.labels.contacto}:</strong> {TITULAR.email} · {contacto.telefono}</li>
      </ul>
      {d.blocks.map((b, i) => <Block key={i} b={b} />)}
    </LegalLayout>
  )
}

export function PoliticaCookies() {
  const L = useLegal()
  const d = L.cookies
  return (
    <LegalLayout L={L} titulo={d.title}>
      <p>{d.intro}</p>
      {d.blocks.map((b, i) => <Block key={i} b={b} />)}
    </LegalLayout>
  )
}
