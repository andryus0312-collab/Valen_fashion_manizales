import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyARk7mqSf7C24v4nu0aIx8zoizoewdFAyY",
    authDomain: "valen-fashion-manizales.firebaseapp.com",
    databaseURL: "https://valen-fashion-manizales-default-rtdb.firebaseio.com",
    projectId: "valen-fashion-manizales",
    storageBucket: "valen-fashion-manizales.firebasestorage.app",
    messagingSenderId: "644464075923",
    appId: "1:644464075923:web:0e0aebd0882fc07a7cd966",
    measurementId: "G-4QM38XDBXB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ============ AUTH ============
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
        loadDashboardData();
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
});

// ============ MOTOR UNIFICADO v4 (GRÁFICAS REALES + TEXTO DINÁMICO + CALENDARIO TEMATIZADO + MONITOR MEJORADO) ============

let cachedEvents = [];

function loadDashboardData() {
    // Productos
    onValue(ref(db, 'valen_products'), snap => {
        const products = snap.val() ? Object.values(snap.val()) : [];
        document.getElementById('total-products').innerText = products.length;
        renderCategoriesChart(products); 
    });

    // Perfil + Testimonios
    onValue(ref(db, 'valen_profile'), snap => {
        const profile = snap.val() || {};
        document.getElementById('total-testimonials').innerText = (profile.testimonials || []).length;
    });

    // Eventos en tiempo real
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

    document.getElementById('total-visits').innerText = totalVisits.toLocaleString('es-CO');
    document.getElementById('total-whatsapp').innerText = waClicks.toLocaleString('es-CO');

    renderDevicesDynamic(deviceMap, totalVisits);
    const dailyCounts = getLast7DaysData(events);
    renderVisitsDynamic(dailyCounts.labels, dailyCounts.data);
    renderLiveConsoleTable(events);
    renderThemedCalendar(); // ← NUEVO: Calendario tematizado
}

// --- GRÁFICA DISPOSITIVOS CON TEXTO DINÁMICO ---
function renderDevicesDynamic(deviceMap, totalVisits) {
    const ctx = document.getElementById('chart-devices');
    if(!ctx) return;
    if(window.myDeviceChart) window.myDeviceChart.destroy();
    
    const labels = Object.keys(deviceMap);
    const data = Object.values(deviceMap);
    
    window.myDeviceChart = new Chart(ctx.getContext('2d'), {
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

    // Texto dinámico según datos reales
    const mobileCount = deviceMap['📱 Celular'] || 0;
    const pcCount = deviceMap['💻 PC'] || 0;
    const pctMobile = totalVisits > 0 ? Math.round((mobileCount/totalVisits)*100) : 0;
    
    const interpEl = document.querySelector('#card-devices .interp-text');
    const actionEl = document.querySelector('#card-devices .interp-action');
    
    if(interpEl && actionEl) {
        if(pctMobile >= 60) {
            interpEl.innerHTML = `✨ <strong>${pctMobile}% de tus clientas entran desde celular</strong> 📱. Tu tienda vive principalmente en pantallas pequeñas.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Prioriza fotos verticales optimizadas para móvil. Publica historias de Instagram entre 7pm-9pm.`;
        } else if(pcCount > mobileCount) {
            interpEl.innerHTML = `💻 <strong>Tu público prefiere PC (${Math.round((pcCount/totalVisits)*100)}%)</strong>. Están investigando con calma.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Aprovecha emails promocionales largos. Sube guías descargables de productos.`;
        } else {
            interpEl.innerHTML = `⚖️ <strong>Mix equilibrado de dispositivos</strong>. Tienes variedad de públicos navegando tu catálogo.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Mantén diseño responsive impecable. No descuides ningún formato.`;
        }
    }
}

// --- GRÁFICA VISITAS CON TEXTO DINÁMICO ---
function renderVisitsDynamic(labels, data) {
    const ctx = document.getElementById('chart-visits');
    if(!ctx) return;
    if(window.myVisitsChart) window.myVisitsChart.destroy();
    
    const gradient = ctx.getContext('2d').createLinearGradient(0,0,0,300);
    gradient.addColorStop(0,'rgba(168,85,247,0.4)');
    gradient.addColorStop(1,'rgba(168,85,247,0.0)');

    window.myVisitsChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Visitas Diarias',
                data: data,
                borderColor: '#a855f7',
                backgroundColor: gradient,
                tension: 0.4, fill: true,
                pointBackgroundColor: '#D4AF37', pointRadius: 5
            }]
        },
        options: { 
            responsive:true, maintainAspectRatio:false,
            scales: { y: { beginAtZero:true, ticks:{stepSize:1} } } 
        }
    });

    // Texto dinámico basado en tendencia real
    const todayVal = data[data.length-1];
    const yesterdayVal = data[data.length-2] || 0;
    const weekAvg = data.reduce((a,b)=>a+b,0)/data.length;
    
    const interpEl = document.querySelector('#card-visits .interp-text');
    const actionEl = document.querySelector('#card-visits .interp-action');
    
    if(interpEl && actionEl) {
        if(todayVal > yesterdayVal * 1.3) {
            interpEl.innerHTML = `📈 <strong>Hoy hubo un pico de visitas (+${Math.round(((todayVal-yesterdayVal)/yesterdayVal)*100)}%)</strong>. Algo está funcionando muy bien.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Identifica qué publicaste hoy y repítelo mañana. Capitaliza el momentum.`;
        } else if(todayVal < weekAvg * 0.5) {
            interpEl.innerHTML = `📉 <strong>Bajón notable hoy</strong> vs promedio semanal. Posible saturación o falta de promoción activa.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Envía recordatorio suave por WhatsApp a clientas recurrentes. Reactiva interés.`;
        } else {
            interpEl.innerHTML = `➡️ <strong>Flujo estable</strong> (~${Math.round(weekAvg)} visitas/día). Buena consistencia general.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Experimenta con nuevos horarios/publicaciones para superar ese techo actual.`;
        }
    }
}

// --- GRÁFICA CATEGORÍAS CON TEXTO DINÁMICO (CORREGIDA) ---
function renderCategoriesChart(products) {
    const counts = { hogar: 0, ninos: 0, ropa: 0, tendidos: 0, relojes: 0, zapatos: 0, gafas: 0 };
    products.forEach(p => { if(counts[p.category] !== undefined) counts[p.category]++; });
    
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).filter(([_,v])=>v>0);
    const leader = sorted[0];
    const second = sorted[1];
    
    const catNames = {hogar:'Hogar',ninos:'Niños',ropa:'Ropa',tendidos:'Tendidos',relojes:'Reloj',zapatos:'Zapato',gafas:'Gafa'};
    
    const ctx = document.getElementById('chart-categories');
    if(!ctx) return;
    if(window.myCatChart) window.myCatChart.destroy();
    
    window.myCatChart = new Chart(ctx.getContext('2d'), {
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

    // Texto dinámico real
    const interpEl = document.querySelector('#card-categories .interp-text');
    const actionEl = document.querySelector('#card-categories .interp-action');
    
    if(interpEl && actionEl && leader) {
        if(second && leader[1] > second[1]*1.5) {
            interpEl.innerHTML = `🔥 <strong>${catNames[leader[0]]} domina con ${leader[1]} productos</strong>. Es tu categoría estrella indiscutible.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Refuerza esta línea con combos temáticos. Considera landing page dedicada.`;
        } else if(second) {
            interpEl.innerHTML = `⚖️ <strong>Catálogo balanceado:</strong> ${catNames[leader[0]]} (${leader[1]}) y ${catNames[second[0]]} (${second[1]}) compiten sanamente.`;
            actionEl.innerHTML = `👉 <strong>Acción:</strong> Cruza categorías en promos ("Compra Hogar + llévate descuento en Niños").`;
        }
    }
}

// --- CALENDARIO COMERCIAL TEMATIZADO (RESTAURADO Y MEJORADO) ---
function renderThemedCalendar() {
    const container = document.getElementById('commercial-calendar');
    if(!container) return;
    
    const themes = {
        halloween: { bg:'linear-gradient(135deg,#ff6b35,#1a1a2e)', text:'#ffffff', accent:'#ffd700', emoji:'🎃', strategy:'Sube disfraces infantiles y peluches oscuros. Promo "Noche de Miedo" 2x1.' },
        blackfriday: { bg:'linear-gradient(135deg,#000000,#4b0082)', text:'#ffffff', accent:'#ff00ff', emoji:'🛍️', strategy:'Ofertas flash 24h. Combos Hogar+Niños con envío gratis Manizales.' },
        navidad: { bg:'linear-gradient(135deg,#0f5132,#dc3545)', text:'#ffffff', accent:'#ffd700', emoji:'🎄', strategy:'Regalos navideños: cobijas suaves + peluches gigantes. Etiqueta dorada especial.' },
        madre: { bg:'linear-gradient(135deg,#ffc0cb,#ff69b4)', text:'#2d1b36', accent:'#8b0000', emoji:'💐', strategy:'Sets de tocador + flores artificiales. Mensaje emocional: "Ella merece lo mejor".' },
        amor: { bg:'linear-gradient(135deg,#ff1493,#8a2be2)', text:'#ffffff', accent:'#ffd700', emoji:'💘', strategy:'Parejas: 2 peluches iguales + cupón cena romántica local aliado.' },
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

// --- TABLA MONITOR MEJORADA (FECHAS COMPLETAS + DESCRIPCIONES CONTEXTUALES) ---
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

// --- UTILITARIOS EXISTENTES (mantener igual) ---
function getLast7DaysData(events) { /* ... misma lógica anterior ... */ }
function initStatsTheme() { /* ... existente ... */ }
window.toggleStatsTheme = function() { /* ... existente ... */ }
window.openHistoryModal = function() { /* ... existente pero mejorado abajo ... */ }
window.downloadFullReportPDF = async function() { /* ... existente pero mejorado abajo ... */ }
