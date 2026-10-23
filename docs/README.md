<div align="center">

# 📘✨ MANUAL OFICIAL · PARTE 1 ✨
## Cómo está construida Valen Fashion Manizales, desde cero y en cristiano

![Morado](https://img.shields.io/badge/Manual_Oficial-Parte_1-8B5CF6?style=for-the-badge)
![Dorado](https://img.shields.io/badge/Valen_Fashion-Manizales,_Colombia-D4AF37?style=for-the-badge)
![Rosa](https://img.shields.io/badge/Lenguaje-100%25_humano,_0%25_humotecnico-EC4899?style=for-the-badge)
![Negro](https://img.shields.io/badge/Versi%C3%B3n-1.0_·_Octubre_2026-1A1A2E?style=for-the-badge)

*Escrito con 💜, tinto ☕ y terquedad colombiana — casi todo desde un celular 📱.*
*Si no sabes nada de código, este manual es para ti. Si sabes, también: aquí está todo con nombres y apellidos.*

</div>

---

## 📖 CÓMO LEER ESTE MANUAL

◆ Está dividido en **PÁGINAS**, como un manual de papel: cada tema grande tiene su propia hoja con su número y su separador bonito. ───
◆ El lenguaje es **informal a propósito**: nada de palabras raras sin explicar. Cuando aparezca una, va con su traducción a humano al lado. 🧑🏫
◆ Todo lo que veas entre `comillas grises` es un **nombre real** del sistema: un archivo, una función, una llave, un nodo. Puedes buscarlo y ahí estará. 🔎
◆ Los recuadros de código son **pedacitos reales** del proyecto, recortados para que se puedan leer sin marearse.

---

## 📑 ÍNDICE MAESTRO

- **1.** 🧰 [La caja de herramientas: qué se usó y para qué](#-la-caja-de-herramientas)
- **2.** 🐣 [El nacimiento del proyecto, paso a paso](#-el-nacimiento-del-proyecto-paso-a-paso)
- **3.** 📁 [La familia de archivos y carpetas (con nombres propios)](#-la-familia-de-archivos-y-carpetas)
- **4.** 🦴 [HTML: el esqueleto de la criatura](#-html-el-esqueleto-de-la-criatura)
- **5.** 🎨 [CSS: el maquillaje y el vestuario](#-css-el-maquillaje-y-el-vestuario)
- **6.** 🧠 [JS: el sistema nervioso](#-js-el-sistema-nervioso)
- **7.** 🔥 [Firebase: el cuaderno y la caja fuerte](#-firebase-el-cuaderno-y-la-caja-fuerte)
- **8.** 🤵 [El mayordomo de Cloudflare: el Worker](#-el-mayordomo-de-cloudflare-el-worker)
- **9.** 🤖 [El robot despertador: keep-alive](#-el-robot-despertador-keep-alive)
- **10.** 💬 [La Coach IA de dos cerebros](#-la-coach-ia-de-dos-cerebros)
- **11.** 💜 [Identidad visual: los colores de la casa](#-identidad-visual-los-colores-de-la-casa)
- **12.** 📖 [Glosario en cristiano](#-glosario-en-cristiano)
- **13.** 🏅 [Reglas de oro y cicatrices aprendidas](#-reglas-de-oro-y-cicatrices-aprendidas)

---

<div align="center">

─── 📄 **PÁGINA 1** ───
# 🧰 LA CAJA DE HERRAMIENTAS
### Qué se usó, con qué analogía se entiende y qué papel juega aquí

</div>

### ◆ GitHub 🐙
**Qué es:** el guardián de todo el código. Una bodega en la nube donde vive cada archivo del proyecto, con historial de cambios (como un "deshacer" gigante).
**En este proyecto:** el repositorio se llama `Valen_fashion_manizales` y vive en la cuenta `andryus0312-collab`. Cada cambio que se guarda se llama **commit** (una foto del momento exacto en que todo quedaba bien).

### ◆ GitHub Pages 📦
**Qué es:** el servicio gratuito de GitHub que **publica** esos archivos como página web real.
**Analogía:** GitHub es la bodega; GitHub Pages es el local comercial abierto al público. 🏬
**En este proyecto:** sirve la vitrina completa y el panel de estadísticas.

### ◆ Firebase (Realtime Database + Auth) 🔥
**Qué es:** una base de datos en la nube de Google que guarda información y la actualiza **en tiempo real**, más un sistema de login.
**Analogía:** es el **cuaderno de la tienda** 📒 (anota visitas, productos, clics) y también el **candado de la puerta de atrás** 🔐 (solo la dueña entra al panel).
**En este proyecto:** la base se llama `valen-fashion-manizales-default-rtdb` y tiene 5 nodos (te los presento en la Página 7).

### ◆ Cloudflare Workers ☁️
**Qué es:** un pedacito de código que vive en los servidores de Cloudflare y actúa como **intermediario** entre la página y las IAs.
**Analogía:** el **mayordomo** 🤵: la página le pide el favor, él saca las llaves secretas de su bolsillo, habla con la IA en privado y trae la respuesta. Nunca muestra las llaves.
**En este proyecto:** el Worker se llama `broken-frog-3909` y su dirección es `https://broken-frog-3909.andryus0312.workers.dev`.

### ◆ GitHub Actions 🤖
**Qué es:** un empleado automático de GitHub que ejecuta tareas en horarios programados.
**En este proyecto:** el archivo `.github/workflows/keep-alive.yml` despierta al mayordomo cada **45 minutos** con un *ping* 🏓 para que nunca esté frío ni dormido.

### ◆ Groq ⚡
**Qué es:** un servicio de inteligencia artificial conocido por ser **rapidísimo**.
**En este proyecto:** es el **Motor 1** de la Coach. Usa modelos de la familia **Qwen** (detectados automáticamente; el respaldo fijo es `qwen/qwen3.8-27b`).

### ◆ Google AI Studio / Gemini 💎
**Qué es:** la fábrica de IAs de Google y su familia de modelos **Gemini Flash**.
**En este proyecto:** es el **Motor 2** de la Coach, el reflexivo. Sus llaves se crean en `aistudio.google.com/apikey`.

### ◆ Un celular 📱 y un navegador valiente
**Qué es:** sí, literal. Casi todo este proyecto se construyó y se mantiene **desde un teléfono**, editando en GitHub web y desplegando en Cloudflare.
**Moraleja:** si se pudo así, se puede como sea. 💪

---

<div align="center">

─── 📄 **PÁGINA 2** ───
# 🐣 EL NACIMIENTO DEL PROYECTO, PASO A PASO
### Cómo se arma esto desde cero, en el orden exacto en que se hizo

</div>

**Paso 1 · Crear la bodega 🐙**
Se crea la cuenta en GitHub y el repositorio `Valen_fashion_manizales`. Al inicio, solo una carpeta vacía con sueños dentro.

**Paso 2 · Abrir el local 📦**
En la configuración del repo se activa **GitHub Pages** (rama `main`). Desde ese momento, todo archivo que llegue a la raíz se vuelve página web pública.

**Paso 3 · Levantar la vitrina 🛍️**
Se escribe el `index.html`: portada con **tres modos de centrado de imagen** (para no recortar fotos a mano), foto de perfil con **anillo de color configurable** (sólido o degradado), botones de 💬 WhatsApp, 📸 Instagram, 🔳 código QR y 📤 compartir; modo 🌗 claro/oscuro; botón 🔠 de tamaño de letra; búsqueda 🔍 por **texto, rango de precios y rango de fechas**; y el botón ⭐ de Testimonios que despliega la **barra lateral izquierda** con fotos y mensajes de clientas reales (publicados con su autorización).

**Paso 4 · Conectar el cuaderno 🔥**
Se crea el proyecto en Firebase y se pega su configuración pública en el código. Se crean los nodos: `valen_products`, `valen_profile`, `valen_banner`, `valen_events` y `admin_access`. Se escriben las **Reglas**: catálogo legible por todos (es vitrina), estadísticas privadas, escritura bloqueada para el público (`.write: false` global con excepciones validadas).

**Paso 5 · La puerta de atrás 🔐**
Se crea el **enlace exclusivo de la dueña** (distinto al público). Solo abriendo la página por ese enlace se desbloquean los botones 🛠️ **Admin** (backend: ingresar y editar productos, portada, perfil, testimonios) y 📊 **Estadísticas** (números y gráficas en tiempo real).

**Paso 6 · El cuarto de los números 📊**
Nace la carpeta `stats/` con sus tres hijos: `stats.html`, `stats.css` y `stats.js`. El panel lee `valen_events` y pinta visitas, clics de WhatsApp, búsquedas, dispositivos y categorías top con gráficas en vivo.

**Paso 7 · Contratar al mayordomo ☁️**
En Cloudflare se crea el Worker `broken-frog-3909`. Se le ponen dos secretos en *Settings → Variables and Secrets*: `GROQ_API_KEY` y `GEMINI_API_KEY`. Desde entonces, **ninguna llave vive en el código público**.

**Paso 8 · Darle cerebro a la Coach 🧠**
En `stats.js` se conecta el chat del panel al mayordomo (nunca directo a las IAs). Nacen los dos motores: ⚡ Groq y 💎 Gemini, con su botoncito para cambiar de cerebro.

**Paso 9 · Blindar y automatizar 🛡️🔄**
Tras varias batallas (que se cuentan en la Página 13), el Worker queda con: CORS completo en todas sus respuestas, endpoint correcto `generateContent`, **auto-detección de modelos** con caché de 6 horas, doble respaldo fijo y timeout de 15 segundos por intento.

**Paso 10 · El robot despertador 🤖**
Se crea `.github/workflows/keep-alive.yml` con un *cron* `*/45 * * * *`: cada 45 minutos, un ping mantiene todo caliente.

**Paso 11 · Contarlo todo 📜**
Se escriben el `README.md` (la carta de presentación) y este manual (la biblia del proyecto). Porque lo que no se documenta, se olvida. 🧠

---

<div align="center">

─── 📄 **PÁGINA 3** ───
# 📁 LA FAMILIA DE ARCHIVOS Y CARPETAS
### Quién es quién, con nombre propio y oficio

</div>

```
Valen_fashion_manizales/
├──  index.html            → La vitrina pública (todo lo que ve la clienta)
├── 📄 README.md             → La carta de presentación del repo
├── 📁 .github/
│   └── 📁 workflows/
│       └──  keep-alive.yml      → El robot despertador (ping cada 45 min)
├──  docs/
│   └── 📄 MANUAL-PARTE-1.md       → Este manual 📘 (el que estás leyendo)
└── 📁 stats/
    ├── 📄 stats.html        → La puerta del panel (pide clave)
    ├── 📄 stats.css         → Toda la belleza visual y animaciones
    ├── 📄 stats.js          → El cerebro frontal: datos, chat, motores IA
    └── 📄 test-coach.html   → Salita de pruebas temporal (borrable sin dolor)
```

◆ **`index.html`** — La cara al público: productos, categorías (HOGAR 🏠, NIÑOS 🧸), testimonios, botones sociales y búsquedas.
◆ **`stats/stats.html`** — El marco del panel: aquí viven el contenedor `coach-engine-container`, el área de chat `coach-chat-area`, los botones `btn-groq` y `btn-gemini`, y el botón de enviar `btn-send-msg`.
◆ **`stats/stats.css`** — Colores de la casa, modo claro/oscuro, burbujas del chat, y las animaciones `animate-fade-in-up` y `thinking-bounce`.
◆ **`stats/stats.js`** — El que piensa: lee Firebase, arma el informe, cambia de motor con `switchEngine()` y habla con el mayordomo mediante `callGroq()` y `callGemini()`.
◆ **`.github/workflows/keep-alive.yml`** — El empleado que nunca duerme.
◆ **Fuera del repo, a propósito:** el código del Worker vive en el panel de Cloudflare, junto a sus secretos. 🤫

---

<div align="center">

─── 📄 **PÁGINA 4** ───
# 🦴 HTML: EL ESQUELETO DE LA CRIATURA
### Cómo se construyen las piezas y con qué nombres viven

</div>

El HTML es el **esqueleto**: define qué cosas existen en la página (botones, cajas, títulos). Cada pieza importante tiene un **id**, como una cédula, para que el JS la encuentre por su nombre.

### ◆ Piezas con nombre propio en el panel IA
| Id real | Qué es |
| :--- | :--- |
| `coach-engine-container` | La caja grande que contiene toda la Coach y cambia de color según el motor |
| `engine-icon` | El cuadrito con el emoji del motor activo (⚡ o 💎) |
| `engine-title` | El título que dice "Valen Coach · Groq Engine" o "· Gemini Engine" |
| `engine-subtitle` | La frase descriptiva debajo del título |
| `btn-groq` / `btn-gemini` | Los botoncitos para cambiar de cerebro |
| `coach-chat-area` | El área donde aparecen las burbujas del chat |
| `btn-send-msg` | El botón de enviar mensaje ➤ |

### ◆ Anatomía de un botón (ejemplo real, en humano)
```html
<button id="btn-gemini" onclick="switchEngine('gemini')">💎 Gemini</button>
```
Traducción: *"Soy un botón, mi cédula es `btn-gemini`, y cuando me toquen llamen a la función `switchEngine` con el argumento 'gemini'."* Así de simple es cada pieza: **nombre + acción**.

### ◆ Regla de construcción de la casa
Cada elemento nuevo se crea con: **1)** su id único, **2)** sus clases de estilo (las que vive en el CSS), y **3)** su acción conectada al JS. Nada de piezas anónimas: aquí todo el mundo tiene cédula. 🪪

---

<div align="center">

─── 📄 **PÁGINA 5** ───
# 🎨 CSS: EL MAQUILLAJE Y EL VESTUARIO
### Colores, modos y animaciones que hacen que todo se vea caro

</div>

El CSS es el **vestuario**: no mueve nada, pero decide cómo se ve todo. Aquí viven los colores institucionales y los movimientos elegantes.

### ◆ La paleta de la casa
| Color | Código | Dónde brilla |
| :--- | :---: | :--- |
| 💜 Morado Valen | `#8B5CF6` | Coach, botones principales, motor Groq |
| ✨ Dorado boutique | `#D4AF37` | Títulos de informes, alertas elegantes, bordes del resumen |
| 🌸 Rosa vitrina | `#EC4899` | Acentos femeninos y detalles |
| 🖤 Negro uva | `#1A1A2E` | Fondos del panel y del chat |
| ⚡ Morado chispa | `#a855f7` | Puntitos de "pensando" del motor Groq |
| 💎 Azul diamante | `#3b82f6` | Puntitos de "pensando" del motor Gemini |

### ◆ Modo claro / modo oscuro 🌗
El CSS guarda dos vestuarios completos y el botón 🌗 solo le dice a la página: *"cámbiate de ropa"*. Ningún contenido se toca; solo cambia el atuendo.

### ◆ Animaciones con nombre propio
◆ `animate-fade-in-up` — cada burbuja del chat entra **apareciendo y subiendo**, como llegando a la conversación con elegancia.
◆ `thinking-bounce` + `.thinking-dot` — los **tres puntitos que rebotan** mientras la IA piensa, con retrasos escalonados (`0.15s` y `0.3s`) para que parezca una ola y no un temblor.
```css
.thinking-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    animation: thinking-bounce 1.2s infinite ease-in-out;
}
.thinking-dot:nth-child(2) { animation-delay: 0.15s; }
.thinking-dot:nth-child(3) { animation-delay: 0.3s; }
```
◆ **Regla de oro del vestuario:** antes de inventar una animación nueva, se revisa si ya existe una parecida en `stats.css` y se reusa. La identidad visual no se fragmenta: se hereda. 👗

---

<div align="center">

─── 📄 **PÁGINA 6** ───
# 🧠 JS: EL SISTEMA NERVIOSO
### `stats.js` por dentro: quién piensa, quién llama y quién dibuja

</div>

El JavaScript es el **sistema nervioso**: recibe toques, pide datos, llama a las IAs y dibuja las respuestas. Estos son sus órganos vitales, con nombre propio:

### ◆ Constantes y variables principales
◆ `AI_PROXY_URL` — la dirección del mayordomo: `"https://broken-frog-3909.andryus0312.workers.dev"`. **Nunca** se llama directo a Groq o Google desde aquí.
◆ `AI_CONFIG` — la ficha visual de cada motor: nombre, icono y color (`groq` → ⚡ morado; `gemini` → 💎 azul).
◆ `currentEngine` — recuerda cuál cerebro está activo ahora (`'groq'` por defecto).
◆ `sessionHistory` — guarda el chat de la sesión actual (para exportarlo más adelante).

### ◆ Funciones estrella
◆ `switchEngine(engineKey)` — cambia de cerebro: actualiza icono, título, subtítulo y recolorea todo el contenedor `coach-engine-container` (morado ↔ azul) sin recargar nada.
◆ `callGroq(sys, userMsg)` — envía el mensaje al mayordomo por la ruta `/groq` y devuelve la respuesta. Límite de respuesta: `max_tokens: 2048`.
◆ `callGemini(sys, userMsg)` — envía por la ruta `/gemini/auto-update-mode` con el formato `contents → parts → text`. Límite: `maxOutputTokens: 2048`.
◆ `showAILoading()` / `removeLoading(id)` — dibujan y retiran los **puntitos que piensan**; a los **4 segundos** el texto cambia a *"Esto está tardando un poco más de lo usual, dame unos segundos más…"* para que nadie espere a ciegas.
◆ `addUserBubble(txt)` / `addAiBubble(htmlTxt)` — dibujan las burbujas del chat (la tuya a la derecha, la de la IA a la izquierda con su icono de motor).
◆ `addErrorMsg(...)` — el cartel rojo de errores. **Sí, con ese nombre exacto**: una vez existió un typo (`addErrorMessage`) que silenció todos los errores del sistema. Nunca más. 📢
◆ `getCoachContext()` — junta los números del día (visitas, clics WA, categorías, productos, testimonios) y los convierte en el resumen que la IA lee para informar.

### ◆ El flujo de un mensaje, contado como cuento
1️⃣ Tocas ➤ → 2️⃣ aparece tu burbuja → 3️⃣ aparecen los puntitos pensando → 4️⃣ `callGroq` o `callGemini` viaja al mayordomo → 5️⃣ el mayordomo habla con la IA usando SU llave → 6️⃣ la respuesta vuelve → 7️⃣ se retiran los puntitos y nace la burbuja de la IA → 8️⃣ todos felices. 💜

---

<div align="center">

─── 📄 **PÁGINA 7** ───
# 🔥 FIREBASE: EL CUADERNO Y LA CAJA FUERTE
### Los 5 nodos, las reglas y por qué la clave pública no es un problema

</div>

### ◆ Los nodos (las secciones del cuaderno)
| Nodo | Qué guarda | ¿Quién lo lee? |
| :--- | :--- | :--- |
| `valen_products` | Catálogo: nombres, precios, categorías, fotos | 🌐 Todos (es vitrina) |
| `valen_profile` | Datos públicos de la boutique y redes | 🌐 Todos |
| `valen_banner` | Avisos bonitos de portada | 🌐 Todos |
| `valen_events` | Diario secreto: visitas, búsquedas, clics WA, dispositivos | 🔒 Solo la dueña |
| `admin_access` | La puerta con llave del panel | 🔒 Solo la dueña |

### ◆ Las reglas de la casa (seguridad real)
```json
{
  "rules": {
    ".read": true,
    ".write": false,
    "valen_products": { ".read": true },
    "valen_events": {
      ".read": false,
      "$event_id": {
        ".write": "newData.hasChildren(['device','language','timestamp'])"
      }
    },
    "admin_access": { ".read": "auth != null" }
  }
}
```
En cristiano: **leer el catálogo sí** (es una tienda, hay que mostrar), **escribir o borrar NO** para el público, y el diario de visitas es **privado** con validación estricta: solo entran eventos con dispositivo, idioma y fecha reciente. Nada de basura, nada de borrados maliciosos. 🗑️

### ◆ La clave pública, explicada sin pánico
En el código aparece un `apiKey` de Firebase. **No es un descuido**: es pública por diseño, como la dirección del local. Sirve para *tocar la puerta*, no para entrar a la bóveda. La bóveda la protegen las **Reglas** de arriba + el login de la dueña. 🔐

---

<div align="center">

─── 📄 **PÁGINA 8** ───
# 🤵 EL MAYORDOMO DE CLOUDFLARE: EL WORKER
### `broken-frog-3909`: rutas, secretos, caché, respaldos y timeout

</div>

### ◆ Las dos rutas del mayordomo
◆ `POST /groq` → habla con Groq usando el modelo detectado automáticamente (respaldo fijo: `qwen/qwen3.8-27b`).
◆ `POST /gemini/...` → habla con Gemini usando el modelo detectado (respaldos fijos: `gemini-flash-latest` y `gemini-3.8-flash`).

### ◆ Los secretos (las llaves del bolsillo)
Viven en *Cloudflare → Workers & Pages → `broken-frog-3909` → Settings → Variables and Secrets*:
◆ `GROQ_API_KEY` 🗝️⚡
◆ `GEMINI_API_KEY` 🗝️💎
**Regla sagrada:** jamás copiar estas llaves a ningún archivo de GitHub. Jamás. 🙅‍♀️

### ◆ Sus superpoderes, uno por uno
**1. CORS completo en TODAS las respuestas** (`CORS_JSON`) — incluso en los errores. Sin esto, el navegador bloquea las respuestas y todo parece "Failed to fetch". Fue una de las grandes batallas. ⚔️
**2. Lectura robusta del cuerpo** — lee el mensaje como texto (`.text()`) y luego lo convierte a JSON a mano, porque algunos navegadores de celular se ahogan con la lectura directa.
**3. Auto-detección de modelos** — le pregunta a Google y a Groq *"¿qué modelos tienes hoy?"*, filtra los que sirven para chat, prefiere el alias `flash-latest` y si no, elige el de versión más alta. Guarda el resultado en **caché por 6 horas** (`CACHE_TTL`).
**4. Doble respaldo distinto** — `GEMINI_FALLBACK_1` y `GEMINI_FALLBACK_2` son diferentes entre sí a propósito: así la lista de intentos **nunca** queda en un solo modelo (ese bug una vez nos dejó sin plan B).
**5. Timeout de 15 segundos** (`TIMEOUT_MS`) con `AbortController` — si un modelo se demora, se aborta y se prueba el siguiente, en vez de esperar a que Cloudflare corte con un feo `HTTP 524`.
**6. Diagnóstico hablador** — si todo falla, el error final lista **todos** los intentos con su motivo y el modelo detectado: `(detectado: nombre-del-modelo)`. Cero silencios misteriosos. 📢

### ◆ Pedacito real del mayordomo
```javascript
const CORS_JSON = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
const modelsToTry = [...new Set([detectedModel, GEMINI_FALLBACK_1, GEMINI_FALLBACK_2])];
const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/"
             + modelName + ":generateContent?key=" + env.GEMINI_API_KEY;
```
*(Nota histórica: antes decía `:generate` y por eso Google rechazaba todo. Una letra… una palabrita… cambiaba el universo. 🌌)*

---

<div align="center">

─── 📄 **PÁGINA 9** ───
# 🤖 EL ROBOT DESPERTADOR: KEEP-ALIVE
### `keep-alive.yml`: el empleado que toca la puerta cada 45 minutos

</div>

**Qué problema resuelve:** los servicios gratuitos se duermen si nadie los usa, y despertarles toma segundos eternos. Este robot evita eso.

**Dónde vive:** `.github/workflows/keep-alive.yml`
**Cuándo trabaja:** con el horario `cron: '*/45 * * * *'` → cada 45 minutos, día y noche, para siempre. ⏰
**Qué hace exactamente:**
1️⃣ Manda un `POST` cortico a `/groq` con la palabra `"ping"` y 5 tokens de respuesta (un saludo mínimo, solo para despertar).
2️⃣ Manda otro a `/gemini/auto-update-mode`; si Gemini anda saturado (503), **no se escandaliza**: registra el aviso y sigue.
**Extra:** también se puede lanzar a mano desde la pestaña **Actions → Run workflow**, ideal para probar o para calentar todo antes de un día importante. 🎯

---

<div align="center">

─── 📄 **PÁGINA 10** ───
# 💬 LA COACH IA DE DOS CEREBROS
### Cómo piensa, cómo informa y cómo se porta de bonita

</div>

### ◆ Los dos motores
◆ **⚡ Groq (el veloz):** responde en 2–4 segundos. Modelo familia Qwen, detectado solo. Para el día a día.
◆ **💎 Gemini (el reflexivo):** 5–10 segundos, análisis con lupa. Familia Flash de Google, detectada sola.

### ◆ Lo que hace solita al abrirse
📊 **Resumen Ejecutivo Automático:** visitas, clics WhatsApp (7 días), categoría top, productos activos y **alertas estratégicas** (por ejemplo: *"🔥 Alta conversión WA detectada (>30% ratio)"* o *"✅ Sin anomalías críticas detectadas"*).
📝 **Informe Diario:** un documento completo con fecha y hora, tráfico, comportamiento por dispositivo, top ventas, prueba social y un **plan de acción del día** con pasos concretos.
💬 **Chat libre:** se le puede preguntar cualquier cosa de la tienda; responde en tono cercano, colombiano y motivador, sin regaños y con datos reales.

### ◆ Modales y buenos modos
◆ Puntitos que piensan del color del motor + aviso amable a los 4 segundos. ⏳
◆ Respuestas hasta **2048 tokens** para que los informes no salgan cortados a la mitad. ✂️🚫
◆ Si algo falla, cartel rojo **con el motivo real** (nada de silencios ni de "ups" genéricos).
◆ Cambiar de motor no borra nada: solo cambia el cerebro y el color del traje. 🎽

---

<div align="center">

─── 📄 **PÁGINA 11** ───
# 💜 IDENTIDAD VISUAL: LOS COLORES DE LA CASA
### La paleta oficial y dónde vive cada tono

</div>

◆ **💜 Morado Valen `#8B5CF6`** — el color del alma: Coach, botones principales, degradados del panel.
◆ **✨ Dorado boutique `#D4AF37`** — el toque elegante: títulos de informes, bordes del Resumen Ejecutivo, alertas positivas.
◆ **🌸 Rosa vitrina `#EC4899`** — el guiño femenino: acentos, detalles, badges.
◆ **🖤 Negro uva `#1A1A2E`** — el fondo serio que hace brillar todo lo demás.
◆ **⚡ `#a855f7` y 💎 `#3b82f6`** — los colores de trabajo de cada motor (puntitos, iconos, burbujas).

**Filosofía de la paleta:** el morado manda, el dorado premia, el rosa enamora y el negro uva sostiene. Ningún color nuevo entra a la casa sin parecerse a la familia. 👨‍👩‍👧‍👦🎨

---

<div align="center">

─── 📄 **PÁGINA 12** ───
# 📖 GLOSARIO EN CRISTIANO
### Las palabras raras, traducidas a humano

</div>

◆ **API** — un mostrador de atención: tú pides por una ventanilla y te responden con un formato fijo.
◆ **Llave / API key** — la contraseña que abre esa ventanilla. Se cuida como cédula + tarjeta. 🗝️
◆ **Endpoint / ruta** — la dirección exacta de una ventanilla (ej: `/groq`, `/gemini/...`).
◆ **CORS** — el permiso que un servidor le da al navegador para aceptar su respuesta. Sin permiso, el navegador dice "no te conozco" y bota todo. 🚪
◆ **Caché** — la memoria de corto plazo: guardar una respuesta para no volver a preguntar por 6 horas.
◆ **Token** — pedacitos de texto que consume una IA; el límite de tokens es el "tamaño del plato". 🍽️
◆ **Commit** — una foto del proyecto en un momento perfecto, guardada en GitHub.
◆ **Deploy / desplegar** — publicar el cambio para que el mundo lo use.
◆ **Nodo** — una carpeta/sección dentro de la base de datos.
◆ **Alias** — un apodo que siempre apunta al modelo más nuevo (ej: `flash-latest`).
◆ **Timeout** — el tiempo máximo de espera antes de decir "siguiente". ⏱️
◆ **Fallback / respaldo** — el plan B (y C) que entra si el plan A falla.
◆ **Ping** — un toquecito mínimo para saber si algo está despierto. 🏓
◆ **Worker** — el mayordomo: código que vive en Cloudflare y hace mandados con las llaves. 🤵

---

<div align="center">

─── 📄 **PÁGINA 13** ───
# 🏅 REGLAS DE ORO Y CICATRICES APRENDIDAS
### Lo que este proyecto enseñó a punta de golpes y victorias

</div>

**Regla 1 · Lo que funciona, NO se toca.** ‍♀️ Mientras se arregla una cosa, las demás se dejan quietas. Así ningún arreglo rompe lo que ya brillaba.
**Regla 2 · Las llaves nunca viven en el frontend.** 🗝️ Siempre en el bolsillo del mayordomo (Cloudflare Secrets).
**Regla 3 · Un error que no se muestra es un error que gobierna en la sombra.** 📢 Por eso hoy todo fallo sale en pantalla con su motivo real (hubo un typo, `addErrorMessage` vs `addErrorMsg`, que silenció todo un sistema durante días).
**Regla 4 · Verificar los nombres oficiales contra la documentación.** 📚 Un `:generate` en vez de `:generateContent` costó noches de misterio.
**Regla 5 · Los errores de los proveedores se leen, no se temen.** 🔍 El mensaje 404 de Google decía textualmente qué modelo usar: la respuesta estaba en el propio error.
**Regla 6 · Diseñar para el celular.** 📱 Lectura robusta del cuerpo, códigos sin caracteres traviesos, pasos cortos: porque este proyecto se construyó y se mantiene desde un teléfono.
**Regla 7 · Dos cerebros piensan más que uno.** 🤝 Este proyecto se hizo en equipo híbrido humano + Claude 🧠 + Qwen 💜: uno diagnosticaba con lupa, el otro operaba con bisturí.
**Regla 8 · Documentar o repetir.** 📜 Todo lo que no se escribe, se vuelve a descubrir a golpes. Por eso existe este manual.

---

<div align="center">

### 💌 COLOFÓN
*Manual Oficial · Parte 1 — Valen Fashion Manizales*
*Escrito a seis manos: una humana terca y cariñosa, Claude 🧠 y Qwen 💜.*
*Continuará en la **Parte 2**… cuando la boutique lo pida.* ✨

![Morado](https://img.shields.io/badge/💜-8B5CF6-8B5CF6?style=flat-square)
![Dorado](https://img.shields.io/badge/✨-D4AF37-D4AF37?style=flat-square)
![Rosa](https://img.shields.io/badge/🌸-EC4899-EC4899?style=flat-square)
![Negro](https://img.shields.io/badge/🖤-1A1A2E-1A1A2E?style=flat-square)

</div>
