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

// ============ MODAL DE GRÁFICA AMPLIADA ============
window.openChartModal = function(chartType) {
    const modal = document.getElementById('chart-modal');
    const title = document.getElementById('modal-chart-title');
    const container = document.getElementById('modal-chart-container');
    const interp = document.getElementById('modal-chart-interpretation');
    
    if (!modal || !title || !container || !interp) return;
    
    const chartData = {
        devices: { 
            title: '📱 ¿Desde dónde te visitan?', 
            canvasId: 'chart-devices', 
            cardId: 'card-devices' 
        },
        categories: { 
            title: '🏆 ¿Qué categorías gustan más?', 
            canvasId: 'chart-categories', 
            cardId: 'card-categories' 
        },
        visits: { 
            title: '📈 ¿Cuándo entra más gente?', 
            canvasId: 'chart-visits', 
            cardId: 'card-visits' 
        }
    };
    
    const data = chartData[chartType];
    if (!data) return;
    
    title.innerText = data.title;
    
    // Copiar la interpretación del card original
    const originalCard = document.getElementById(data.cardId);
    if (originalCard) {
        const originalInterp = originalCard.querySelector('.chart-interpretation');
        interp.innerHTML = originalInterp ? originalInterp.innerHTML : '';
    }
    
    // Clonar el canvas al modal
    container.innerHTML = '<canvas id="modal-canvas" style="max-height: 400px; width: 100%;"></canvas>';
    const originalCanvas = document.getElementById(data.canvasId);
    const modalCanvas = document.getElementById('modal-canvas');
    
    if (originalCanvas && modalCanvas) {
        const chartInstance = Chart.getChart(originalCanvas);
        if (chartInstance) {
            new Chart(modalCanvas.getContext('2d'), {
                type: chartInstance.config.type,
                data: JSON.parse(JSON.stringify(chartInstance.data)),
                options: { 
                    ...chartInstance.options, 
                    responsive: true, 
                    maintainAspectRatio: false,
                    animation: false
                }
            });
        }
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeChartModal = function() {
    const modal = document.getElementById('chart-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        // Destruir la gráfica del modal para evitar memoria
        const modalCanvas = document.getElementById('modal-canvas');
        if (modalCanvas) {
            const chart = Chart.getChart(modalCanvas);
            if (chart) chart.destroy();
        }
    }
};

window.closeChartModal = function() {
    const modal = document.getElementById('chart-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

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
