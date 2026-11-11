import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { es, en, de, fr, it } from './traducciones'

export const IDIOMAS = ['es', 'en', 'de', 'fr', 'it']
const STORAGE_KEY = 'casa-tere-lang'

function idiomaInicial() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (IDIOMAS.includes(guardado)) return guardado
  } catch { /* almacenamiento bloqueado: se usa el del navegador */ }
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase()
  if (IDIOMAS.includes(nav)) return nav
  // Quien no hable ninguno de los cinco (holandeses, polacos, suecos: en
  // Lanzarote son muchos) entiende antes el inglés que el español.
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    de: { translation: de },
    fr: { translation: fr },
    it: { translation: it },
  },
  lng: idiomaInicial(),
  fallbackLng: 'es',
  supportedLngs: IDIOMAS,
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem(STORAGE_KEY, lng) } catch { /* sin almacenamiento */ }
  document.documentElement.lang = lng
})
document.documentElement.lang = i18n.language

export default i18n
