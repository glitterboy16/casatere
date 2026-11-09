# Grabador

Convierte grabados antiguos de dominio público en ilustraciones web de un solo
color sobre fondo transparente. Es la herramienta con la que se hicieron los
grabados de la carta y del hero de Casa Tere.

```bash
cd herramientas/grabados
npm install
node buscar.mjs "octopus engraving" --min 1500     # buscar en Wikimedia Commons
node grabar.mjs casa-tere.json                     # procesar todas las piezas
node grabar.mjs casa-tere.json --solo pulpo        # solo algunas
node grabar.mjs casa-tere.json --solo pulpo --detalle  # y dónde cae el recorte
node libro.mjs GoufPa                              # grabados dentro de un libro de archive.org
node marco.mjs molduras/moldura-olas.webp --ancho 1200 --alto 900 --grosor 50 --salida marco.webp
```

Cada pieza deja un `.webp` listo para la web, una previa sobre el color de
fondo en `previas/` y una fila en `CREDITOS.md`.

---

## Cómo se consigue que queden así de bien

La calidad no sale de dibujar, sale de **elegir bien y procesar con cuidado**.
Un grabador del siglo XIX ya resolvió el dibujo con miles de horas de buril;
el trabajo consiste en no estropearlo.

### 1. La referencia manda

La carta impresa de Casa Tere ya usaba grabados (un pez, carne a la brasa,
helados). Las cartas clásicas de marisquería beben de las láminas científicas
del XIX: trazo de buril, sujeto aislado, mucho aire alrededor. Ese es el
lenguaje; se busca material que ya hable así.

### 2. Fuente: dominio público con licencia verificable

Wikimedia Commons tiene escaneos de láminas de enciclopedias y tratados cuyos
derechos ya expiraron. Las colecciones que mejor funcionan son estas:

- **Vilmorin-Andrieux, *Les plantes potagères* (1883 y 1904)**: verduras, setas y frutas.
- **FMIB (Freshwater and Marine Image Bank)**: peces y mariscos.
- **Popular Science Monthly**: animales con un buril muy limpio.
- **Rijksmuseum**: aguafuertes en CC0 a muy alta resolución.
- **Brehms Tierleben** y **Meyers Konversations-Lexikon**: fauna en general.
- **Libros escaneados de archive.org** (dominio público): Carême, *Le Pâtissier royal
  parisien* (1828); Gouffé, *Le Livre de pâtisserie* (1873). Dentro de un libro de 500
  páginas, `libro.mjs` encuentra solo las que llevan grabado y hace hojas de contacto.

Se comprueba siempre la licencia en la ficha, que debe ser *Public domain* o
*CC0*, y se anota obra, autor y fecha. `buscar.mjs` lo hace por ti.

### 3. Criterio de selección

- **Tinta negra sobre papel**: litografías a color no. Sus manchas de color se
  vuelven manchas blancas y se pierde el dibujo.
- **Sujeto aislado**, sin paisaje ni fondo rayado detrás.
- **Trazo de buril**, no mancha: al invertirlo, las líneas son la luz.
- **Resolución**: al menos el doble del tamaño al que se va a mostrar.
- **Sin texto**: los pies de lámina se recortan.
- **Sobre fondo oscuro, grabado de línea**: los grabados tonales (mucha sombra, como las
  maderas de Gouffé) se invierten mal y salen en negativo. Sobre papel quedan perfectos.
- **Nunca la misma lámina en dos sitios** de la web: cada sección lleva su grabado.

### 4. El procesado

1. Se pasa a escala de grises sobre papel blanco.
2. Se aplica un **recorte manual** opcional para quitar pies de lámina, márgenes y sombras del lomo.
3. Se hace un **recorte automático** al dibujo, ignorando motas sueltas, con un 3 % de aire.
4. Se escala a la medida final con Lanczos. Por defecto **no se amplía**; si la fuente se
   queda corta (`ampliar`), es mejor ampliarla aquí con Lanczos que dejar que el navegador
   la estire. Después, un **enfoque suave** (`nitidez`, sigma 0,5) devuelve el filo del buril
   que la reducción redondea.
5. Se calcula la tinta. Se mide el papel en el percentil 97 y el negro en el
   percentil 2. El alfa de cada píxel es cuánto más oscuro es que el papel.
   Así el papel desaparece aunque esté amarillento y las líneas conservan sus
   grises.
6. La **limpieza** borra el velo y la suciedad del papel por debajo de un
   umbral. El **peso** es una curva de gamma: por debajo de 1 engorda el trazo
   para que aguante a tamaño pequeño o sobre fondo oscuro.
7. Todo se pinta de **un solo color de marca** y se exporta a WebP. Toda la
   información va en el alfa: con `alfa: 100` el alfa va **sin pérdida** y las
   líneas finas salen limpias (con alfa 72 el compresor las emborrona); la
   `calidad` solo afecta al color, que es plano. Con `variantes` se sacan copias
   más pequeñas para móvil (`srcset`).
8. Se revisa la **previa** sobre el fondo real antes de publicar.

Para escaneos difíciles hay tres ayudas más:

- **Aplanado del papel** (`aplanar`): iguala sombras del lomo, manchas y luz de lado antes
  de calcular la tinta.
- **Zonas** (`zonas`): rectángulos con limpieza propia. Con limpieza 1 se borran firmas,
  números de lámina o pliegues; con `clonar` se rellenan con la textura de encima.
- **Viñeta** (`vineta`): para grabados con escena (Bewick), funde los bordes en una elipse.
- **Motas** (`motas`): el enfoque hace más visible el polvo del papel viejo. Borra manchas
  pequeñas y redondas que no tienen ningún trazo cerca, también si van en grupitos, y respeta
  los sombreados (si alrededor hay mucha tinta, no toca nada) y las rayas cortas del agua.
- **Rumbos** (`rumbos`): las vistas de costa de las cartas náuticas llevan rectas punteadas
  de rumbo. La transformada de Hough las encuentra, las borra copiando el mar de al lado y
  repite hasta que no quedan. Así salió limpia la vista de Lanzarote del siglo XVIII.

### Marcos

`marco.mjs` monta un marco como un enmarcador: toma una moldura grabada (una tira ya
procesada), detecta cada cuánto se repite el motivo para que no queden costuras, la repite
a lo largo de cada lado y corta las esquinas a inglete. El marco del carrusel de Casa Tere
es la moldura de olas de *Ornements pour moulures et cadres* (Boucher fils, s. XVIII).

### 5. La integración en la web

- Son decorativas: `alt=""` y `aria-hidden`. La carta y el hero se leen igual sin ellas.
- En la carta, cada capítulo abre con su grabado como un frontispicio. En
  escritorio va en la columna fija y en móvil, centrado sobre el título.
- En el hero, el pulpo y la langosta se pintan **debajo** del mar animado. Las
  líneas del mar pasan por encima y los sumergen. Se funden hacia el fondo con
  `mask-image` y flotan muy despacio. El toro, la brasa, vigila desde arriba.
- Se cargan en diferido en la carta. El pulpo del hero va con `srcset` (1000 px en móvil, 1800 en escritorio) y `fetchpriority="high"`; los grabados de abajo que van como máscara CSS esperan a que la sección se acerque (`useCerca`).

### Parámetros por pieza (`casa-tere.json`)

| Campo | Qué hace | Valor típico |
|---|---|---|
| `fuente` | URL del original (se guarda en `cache/`) o ruta local | — |
| `recorte` | `[x0, y0, x1, y1]` en fracciones del original | `[0, 0, 1, 1]` |
| `max` | Lado mayor en píxeles: el doble de lo que se muestra | 720–1000 |
| `peso` | Gamma del trazo: < 1 engorda, > 1 adelgaza | 0,72–0,9 |
| `limpieza` | Umbral bajo el que el alfa es 0 | 0,08–0,2 |
| `tinta` | Color de la tinta | `#ffffff` |
| `calidad` | Calidad WebP | 72 |
| `aplanar` | Iguala el papel; número = tamaño del bloque (fracción) | `true` / 0,02 |
| `zonas` | `[{ rect: [x0,y0,x1,y1], limpieza, clonar }]` en fracciones del recorte; `clonar`: `true` (de arriba), `"derecha"` o `"izquierda"` | — |
| `trazos` | Borra rectas finas: `[{ de: [x,y], a: [x,y], ancho }]` | — |
| `rumbos` | Borra rectas solas (Hough): `[{ region, angulos: [min,max], ancho, max, umbral }]` | — |
| `vineta` | Fracción del borde que se funde en elipse | 0,3 |
| `motas` | Borra polvo: `{ region, area, radio, densidad }` | `{ area: 60, radio: 4 }` |
| `nitidez` | Sigma del enfoque tras reducir (0 = nada) | 0,5 |
| `alfa` | Calidad del alfa WebP (100 = sin pérdida) | 100 |
| `ampliar` | Permite ampliar si la fuente no llega a `max` | `true` |
| `variantes` | Anchos extra para `srcset` | `[1000]` |
| `girar` | Grados (horario) para orientar la lámina ya hecha | 180 |
| `modo` | `"positivo"`: experimental, para grabados tonales | — |
| `credito` | Obra, autor, fecha, licencia y ficha | obligatorio |

---

## El prompt para convertirlo en un programa

Pégalo tal cual en Claude Code u otro agente de programación para construir la
herramienta como aplicación independiente:

```text
Construye «Grabador», una herramienta para diseñadores web que convierte
grabados antiguos de dominio público en ilustraciones de un solo color sobre
fondo transparente, listas para usar en webs y cartas de restaurante.

CONTEXTO
Las láminas científicas y botánicas de los siglos XVIII-XIX (Wikimedia Commons,
Biodiversity Heritage Library, Rijksmuseum) son ilustración de altísima calidad
sin derechos. El problema es que vienen como tinta negra sobre papel amarillento,
con manchas, pies de lámina y sombras del lomo. La herramienta debe dejarlas
como tinta de un color de marca sobre transparente, sin perder el trazo de buril.

STACK
Node 20+, TypeScript, sharp para el procesado y una interfaz web local con
Vite + React. La CLI y la interfaz comparten el mismo núcleo de procesado.

FUNCIONES
1. Buscar
   - Consulta la API de Wikimedia Commons (generator=search, namespace 6 y
     categorías) con un User-Agent con contacto, como exige su política.
   - Filtra por licencia (Public domain, CC0) y por tamaño mínimo.
   - Muestra miniaturas, tamaño, licencia, autor, fecha y enlace a la ficha.
   - Permite marcar favoritas y descargarlas a una caché local por hash de URL.
2. Procesar (núcleo, función pura con parámetros)
   - Escala de grises sobre blanco (flatten).
   - Recorte manual opcional en fracciones [x0,y0,x1,y1].
   - Recorte automático al dibujo: analiza a ~1200 px, umbral = papel −
     35 % del rango, histogramas de filas y columnas, descarta el 0,15 % de
     tinta más extremo por lado para ignorar motas; añade un 3 % de aire.
   - Escalado Lanczos a un lado máximo, sin ampliar nunca.
   - Alfa = clamp((papel − v) / (papel − negro)), con papel = percentil 97 y
     negro = percentil 2 de la imagen ya escalada.
   - Limpieza: alfa < umbral → 0. Peso: alfa^gamma (gamma < 1 engorda el trazo).
   - Tinta de un color hexadecimal; exporta WebP (calidad configurable, 72 por
     defecto) y PNG opcional, a 1x y 2x.
   - Previa compuesta sobre el color de fondo elegido, usando el WebP exportado.
3. Editor visual
   - Vista previa en vivo sobre el fondo de marca, con deslizadores para peso,
     limpieza, umbral de recorte y calidad, y medidor del peso del archivo.
   - Recorte manual arrastrando un rectángulo sobre el original.
   - Botón «ver a tamaño real» a 1x y 2x, y comparación antes/después.
   - Aviso si la fuente no da para el tamaño pedido.
4. Lotes
   - Un JSON de proyecto con piezas {nombre, fuente, recorte, max, peso,
     limpieza, tinta, calidad, salida, credito}. La CLI lo procesa entero o
     con --solo.
5. Créditos
   - Genera CREDITOS.md y creditos.json con obra, autor, fecha, licencia y
     ficha de cada pieza. Avisa y no exporta si una pieza no tiene licencia
     libre verificada.
6. Integración
   - Exporta, opcionalmente, un componente React <Grabado nombre="pulpo" />
     con alt vacío, loading="lazy" y decoding="async", más un CSS de ejemplo:
     frontispicio de capítulo y figura «sumergida» con mask-image y animación
     de flotación que respete prefers-reduced-motion.

CALIDAD
- Tests del núcleo con imágenes sintéticas: papel amarillento, motas,
  sombra de lomo en un borde y un pie de lámina con texto.
- El procesado de una lámina de 4000 px tarda menos de 2 s.
- La interfaz es accesible por teclado; sin dependencias de pago.

ENTREGABLES
CLI (`grabador buscar`, `grabador procesar`), interfaz local
(`grabador ui`), README con el método y un proyecto de ejemplo con 3 láminas.
```
