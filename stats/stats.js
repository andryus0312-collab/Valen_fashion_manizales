import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============ CONFIGURACIÓN FIREBASE (IDÉNTICA A TU APP PRINCIPAL) ============
const firebaseConfig = {
    apiKey: "AIzaSyARk7mqSf7C24v4nu0aIx8zoizoewdFAyY",
    authDomain: "valen-fashion-manizales.firebaseapp.com",
    databaseURL: "https://valen-fashion-manizales-default-rtdb.firebaseio.com",
    projectId: "valen-fashion-manizales",
    storageBucket: "valen-fashion-manizales.firebasestorage.app",
    messagingSenderId: "644464075923",
    appId: "1:644464075923:web:0e0aebd0882fc07a7cd966"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Variables globales para cache
let cachedEvents = [];
let chartInstances = {}; // Para guardar referencias de Chart.js y destruirlos antes de recrear

// ============ GENERADOR DE CONTEXTO PARA EL COACH IA ============
async function getCoachContext() {
    // 1. Obtener Referencias Básicas desde Firebase Directamente (para asegurar frescura total)
    const [productsSnap, profileSnap] = await Promise.all([
        get(ref(db, 'valen_products')),
        get(ref(db, 'valen_profile'))
    ]);

    const productsRaw = productsSnap.exists() ? Object.values(productsSnap.val()) : [];
    const profileData = profileSnap.exists() ? profileSnap.val() : {};
    
    // Usar eventos cacheados si existen, o leerlos directamente si es primera carga rápida
    const eventsToAnalyze = cachedEvents.length > 0 
        ? cachedEvents 
        : ((await get(ref(db, 'valen_events'))).exists() 
            ? Object.values((await get(ref(db, 'valen_events')).val())) 
            : []);

    // --- CÁLCULO DE MÉTRICAS CLAVE ---
    
    // A. Visitas Totales Históricas
    const totalVisits = eventsToAnalyze.filter(e => e.event === 'page_view').length;
    
    // B. Clicks WhatsApp Recientes (últimos 7 días aprox por timestamp)
    const sevenDaysAgoTs = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentWaClicks = eventsToAnalyze.filter(e => 
        e.timestamp > sevenDaysAgoTs && 
        (e.event.includes('whatsapp') || e.event === 'product_whatsapp_requested')
    ).length;

    // C. Categorías Top (Basado en productos activos)
    const categoryCounts = {};
    productsRaw.forEach(p => {
        if(p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    const sortedCategories = Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1]);
    const topCategoryName = sortedCategories.length > 0 ? sortedCategories[0][0].toUpperCase() : 'Sin Datos';
    const secondBestCatName = sortedCategories.length > 1 ? sortedCategories[1][0].toUpperCase() : null;

    // D. Alertas Inteligentes Simples (Reglas básicas antes de usar LLM pesada)
    let alerts = [];
    if(totalVisits < 5 && new Date().getHours() > 18) {
        alerts.push("⚠️ Pocas visitas hoy comparado con promedios habituales nocturnos.");
    }
    if(recentWaClicks > 0 && totalVisits > 0 && (recentWaClicks/totalVisits) > 0.3) {
        alerts.push("🔥 Alta conversión WA detectada recientemente (>30% ratio).");
    }
    if(!secondBestCatName && sortedCategories.length <= 1) {
         alerts.push("💡 Tu catálogo está muy concentrado en una sola categoría. Diversifica riesgos.");
    }

    // E. Fecha Actual Formateada para Colombia
    const todayStr = new Intl.DateTimeFormat('es-CO', { dateStyle: 'full' }).format(new Date());

    return {
        meta_info: {
            generated_at: new Date().toISOString(),
            business_name: "Valen Fashion Manizales",
            current_date_human_readable: todayStr
        },
        traffic_metrics: {
            total_registered_visits_lifetime: totalVisits,
            whatsapp_interactions_last_7_days: recentWaClicks,
            primary_device_type: (() => {
                 const devices = {};
                 eventsToAnalyze.forEach(ev => {
                     if(ev.device?.includes('Celular')) devices.mobile = (devices.mobile||0)+1;
                     else if(ev.device?.includes('PC')) devices.desktop = (devices.desktop||0)+1;
                 });
                 return devices.mobile > devices.desktop ? "Móvil Dominante" : "Equilibrado/Escritorio";
            })()
        },
        catalog_insights: {
            total_active_products: productsRaw.length,
            leading_category: topCategoryName,
            runner_up_category: secondBestCatName || "N/A",
            testimonials_count: (profileData.testimonials || []).length
        },
        strategic_alerts: alerts.length > 0 ? alerts.join(" | ") : "✅ Sin anomalías críticas detectadas.",
        raw_sample_recent_activity: eventsToAnalyze.slice(0, 5).map(ev => ({
             time: new Date(ev.timestamp).toLocaleTimeString('es-CO'),
             action_desc: ev.event.replace('_',' '),
             device: ev.device
        }))
    };
}

// ============ AUTENTICACIÓN ============
window.statsLogin = () => {
    const email = document.getElementById('stats-email').value;
    const password = document.getElementById('stats-password').value;
    const errorEl = document.getElementById('stats-login-error');
    
    signInWithEmailAndPassword(auth, email, password)
        .catch(err => {
            errorEl.innerText = '❌ Credenciales incorrectas';
            errorEl.classList.remove('hidden');
        });
};

window.statsLogout = () => signOut(auth);

onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        initStatsTheme(); // Cargar tema guardado
        loadDashboardData(); // Iniciar carga de datos
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
});

// ============ MODO CLARO/OSCURO ============
function initStatsTheme() {
    const savedTheme = localStorage.getItem('valen_theme') || 'dark'; // Default oscuro para stats
    const btn = document.getElementById('stats-theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark');
        if (btn) btn.innerText = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        if (btn) btn.innerText = '🌙';
    }
}

window.toggleStatsTheme = function() {
    const btn = document.getElementById('stats-theme-toggle');
    const isDark = document.body.classList.toggle('dark-mode');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('valen_theme', isDark ? 'dark' : 'light');
    if (btn) btn.innerText = isDark ? '☀️' : '🌙';
    updateChartsTheme(isDark);
};

function updateChartsTheme(isDark) {
    Object.values(chartInstances).forEach(chart => {
        if (!chart) return;
        const textColor = isDark ? '#f3f4f6' : '#2d1b36';
        const gridColor = isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)';
        
        if (chart.options.scales?.x) {
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.x.grid.color = gridColor;
        }
        if (chart.options.scales?.y) {
            chart.options.scales.y.ticks.color = textColor;
            chart.options.scales.y.grid.color = gridColor;
        }
        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        chart.update();
    });
}

// ============ MOTOR DE DATOS PRINCIPAL ============
function loadDashboardData() {
    // 1. Productos
    onValue(ref(db, 'valen_products'), snap => {
        const products = snap.val() ? Object.values(snap.val()) : [];
        document.getElementById('total-products').innerText = products.length;
        renderCategoriesChart(products); 
    });

    // 2. Perfil + Testimonios
    onValue(ref(db, 'valen_profile'), snap => {
        const profile = snap.val() || {};
        document.getElementById('total-testimonials').innerText = (profile.testimonials || []).length;
    });

    // 3. EVENTOS EN TIEMPO REAL (Fuente única de verdad)
    onValue(ref(db, 'valen_events'), (snapshot) => {
        const rawData = snapshot.val();
        cachedEvents = rawData ? Object.keys(rawData).map(k => ({ id: k, ...rawData[k] })) : [];
        cachedEvents.sort((a, b) => b.timestamp - a.timestamp);
        
        updateAllMetricsAndVisuals(cachedEvents);
    });
}

function updateAllMetricsAndVisuals(events) {
    if (!events) return;

    let totalVisits = 0, waClicks = 0;
    const deviceMap = {};
    
    events.forEach(ev => {
        if (ev.event === 'page_view') totalVisits++;
        if (ev.event.includes('whatsapp')) waClicks++;
        
        const devType = ev.device?.includes('Celular') ? '📱 Celular' : 
                        ev.device?.includes('PC') ? '💻 PC' : '📟 Tablet/Otros';
        deviceMap[devType] = (deviceMap[devType] || 0) + 1;
    });

    // Actualizar Tarjetas Superiores
    document.getElementById('total-visits').innerText = totalVisits.toLocaleString('es-CO');
    document.getElementById('total-whatsapp').innerText = waClicks.toLocaleString('es-CO');

    // Renderizar Gráficas Dinámicas
    renderDevicesDynamic(deviceMap, totalVisits);
    // Pasamos TODOS los eventos filtrados por page_view directamente
const visitEvents = events.filter(e => e.event === 'page_view');
renderVisitsDynamic(visitEvents);
    
    // Renderizar Tabla Monitor
    renderLiveConsoleTable(events);
    
    // Renderizar Calendario Tematizado
    renderThemedCalendar();
}

// ============ GRÁFICAS DINÁMICAS CON TEXTO INTERPRETATIVO ============

function renderDevicesDynamic(deviceMap, totalVisits) {
    const ctx = document.getElementById('chart-devices');
    if(!ctx) return;
    
    // Destruir instancia previa si existe
    if(chartInstances.devices) chartInstances.devices.destroy();
    
    const labels = Object.keys(deviceMap);
    const data = Object.values(deviceMap);
    
    chartInstances.devices = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#ec4899','#a855f7','#D4AF37','#9333ea'],
                borderWidth: 0, hoverOffset: 15
            }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
    });
}

function renderVisitsDynamic(eventsList) {
    const ctx = document.getElementById('chart-visits');
    if(!ctx) return;
    
    // Destruir instancia previa si existe
    if(chartInstances.visits) chartInstances.visits.destroy();

    // 1. Preparar estructura de datos para RADAR
    // Necesitamos un array de 7 posiciones (Domingo a Sábado)
    const daysLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dailyCounts = [0, 0, 0, 0, 0, 0, 0]; // Inicializar en cero
    
    // 2. Rellenar conteos basados en eventos reales
    eventsList.forEach(ev => {
        if (ev.event === 'page_view' && ev.timestamp) {
            const dateObj = new Date(ev.timestamp);
            const dayIndex = dateObj.getDay(); // 0=Domingo ... 6=Sábado
            
            // Incrementar el contador del día correspondiente
            if(dayIndex >= 0 && dayIndex <= 6) {
                dailyCounts[dayIndex]++;
            }
        }
    });

    // 3. Configurar Chart.js como RADAR CHART
    chartInstances.visits = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: daysLabels,
            datasets: [{
                label: 'Visitas Totales',
                data: dailyCounts,
                backgroundColor: 'rgba(168, 85, 247, 0.2)', // Morado transparente (relleno)
                borderColor: '#a855f7',                      // Borde morado sólido
                pointBackgroundColor: '#D4AF37',             // Puntos dorados (tu sello)
                pointBorderColor: '#fff',                    // Contorno blanco puntos
                pointHoverBackgroundColor: '#ec4899',        // Rosa al pasar mouse/dedo
                pointHoverBorderColor: '#fff',
                borderWidth: 3,                              // Grosor de línea principal
                fill: true                                   // Rellenar el área interior
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Ocultar leyenda innecesaria
                tooltip: {
                    callbacks: {
                        title: () => '', // Sin título
                        label: (context) => `${context.label}: ${context.raw} visitas`
                    }
                }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(168, 85, 247, 0.2)' }, // Líneas radiales suaves
                    grid: { 
                        circular: true, // Cuadrícula redonda perfecta
                        color: 'rgba(255, 255, 255, 0.1)' 
                    },
                    pointLabels: {
                        font: { size: 14, weight: 'bold', family: "'Segoe UI', sans-serif" },
                        color: '#f3f4f6' // Texto blanco/claro para contraste
                    },
                    ticks: {
                        backdropColor: 'transparent', // Fondo invisible números eje Y
                        color: '#a855f7',              // Números morados
                        stepSize: Math.max(1, Math.ceil(Math.max(...dailyCounts)/5)), // Escalonamiento inteligente
                        showLabelBackdrop: false
                    },
                    suggestedMin: 0,
                    beginAtZero: true
                }
            }
        }
    });
}

function renderCategoriesChart(products) {
    const counts = { hogar: 0, ninos: 0, ropa: 0, tendidos: 0, relojes: 0, zapatos: 0, gafas: 0 };
    products.forEach(p => { if(counts[p.category] !== undefined) counts[p.category]++; });
    
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).filter(([_,v])=>v>0);
    const leader = sorted[0];
    const second = sorted[1];
    
    const catNames = {hogar:'Hogar',ninos:'Niños',ropa:'Ropa',tendidos:'Tendidos',relojes:'Reloj',zapatos:'Zapato',gafas:'Gafa'};
    
    const ctx = document.getElementById('chart-categories');
    if(!ctx) return;
    if(chartInstances.categories) chartInstances.categories.destroy();
    
    chartInstances.categories = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: sorted.map(([k])=>`${catNames[k]||k}`),
            datasets: [{
                label: 'Productos',
                data: sorted.map(([_,v])=>v),
                backgroundColor: ['#a855f7','#ec4899','#D4AF37','#9333ea','#f472b6','#fb923c','#60a5fa'].slice(0,sorted.length),
                borderRadius: 8, borderSkipped: false
            }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
    });
}

// ============ CALENDARIO COMERCIAL TEMATIZADO ============
function renderThemedCalendar() {
    const container = document.getElementById('commercial-calendar');
    if(!container) return;
    
    const themes = {
        halloween: { bg:'linear-gradient(135deg,#ff6b35,#1a1a2e)', text:'#ffffff', accent:'#ffd700', emoji:'🎃', strategy:'Sube disfraces infantiles y peluches oscuros.' },
        blackfriday: { bg:'linear-gradient(135deg,#000000,#4b0082)', text:'#ffffff', accent:'#ff00ff', emoji:'🛍️', strategy:'Ofertas flash 24h. Combos Hogar+Niños.' },
        navidad: { bg:'linear-gradient(135deg,#0f5132,#dc3545)', text:'#ffffff', accent:'#ffd700', emoji:'🎄', strategy:'Regalos navideños: cobijas suaves + peluches gigantes.' },
        madre: { bg:'linear-gradient(135deg,#ffc0cb,#ff69b4)', text:'#2d1b36', accent:'#8b0000', emoji:'💐', strategy:'Sets de tocador + flores artificiales.' },
        amor: { bg:'linear-gradient(135deg,#ff1493,#8a2be2)', text:'#ffffff', accent:'#ffd700', emoji:'💘', strategy:'Parejas: 2 peluches iguales + cupón cena romántica.' },
        default: { bg:'linear-gradient(135deg,#6a0dad,#4b0082)', text:'#ffffff', accent:'#ffd700', emoji:'⭐', strategy:'Promoción estándar multisectorial.' }
    };
    
    const dates = [
        { key:'amor', name:'Amor y Amistad', date:'2026-09-19' },
        { key:'halloween', name:'Halloween', date:'2026-10-31' },
        { key:'blackfriday', name:'Black Friday', date:'2026-11-27' },
        { key:'navidad', name:'Navidad', date:'2026-12-25' },
        { key:'madre', name:'Día de la Madre', date:'2027-05-09' }
    ].map(d => ({...d, daysLeft: Math.ceil((new Date(d.date)-new Date())/(1000*60*60*24))}))
     .filter(d => d.daysLeft > 0)
     .sort((a,b)=>a.daysLeft-b.daysLeft);

    container.innerHTML = dates.map(d => {
        const t = themes[d.key] || themes.default;
        return `
        <div class="calendar-themed-card" style="background:${t.bg}; color:${t.text};">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <span style="font-size:2rem;">${t.emoji}</span>
                    <h4 class="text-lg font-bold mt-1">${d.name}</h4>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold" style="background:${t.accent}; color:#000;">
                    ⏳ ${d.daysLeft} días
                </span>
            </div>
            <p class="text-sm leading-relaxed opacity-90">${t.strategy}</p>
        </div>`;
    }).join('') || '<p class="text-center text-desc py-4">🌵 Sin fechas próximas registradas.</p>';
}

// ============ TABLA MONITOR MEJORADA ============
function renderLiveConsoleTable(allEvents) {
    const container = document.getElementById('live-events-body');
    if (!container) return;

    const recent = allEvents.slice(0, 15);

    if (recent.length === 0) {
        container.innerHTML = '<div class="py-8 text-center text-desc italic">🌵 Esperando señales vitales...</div>';
        return;
    }

    const descriptions = {
        page_view: '👀 Ingresó a explorar el catálogo general.',
        click_whatsapp_direct: '💬 Contactó vía WhatsApp principal para asesoría rápida.',
        click_instagram_link: '📸 Visitó tu perfil de Instagram para ver contenido visual.',
        click_qr_button: '🔳 Abrió código QR probablemente para compartir tu web.',
        click_testimonials_btn: '👑 Consultó reseñas antes de decidir compra.',
        click_search_btn: '🔍 Usó buscador interno buscando producto específico.',
        filter_category_selected: '🏷️ Filtró por categoría mostrando intención clara.',
        search_text_typed: '⌨️ Escribió consulta personalizada revelando necesidad exacta.',
        product_image_zoomed: '🖼️ Amplió foto evaluando calidad/detalle del artículo.',
        product_whatsapp_requested: '🛒 Solicitó pedido directo de producto específico.',
        product_shared: '🔗 Compartió producto posiblemente recomendándolo a alguien.'
    };

    container.innerHTML = recent.map(ev => {
        const fullDate = new Date(ev.timestamp).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'});
        const desc = descriptions[ev.event] || 'Interacción registrada en plataforma.';
        const detail = ev.query ? `"${ev.query}"` : (ev.product_title && ev.product_title !== 'Sin título' ? ev.product_title : '-');
        
        return `
        <div class="console-row-enhanced">
            <div class="console-cell console-date">${fullDate}</div>
            <div class="console-cell console-action"><span class="action-badge-modern">${ev.event.replace('_',' ')}</span></div>
            <div class="console-cell console-device">${ev.device||'?'} • ${ev.browser||'?'}</div>
            <div class="console-cell console-context">${desc}<br/><small class="opacity-70">Contexto: ${detail}</small></div>
            <div class="console-cell console-status"><span class="pulse-dot"></span></div>
        </div>`;
    }).join('');
}

// ============ UTILITARIOS Y EXPORTACIÓN ============

function getLast7DaysData(events) {
    const today = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const keyStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const dayName = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
        
        labels.push(dayName);
        const count = events.filter(ev => ev.event === 'page_view' && ev.isoDate?.startsWith(keyStr)).length;
        data.push(count);
    }
    return { labels, data };
}

// LUPA: Abrir Modal Historial Agrupado por Dispositivo
window.openHistoryModal = function() {
    const modal = document.getElementById('history-modal');
    if(!modal) return;
    
    onValue(ref(db, 'valen_events'), (snap) => {
        const events = snap.val() ? Object.values(snap.val()).sort((a,b)=>b.timestamp-a.timestamp) : [];
        const listContainer = document.getElementById('history-list-container');
        
        const grouped = {};
        events.forEach(ev => {
            const key = `${ev.device}|${ev.browser}`;
            if(!grouped[key]) grouped[key] = [];
            grouped[key].push(ev);
        });
        
        listContainer.innerHTML = Object.entries(grouped).map(([devKey, devEvents]) => {
            const [device, browser] = devKey.split('|');
            return `
            <div class="mb-6 p-4 rounded-xl bg-purple-900/20 border border-purple-500/30">
                <h4 class="font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
                    👤 ${device} <span class="text-xs opacity-70">(${browser})</span>
                    <span class="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">${devEvents.length} acciones</span>
                </h4>
                <div class="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    ${devEvents.slice(0,10).map(ev => `
                    <div class="flex justify-between items-start text-xs border-b border-white/10 pb-2">
                        <div>
                            <span class="font-bold text-pink-400">${ev.event.replace('_',' ').toUpperCase()}</span><br/>
                            <span class="italic text-gray-400">${ev.query || ev.product_title || '-'}</span>
                        </div>
                        <span class="text-gray-500 whitespace-nowrap ml-3">${new Date(ev.timestamp).toLocaleTimeString('es-CO')}</span>
                    </div>`).join('')}
                </div>
            </div>`;
        }).join('') || '<p class="text-center py-4 text-desc">Sin historial disponible.</p>';
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }, { onlyOnce: true });
};

// ============ CAPTURADOR DE GRÁFICAS PREMIUM (PNG ALTA CALIDAD) ============

/**
 * Genera una imagen PNG profesional combinando Logo + Título + Gráfica + Texto Explicativo
 * @param {string} chartId - ID del canvas ('chart-devices', 'chart-categories', 'chart-visits')
 * @param {string} titleText - Título visible de la tarjeta (ej: "¿Desde dónde te visitan?")
 */
window.captureAndDownloadGraph = async function(chartId, titleText) {
    showToast('📸 Preparando captura premium...');
    
    try {
        // 1. Obtener referencias DOM necesarias
        const canvasElement = document.getElementById(chartId);
        if (!canvasElement) throw new Error("Canvas no encontrado");
        
        // Encontrar el contenedor padre (.chart-card-enhanced) para sacar el texto interpretativo
        const cardContainer = canvasElement.closest('.chart-card-enhanced');
        const interpBlock = cardContainer?.querySelector('.chart-interpretation');
        
        if (!interpBlock) throw new Error("Bloque de texto no encontrado");

        // 2. Crear lienzo temporal gigante (para composición perfecta)
        // Usamos escala x2 para asegurar nitidez retina/HD
        const scale = 2; 
        const width = 800 * scale;
        const height = 1200 * scale; // Altura suficiente para logo+titulo+grafica+texto
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');

        // --- A. FONDO OSCURO BOUTIQUE (Igual al Panel Admin) ---
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#1b0c1b');   // Negro profundo arriba
        bgGradient.addColorStop(1, '#2e1065');   // Morado muy oscuro abajo
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Añadir un borde dorado sutil alrededor de todo el lienzo
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'; // Dorado translúcido
        ctx.lineWidth = 4 * scale;
        ctx.strokeRect(10*scale, 10*scale, width - 20*scale, height - 20*scale);

        // --- B. LOGO CENTRADO ARRIBA ---
        const logoImg = new Image();
        logoImg.src = '../logo.jpg'; // Ruta relativa desde stats/
        
        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = () => resolve(); // Continuar aunque falle el logo
        });

        const logoSize = 150 * scale;
        const logoX = (width - logoSize) / 2;
        const logoY = 50 * scale;
        
        if (logoImg.complete && logoImg.naturalWidth > 0) {
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        } else {
            // Fallback si no carga el logo: Dibujar círculo decorativo
            ctx.beginPath();
            ctx.arc(width/2, logoY + logoSize/2, logoSize/2, 0, Math.PI*2);
            ctx.fillStyle = '#f3e8ff';
            ctx.fill();
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 5 * scale;
            ctx.stroke();
            ctx.fillStyle = '#a855f7';
            ctx.font = `bold ${20*scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('VF', width/2, logoY + logoSize/2 + 10*scale);
        }

        // --- C. TÍTULO EN DORADO BRILLANTE (Contraste alto sobre oscuro) ---
        ctx.fillStyle = '#D4AF37'; // Tu color dorado insignia
        ctx.font = `bold ${28*scale}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(titleText.toUpperCase(), width / 2, logoY + logoSize + (60 * scale));

        // Línea divisoria sutil bajo el título
        ctx.beginPath();
        ctx.moveTo(width * 0.2, logoY + logoSize + (80 * scale));
        ctx.lineTo(width * 0.8, logoY + logoSize + (80 * scale));
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // --- D. INSERTAR LA GRÁFICA REAL (CANVAS ORIGINAL) ---
        // Copiamos los píxeles exactos del gráfico actual sin re-renderizar
        const graphHeight = 500 * scale; // Altura reservada para la gráfica
        const graphY = logoY + logoSize + (100 * scale);
        
        // Centrar horizontalmente
        const drawX = (width - canvasElement.width) / 2;
        const drawY = graphY + ((graphHeight - canvasElement.height) / 2);
        
        ctx.drawImage(canvasElement, drawX, drawY, canvasElement.width, canvasElement.height);

        // --- E. TEXTO EXPLICATIVO EN BLANCO SUAVE ---
        // Extraemos el texto plano del bloque HTML
        const explanationText = interpBlock.innerText || "";
        
        ctx.fillStyle = '#f3f4f6'; // Blanco hueso casi puro
        ctx.font = `${16*scale}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'left';
        
        // Word wrap manual para el texto largo
        const maxWidth = width * 0.8;
        const lineHeight = 24 * scale;
        const startX = (width - maxWidth) / 2;
        let currentY = graphY + graphHeight + (40 * scale);
        
        const words = explanationText.split(/\s+/);
        let line = '';
        
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line.trim(), startX, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), startX, currentY);

        // --- F. PIE DE PÁGINA SUTIL ---
        ctx.fillStyle = '#cbd5e1';
        ctx.font = `italic ${12*scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`Valen Fashion Manizales • Reporte Automático • ${new Date().toLocaleDateString('es-CO')}`, width/2, height - (30*scale));

        // --- G. DESCARGAR COMO PNG ---
        const link = document.createElement('a');
        link.download = `Valen_${titleText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png', 1.0); // Calidad máxima
        link.click();

        showToast('✅ Imagen descargada exitosamente');

    } catch (err) {
        console.error("Error capturando gráfica:", err);
        alert('Hubo un problema generando la imagen: ' + err.message);
    }
};


// ============ CONTROLADOR VISUAL DEL COACH IA ============
window.toggleCoachModal = async function(show) {
    const modal = document.getElementById('coach-modal');
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
        void modal.offsetWidth; 
        document.body.style.overflow = 'hidden'; 
        
        // NUEVO: Cargar contexto real automáticamente al abrir
        loadInitialCoachContext(); 

    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; 
    }
};

// Helper para renderizar el contexto inicial dentro del chat area
async function loadInitialCoachContext() {
    const chatArea = document.getElementById('coach-chat-area');
    if(!chatArea) return;

    // 1. LIMPIEZA INMEDIATA: Borrar cualquier resumen ejecutivo previo o mensaje de carga duplicado
    // Esto evita que se apilen las tarjetas cada vez que abres/cierras
    const existingCards = chatArea.querySelectorAll('.coach-summary-card');
    existingCards.forEach(card => card.remove()); 
    
    // También eliminamos loaders viejos si quedaron pegados
    const oldLoader = document.getElementById('loading-coach-msg');
    if(oldLoader) oldLoader.remove();

    // 2. MOSTRAR INDICADOR DE CARGA NUEVO
    const loaderHtml = `<div id="loading-coach-msg" class="text-center py-4 opacity-60 animate-pulse text-xs text-gray-400">🔄 Analizando tus métricas en tiempo real...</div>`;
    chatArea.insertAdjacentHTML('afterbegin', loaderHtml);

    try {
        const context = await getCoachContext();
        
        // Eliminar el loader específico que acabamos de poner
        const currentLoader = document.getElementById('loading-coach-msg');
        if(currentLoader) currentLoader.remove();

        // 3. CONSTRUIR TARJETA ÚNICA Y REFRESCANTE
        // Añadimos clase 'coach-summary-card' para poder identificarla y borrarla luego
        const infoCardHtml = `
        <div class="coach-summary-card bg-gradient-to-br from-purple-900/40 to-black/40 border-l-4 border-[#D4AF37] rounded-xl p-4 shadow-lg mb-4 backdrop-blur-sm animate-fade-in-up">
            <h3 class="font-bold text-[#D4AF37] flex items-center gap-2 mb-3">
                📊 Resumen Ejecutivo Automático
            </h3>
            
            <div class="grid grid-cols-2 gap-3 text-xs sm:text-sm text-gray-300">
                <div><strong>👀 Visitas:</strong> ${context.traffic_metrics.total_registered_visits_lifetime}</div>
                <div><strong>💬 Clics WA (7d):</strong> ${context.traffic_metrics.whatsapp_interactions_last_7_days}</div>
                <div><strong>🏆 Top Cat:</strong> ${context.catalog_insights.leading_category}</div>
                <div><strong>📦 Productos:</strong> ${context.catalog_insights.total_active_products}</div>
            </div>

            <div class="mt-3 pt-3 border-t border-white/10">
                <p class="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Alertas Estratégicas:</p>
                <p class="text-emerald-400 font-medium italic">${context.strategic_alerts}</p>
            </div>
            
            <div class="mt-4 flex justify-between items-end">
                 <span class="text-[9px] text-gray-600">Generado: ${new Date(context.meta_info.generated_at).toLocaleString('es-CO')}</span>
                 <button onclick="requestDeepAnalysis()" class="bg-[#D4AF37] hover:bg-yellow-600 text-black text-[10px] font-bold px-3 py-1 rounded-full transition-colors shadow-md active:scale-95">
                    🤖 Pedir Consejo Profundo (Próx. Fase)
                 </button>
            </div>
        </div>`;

        // Insertar al principio del área de chat (siempre arriba de todo)
        chatArea.insertAdjacentHTML('afterbegin', infoCardHtml);

    } catch (err) {
        console.error(err);
        const errorMsg = `<div class="text-red-400 text-xs bg-red-900/20 p-2 rounded coach-summary-card">Error cargando contexto: ${err.message}</div>`;
        const loader = document.getElementById('loading-coach-msg');
        if(loader) loader.outerHTML = errorMsg;
    }
}


// DESCARGA PDF FORENSE INTELIGENTE
window.downloadFullReportPDF = async function() {
    showToast('⏳ Procesando evidencia digital...');
    
    try {
        const snapshot = await get(ref(db, 'valen_events'));
        const rawEvents = snapshot.exists() ? Object.values(snapshot.val()) : [];
        
        if(rawEvents.length === 0) { alert('No hay datos registrados aún.'); return; }

        const groupedByDevice = {};
        rawEvents.forEach(ev => {
                        const key = `${ev.device || 'Desconocido'}|${ev.browser || 'N/A'}`;
            if(!groupedByDevice[key]) groupedByDevice[key] = [];
            groupedByDevice[key].push(ev);
        });

        let htmlContent = `
        <div style="padding: 40px; font-family: sans-serif; background: #fff; color: #000;">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:30px; border-bottom:3px solid #a855f7; padding-bottom:20px;">
                <img src="../logo.jpg" style="width:80px; height:80px; border-radius:50%; object-fit:cover;" />
                <div>
                    <h1 style="margin:0; color:#2e1065;">Valen Fashion Manizales</h1>
                    <p style="margin:5px 0 0; color:#666; font-weight:bold;">Reporte Forense de Actividad Web</p>
                    <small style="color:#999;">Generado: ${new Date().toLocaleString('es-CO')}</small>
                </div>
            </div>
            
            <div style="background:#f3e8ff; padding:15px; border-radius:8px; margin-bottom:30px; border-left:5px solid #a855f7;">
                <strong>Resumen Ejecutivo:</strong> Detalle de interacciones organizadas por dispositivo.
            </div>
        `;

        Object.entries(groupedByDevice).forEach(([deviceKey, events]) => {
            const [deviceName, browserName] = deviceKey.split('|');
            htmlContent += `
            <div style="margin-top:30px; page-break-inside: avoid; border:1px solid #eee; border-radius:10px; overflow:hidden;">
                <div style="background:#2e1065; color:white; padding:12px 20px; display:flex; justify-content:space-between;">
                    <h3 style="margin:0; font-size:16px;">👤 ${deviceName} (${browserName})</h3>
                    <span style="background:#D4AF37; color:#000; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:bold;">${events.length} Acciones</span>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:11px;">
                    <thead>
                        <tr style="background:#f9fafb; text-align:left;">
                            <th style="padding:10px; border-bottom:1px solid #ddd; width:15%;">Hora</th>
                            <th style="padding:10px; border-bottom:1px solid #ddd; width:25%;">Acción</th>
                            <th style="padding:10px; border-bottom:1px solid #ddd; width:60%;">Contexto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.sort((a,b)=>b.timestamp-a.timestamp).slice(0,30).map(ev => {
                            const time = new Date(ev.timestamp).toLocaleTimeString('es-CO');
                            // Mapeo de acciones técnicas a lenguaje humano (igual que en la web)
const humanDescriptions = {
    page_view: '👀 Ingreso al catálogo',
    click_whatsapp_direct: '💬 Contacto principal WA',
    product_whatsapp_requested: '🛒 Pedido específico enviado',
    filter_category_selected: '🏷️ Navegación por categoría',
    search_text_typed: '⌨️ Búsqueda textual realizada',
    product_shared: '🔗 Producto compartido externamente'
};

const readableAction = humanDescriptions[ev.event] || ev.event.replace('_',' ');
const detailInfo = ev.query ? `"${ev.query}"` : (ev.product_title !== 'Sin título' ? ev.product_title : '');

return `
<tr style="border-bottom:1px solid #f3f4f6;">
    <td style="padding:8px; font-family:monospace; color:#666;">${time}</td>
    <td style="padding:8px; font-weight:bold; color:${readableAction.includes('Pedido')?'#10b981':'#ec4899'};">${readableAction}</td>
    <td style="padding:8px; color:#333;">${detailInfo || '-'}</td>
</tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
        });

    htmlContent += `</div>`;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, heightLeft);
        heightLeft -= pdf.internal.pageSize.getHeight();
        
        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, heightLeft);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        
        pdf.save(`Valen_Reporte_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.removeChild(tempDiv);
        showToast('✅ Evidencia exportada correctamente');
        
    } catch (err) {
        console.error("Error PDF:", err);
        alert('Hubo un problema generando el reporte: ' + err.message);
    }
};

function showToast(msg) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.className = 'fixed bottom-5 right-5 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-xl z-50 animate-bounce';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}


// ========================================================================
// ================== MOTOR COACH IA DUAL ENGINE v2.0 ====================
// ========================================================================

// URL DEL PUENTE SEGURO (CLOUDFLARE WORKER)
const AI_PROXY_URL = "https://broken-frog-3909.andryus0312.workers.dev";

// Configuración visual del motor (sin claves expuestas)
const AI_CONFIG = {
    groq: {
        name: "Groq", icon: "⚡", colorClass: "purple",
        model: "llama-3.1-8b-instant", // <-- Rápido, barato y siempre disponible
// O si quieres más potencia: "mixtral-8x7b-32768"
        description: "Velocidad extrema • Análisis Texto"
    },
    gemini: {
        name: "Gemini", icon: "💎", colorClass: "blue",
        model: "gemini-1.5-flash", 
        description: "Multimodal • Reasoning Profundo"
    }
};

let currentEngine = 'groq'; // Por defecto inicia con Groq
let sessionHistory = []; // Guarda el chat actual para exportar PDF

// --- FUNCIÓN MAESTRA DE INTERRUPCIÓN VISUAL ---
window.switchEngine = function(engineKey) {
    if(currentEngine === engineKey) return;
    
    currentEngine = engineKey;
    const config = AI_CONFIG[engineKey];
    
    // 1. Actualizar Header Visual
    document.getElementById('engine-icon').innerText = config.icon;
    document.getElementById('engine-title').innerHTML = `Valen Coach • ${config.name} Engine`;
    document.getElementById('engine-subtitle').innerText = config.description;
    
    // 2. Cambiar Colores Globales del Container
    const container = document.getElementById('coach-engine-container');
    const headerIcon = document.getElementById('engine-icon');
    const sendBtn = document.getElementById('btn-send-msg');
    
    // Resetear clases previas dinámicamente
    container.className = container.className.replace(/from-\[#.*?\]|to-\[#.*?\]|border-.*/g, '');
    
    if(engineKey === 'groq') {
        container.classList.add('bg-gradient-to-b', 'from-[#1a0b2e]', 'to-[#0f0518]', 'border-purple-500/40');
        headerIcon.className = "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg bg-purple-600 text-white shadow-purple-500/50";
        sendBtn.className = "bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-900/50";
        document.getElementById('btn-groq').className = "px-3 py-1.5 rounded-full text-xs font-bold bg-purple-600 text-white shadow-lg";
        document.getElementById('btn-gemini').className = "px-3 py-1.5 rounded-full text-xs font-bold text-gray-400 hover:text-white";
    } else {
        container.classList.add('bg-gradient-to-b', 'from-[#0c1e3a]', 'to-[#050d1a]', 'border-blue-500/40');
        headerIcon.className = "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg bg-blue-600 text-white shadow-blue-500/50";
        sendBtn.className = "bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/50";
        document.getElementById('btn-gemini').className = "px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg";
        document.getElementById('btn-groq').className = "px-3 py-1.5 rounded-full text-xs font-bold text-gray-400 hover:text-white";
    }

    addSystemMessage(`🔄 Cerebro cambiado a ${config.name}. Listo para nuevos desafíos.`);
};

// --- ENVIAR MENSAJE USUARIO ---
window.sendUserMessage = async function() {
    const input = document.getElementById('user-query-input');
    const text = input.value.trim();
    if(!text) return;

    addUserBubble(text);
    input.value = '';
    input.focus();

    const loaderId = showAILoading();

    try {
        const contextData = await getCoachContext();
        
        const systemPrompt = `Eres la asistente estratégica de "Valen Fashion Manizales". 
Tu dueña es una mujer emprendedora, cariñosa pero exigente con sus números.
Habla español neutro-coloquial (usa "mija", "parce" si aplica, pero mantén profesionalismo boutique).
Usa emojis estratégicos 💜✨📈.
OBJETIVO: Dar informes DETALLADOS, accionables y motivadores basados en los datos JSON provistos.
FORMATO RESPUESTA: Usa Markdown (**negritas**, listas) para facilitar lectura rápida.`;

        const fullContextString = JSON.stringify(contextData);
        
        let aiResponseText = "";

        if(currentEngine === 'groq') {
            aiResponseText = await callGroq(systemPrompt, `${fullContextString}\n\nConsulta Usuario: "${text}"`);
        } else {
            aiResponseText = await callGemini(systemPrompt, `${fullContextString}\n\nConsulta Usuario: "${text}"`);
        }

        removeLoading(loaderId);
        addAiBubble(aiResponseText);
        
        sessionHistory.push({ role: 'user', content: text });
        sessionHistory.push({ role: 'assistant', content: aiResponseText });

    } catch (err) {
        removeLoading(loaderId);
        addErrorMessage("Ups, se me fue la señal mental. Revisa conexión o clave API.");
        console.error(err);
    }
};

// --- LLAMADAS API VIA PUENTE SEGURO CLOUDFLARE ---

async function callGroq(sys, userMsg) {
    const res = await fetch(`${AI_PROXY_URL}/groq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: AI_CONFIG.groq.model,
            messages: [{role:"system",content:sys},{role:"user",content:userMsg}],
            temperature: 0.7, max_tokens: 1000
        })
    });
    // 1. Verificar si la respuesta es exitosa
    if (!res.ok) {
        const errText = await res.text();
        console.error("Error HTTP:", res.status, errText);
        throw new Error(`Servidor IA rechazó petición (${res.status}). Detalle: ${errText}`);
    }

    // 2. Intentar parsear JSON de forma segura
    let data;
    try {
        data = await res.json();
    } catch (parseErr) {
        console.error("Error parseando JSON:", parseErr);
        throw new Error("La IA devolvió un formato inválido (no es JSON).");
    }

    // 3. Validar estructura antes de acceder (evita 'undefined')
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.warn("Estructura inesperada:", data);
        throw new Error("Respuesta incompleta de Groq. Revisa logs.");
    }

    return data.choices[0].message.content;
}

async function callGemini(sys, userMsg) {
    const res = await fetch(`${AI_PROXY_URL}/gemini/${AI_CONFIG.gemini.model}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: sys + "\n\n" + userMsg }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
    });
    // 1. Verificar si la respuesta es exitosa
    if (!res.ok) {
        const errText = await res.text();
        console.error("Error HTTP:", res.status, errText);
        throw new Error(`Servidor IA rechazó petición (${res.status}). Detalle: ${errText}`);
    }

    // 2. Intentar parsear JSON de forma segura
    let data;
    try {
        data = await res.json();
    } catch (parseErr) {
        console.error("Error parseando JSON:", parseErr);
        throw new Error("La IA devolvió un formato inválido (no es JSON).");
    }

    // 3. Validar estructura antes de acceder (evita 'undefined')
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.warn("Estructura inesperada:", data);
        throw new Error("Respuesta incompleta de Groq. Revisa logs.");
    }

    return data.choices[0].message.content;
}


// --- HELPERS VISUALES CHAT ---
function addUserBubble(txt) {
    const area = document.getElementById('coach-chat-area');
    area.insertAdjacentHTML('beforeend', `
    <div class="flex justify-end animate-fade-in-up mb-2">
        <div class="bg-white/10 border border-white/20 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm text-white shadow-sm">
            ${txt}
        </div>
    </div>`);
    scrollToBottom();
}

function addAiBubble(htmlTxt) {
    const area = document.getElementById('coach-chat-area');
    // Parseo básico markdown a HTML simple
    const parsed = htmlTxt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>')
                          .replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul class="list-disc pl-5 my-2">${match}</ul>`);
    
    area.insertAdjacentHTML('beforeend', `
    <div class="flex gap-3 animate-fade-in-up mb-4">
        <div class="w-8 h-8 rounded-full ${currentEngine==='groq'?'bg-purple-600':'bg-blue-600'} flex items-center justify-center text-white text-xs shrink-0 shadow-lg">
            ${AI_CONFIG[currentEngine].icon}
        </div>
        <div class="flex-1 bg-black/40 border border-white/10 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-200 leading-relaxed shadow-inner backdrop-blur-sm">
            ${parsed}
        </div>
    </div>`);
    scrollToBottom();
}

function addSystemMessage(txt) {
    const area = document.getElementById('coach-chat-area');
    area.insertAdjacentHTML('beforeend', `
    <div class="text-center text-[10px] text-gray-500 italic py-2 border-y border-white/5 my-2">
        ${txt}
    </div>`);
    scrollToBottom();
}

function showAILoading() {
    const id = 'loader-'+Date.now();
    const area = document.getElementById('coach-chat-area');
    area.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="flex gap-3 mb-4 opacity-70">
        <div class="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
        <div class="flex-1 bg-black/20 rounded-2xl p-4 h-12 animate-pulse"></div>
    </div>`);
    scrollToBottom();
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}

function addErrorMsg(msg) {
    const area = document.getElementById('coach-chat-area');
    area.insertAdjacentHTML('beforeend', `
    <div class="bg-red-900/30 border-l-4 border-red-500 p-3 rounded text-red-200 text-xs mb-4">
        ❌ ${msg}
    </div>`);
}

function scrollToBottom() {
    const area = document.getElementById('coach-chat-area');
    setTimeout(() => area.scrollTop = area.scrollHeight, 50);
}

// --- INICIALIZACIÓN AUTOMÁTICA AL ABRIR ---
// Sobreescribimos temporalmente toggleCoachModal para lanzar reporte inicial
const originalToggle = window.toggleCoachModal;
window.toggleCoachModal = async function(show) {
    originalToggle(show);
    if(show) {
        setTimeout(async () => {
            if(sessionHistory.length === 0) {
                await autoGenerateInitialReport();
            }
        }, 800);
    }
};

async function autoGenerateInitialReport() {
    const loaderId = showAILoading();
    try {
        const ctx = await getCoachContext();
        const promptSys = `Genera un INFORME DIARIO COMPLETO para Valen Fashion. 
Datos: ${JSON.stringify(ctx)}.
Estructura obligatoria:
1. 📊 Resumen Vital (Visitas/Conversiones).
2. 🔥 Top Ventas & Alertas Stock.
3. 💡 Recomendación Accionable HOY.
Sé detallada pero concisa. Usa emojis.`;
        
        let resp = "";
        if(currentEngine === 'groq') resp = await callGroq(promptSys, "");
        else resp = await callGemini(promptSys, "");
        
        removeLoading(loaderId);
        addAiBubble(resp);
        sessionHistory.push({role:'system_init', content:resp});
        
    } catch(e) {
        removeLoading(loaderId);
        // Muestra el error técnico real para diagnóstico sin consola
        addErrorMsg(`❌ DETALLE ERROR:<br/><small>${e.message || e.toString()}</small>`);
        console.error("Fallo IA:", e); 
    }
}
// ========================================================================
