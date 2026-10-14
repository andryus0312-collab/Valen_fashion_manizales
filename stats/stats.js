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

// ============ FUNCIONES DE SOPORTE Y EXPORTACIÓN (CIERRE DEFINITIVO) ============

// 1. Utilitario para calcular visitas diarias últimos 7 días
function getLast7DaysData(events) {
    const today = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        
        // Formato YYYY-MM-DD para comparar con isoDate de eventos
        const keyStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const dayName = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
        
        labels.push(dayName);
        
        // Contar page_view exactos de ese día
        const count = events.filter(ev => 
            ev.event === 'page_view' && 
            ev.isoDate && 
            ev.isoDate.startsWith(keyStr)
        ).length;
        
        data.push(count);
    }
    return { labels, data };
}

// 2. Inicialización de Tema Claro/Oscuro en Stats
function initStatsTheme() {
    const savedTheme = localStorage.getItem('valen_theme') || 'light';
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
    
    // Actualizar colores de gráficas dinámicamente
    updateChartsTheme(isDark);
};

function updateChartsTheme(isDark) {
    const textColor = isDark ? '#f3f4f6' : '#2d1b36';
    const gridColor = isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)';
    
    Chart.helpers.each(Chart.instances, function(instance) {
        if (instance.options.scales) {
            if (instance.options.scales.x) {
                instance.options.scales.x.ticks.color = textColor;
                instance.options.scales.x.grid.color = gridColor;
            }
            if (instance.options.scales.y) {
                instance.options.scales.y.ticks.color = textColor;
                instance.options.scales.y.grid.color = gridColor;
            }
        }
        if (instance.options.plugins && instance.options.plugins.legend) {
            instance.options.plugins.legend.labels.color = textColor;
        }
        instance.update();
    });
}

// 3. Generador de PDF Forense Inteligente (Agrupado por Dispositivo)
window.downloadFullReportPDF = async function() {
    showToast('⏳ Procesando evidencia digital...');
    
    try {
        // Leer todos los eventos desde Firebase
        const snapshot = await get(ref(db, 'valen_events'));
        const rawEvents = snapshot.exists() ? Object.values(snapshot.val()) : [];
        
        if(rawEvents.length === 0) { 
            alert('No hay datos registrados aún.'); 
            return; 
        }

        // Agrupar por Dispositivo + Navegador
        const groupedByDevice = {};
        rawEvents.forEach(ev => {
            const key = `${ev.device || 'Desconocido'}|${ev.browser || 'N/A'}`;
            if(!groupedByDevice[key]) groupedByDevice[key] = [];
            groupedByDevice[key].push(ev);
        });

        // Construir HTML Temporal Profesional
        let htmlContent = `
        <div style="padding: 40px; font-family: 'Segoe UI', sans-serif; background: #ffffff; color: #000;">
            
            <!-- HEADER CORPORATIVO -->
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:30px; border-bottom:3px solid #a855f7; padding-bottom:20px;">
                <img src="../logo.jpg" style="width:80px; height:80px; border-radius:50%; object-fit:cover; box-shadow:0 4px 10px rgba(0,0,0,0.1);" />
                <div>
                    <h1 style="margin:0; color:#2e1065; font-size:24px;">Valen Fashion Manizales</h1>
                    <p style="margin:5px 0 0; color:#666; font-weight:bold;">Reporte Forense de Actividad Web</p>
                    <small style="color:#999;">Generado automáticamente: ${new Date().toLocaleString('es-CO')}</small>
                </div>
            </div>
            
            <!-- RESUMEN EJECUTIVO -->
            <div style="background:#f3e8ff; padding:15px; border-radius:8px; margin-bottom:30px; border-left:5px solid #a855f7;">
                <strong style="color:#6b21a8;">📊 Resumen Ejecutivo:</strong><br/>
                Este documento detalla cada interacción registrada en tiempo real, organizada por perfil de dispositivo para facilitar el análisis de comportamiento del cliente. Se incluyen timestamps exactos, contexto de navegación y acciones específicas realizadas.
            </div>
        `;

        // CICLO POR DISPOSITIVO
        Object.entries(groupedByDevice).forEach(([deviceKey, events], index) => {
            const [deviceName, browserName] = deviceKey.split('|');
            const totalActions = events.length;
            
            htmlContent += `
            <div style="margin-top:30px; page-break-inside: avoid; border:1px solid #eee; border-radius:10px; overflow:hidden;">
                
                <!-- CABECERA DEL PERFIL -->
                <div style="background:#2e1065; color:white; padding:12px 20px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:16px;">👤 Perfil: ${deviceName} (${browserName})</h3>
                    <span style="background:#D4AF37; color:#000; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:bold;">${totalActions} Acciones</span>
                </div>
                
                <!-- TABLA DE EVENTOS DE ESTE DISPOSITIVO -->
                <table style="width:100%; border-collapse:collapse; font-size:11px;">
                    <thead>
                        <tr style="background:#f9fafb; text-align:left;">
                            <th style="padding:10px; border-bottom:1px solid #ddd; width:15%;">Hora Exacta</th>
                            <th style="padding:10px; border-bottom:1px solid #ddd; width:25%;">Acción Realizada</th>
                            <th style="padding:10px; border-bottom:1px solid #ddd; width:60%;">Contexto / Detalle Técnico</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.sort((a,b)=>b.timestamp-a.timestamp).slice(0,30).map(ev => {
                            const time = new Date(ev.timestamp).toLocaleTimeString('es-CO');
                            const action = ev.event.replace('_',' ').toUpperCase();
                            const context = ev.query ? `"${ev.query}"` : (ev.product_title || '-');
                            
                            // Color coding simple para visibilidad
                            const color = action.includes('WHATSAPP') ? '#10b981' : 
                                          action.includes('SEARCH') ? '#3b82f6' : 
                                          action.includes('CLICK') ? '#ec4899' : '#6b7280';
                                          
                            return `
                            <tr style="border-bottom:1px solid #f3f4f6;">
                                <td style="padding:8px; font-family:monospace; color:#666;">${time}</td>
                                <td style="padding:8px; font-weight:bold; color:${color};">${action}</td>
                                <td style="padding:8px; color:#333;">${context}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                
                ${totalActions > 30 ? `<div style="text-align:right; padding:5px 10px; font-size:10px; color:#999;">+${totalActions-30} registros adicionales omitidos en vista previa...</div>` : ''}
            </div>`;
        });

        htmlContent += `
            <div style="margin-top:40px; text-align:center; font-size:10px; color:#aaa; border-top:1px dashed #ccc; padding-top:10px;">
                © ${new Date().getFullYear()} Valen Fashion Manizales • Sistema de Monitoreo Automático v4.0
            </div>
        </div>`;

        // RENDERIZADO Y CONVERSIÓN A PDF
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
        
        // Manejo multi-página básico si es muy largo
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
        
        pdf.save(`Valen_Reporte_Forense_${new Date().toISOString().split('T')[0]}.pdf`);
        
        document.body.removeChild(tempDiv);
        showToast('✅ Evidencia exportada correctamente');
        
    } catch (err) {
        console.error("Error PDF:", err);
        alert('Hubo un problema generando el reporte: ' + err.message);
    }
};

// Helper Toast visual
function showToast(msg) {
    const toast = document.createElement('div');
    toast.innerText = msg;
    toast.className = 'fixed bottom-5 right-5 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-xl z-50 animate-bounce';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- UTILITARIOS EXISTENTES (mantener igual) ---
function getLast7DaysData(events) { /* ... misma lógica anterior ... */ }
function initStatsTheme() { /* ... existente ... */ }
window.toggleStatsTheme = function() { /* ... existente ... */ }
window.openHistoryModal = function() { /* ... existente pero mejorado abajo ... */ }
window.downloadFullReportPDF = async function() { /* ... existente pero mejorado abajo ... */ }
