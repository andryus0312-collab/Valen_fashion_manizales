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

// ============ DATOS DEL DASHBOARD ============
function loadDashboardData() {
    // Productos
    onValue(ref(db, 'valen_products'), snap => {
        const products = snap.val() ? Object.values(snap.val()) : [];
        document.getElementById('total-products').innerText = products.length;
        renderCategoriesChart(products);
    });

    // Testimonios
    onValue(ref(db, 'valen_profile'), snap => {
        const profile = snap.val() || {};
        const testimonials = profile.testimonials || [];
        document.getElementById('total-testimonials').innerText = testimonials.length;
    });

    // Visitas e interacciones (simuladas por ahora — luego las registramos)
    document.getElementById('total-visits').innerText = '—';
    document.getElementById('total-whatsapp').innerText = '—';
    
    renderDevicesChart();
    renderVisitsChart();
    renderCommercialCalendar();
}

// ============ GRÁFICAS MEJORADAS ============
function renderDevicesChart() {
    const ctx = document.getElementById('chart-devices').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['📱 Celular', '💻 PC', '📟 Tablet'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: ['#ec4899', '#a855f7', '#D4AF37'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                tooltip: {
                    backgroundColor: 'rgba(27, 12, 27, 0.9)',
                    titleColor: '#D4AF37',
                    bodyColor: '#fff',
                    borderColor: '#D4AF37',
                    borderWidth: 1
                }
            },
            animation: { animateRotate: true, animateScale: true }
        }
    });
}

function renderCategoriesChart(products) {
    const counts = { hogar: 0, ninos: 0, ropa: 0, tendidos: 0 };
    products.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });
    
    // Encontrar la categoría líder
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const leader = sorted[0];
    const second = sorted[1];
    const leaderName = { hogar: 'Hogar', ninos: 'Niños', ropa: 'Ropa', tendidos: 'Tendidos' }[leader[0]];
    const secondName = { hogar: 'Hogar', ninos: 'Niños', ropa: 'Ropa', tendidos: 'Tendidos' }[second[0]];
    
    // Generar tip dinámico
    let dynamicTip = '';
    if (leader[1] > second[1] * 1.5) {
        dynamicTip = `🔥 <strong>${leaderName} domina tu catálogo</strong> con ${leader[1]} productos. Es tu categoría estrella.`;
    } else {
        dynamicTip = `⚖️ <strong>${leaderName} y ${secondName} están parejos</strong> (${leader[1]} vs ${second[1]}). Tienes un catálogo equilibrado.`;
    }
    
    const ctx = document.getElementById('chart-categories').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['🏠 Hogar', '🧸 Niños', '👗 Ropa', '🛏️ Tendidos'],
            datasets: [{
                label: 'Productos',
                data: [counts.hogar, counts.ninos, counts.ropa, counts.tendidos],
                backgroundColor: ['#a855f7', '#ec4899', '#D4AF37', '#9333ea'],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(168, 85, 247, 0.1)' } },
                x: { grid: { display: false } }
            },
            animation: { duration: 1500, easing: 'easeOutQuart' }
        }
    });
    
    // Actualizar interpretación dinámica
    const interpEl = document.querySelector('#card-categories .interp-text');
    if (interpEl) {
        interpEl.innerHTML = `${dynamicTip} Tienes ${products.length} productos activos en total.`;
    }
}

function renderVisitsChart() {
    const ctx = document.getElementById('chart-visits').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Visitas',
                data: [12, 19, 15, 25, 22, 30, 28],
                borderColor: '#a855f7',
                backgroundColor: gradient,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#D4AF37',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(168, 85, 247, 0.1)' } },
                x: { grid: { display: false } }
            },
            animation: { duration: 2000, easing: 'easeInOutQuart' }
        }
    });
}

// ============ AMPLIAR GRÁFICA (IN-PLACE) ============
window.toggleChartExpand = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const isExpanded = card.classList.toggle('expanded');
    document.body.classList.toggle('chart-expanded', isExpanded);
    
    // Actualizar texto del botón
    const btn = card.querySelector('.chart-expand-btn');
    if (btn) {
        btn.innerText = isExpanded ? '✕ Cerrar' : '🔍 Ampliar';
    }
    
    // Redimensionar la gráfica para que se adapte al nuevo tamaño
    const canvas = card.querySelector('canvas');
    if (canvas) {
        const chart = Chart.getChart(canvas);
        if (chart) {
            setTimeout(() => chart.resize(), 100);
        }
    }
};

// Cerrar con tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.chart-card-enhanced.expanded').forEach(card => {
            toggleChartExpand(card.id);
        });
    }
});

// Cerrar al hacer clic en el fondo oscuro
document.addEventListener('click', (e) => {
    if (e.target === document.body && document.body.classList.contains('chart-expanded')) {
        document.querySelectorAll('.chart-card-enhanced.expanded').forEach(card => {
            toggleChartExpand(card.id);
        });
    }
});

// ============ DESCARGAR GRÁFICA COMO IMAGEN ============
window.downloadChart = function(cardId, title) {
    const card = document.getElementById(cardId);
    html2canvas(card, {
        backgroundColor: '#fdfbf7',
        scale: 2,
        useCORS: true
    }).then(canvas => {
        // Crear canvas final con logo + texto
        const finalCanvas = document.createElement('canvas');
        const ctx = finalCanvas.getContext('2d');
        const W = 800, H = canvas.height + 200;
        finalCanvas.width = W;
        finalCanvas.height = H;
        
        // Fondo degradado
        const gradient = ctx.createLinearGradient(0, 0, W, H);
        gradient.addColorStop(0, '#fdfbf7');
        gradient.addColorStop(1, '#f3e8ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);
        
        // Logo
        const logo = new Image();
        logo.onload = () => {
            ctx.drawImage(logo, 20, 20, 80, 80);
            ctx.fillStyle = '#2e1065';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('Valen Fashion 📊', 120, 60);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#4b5563';
            ctx.fillText(title + ' • ' + new Date().toLocaleDateString('es-CO'), 120, 85);
            
            // Gráfica
            ctx.drawImage(canvas, 50, 120, W - 100, canvas.height);
            
            // Descargar
            const link = document.createElement('a');
            link.download = `valen-stats-${title.toLowerCase()}.png`;
            link.href = finalCanvas.toDataURL('image/png');
            link.click();
        };
        logo.src = '../logo.jpg';
    });
};

// ============ CALENDARIO COMERCIAL DETALLADO (COLOMBIA) ============
function renderCommercialCalendar() {
    const dates = [
        { 
            name: '🎃 Halloween', 
            date: '2026-10-31', 
            strategy: '👻 Sube disfraces de niños, peluches de monstruositos y cobijas con temática oscura. Haz promo "2x1 en peluches" por WhatsApp. Publica historias de Instagram con maquillaje de Halloween.' 
        },
        { 
            name: '🛍️ Black Friday', 
            date: '2026-11-27', 
            strategy: '💰 Ofertas flash solo por 24h. Crea combos "Hogar + Niños" con descuento. Envía mensaje masivo por WhatsApp a clientas anteriores. Usa etiqueta "🔥 OFERTA" en productos.' 
        },
        { 
            name: '🎄 Navidad', 
            date: '2026-12-25', 
            strategy: '🎁 Empieza a subir regalos desde noviembre. Peluches, cobijas y maletas son ideales. Haz promo "Envío gratis en Manizales". Publica reels de "ideas de regalo".' 
        },
        { 
            name: '💐 Día de la Madre', 
            date: '2027-05-09', 
            strategy: '💝 Cobijas suaves, peluches grandes y sets de tocador son perfectos. Crea combo "Mamá merece lo mejor". Publica testimonios de clientas felices.' 
        },
        { 
            name: '💘 Amor y Amistad', 
            date: '2026-09-19', 
            strategy: '💌 Peluches rosados, cobijas para pareja. Promo "2x1 para compartir". Publica en Instagram con hashtag #AmorYAmistadManizales.' 
        }
    ].map(d => ({ ...d, daysLeft: getDaysLeft(d.date) }))
      .filter(d => d.daysLeft > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const container = document.getElementById('commercial-calendar');
    container.innerHTML = dates.map(d => `
        <div class="calendar-item">
            <div class="calendar-header">
                <span class="calendar-name">${d.name}</span>
                <span class="calendar-days">⏳ ${d.daysLeft} días</span>
            </div>
            <p class="calendar-strategy">${d.strategy}</p>
        </div>
    `).join('') || '<p class="text-desc text-center">No hay fechas próximas</p>';
}

function getDaysLeft(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

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
