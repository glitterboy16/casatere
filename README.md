# Casa Tere

Web y **carta digital por QR** de **Casa Tere**, el restaurante de Nacho González en el
paseo de Playa Honda (Lanzarote). Pescado fresco y brasa a pie de playa.

- **Stack:** React + Vite · Supabase (contenido, fotos y acceso) · Vercel (hosting)
- Misma base funcional que El Bocadito, con diseño propio a partir del logo.

## Qué tiene

- **Nuestra cocina.** Un carrusel en la portada con un capítulo de la carta por
  diapositiva: su grabado, platos reales y el enlace a ese capítulo. Sale de los datos
  de la carta, así que cambia solo cuando Nacho la edita.
- **Abierto ahora / Cerrado.** Se calcula en directo con la hora de Canarias a partir
  del horario semanal, que sale de la ficha de Google y Nacho puede editar.
- **Carta editorial.** Capítulos numerados con índice fijo y un grabado por capítulo, precios
  de ración y media ración en columnas, alérgenos con nombre bajo cada plato y el sol del
  logo marcando lo que recomienda la casa. Pestaña de Bodega cuando hay vinos, exportación
  a PDF y generador de QR para las mesas.
- **Cinco idiomas.** Español, inglés, alemán, francés e italiano. Lo que Nacho escribe
  en español se traduce solo.
- **Modo edición sin código.** Se entra pulsando «Nacho González» en el pie de página.
  Desde ahí se editan carta, vinos, galería, horario y teléfono.
- **Galería.** Nacho sube las fotos desde el móvil; mientras esté vacía no se muestra.
- **Páginas legales y aviso de cookies.**

## Arrancar en local

```bash
npm install
npm run dev        # http://localhost:5173
```

Sin `.env` la web funciona con el contenido de ejemplo y el modo edición queda
desactivado. Para conectarla, crea un `.env` (no se versiona):

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Puesta en marcha de Supabase

1. Crear un proyecto nuevo en Supabase (no reutilizar el de El Bocadito).
2. Ejecutar `supabase/schema.sql` (tabla, permisos, tiempo real y bucket `galeria`) y después
   `supabase/seed.sql` (carta completa, bodega y galería vacías, teléfono). El seed se regenera
   desde los datos con `node supabase/generar-seed.mjs` y nunca pisa lo ya editado.
3. En Authentication, crear el usuario de Nacho con el email
   `<usuario>@acceso.casatere.local` y su contraseña. En la web solo escribirá `<usuario>`.

## Despliegue

Vercel, proyecto `casatere` (https://casatere.vercel.app). Se publica con `vercel deploy --prod`;
`.vercelignore` deja fuera `herramientas/`. Cuando exista la base de Supabase, añadir en Vercel
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` y volver a publicar.

## Pendiente antes de publicar

- [x] Carta real con precios y alérgenos (transcrita de la carta física; revisar con Nacho).
- [x] Horario: lunes cerrado, de martes a domingo de 11:00 a 23:30 (confirmado).
- [ ] Fotos para la galería.
- [ ] Datos fiscales del titular en `src/data/legal.js`.
- [ ] Dominio definitivo (en el aviso legal figura `casatere.es` como provisional).

## Estructura

```
src/
├── App.jsx / main.jsx       rutas: /, /carta, /aviso-legal, /privacidad, /cookies
├── pages/                   Home, Carta, Legal
├── components/              Nav, Footer, Mar (olas del hero), Estado, CookieBanner, shared
├── admin/                   AdminContext (Supabase), LoginModal, QrModal, exportarPdf
├── data/                    carta, casa (contacto, horario, pescado), galeria, legal
├── i18n/                    traducciones en 5 idiomas
├── lib/                     supabaseClient, horario, confirmar
└── styles/                  global.css (sistema de diseño) · components.css
```

## Diseño

- **Color:** el azul marino exacto del logo (`#021E50`), blanco espuma, arena clara y
  un único acento cálido, el sol del atardecer.
- **Tipografía:** Bodoni Moda para títulos y platos; Montserrat espaciada para etiquetas,
  como «RESTAURANTE» en el logo.
- **Firma visual:** las pinceladas de ola del logo se usan como separador de sección,
  y el hero tiene un mar animado con el mismo trazo.
- **Grabados:** la carta, el carrusel y el hero llevan grabados de dominio público (Carême,
  Vilmorin-Andrieux, Mock según Potter, Goode, Pollock, Popular Science Monthly, Rijksmuseum,
  y una vista de Lanzarote del s. XVIII de la BnF) pasados a
  tinta de la marca con la herramienta de `herramientas/grabados`. Ninguno se repite. Ahí
  están el método, los créditos y la configuración para regenerarlos.
- **El mar del hero:** grabado a buril en tiempo real: tallas que engordan con la luz de la
  ola y se aquietan detrás de los textos.
