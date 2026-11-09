import { useEffect, useRef, useState } from 'react'

// Activa las animaciones de entrada solo si el navegador puede hacerlas
if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-anim')
}

/**
 * Animación al hacer scroll: el elemento recibe la clase "in" al entrar
 * en pantalla. Uso: <div className="reveal" ref={useReveal()}>
 */
export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

/**
 * true en cuanto el elemento se acerca a la pantalla. Sirve para cargar tarde
 * los grabados pesados que van como máscara CSS (no admiten loading="lazy").
 * Uso: const [ref, cerca] = useCerca()
 */
export function useCerca(margen = '600px') {
  const ref = useRef(null)
  const [cerca, setCerca] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (cerca || !ref.current) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setCerca(true); io.disconnect() }
    }, { rootMargin: margen })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [cerca, margen])
  return [ref, cerca]
}

/** Las tres pinceladas de ola del logo: filete de sección de la marca. */
export function Olas({ className = '' }) {
  return (
    <svg className={`olas ${className}`.trim()} viewBox="0 0 120 22" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
      <path d="M2 9 C30 5, 60 4, 118 8" strokeWidth="1.2" />
      <path d="M14 14 C40 10, 70 11, 98 15" strokeWidth="1.6" />
      <path d="M34 19 C56 17, 74 17, 90 19" strokeWidth="1" />
    </svg>
  )
}

/** Cabecera de sección: eyebrow + título + olas (+ entradilla opcional). */
export function SectionHead({ eyebrow, title, children }) {
  const ref = useReveal()
  return (
    <div className="sec-head reveal" ref={ref}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <Olas />
      {children && <p>{children}</p>}
    </div>
  )
}

/* ---------- iconos de línea (trazo fino, como el logo) ---------- */
const svg = (children, className) => (props) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
)

export const IconoTel = svg(<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />)
export const IconoFlecha = svg(<path d="M4 12h16M14 6l6 6-6 6" />, 'flecha')
export const IconoPin = svg(<><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.4" /></>)
export const IconoReloj = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>)
export const IconoInstagram = svg(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></>)
export const IconoX = svg(<path d="M6 6l12 12M18 6L6 18" />)
export const IconoMas = svg(<path d="M12 5v14M5 12h14" />)
export const IconoPez = svg(<><path d="M3 12c3-4.5 7.5-6 12-4.5 2 .7 3.6 2.2 4.5 4.5-.9 2.3-2.5 3.8-4.5 4.5C10.5 18 6 16.5 3 12z" /><path d="M3 12l-1.5-3M3 12l-1.5 3" /><circle cx="15.5" cy="11" r=".8" fill="currentColor" /></>)
export const IconoLlama = svg(<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.3 3.6-7.6.4 1.6 1.2 2.6 2.2 3.2.2-3.1 1.6-5.6 3.9-7.4-.2 2.9.9 5 2.4 6.9 1.2 1.5 1.9 3.1 1.9 4.9 0 3.6-2.6 6.2-6.5 6.2zM12 21c-1.6 0-2.7-1.1-2.7-2.6 0-1.6 1.2-2.5 2.7-4.2 1.5 1.7 2.7 2.6 2.7 4.2 0 1.5-1.1 2.6-2.7 2.6z" />)

/** El sol del logo, posado en el horizonte: señala lo que recomienda la casa. */
export const IconoSol = svg(<><path d="M5.5 14a6.5 6.5 0 0 1 13 0" /><path d="M2.5 14h19" /><path d="M7.5 18.2c3-1.3 6-1.3 9 0" /></>)

/** Las dos gaviotas del logo, para cabeceras. Planean con la animación de la casa. */
export function Gaviotas({ className = '' }) {
  return (
    <svg className={`gaviotas ${className}`.trim()} viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
      <path className="h-gaviota" d="M8 30 C20 18, 32 20, 40 34 C48 22, 62 16, 78 22" strokeWidth="1.5" />
      <path className="h-gaviota dos" d="M70 50 C78 42, 86 43, 91 52 C97 44, 106 40, 116 44" strokeWidth="1.2" />
    </svg>
  )
}
