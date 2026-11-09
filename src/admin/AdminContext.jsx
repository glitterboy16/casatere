import { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { carta as cartaBase, vinosBase } from '../data/carta'
import { CONTACTO, HORARIO_BASE } from '../data/casa'
import { galeriaBase } from '../data/galeria'

// ── Modo edición ─────────────────────────────────────────────────────────
// Todo el contenido editable vive en Supabase (tabla `site_content`, una
// fila JSON por sección) para que los cambios se vean al momento en
// cualquier navegador o dispositivo. El login usa Supabase Auth.
// Secciones: carta · vinos · galeria · contacto · horario

const IDIOMAS_DESTINO = ['en', 'de', 'fr', 'it']
const BUCKET = 'galeria'
// Supabase Auth exige un email; Nacho escribe solo su usuario y aquí se
// completa a la dirección dada de alta en Supabase.
const DOMINIO_ADMIN = 'acceso.casatere.local'

// Traducción automática ES → resto (API gratuita MyMemory)
async function traducir(textoEs) {
  const uno = async (lang) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoEs)}&langpair=es|${lang}`
    const r = await fetch(url)
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const j = await r.json()
    const t = j?.responseData?.translatedText
    if (!t || j.responseStatus !== 200) throw new Error('sin traducción')
    return [lang, t]
  }
  const resultados = await Promise.allSettled(IDIOMAS_DESTINO.map(uno))
  return Object.fromEntries(resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value))
}

// Reduce una foto a máx. 1600px y la devuelve como JPEG listo para subir
const comprimir = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 1600
      const esc = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * esc)
      c.height = Math.round(img.height * esc)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      c.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sin blob'))), 'image/jpeg', 0.84)
    }
    img.onerror = reject
    img.src = url
  })

// Deriva el enlace tel: a partir del número que se muestra
function telAHref(telefono) {
  const limpio = String(telefono).replace(/[^\d+]/g, '')
  if (limpio.startsWith('+')) return `tel:${limpio}`
  if (limpio.startsWith('00')) return `tel:+${limpio.slice(2)}`
  if (limpio.length === 9) return `tel:+34${limpio}`
  return `tel:+${limpio}`
}

const cargarSeccion = async (key, fallback) => {
  if (!supabase) return fallback
  const { data, error } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle()
  if (error || !data) return fallback
  return data.value
}

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(false)
  const [cartaData, setCartaData] = useState(cartaBase)
  const [vinos, setVinos] = useState(vinosBase)
  const [galeria, setGaleria] = useState(galeriaBase)
  const [contacto, setContacto] = useState(CONTACTO)
  const [horario, setHorario] = useState(HORARIO_BASE)
  // Tras el login se ve la web normal; estos flags activan cada editor
  const [editandoCarta, setEditandoCarta] = useState(false)
  const [editandoGaleria, setEditandoGaleria] = useState(false)
  const [editandoVisita, setEditandoVisita] = useState(false)

  // Sesión de admin (persiste sola entre recargas vía Supabase Auth)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setAdmin(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setAdmin(!!session))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Carga inicial (si algo falla, se queda el contenido de fábrica)
  useEffect(() => {
    let vivo = true
    Promise.all([
      cargarSeccion('carta', cartaBase),
      cargarSeccion('vinos', vinosBase),
      cargarSeccion('galeria', galeriaBase),
      cargarSeccion('contacto', null),
      cargarSeccion('horario', HORARIO_BASE),
    ]).then(([c, v, g, ct, h]) => {
      if (!vivo) return
      setCartaData(c)
      setVinos(v)
      setGaleria(g)
      if (ct) setContacto((prev) => ({ ...prev, ...ct }))
      setHorario(h)
    })
    return () => { vivo = false }
  }, [])

  // Sincroniza en vivo cuando se guarda desde otro navegador o dispositivo
  useEffect(() => {
    if (!supabase) return
    const canal = supabase
      .channel('site_content-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, (payload) => {
        const fila = payload.new
        if (!fila) return
        if (fila.key === 'carta') setCartaData(fila.value)
        if (fila.key === 'vinos') setVinos(fila.value)
        if (fila.key === 'galeria') setGaleria(fila.value)
        if (fila.key === 'contacto') setContacto((prev) => ({ ...prev, ...fila.value }))
        if (fila.key === 'horario') setHorario(fila.value)
      })
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [])

  const login = async (usuario, clave) => {
    if (!supabase) {
      toast.error('Falta conectar Supabase para poder editar')
      return false
    }
    const email = usuario.includes('@') ? usuario : `${usuario}@${DOMINIO_ADMIN}`
    const { error } = await supabase.auth.signInWithPassword({ email, password: clave })
    if (error) return false
    toast('Bienvenido, Nacho', { icon: '🌊', id: 'bienvenida' })
    return true
  }

  const logout = async () => {
    await supabase?.auth.signOut()
    setEditandoCarta(false)
    setEditandoGaleria(false)
    setEditandoVisita(false)
    toast('Sesión cerrada. Hasta pronto, Nacho', { id: 'sesion' })
  }

  // Confirma los cambios (ya guardados al editar) y sale del modo edición
  const guardar = () => {
    setEditandoCarta(false)
    setEditandoGaleria(false)
    setEditandoVisita(false)
    toast.success('Cambios guardados', { id: 'guardar' })
  }

  const escribirSeccion = async (key, valor) => {
    if (!supabase) return false
    const { error } = await supabase
      .from('site_content')
      .upsert({ key, value: valor, updated_at: new Date().toISOString() })
    if (error) {
      toast.error('No se pudo guardar. Revisa tu conexión')
      return false
    }
    return true
  }

  // Aceptan valor directo o función (prev) => nuevo, para que las
  // actualizaciones asíncronas (traducciones) no pisen cambios recientes.
  const guardador = (key, setter) => (nuevo) =>
    setter((prev) => {
      const val = typeof nuevo === 'function' ? nuevo(prev) : nuevo
      escribirSeccion(key, val)
      return val
    })

  const guardarCarta = guardador('carta', setCartaData)
  const guardarVinos = guardador('vinos', setVinos)
  const guardarGaleria = guardador('galeria', setGaleria)
  const guardarHorario = guardador('horario', setHorario)

  const guardarContacto = (telefono) => {
    const tel = String(telefono).trim()
    const valor = { telefono: tel, telHref: telAHref(tel) }
    setContacto((prev) => ({ ...prev, ...valor }))
    escribirSeccion('contacto', valor)
  }

  // Sube una foto a Supabase Storage; devuelve {src, path}
  const subirFoto = async (file) => {
    if (!supabase) throw new Error('Supabase sin configurar')
    const blob = await comprimir(file)
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { src: data.publicUrl, path }
  }

  const borrarFoto = async (path) => {
    if (!path || !supabase) return
    await supabase.storage.from(BUCKET).remove([path])
  }

  // Guarda primero el español y luego completa el resto de idiomas.
  // `aplicar` recibe {es,en,de,fr,it} y guarda la sección ya montada.
  const campoTraducido = async (textoEs, aplicar) => {
    aplicar({ es: textoEs })
    try {
      const resto = await traducir(textoEs)
      if (Object.keys(resto).length) {
        aplicar({ es: textoEs, ...resto })
        toast.success('Traducciones actualizadas', { id: 'trad' })
      } else {
        toast('Traducción automática no disponible: se mostrará en español', { id: 'trad' })
      }
    } catch {
      toast('Traducción automática no disponible: se mostrará en español', { id: 'trad' })
    }
  }

  return (
    <AdminContext.Provider
      value={{
        admin, login, logout, guardar,
        cartaData, guardarCarta, vinos, guardarVinos, galeria, guardarGaleria,
        horario, guardarHorario,
        contacto, guardarContacto, campoTraducido, subirFoto, borrarFoto,
        editandoCarta, setEditandoCarta, editandoGaleria, setEditandoGaleria,
        editandoVisita, setEditandoVisita,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)

// Resuelve un campo multiidioma { es, en, ... } (o texto universal)
export const resolver = (lang) => (v) => (v && typeof v === 'object' ? v[lang] || v.es : v)
