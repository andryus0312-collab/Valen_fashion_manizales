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

// ============ MOTOR DE DATOS UNIFICADO (v3 - SIN ERRORES DE SCOPE) ============

let cachedEvents = []; // Cache global para evitar múltiples lecturas pesadas

function loadDashboardData() {
    // 1. Productos (Inmediato)
    onValue(ref(db, 'valen_products'), snap => {
        const products = snap.val() ? Object.values(snap.val()) : [];
        document.getElementById('total-products').innerText = products.length;
        renderCategoriesChart(products); 
    });

    // 2. Perfil + Testimonios (Inmediato)
    onValue(ref(db, 'valen_profile'), snap => {
        const profile = snap.val() || {};
        document.getElementById('total-testimonials').innerText = (profile.testimonials || []).length;
    });

    // 3. EVENTOS EN TIEMPO REAL (Fuente única de verdad)
    onValue(ref(db, 'valen_events'), (snapshot) => {
        const rawData = snapshot.val();
        cachedEvents = rawData ? Object.keys(rawData).map(k => ({ id: k, ...rawData[k] })) : [];
        
        // Ordenar descendente siempre
        cachedEvents.sort((a, b) => b.timestamp - a.timestamp);

        updateAllMetricsAndVisuals(cachedEvents);
    });
}

// Función maestra que actualiza TARJETAS + GRÁFICAS + TABLA + CALENDARIO
function updateAllMetricsAndVisuals(events) {
    if (!events) return;

    // --- A. CALCULAR MÉTRICOS GLOBALES ---
    let totalVisits = 0;
    let waClicks = 0;
    const deviceMap = {}; // Conteo por tipo de dispositivo
    
    events.forEach(ev => {
        if (ev.event === 'page_view') totalVisits++;
        if (ev.event.includes('whatsapp')) waClicks++;
        
        // Agrupar dispositivos
        const devType = ev.device?.includes('Celular') ? '📱 Celular' : 
                        ev.device?.includes('PC') ? '💻 PC' : '📟 Tablet/Otros';
        deviceMap[devType] = (deviceMap[devType] || 0) + 1;
    });

    // Actualizar Tarjetas Superiores
    document.getElementById('total-visits').innerText = totalVisits.toLocaleString('es-CO');
    document.getElementById('total-whatsapp').innerText = waClicks.toLocaleString('es-CO');

    // --- B. REDIBUJAR GRÁFICAS ---
    
    // Gráfica Dispositivos (Doughnut dinámico)
    const labelsDev = Object.keys(deviceMap);
    const dataDev = Object.values(deviceMap);
    renderDevicesDynamic(labelsDev, dataDev);

    // Gráfica Visitas Últimos 7 Días (Line chart real)
    const dailyCounts = getLast7DaysData(events);
    renderVisitsDynamic(dailyCounts.labels, dailyCounts.data);

    // --- C. ACTUALIZAR TABLA MONITOR ---
    renderLiveConsoleTable(events);

    // --- D. RENDERIZAR CALENDARIO COMERCIAL ---
    renderCommercialCalendar(); // Esta función ya existe arriba, solo la llamamos aquí si se perdió
}

// Utilitario: Datos últimos 7 días reales
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
        // Contar cuántos page_view hubo ese día exacto
        const count = events.filter(ev => ev.event === 'page_view' && ev.isoDate.startsWith(keyStr)).length;
        data.push(count);
    }
    return { labels, data };
}

// --- NUEVAS FUNCIONES DE GRÁFICA ROBUSTAS ---
function renderDevicesDynamic(labels, data) {
    const ctx = document.getElementById('chart-devices');
    if(!ctx) return;
    
    // Destruir instancia previa si existe
    if(window.myDeviceChart) window.myDeviceChart.destroy();
    
    window.myDeviceChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#ec4899', '#a855f7', '#D4AF37', '#9333ea'],
                borderWidth: 0, hoverOffset: 15
            }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
    });
}

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
}

// --- TABLA MONITOR PREMIUM (Renderizado directo) ---
function renderLiveConsoleTable(allEvents) {
    const container = document.getElementById('live-events-body');
    if (!container) return;

    const recent = allEvents.slice(0, 15); // Solo últimos 15 visibles

    if (recent.length === 0) {
        container.innerHTML = '<div class="py-8 text-center text-desc italic">🌵 Esperando señales vitales...</div>';
        return;
    }

    const names = {
        page_view: '👀 Entrada', click_whatsapp_direct: '💬 WA Main',
        click_instagram_link: '📸 Insta', click_qr_button: '🔳 QR',
        click_testimonials_btn: '👑 Testi', click_search_btn: '🔍 Search',
        filter_category_selected: '🏷️ Filter', search_text_typed: '⌨️ Typing',
        product_image_zoomed: '🖼️ Zoom', product_whatsapp_requested: '🛒 Order',
        product_shared: '🔗 Share'
    };

    container.innerHTML = recent.map(ev => {
        const time = new Date(ev.timestamp).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
        const act = names[ev.event] || ev.event.replace('_',' ');
        const det = ev.query ? `"${ev.query}"` : (ev.product_title || '-');
        
        return `
        <div class="console-row">
            <div class="console-td font-mono text-[#D4AF37]">${time}</div>
            <div class="console-td"><span class="action-badge">${act}</span></div>
            <div class="console-td text-purple-300">${ev.device||'?'}</div>
            <div class="console-td text-gray-400">${ev.browser||'?'}</div>
            <div class="console-td text-xs opacity-70">${ev.language||'-'}</div>
            <div class="console-td truncate max-w-[150px]" title="${det}">${det}</div>
            <div class="console-td"><span class="status-dot" style="width:6px;height:6px;"></span></div>
        </div>`;
    }).join('');
}
        

window.openHistoryModal = function() {
    const modal = document.getElementById('history-modal');
    if(!modal) return;
    
    // Obtener todos los eventos actuales almacenados en memoria o volver a leer
    onValue(ref(db, 'valen_events'), (snap) => {
        const events = snap.val() ? Object.values(snap.val()).sort((a,b)=>b.timestamp-a.timestamp) : [];
        const listContainer = document.getElementById('history-list-container');
        
        listContainer.innerHTML = events.slice(0, 50).map(ev => {
             const d = new Date(ev.timestamp);
             return `<div class="p-3 border-b border-white/10 text-xs flex justify-between items-start gap-2">
                <div>
                    <span class="font-bold text-[#D4AF37] block mb-1">${ev.event.replace('_',' ').toUpperCase()}</span>
                    <span class="text-gray-400">${ev.device} • ${ev.browser}</span><br/>
                    <span class="italic text-purple-300">${ev.query || ev.product_title || '-'}</span>
                </div>
                <span class="text-gray-500 whitespace-nowrap">${d.toLocaleDateString()} ${d.toLocaleTimeString()}</span>
             </div>`;
        }).join('') || '<p class="text-center py-4 text-desc">Sin historial reciente.</p>';
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }, { onlyOnce: true });
};

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('history-modal');
    if (modal && !modal.classList.contains('hidden') && e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
});

// Llamarla cuando cargue el dashboard
const originalLoadDashboard = loadDashboardData;
loadDashboardData = function() {
    originalLoadDashboard.call(this);
    renderLiveEventsTable();
};

// ============ MODO CLARO/OSCURO EN STATS ============
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
    
    // Actualizar colores de las gráficas
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

// Inicializar tema al cargar
initStatsTheme();


window.downloadFullReportPDF = async function() {
    showToast('⏳ Generando reporte experto...');
    
    try {
        // 1. Leer todos los eventos
        const snapshot = await get(ref(db, 'valen_events'));
        const rawEvents = snapshot.exists() ? Object.values(snapshot.val()) : [];
        
        if(rawEvents.length === 0) { alert('No hay datos aún.'); return; }

        // 2. Agrupar por Dispositivo (Device ID simulado por UserAgent+Screen)
        const groupedByDevice = {};
        rawEvents.forEach(ev => {
            const key = `${ev.device}|${ev.browser}`;
            if(!groupedByDevice[key]) groupedByDevice[key] = [];
            groupedByDevice[key].push(ev);
        });

        // 3. Construir HTML Temporal para captura
        let htmlContent = `
        <div style="padding: 40px; font-family: sans-serif; background: #fff; color: #000;">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:30px; border-bottom:3px solid #a855f7; padding-bottom:20px;">
                <img src="../logo.jpg" style="width:80px; height:80px; border-radius:50%; object-fit:cover;" />
                <div>
                    <h1 style="margin:0; color:#2e1065;">Valen Fashion Manizales</h1>
                    <p style="margin:5px 0 0; color:#666;">Reporte Forense de Actividad Web</p>
                    <small style="color:#999;">Generado: ${new Date().toLocaleString('es-CO')}</small>
                </div>
            </div>
            
            <div style="background:#f3e8ff; padding:15px; border-radius:8px; margin-bottom:20px; border-left:5px solid #a855f7;">
                <strong>Resumen Ejecutivo:</strong> Este documento detalla cada interacción registrada en tiempo real, organizada por perfil de dispositivo para facilitar el análisis de comportamiento del cliente.
            </div>
        `;

        Object.entries(groupedByDevice).forEach(([deviceKey, events], index) => {
            const [deviceName, browserName] = deviceKey.split('|');
            const firstEvent = events[events.length-1]; // El más viejo
            
            htmlContent += `
            <div style="margin-top:30px; page-break-inside: avoid;">
                <h3 style="background:#eee; padding:10px; border-radius:5px; display:inline-block; font-size:14px;">
                    👤 Perfil: ${deviceName} (${browserName})
                </h3>
                <p style="font-size:12px; color:#666; margin-top:5px;">Total acciones detectadas: ${events.length}</p>
                
                <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:11px;">
                    <thead>
                        <tr style="background:#2e1065; color:white;">
                            <th style="padding:8px; text-align:left;">Hora</th>
                            <th style="padding:8px; text-align:left;">Evento</th>
                            <th style="padding:8px; text-align:left;">Contexto/Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.sort((a,b)=>b.timestamp-a.timestamp).slice(0,20).map(ev => `
                        <tr style="border-bottom:1px solid #ddd;">
                            <td style="padding:6px;">${new Date(ev.timestamp).toLocaleTimeString()}</td>
                            <td style="padding:6px; font-weight:bold; color:${ev.event.includes('whatsapp')?'green':'purple'};">${ev.event}</td>
                            <td style="padding:6px;">${ev.query || ev.product_title || '-'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        });

        htmlContent += `</div>`;

        // 4. Renderizar y Convertir a PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Valen_Reporte_Actividad_${new Date().toISOString().split('T')[0]}.pdf`);
        
        document.body.removeChild(tempDiv);
        showToast('✅ Reporte descargado exitosamente');
        
    } catch (err) {
        console.error(err);
        alert('Error generando PDF: ' + err.message);
    }
};
