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
    const dailyCounts = getLast7DaysData(events);
    renderVisitsDynamic(dailyCounts.labels, dailyCounts.data);
    
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
    
    // Destruir instancia previa
    if(chartInstances.visits) chartInstances.visits.destroy();

    // 1. Preparar estructura de datos Matricial (7 Días x 24 Horas)
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const matrixData = Array(7).fill().map(() => Array(24).fill(0));
    
    // 2. Rellenar matriz con eventos reales
    eventsList.forEach(ev => {
        if (ev.event === 'page_view' && ev.timestamp) {
            const dateObj = new Date(ev.timestamp);
            const dayIndex = dateObj.getDay(); // 0=Domingo ... 6=Sábado
            const hour = dateObj.getHours();   // 0-23
            
            // Incrementar contador en esa celda específica
            if(matrixData[dayIndex]) {
                matrixData[dayIndex][hour]++;
            }
        }
    });

    // 3. Configurar Chart.js como Scatter Plot (Puntos dispersos)
    // Usamos scatter porque nos permite controlar X (hora) e Y (día) manualmente
    const datasets = [];
    
    days.forEach((dayName, dayIdx) => {
        const pointsForDay = [];
        
        for(let h=0; h<24; h++) {
            const count = matrixData[dayIdx][h];
            if(count > 0) {
                // Solo creamos punto si hubo actividad (>0)
                pointsForDay.push({
                    x: h,          // Eje Horizontal: Hora Militar (0-23)
                    y: dayIdx,     // Eje Vertical: Índice del Día (0-6)
                    r: Math.min(count * 2 + 3, 15), // Radio proporcional a visitas (mín 3, máx 15)
                    label: `${count} visitas`,
                    tooltipLabel: `${dayName} ${String(h).padStart(2,'0')}:00 hrs - ${count} entradas`
                });
            }
        }
        
        if(pointsForDay.length > 0) {
            datasets.push({
                label: dayName,
                data: pointsForDay,
                backgroundColor: getColorByIntensity(dayIdx), // Color según día
                borderColor: '#fff',
                borderWidth: 1
            });
        }
    });

    // Función auxiliar para colores atractivos por día
    function getColorByIntensity(idx) {
        const palette = [
            'rgba(236, 72, 153, 0.8)', // Dom (Rosa)
            'rgba(168, 85, 247, 0.8)', // Lun (Morado)
            'rgba(99, 102, 241, 0.8)', // Mar (Indigo)
            'rgba(59, 130, 246, 0.8)', // Mié (Azul)
            'rgba(14, 165, 233, 0.8)', // Jue (Celeste)
            'rgba(20, 184, 166, 0.8)', // Vie (Turquesa)
            'rgba(245, 158, 11, 0.8)'  // Sáb (Ámbar/Dorado)
        ];
        return palette[idx % palette.length];
    }

    chartInstances.visits = new Chart(ctx.getContext('2d'), {
        type: 'bubble', // Bubble permite radios variables fácilmente
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Ocultamos leyenda tradicional
                tooltip: {
                    callbacks: {
                        title: () => '', // Sin título en tooltip
                        label: (context) => context.raw.tooltipLabel
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -0.5, max: 23.5,
                    ticks: {
                        stepSize: 1,
                        callback: value => String(value).padStart(2,'0') + ':00', // Formato HH:MM
                        font: { size: 10, weight: 'bold' },
                        color: '#a855f7'
                    },
                    grid: { color: 'rgba(168, 85, 247, 0.1)' }
                },
                y: {
                    reverse: true, // Sábado arriba, Domingo abajo (o viceversa según prefieras)
                    min: -0.5, max: 6.5,
                    ticks: {
                        stepSize: 1,
                        callback: value => days[value] || '', // Mostrar nombres completos
                        font: { size: 12, weight: 'bold' },
                        color: '#ec4899'
                    },
                    grid: { color: 'rgba(236, 72, 153, 0.1)' }
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
