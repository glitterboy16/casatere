# Pendiente · Casa Tere

Lista de trabajo abierta. Sale de la auditoría UI/UX del 2026-11-11 (estética, accesibilidad
WCAG 2.2 AA, UX móvil y copy/i18n) más los hilos de despliegue que venían de antes.

Las referencias `archivo:línea` son del estado del repo en el commit que añade este archivo.
Lo marcado **(verificado)** se comprobó leyendo el código; el resto viene del informe y
conviene confirmarlo al abordarlo.

> **Estado.** Lo marcado `[x]` ya está arreglado y compila, pero **no se ha visto en un móvil
> real**: la pasada se hizo leyendo y midiendo el CSS, no renderizando. Lo primero que hay que
> hacer es abrir `/carta` en un teléfono y confirmar que se ve un plato sin hacer scroll.
>
> Dos cosas se dejaron a propósito sin tocar porque no son decisión técnica:
> el **banner de cookies** (quitarlo es lo correcto si no hay analítica, pero es una decisión
> de Nacho) y los **datos fiscales**, que hay que pedirle. Del banner solo se arregló que no se
> salga de la pantalla; sigue tapando los botones del hero y sigue pidiendo permiso para
> cookies que no existen.

---

## Bloqueado · hace falta un dato de Nacho

- [ ] **Datos fiscales reales** para `src/data/legal.js:8-12`: razón social, NIF y un email de
      contacto. Ahora mismo se publica `[Razón social pendiente]`, `[NIF pendiente]` y
      `[email pendiente]` en los cinco idiomas, y la política de privacidad remite a
      «escribiendo a [email pendiente]»: no hay vía de ejercicio de derechos RGPD. **(verificado)**
- [ ] **Dominio**: `legal.js:13` dice `casatere.es`. Confirmar que es el comprado y asignarlo,
      o quitar la línea.
- [ ] **Qué lleva la «Cazuela de la casa»** (`src/data/carta.js:76`) y si las «Berenjenas»
      (`:88`) van fritas o con miel. Hoy no se puede saber ni en español.
- [ ] **Teléfono definitivo** y si se mantiene el Instagram que hay en `src/data/casa.js`.

## P0 · antes de volver a desplegar

- [ ] **Páginas legales de DE/FR/IT salen en inglés.** `legal.js:138` es
      `{ es, en, de: en, fr: en, it: en }`. El pie en alemán promete «Impressum» y aterriza en
      inglés. Son ~40 cadenas cortas. **(verificado)**
- [ ] **Quitar el banner de cookies.** Pide consentimiento para cookies de medición que no
      existen (la propia política dice «solo almacenamiento técnico necesario»); solo hay
      `localStorage` de idioma y consentimiento, que no requiere banner. En móvil aparece a los
      0,9 s con ~250 px y tapa «Ver la carta» y «Reservar mesa». Mantener la página
      `/cookies` informativa. Si algún día entra analítica, volver a ponerlo con un botón y
      los dos al mismo nivel visual.
- [x] **La primera pantalla de `/carta` no enseña ni un plato.** Es la pantalla del QR. Entre
      cabecera (~450 px), barra de capítulos (74 px), padding y la ilustración de capítulo a
      257 px, el primer nombre cae a ~900 px. En `@media (max-width: 640px)`: bajar el padding
      de `.carta-head`, h1 a ~2.2rem, ocultar `.carta-lema` y el `<Mar>`, y la ilustración de
      capítulo a 72-96 px al lado del número.

## P1 · importan de verdad

- [x] **Bomba de relojería en el reveal.** `src/components/shared.jsx:26` usa `threshold: 0.12`,
      que se calcula sobre la altura de la sección. Cuando un capítulo pase de ~8 pantallas, no
      alcanzará nunca el 12 % visible, el observer no dispara y el `opacity: 0` se queda fijo:
      **el capítulo desaparece para siempre**. Nacho lo provocará solo añadiendo platos.
      Arreglo: `threshold: 0` con `rootMargin: '0px 0px -10% 0px'`. **(verificado)**
- [ ] **En `/carta` no hay teléfono ni abierto/cerrado.** El principio del proyecto es «a un
      toque» y es la página del QR. `.nav-cta` vive dentro del panel del burger; `<Estado>` solo
      se monta en la portada. Añadir un botón redondo de 44 px con `tel:` en `.nav`, fuera de
      `.nav-links` (sin `onClick={close}`, por el bug de iOS), y `<Estado>` compacto bajo el h1.
- [x] **Un holandés, sueco o polaco recibe la web en español.** `src/i18n/index.js:14`:
      `IDIOMAS.includes(nav) ? nav : 'es'`. En Lanzarote es mucha gente. Pasar el fallback a
      `'en'`. Una línea. **(verificado)**
- [x] **El sol se desbordó contra su propia regla.** `src/styles/components.css:342` declara por
      escrito que el sol señala «solo dos cosas: el número de capítulo y lo que recomienda la
      casa». Luego lo usa en los puntos de cada plato (`:213`), el contador de los chips (`:382`)
      y los iconos del pie (`:530`), y el glow de la cabecera de la carta está al 24 % (`:354`),
      más intenso que el del hero. **(verificado)**
- [x] **Anillo de foco invisible en el login público.** El modal se monta dentro de
      `<footer className="pie oscuro">` (`Footer.jsx:56`), hereda `--anillo: var(--sol)` y queda
      en **2,08:1** sobre espuma. Lo abre cualquiera que pulse «Nacho González». Arreglo:
      `.velo, .panel { --anillo: var(--marino); }` y `.admin-input:focus { outline-color: var(--anillo); }`.
      **(verificado)**
- [x] **Menú móvil: foco perdido y sin scroll.** `.burger` va después de `.nav-links` en el DOM
      (`Nav.jsx:96` vs `:144`), así que al tabular con el menú abierto el foco cae detrás del
      panel opaco. Y `.nav-links` no tiene `overflow-y`: a 320 px de ancho «Reservar» y el
      selector de idioma quedan fuera de alcance. Al cerrar no se devuelve el foco al burger.
      **(verificado)**
- [ ] **12 MB de despliegue por los pulpos.** `src/pages/Home.jsx:26` usa
      `import.meta.glob(..., { eager: true })`, así que los 12 archivos del hero (6,1 MB) van al
      build aunque cada visita vea uno solo, elegido al azar. Cada visita baja 270-794 KB de un
      grabado que se pinta al 32 % de opacidad, y los otros 11 ocupan el CDN sin que nadie los
      aproveche. Dejar 2-3 variantes, servir una de ~600 px en móvil y quitar el
      `fetchpriority="high"`. **(verificado)**
- [ ] **Las fuentes de Google contradicen el texto legal.** `legal.js:56` afirma «no se ceden
      datos a terceros», pero `index.html:16` manda la IP de cada visitante a Google Fonts en un
      `<link rel="stylesheet">` bloqueante. Es la reclamación típica alemana. Autoalojar los
      woff2 **variables** subconjunto latin con `preload`.
      Ojo: los cuatro `.ttf` de `src/assets/fonts/` **no sirven** — son instancias estáticas que
      usa solo `src/admin/exportarPdf.js:2-5` para el PDF, y perderían el eje óptico de Bodoni.
      **(verificado)**
- [x] **El dato más útil tarda 2,4 s en aparecer.** `components.css:96-102`: `.hero-pie`
      (abierto/cerrado) entra con `emerge 1.6s` y `.8s` de retraso. Bajar `emerge` a ~.7s y los
      retrasos a .1/.2/.3s, o eximir `.hero-pie`. **(verificado)**
- [x] **Ilustraciones de capítulo sin dimensiones.** `src/components/Ilustraciones.jsx:49` no
      pasa `width`/`height` ni `aspect-ratio`: cada carga empuja los platos que se están leyendo
      y rompe el salto a `/carta#pescados`. Pesan 157-400 KB para una línea a un color.
      **(verificado)**
- [ ] **Movimiento automático sin control de pausa** (2.2.2). Mar en canvas, `respira`, `flota`,
      `latido`, `planea` y el carrusel cada 6,5 s, todos infinitos. `prefers-reduced-motion` está
      bien cubierto, pero WCAG pide un mecanismo explícito en la página. Un botón «Pausar
      movimiento» con `aria-pressed` que ponga `html.quieto` y
      `.quieto *, .quieto *::before, .quieto *::after { animation-play-state: paused !important }`.
- [x] **Desnudar el hero.** Acumula `filter: drop-shadow` en el logo (`:90`), `respira 9s` en el
      sol (`:82-84`), `flota 12s` en el pulpo (`:134-136`) y dos gradientes con hex sueltos fuera
      del sistema de tokens (`:74-75`). Que el mar sea el único movimiento. **(verificado)**
- [ ] **La traducción automática no tiene glosario.** `src/admin/AdminContext.jsx:212-225` manda
      lo que escriba Nacho a MyMemory sin revisión. Hoy la carta no tiene nombres canarios, pero
      en cuanto escriba «Vieja a la espalda» o «Cherne con mojo» saldrán literales en cuatro
      idiomas. Añadir un glosario de paso directo en `traducir()`: vieja, cherne, sama,
      bocinegro, cazón, mojo, gofio, papas arrugadas, «a la espalda», «a la brasa», «al horno»,
      «a la plancha». Y decir la verdad en el aviso al editor (`Carta.jsx:389`).

## P2 · incumplimientos y fallos serios

- [x] **Estado activo sin contraste** (1.4.11). `.chips button.on`: borde 1,74:1 y fondo 1,26:1;
      texto activo vs inactivo 1,78:1. `.cocina-indice button.on::after`: 1,32:1. Al sol no se
      sabe en qué capítulo estás (el lector de pantalla sí, hay `aria-current`). Arreglo:
      `.chips button.on { background: var(--espuma); color: var(--marino) }` y el subrayado del
      índice a `var(--marino)`.
- [ ] **Login sin trampa de foco.** `src/admin/LoginModal.jsx` tiene `role="dialog"`
      `aria-modal="true"` pero Tab sale a la página de detrás y al cerrar no devuelve el foco a
      «Nacho González». Pasar a `<dialog>` nativo con `showModal()`: trampa, Escape y fondo
      inerte gratis.
- [ ] **Foco y anclajes tapados por la barra pegajosa en `/carta`** (2.4.11).
      `scroll-padding-top` global son 88 px, pero `.carta-barra` añade 64 px (hasta 124 px en
      ≤640 px con las pestañas de Bodega). Meter la altura real en `--barra-h` y usarla en
      `scroll-padding-top` y en `.menu-cat`.
- [x] **Enlaces por debajo de 24 px en táctil** (2.5.8). `.pie-datos a` (dirección, teléfono,
      Instagram) y `.hero-lugar` miden 23,8 px: el bloque `@media (pointer: coarse)` los olvidó.
      Es el teléfono del restaurante pulsado con el pulgar.
- [x] **Nav principal sin `aria-current` ni nombre de landmark.** Tres `<nav>` y solo dos tienen
      nombre. Añadir `aria-label` y `aria-current="page"` / `"location"`.
- [x] **Selector de idioma: foco perdido al elegir, no cierra con Escape ni al salir con Tab**,
      y `aria-expanded` se queda desincronizado. Además el `aria-label` tapa el texto visible, así
      que el lector no dice el idioma actual.
- [x] **Sin enlace de salto al contenido** (2.4.1). No es incumplimiento estricto (hay
      landmarks), pero en `/carta` un usuario de teclado vidente pasa ~15 paradas antes del
      primer plato.
- [x] **Reveal por plato escalonado en móvil.** `components.css:444-448`: hasta 1,2 s por
      capítulo. La exención `pointer: coarse` de `global.css:143` cubre `.reveal` pero no
      `.plato`.
- [x] **Alérgenos a 13 px con `opacity: .82`.** 55 de los 67 platos la llevan y es información
      legalmente relevante; al sol es lo primero que desaparece. A `.9rem` y `opacity: 1`.
- [ ] **La carta es la pantalla oscura, y es la que se lee en la terraza.** La portada es clara y
      `/carta` es `.oscuro`: al sol una pantalla oscura hace de espejo. Valorar variante «papel»
      para la lista de platos en móvil, manteniendo el marino en cabecera y barra.
- [ ] **Supabase: 5 peticiones + websocket por visita.** `AdminContext.jsx:93-128` espera al
      `select` más lento antes de aplicar nada y abre el canal realtime para todos los
      visitantes; si lo publicado difiere de `cartaBase`, la carta salta a mitad de lectura. Una
      sola consulta `.in('key', [...])` y realtime solo cuando `admin`.
- [x] **`scrollTo(0,0)` animado al entrar en `/carta`** (`Carta.jsx:215`) con
      `scroll-behavior: smooth` global. Pasar a `behavior: 'instant'`.
- [x] **El PDF lleva el teléfono «de fábrica».** `exportarPdf.js:8,70` usa `CONTACTO` de
      `casa.js` y `Carta.jsx:254` no le pasa el contacto editado: si Nacho cambia el teléfono, el
      PDF de las mesas sigue con el viejo.
- [ ] **Escala tipográfica con tamaños casi iguales.** Seis tamaños en 2,5 px por abajo
      (`.7`/`.72`/`.78`/`.8`/`.82`/`.875`) y otros seis en 4 px por arriba
      (`1`/`1.02`/`1.05`/`1.15`/`1.2`/`1.25`). Colapsar a tokens.
- [ ] **`opsz` de Bodoni heredado en todo el display intermedio.** `body` fija `opsz 14` y solo
      `h1,h2,h3` suben a 30: `.hero-lema`, `.visita-tel` (2,6 rem), `.menu-cat-num`,
      `.plato-nombre` se renderizan con el corte de texto y parecen otra fuente.
- [ ] **Cookies, menú de idioma y panel son tarjetas de kit UI.** `border-radius: 14-16px` con
      sombras de 24-80 px en una web plana de filetes de 1 px. Son el único sitio donde aparece
      el «card con sombra» genérico.
- [ ] **Visita: cabecera centrada + tres tarjetas en fila.** El momento más genérico de la
      portada. Convertirlo en composición editorial: teléfono grande en Bodoni, horario y
      dirección como texto corrido, y que solo el bloque de reservas sea tarjeta.
- [ ] **Cuatro secciones seguidas sobre el mismo `--sal` con el mismo padding**
      (`.cocina`, `.casa`, `.galeria`, `.visita`), y la tarjeta marina de reservas acaba pegada al
      pie `--abismo`: bloque oscuro sobre bloque oscuro.
- [ ] **El carrusel de la portada rota mientras lees.** Ocupa ~800 px en móvil y cambia cada
      6,5 s: los cuatro nombres de plato desaparecen a medio leer. Está muy bien hecho (pausa con
      hover, foco, fuera de pantalla y pestaña oculta), pero en móvil debería arrancar pausado.
- [ ] **Falsos amigos en la carta.** `carta.js:208,216` «Solomillo» → *sirloin* (es lomo bajo;
      debe ser *fillet*/*tenderloin*). `:150,154` «Calamares saharianos» → *Saharan squid* /
      *Sahara-Tintenfisch* (y en alemán el calamar es *Kalmar*, no *Tintenfisch*).
      `:146` «Cazón» → *Hundshai* («tiburón perro»): repelente para un alemán.
- [ ] **«IGIC» sin explicar** en los cuatro idiomas extranjeros (`traducciones.js:187,288,389,490`).
      Lo que el turista quiere saber es si el impuesto está dentro.
- [ ] **«abre martes a las 11:00»**: `Estado.jsx:24` aplica `toLowerCase()` a todos los idiomas y
      falta el artículo. En inglés y alemán los días van en mayúscula; en alemán falta «am».
      Clave aparte `estado.abreDia`.
- [ ] **El texto legal afirma cosas que el código contradice** (`legal.js:30`: menciona una
      sección de pescado del día que no existe).

## P3 · pulido

- [ ] Radios sin escala: 6/8/9/14/16/999. Para una estética de lámina, casi recto (`--r: 3px`).
- [ ] `--abierto: #5fd4a0` es el único color fuera de paleta y a 8 px roza el turquesa de
      chiringuito, que es anti-referencia explícita. Y `latido` anima `box-shadow`.
- [x] Se animan propiedades de layout: `transition: height` en `.nav` (`:8`, la altura nunca
      cambia) y `top` en `.burger span` (`:43`).
- [ ] Fade-up universal de 28 px / 0,9 s en todas las secciones (`global.css:141`). A 10 px y
      .55s, o solo opacidad: las láminas ya tienen su entrada de imprenta, que es la buena.
- [ ] Eyebrow en todas las secciones; «Playa Honda» sobre «Galería» y «Te esperamos» sobre
      «Ven a vernos» no añaden nada.
- [ ] Chips de la carta como `<button>` en vez de `<a href="#id">`: funcionarían sin JS y saldrían
      en la lista de enlaces del lector.
- [x] `scrollTo smooth` sin comprobar `prefers-reduced-motion` en `Nav.jsx:91` (Home y Carta sí
      lo comprueban).
- [ ] Fila de cabecera `aria-hidden` dentro de la `<ul>` de platos: el lector cuenta un elemento
      de más.
- [ ] Botón «Nacho González» sin propósito en su nombre accesible; y el modal de acceso está solo
      en español y sin botón de cerrar visible.
- [ ] Título de pestaña y meta description solo en español en la portada: `Home.jsx` no llama a
      `useTitulo`.
- [ ] `--t-xs` = 11,5 px en menú y botones, `.7rem` en pies de foto: para mayores al sol, ≥.8rem.
- [x] `og:image` apunta al favicon y con URL relativa (`index.html:10`): al compartir por WhatsApp
      sale un icono diminuto. Hacer una imagen de 1200×630 y URL absoluta. Falta `og:url`,
      `og:type` y `twitter:card`. **(verificado)**
- [x] Sin JSON-LD de `Restaurant` (horario, dirección, teléfono, carta): es el dato que más ayuda
      a un restaurante local en búsquedas. **(verificado)**
- [ ] Logo PNG de 68 KB en tres sitios: pasar a SVG o WebP.
- [ ] Líneas de cuerpo a ~85 ch en las páginas legales (`components.css:512`): `min(66ch, ...)`.
- [ ] Voz en español: «A pie de playa» aparece en el lema del hero, el eyebrow de La casa y el
      lema de la carta. «Nuestra cocina» sobre «Nuestros pescados / Nuestras carnes»: doble
      posesivo. «Te esperamos» + «Ven a vernos»: dos invitaciones seguidas.
- [ ] «Reservar mesa» es en realidad una llamada: en escritorio un `tel:` no hace nada. Microcopy
      honesto («Llamar para reservar») o mostrar el número al lado.
- [ ] Alemán: nav «Besuch» → «Kontakt»; columna «Halbe» → «½ Portion»; «Küche/Weinkarte» →
      «Speisen/Weine». Francés: «cookies propres» → «nos propres cookies»; «Flan» →
      «Flan (crème caramel)». Italiano: `footer.legal` y `footer.aviso` son ambos «Note legali».
      Inglés: tres nombres para lo mismo (The food / Our kitchen / Kitchen) y «grilled» aplana
      plancha y brasa, cuando la marca vende brasa.
- [ ] El pulpo preside hero y capítulo de pescados. No es la misma lámina (cumple la regla), pero
      en una casa de pescado y brasa el capítulo podría llevar un pez de línea.
- [ ] `alt` genérico en la galería: toda foto sin etiqueta lee «Casa Tere». Mejor `alt=""` o
      exigir título en el modo edición.
- [ ] Chips con `scrollbar-width: none` y degradado solo a la derecha: con ratón sin scroll
      horizontal no hay forma de ver los capítulos que no caben.

---

## Despliegue e infraestructura

Viene de antes de la auditoría.

- [ ] **Transferir los proyectos de Vercel** (`casatere` y `el-bocadito`) de la cuenta del
      instituto a la personal. Ruta elegida: transferencia oficial
      (`POST /projects/{id}/transfer-request` → claim URL), no recrear. Los IDs de proyecto y de
      equipo no se anotan aquí porque el repo es público.
- [ ] **Mover los dominios aparte**: los comprados *en* Vercel no viajan con el proyecto
      (`vercel domains move <dominio> villorinaangelandres-gmailcoms-projects`).
- [ ] Tras la transferencia: `vercel login` con la cuenta de gmail y `vercel link` en las dos
      carpetas (cambia el `orgId` de `.vercel/project.json`).
- [ ] **Crear el proyecto de Supabase** (nuevo, no el de El Bocadito), correr
      `supabase/schema.sql` y `supabase/seed.sql`, crear el usuario de Nacho
      `<usuario>@acceso.casatere.local`, y poner `VITE_SUPABASE_URL` /
      `VITE_SUPABASE_ANON_KEY` en Vercel.
- [ ] **Galería**: sigue vacía a propósito. Hacen falta fotos **horizontales**; las verticales de
      móvil no entran en el mosaico sin recortes que se comen la foto.
- [ ] Revisar las traducciones FR/IT de la carta real contra el menú físico.

---

## Lo que ya está bien y no hay que tocar

Para no «arreglarlo» por error en una pasada futura:

- Ni un `border-left` de color, ni gradient text, ni glass decorativo, ni modales gratuitos.
- **El contraste del texto pasa AA en el 100 % de las combinaciones.** La más justa es niebla
  sobre sal-honda (4,85:1). Los fallos de contraste están solo en indicadores de estado, bordes
  decorativos y dos anillos de foco.
- `lang` sincronizado con i18n, landmarks reales, `prefers-reduced-motion` tratado con cuidado en
  CSS, canvas y carrusel, 44 px en casi todo lo táctil.
- Los 14 alérgenos traducidos por nombre en los cinco idiomas con terminología del Reglamento
  1169/2011, y cobertura de claves perfecta: 95 de 95 por idioma, cero huecos.
- El QR apunta a `/carta` y no a la portada.
- `Mar.jsx`: el mar como talla de buril en canvas. Es lo más alejado de un generador que hay aquí.
- Los grabados de dominio público como máscara en tinta de marca, cada lámina usada una sola vez.
- El `tel:` del menú móvil evita a propósito el bug de iOS al no cerrar el panel en el toque.
- `jspdf`, `qrcode` y el PDF se cargan de forma perezosa.
