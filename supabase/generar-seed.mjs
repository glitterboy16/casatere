// Genera supabase/seed.sql con el contenido de fábrica de la web (carta,
// bodega, galería vacía y contacto) para cargarlo en una base nueva.
//   node supabase/generar-seed.mjs
// Es idempotente: no pisa lo que Nacho ya haya editado (on conflict do nothing).
// El horario es el confirmado (ver src/data/casa.js).
import { writeFileSync } from 'node:fs'
import { carta, vinosBase } from '../src/data/carta.js'
import { CONTACTO, HORARIO_BASE } from '../src/data/casa.js'
import { galeriaBase } from '../src/data/galeria.js'

const fila = (key, value) => `  ('${key}', $json$${JSON.stringify(value)}$json$::jsonb)`

const sql = `-- Casa Tere — contenido inicial de site_content.
-- Generado con: node supabase/generar-seed.mjs (no editar a mano)
-- Ejecutar DESPUÉS de schema.sql. No sobrescribe lo ya editado.

insert into site_content (key, value) values
${[
  fila('carta', carta),
  fila('vinos', vinosBase),
  fila('galeria', galeriaBase), // vacía: la sección no se ve hasta que Nacho suba fotos
  fila('contacto', { telefono: CONTACTO.telefono, telHref: CONTACTO.telHref }),
  ...(HORARIO_BASE ? [fila('horario', HORARIO_BASE)] : []),
].join(',\n')}
on conflict (key) do nothing;
`

writeFileSync(new URL('./seed.sql', import.meta.url), sql)
const platos = carta.reduce((n, c) => n + c.platos.length, 0)
console.log(`✓ supabase/seed.sql · carta: ${carta.length} capítulos, ${platos} platos · bodega: ${vinosBase.length} · galería: ${galeriaBase.length} fotos`)
