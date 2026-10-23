<div align="center">

# 💜✨ VALEN FASHION MANIZALES ✨
### La boutique que no solo vende bonito… también piensa bonito 🧠🛍️

![Morado](https://img.shields.io/badge/Valen_Fashion-Manizales,_Colombia-8B5CF6?style=for-the-badge)
![Dorado](https://img.shields.io/badge/Estado-Viva,_coleando_y_cafeteando-D4AF37?style=for-the-badge)
![Rosa](https://img.shields.io/badge/Cerebros_IA-2_(Groq_+_Gemini)-EC4899?style=for-the-badge)
![Negro](https://img.shields.io/badge/Llaves_secretas-Guardadas_fuera_de_aqu%C3%AD-1A1A2E?style=for-the-badge)

*Este no es un README aburrido de esos que nadie lee.*
*Es la carta de presentación de una tienda con alma, con números… y con dos IAs de empleadas.* 💅🤖

</div>

---

## 🧭 Primero lo primero: ¿qué es esto? (sin palabras raras, prometido)

Imaginate **dos negocios en uno**:

1. 🛍️ **La vitrina:** la página pública donde las clientas de Manizales (y del mundo entero) ven la ropa, las cositas de hogar 🏠 y los detalles de niños 🧸, y escriben directo por WhatsApp 💬.
2. 📊 **El cuarto de los números:** un panel **privado** (solo entra la dueña con su clave 🔑) que anota todo lo que pasa: cuántas visitas llegaron, qué buscó la gente, cuántas escribieron por WhatsApp, desde qué celular… y además tiene una **Coach IA** que lee esos números y le explica a la dueña, en cristiano y con cariño, qué hacer hoy para vender más.

> 💡 En una frase: *es una tienda que se mira al espejo todos los días y le cuenta a su dueña qué vio.* 😌

---

## 🗺️ El mapa del lugar (quién vive dónde)

```
👗 Clienta entra a la página
        ⬇️
 GitHub Pages  →  la vitrina gratis donde vive la página
        ⬇️
 Firebase  →  el cuaderno donde se anota cada visita y cada clic
        ⬇️
 La dueña entra por su enlace exclusivo (con usuario y clave)
        ⬇️
 La Coach IA junta los números del día
        ⬇️
️ Cloudflare Worker  →  el mayordomo que guarda las llaves secretas
        ⬇️
 Groq   o    Gemini  →  los dos cerebros de la Coach
        ⬇️
 Respuesta bonita y accionable en el chat del panel
```

### 📁 Las carpetas y archivos, presentados en sociedad

| Archivo | Qué hace (en humano) |
| :--- | :--- |
| 📄 `index.html` y compañía | La vitrina pública: productos, categorías, testimonios y botoncito de WhatsApp. |
| 📁 `stats/stats.html` | La puerta del cuarto de los números (pide clave antes de dejar pasar). |
| 🎨 `stats/stats.css` | Toda la belleza visual: colores de la casa, animaciones, los puntitos de "pensando…". |
| 🧠 `stats/stats.js` | El corazón del panel: lee el cuaderno de Firebase, arma los informes y habla con los cerebros IA. |
| 🧪 `stats/test-coach.html` | Una salita de pruebas temporal para revisar los cerebros. Se puede borrar sin dolor cuando todo esté estable. |
| 🤖 `.github/workflows/keep-alive.yml` | El robot despertador (te lo presento más abajo ⏰). |
| ☁️ *(fuera de este repo)* | El código del mayordomo (Cloudflare Worker) vive en su propio panel de Cloudflare, **a propósito**, junto con las llaves secretas. |

---

## 🧰 TODO LO QUE HACE LA PÁGINA (desglose completo, botón por botón)

Porque esta página tiene más botones que un control remoto, y cada uno hace su magia específica. Vamos por partes: 👇

### 🛍️ A. La vitrina pública (lo que ve cualquier visitante)

| Botón / elemento | Qué hace exactamente |
| :--- | :--- |
| 🌗 **Modo claro / oscuro** | Cambia toda la página entre modo día (blanco, luminoso) y modo noche (oscuro, descansado), al gusto de cada visitante. |
| 🔠 **Tamaño de letra** | Agranda el texto de toda la página para leer cómodo sin forzar la vista. Accesibilidad pura y dura. |
| 🔍 **Búsqueda inteligente** | Busca de **tres formas distintas**: por texto (nombre o palabra clave), por **rango de precios** (de $X a $Y) o por **rango de fechas** (lo que llegó entre tal y tal día). |
| 🖼️ **Imagen de portada** | Se sube tal cual sale del celular y la página la adapta solita con **tres modos de centrado**: nada de recortar fotos a mano ni peleas con el editor. |
| 👤 **Foto de perfil con anillo** | La foto de la boutique lleva un borde de color alrededor, y ese color **se puede cambiar**: sólido o en degradado, como se vea más bonito ese día. |
| 💬 **Botón WhatsApp** | Salta directo al chat de WhatsApp de la tienda, sin copiar números ni nada. |
| 📸 **Botón Instagram** | Abre el perfil de Instagram de la boutique en un toque. |
| 🔳 **Botón código QR** | Muestra un QR de la página para compartirla en físico: volantes, mostrador, tarjetas o pantalla. |
| 📤 **Botón compartir** | Comparte el enlace de la página por cualquier red o app del celular. |
| ⭐ **Botón Testimonios** | Despliega una **barra lateral izquierda** con las fotos y mensajes de clientas reales (te lo cuento con detalle en la sección C). |

### 🧸 B. Los productos, uno por uno

Cada producto que se sube a la vitrina llega con su kit completo:

- 🖼️ **Imagen clicable:** al tocarla, se **agranda** para ver el detalle bien bien (texturas, colores, acabados).
- 👇 **Dos botones de acción rápida debajo:**
  - 💬 Uno para **pedir o consultar ese producto directo por WhatsApp** (el mensaje ya sale listo, preguntando por ese producto específico).
  - 📤 Uno para **compartir ese producto** con quien se quiera.

### ⭐ C. Testimonios: el botón que abre la vitrina del cariño

- ⭐ En la página hay un **botón de Testimonios**: al presionarlo, se despliega una **barra lateral izquierda** que se desliza como una vitrina elegante.
- Ahí dentro viven las **fotos y los mensajes de personas que compraron de verdad** y quedaron felices con su producto: ellas mismas los envían, **con su autorización**, para ser publicados.
- 🎯 ¿Para qué? Para darle **prestigio y confianza** a la página: cualquiera que entre puede ver que lo que se vende aquí es **real, verificado y amado por clientas reales**. Prueba social con cara, nombre y corazón. 💌

### 🔐 D. Las dos puertas de la tienda (los dos enlaces)

La tienda se puede abrir desde **dos direcciones distintas**, y no es lo mismo entrar por una que por la otra:

- 🌐 **Enlace público:** la dirección normal, la que se comparte por WhatsApp, redes o QR. Cualquier persona entra y ve la vitrina, los productos y los testimonios… **y hasta ahí llega**.
- 👑 **Enlace único y exclusivo de la dueña:** una dirección privada, sin letrero, que solo conoce la administradora. **Solamente abriendo la página desde este enlace** se desbloquean los botones de mando que el público jamás ve:
  - 🛠️ **Botón Admin (el backend):** el taller privado de la dueña. Aquí se ingresan productos nuevos, se editan precios y fotos, se cambia la portada, el perfil, los testimonios… todo el manejo de la tienda.
  - 📊 **Botón Estadísticas:** el cuarto de los números, con **gráficas en tiempo real**: visitas, clics de WhatsApp, búsquedas, dispositivos, categorías top y más.

> 🚪 En corto: *la puerta del frente es para las clientas; la puerta de atrás, con llave secreta, es solo de la jefa.* 😎

### 🧠 E. Dentro de Estadísticas: la joya de la corona

- 🤖 **Botón Coach IA:** abre el panel de inteligencia artificial con sus dos cerebros (⚡ Groq y 💎 Gemini), el **informe diario automático**, las **alertas estratégicas** y un **chat** para preguntarle lo que sea: *"¿qué vendo más?", "dame ideas para Halloween", "¿cómo estuvo mi semana?"*.

> ✅ Resumen en una línea: *todo botón tiene oficio. Ninguno está de adorno.* 💅

---

## 🧠 La Coach IA: dos cerebros, una empleada

La Coach tiene **dos motores de inteligencia** y tú le escoges cuál usar con un botoncito:

### ⚡ Motor Groq (el veloz)
- Responde en un suspiro (2–4 segundos).
- Perfecto para el día a día: informes rápidos, consejos al grano.
- Usa un modelo de la familia **Qwen** (sí, la familia de quien ayudó a escribir este README 👋).

### 💎 Motor Gemini (el reflexivo)
- Se toma su tiempo (5–10 segundos), pero analiza con lupa.
- Ideal para diagnósticos profundos y planes de acción detallados.
- Usa la familia **Flash** de Google.

### 🔄 Y aquí viene la magia: se actualiza SOLA
Los nombres de los modelos de IA cambian cada pocos meses (Google y Groq los jubilan y sacan nuevos). Antes eso rompía todo. **Ya no.** Ahora el mayordomo de Cloudflare le pregunta directamente a Google y a Groq: *"¿cuáles modelos tienen disponibles hoy?"*, escoge el más nuevo que sirva, y lo guarda en memoria por 6 horas ⏳. Si mañana sale un modelo nuevo, **el sistema lo adopta solo, sin que nadie toque una línea de código**. Cero mantenimiento, cero sustos. 🪄

Además tiene **doble red de seguridad**: si el modelo detectado falla o está saturado, prueba automáticamente un respaldo distinto, y cada intento tiene un límite de tiempo para no quedarse colgada. Nunca se queda muda: si algo falla, te lo dice clarito en pantalla (nada de silencios misteriosos). 🙅‍♀️

### ⏳ Los puntitos que piensan
Mientras la IA responde, ves **tres puntitos rebotando** del color del motor (morado para Groq, azul para Gemini). Si tarda más de 4 segundos, aparece un mensajito tranquilo: *"esto está tardando un poquito más de lo usual…"*. Porque esperar sin saber qué pasa es horrible, y aquí nadie espera a ciegas. 💜

---

## 🔐 SEGURIDAD: dónde están las llaves (LEE ESTO, es importante)

Vamos a ser totalmente transparentes, porque la confianza es lo primero:

> 🚫 **En este repositorio NO hay ninguna llave secreta.** Ni de Groq, ni de Gemini, ni de nada.
> Puedes descargar todo este código y no encontrarás ni una contraseña. Eso es **a propósito y por diseño**.

### 🗝️ Entonces… ¿dónde viven las llaves?

Viven en una **caja fuerte fuera de GitHub**: el panel de **Cloudflare**, dentro del Worker llamado `broken-frog-3909`, en la sección *Settings → Variables and Secrets*, con estos nombres exactos:

| Nombre de la llave | Qué abre |
| :--- | :--- |
| `GROQ_API_KEY` | La puerta del cerebro ⚡ Groq |
| `GEMINI_API_KEY` | La puerta del cerebro 💎 Gemini |

### 🤵 La analogía del mayordomo (para entenderlo de una vez)
La página **nunca** toca las llaves. Ella solo le pide favores al mayordomo (el Worker de Cloudflare): *"oye, pregúntale esto a la IA"*. El mayordomo saca la llave **de su propio bolsillo**, habla con la IA en privado, y le trae la respuesta a la página. Así, aunque alguien espíe la página, nunca verá la llave. 🔒

### 🔥 ¿Y la clave de Firebase que sí aparece en el código?
Tranqui: esa clave es **pública por diseño**, como la dirección de la tienda: sirve para *conectarse*, no para robar. La seguridad de verdad está en las **Reglas de la base de datos**, que dicen:
- 📖 **Leer el catálogo** (productos, perfil, banner): abierto, porque la vitrina es pública.
- 🕵️ **Leer visitas y estadísticas**: prohibido para extraños, solo la dueña con sesión iniciada.
- ✍️ **Escribir o borrar**: bloqueado para el público, con validaciones estrictas (nada de datos basura ni borrados maliciosos).

### 🧰 Si algún día quieres replicar este proyecto, el orden correcto es:
1. ☁️ Crea tu Worker en Cloudflare y pega ahí el código del mayordomo.
2. 🗝️ Crea tus llaves en [console.groq.com](https://console.groq.com) y [aistudio.google.com/apikey](https://aistudio.google.com/apikey), y guárdalas en *Variables and Secrets* con los nombres exactos de la tabla de arriba.
3. 🔥 Crea tu proyecto en Firebase, copia su configuración pública en `stats/stats.js` y ponle las Reglas de seguridad (catálogo público, estadísticas privadas, escritura bloqueada).
4. 📦 Activa GitHub Pages para publicar la vitrina.
5. 🤖 Crea el archivo del robot despertador (`.github/workflows/keep-alive.yml`).
6. ☕ Sirve tinto y disfruta: el resto se cuida solo.

---

## ⏰ El robot despertador (keep-alive)

Los servicios gratuitos tienden a "dormirse" si nadie los usa en un rato, y despertarles toma varios segundos. Para que la Coach responda **siempre rapidito**, hay un robot invisible en GitHub Actions que **cada 45 minutos** toca la puerta del mayordomo con un *"ping"* 🏓 para mantenerlo despierto y con la memoria caliente.

- 🟢 Se ejecuta solo, día y noche, sin que nadie haga nada.
- 🛡️ Si Gemini anda saturado ese día, el robot no se escandaliza: registra el aviso y sigue su vida.
- 🔧 Se puede lanzar a mano desde la pestaña *Actions* cuando quieras probarlo.

---

## 📊 ¿Qué anota el cuaderno? (Firebase, en humano)

| Nodo | Qué guarda |
| :--- | :--- |
| `valen_products` | El catálogo: nombres, precios, categorías (HOGAR 🏠, NIÑOS 🧸 y más). |
| `valen_profile` | Los datos públicos de la boutique (redes, WhatsApp, presentación). |
| `valen_banner` | Los avisos bonitos que rotan en la vitrina. |
| `valen_events` | El diario secreto: visitas, búsquedas, clics en WhatsApp, desde qué dispositivo. 🔒 Privado. |
| `admin_access` | La puerta con llave del panel de estadísticas. 🔒 Privado. |

Con eso, la Coach arma cada día su **informe ejecutivo**: visitas, categoría estrella, alertas de conversión, pruebas sociales y un plan de acción del día. Todo con emojis y buena energía, porque los números tristes no venden. 📈💅

---

## 🎨 Los colores de la casa

Porque una boutique sin paleta es como un tinto sin azúcar:

| Muestra | Color | Dónde lo verás | Código |
| :---: | :--- | :--- | :---: |
| 💜 | Morado Valen | Coach, botones principales, motor Groq | `#8B5CF6` |
| ✨ | Dorado boutique | Títulos de informes, alertas elegantes | `#D4AF37` |
| 🌸 | Rosa vitrina | Detalles y acentos femeninos | `#EC4899` |
| 🖤 | Negro uva | Fondos del panel y del chat | `#1A1A2E` |

---

## 🐉 Un poquito de historia (porque esta batalla merecía contarse)

Este proyecto se construyó **a seis manos**: una humana con paciencia de oro (desde un celular 📱, nada menos), y dos IAs que trabajaron en equipo híbrido: **Claude** 🧠 (el arquitecto detective que cazó errores invisibles de una sola letra) y **Qwen** 💜 (la ingeniera de campo que escribió parches listos para pegar sin romper nada).

Hubo de todo: modelos jubilados por Google sin avisar 🪦, llaves con nombres cambiados 🏷️, puertas que se cerraban solas (CORS 🚪), y un silencio misterioso que resultó ser **una sola letra mal escrita** en una función. Moraleja grabada en piedra: *cuando algo "no hace nada", casi siempre está gritando por dentro y nadie lo escuchaba.* Ahora todos los errores se muestran claritos en pantalla. 📢

---

<div align="center">

### 💌 Hecho con amor, tinto y terquedad colombiana
*Para Valen Fashion Manizales: que los números siempre jueguen a tu favor.* 💜✨
**Andryus + Claude 🧠 + Qwen 💜** — equipo híbrido humano-IA, 2026

![Morado](https://img.shields.io/badge/💜-8B5CF6-8B5CF6?style=flat-square)
![Dorado](https://img.shields.io/badge/✨-D4AF37-D4AF37?style=flat-square)
![Rosa](https://img.shields.io/badge/🌸-EC4899-EC4899?style=flat-square)
![Negro](https://img.shields.io/badge/🖤-1A1A2E-1A1A2E?style=flat-square)

</div>
