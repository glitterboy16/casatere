// Grabados de dominio público procesados con herramientas/grabados (créditos
// completos en su CREDITOS.md). Ninguno se repite entre secciones:
//
// Capítulos de la carta (tinta blanca sobre el marino)
//   ensaladas · «Laitue impériale», Vilmorin-Andrieux (1904)
//   entrantes · «Champignon de couche», G. Laplante para Vilmorin-Andrieux (1904)
//   pescados  · «Octopus or devil fish», Popular Science Monthly vol. 14 (1878–1879)
//   carnes    · «Kop van een koe», firmado F.L.H., Rijksmuseum (CC0)
//   postres   · Le Pâtissier royal parisien, lám. 33, fig. 5, M.-A. Carême (1828)
//
// Carrusel de la portada (tinta marina sobre el papel)
//   pescados  · «Pagellus milneri», H. L. Todd para G. B. Goode (1884)
//   carnes    · «Stier», aguafuerte de Johannes Mock (1824) según Paulus Potter, Rijksmuseum (CC0)
//   marco     · moldura de olas, «Ornements pour moulures et cadres», Boucher fils (1772–1779), Rijksmuseum (CC0)
//   entrantes · «Ail blanc ou commun», Vilmorin-Andrieux (1904)
//
// El tipo se deduce del id o del título en español de cada categoría, así
// siguen funcionando si Nacho renombra o añade capítulos.
import ensaladas from '../assets/carta/ensaladas.webp'
import entrantes from '../assets/carta/entrantes.webp'
import pescados from '../assets/carta/pescados.webp'
import carnes from '../assets/carta/carnes.webp'
import postres from '../assets/carta/postres.webp'
import portadaPescados from '../assets/portada/portada-pescados.webp'
import portadaCarnes from '../assets/portada/portada-carnes.webp'
import portadaEntrantes from '../assets/portada/portada-entrantes.webp'

const TIPOS = [
  ['ensaladas', /ensalad|verdur|huerta/i],
  ['entrantes', /entrante|picar|tapa|racion/i],
  ['pescados', /pescad|marisc|\bmar\b/i],
  ['carnes', /carne|brasa|parrilla|grill/i],
  ['postres', /postre|dulce|helad/i],
]
const CARTA = { ensaladas, entrantes, pescados, carnes, postres }
const PORTADA = { pescados: portadaPescados, carnes: portadaCarnes, entrantes: portadaEntrantes }

export function tipoDe(cat) {
  const clave = `${cat.id ?? ''} ${typeof cat.titulo === 'object' ? cat.titulo?.es ?? '' : cat.titulo ?? ''}`
  return TIPOS.find(([, re]) => re.test(clave))?.[0] ?? null
}

export const ilustracionPortada = (tipo) => PORTADA[tipo] ?? null

// Decorativa: alt vacío para que los lectores de pantalla la salten
export function Ilustracion({ cat }) {
  const src = CARTA[tipoDe(cat)]
  if (!src) return null
  return <img className="menu-cat-ilus" src={src} alt="" loading="lazy" decoding="async" />
}
