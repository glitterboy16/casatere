// Datos de contacto, horario y pescado del día "de fábrica".
// Todo esto es editable por Nacho desde la web (modo edición) y se guarda en
// Supabase; lo de aquí solo se usa si Supabase no responde o está vacío.

export const CONTACTO = {
  telefono: '928 82 17 06',
  telHref: 'tel:+34928821706',
  instagram: 'https://www.instagram.com/casaterelz/',
  instagramUser: '@casaterelz',
  direccion: 'Paseo de Playa Honda',
  direccion2: '35509 Playa Honda · Lanzarote',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Restaurante+Casa+Tere+Playa+Honda+Lanzarote',
}

// Horario semanal: índice 0 = lunes … 6 = domingo.
// Cada día es una lista de tramos ['HH:MM', 'HH:MM']; lista vacía = cerrado.
// Horario confirmado por Angel el 2026-11-03: lunes cerrado, de martes a
// domingo de 11:00 a 23:30. Nacho lo cambia desde el modo edición.
const ABIERTO = [['11:00', '23:30']]
export const HORARIO_BASE = [[], ABIERTO, ABIERTO, ABIERTO, ABIERTO, ABIERTO, ABIERTO]

