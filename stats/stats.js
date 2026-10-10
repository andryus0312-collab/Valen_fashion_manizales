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

// ============ GRÁFICAS ============
function renderDevicesChart() {
    const ctx = document.getElementById('chart-devices').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['📱 Celular', '💻 PC', '📟 Tablet'],
            datasets: [{
                data: [65, 25, 10], // Datos simulados — luego reales
                backgroundColor: ['#ec4899', '#a855f7', '#D4AF37'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
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
                borderRadius: 8
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function renderVisitsChart() {
    const ctx = document.getElementById('chart-visits').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Visitas',
                data: [12, 19, 15, 25, 22, 30, 28], // Simulado
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

// ============ CALENDARIO COMERCIAL ============
function renderCommercialCalendar() {
    const dates = [
        { name: '💘 Amor y Amistad', date: '2026-09-19', daysLeft: getDaysLeft('2026-09-19') },
        { name: '🎃 Halloween', date: '2026-10-31', daysLeft: getDaysLeft('2026-10-31') },
        { name: '🛍️ Black Friday', date: '2026-11-27', daysLeft: getDaysLeft('2026-11-27') },
        { name: '🎄 Navidad', date: '2026-12-25', daysLeft: getDaysLeft('2026-12-25') },
        { name: '💐 Día de la Madre', date: '2027-05-09', daysLeft: getDaysLeft('2027-05-09') }
    ].filter(d => d.daysLeft > 0).sort((a, b) => a.daysLeft - b.daysLeft);

    const container = document.getElementById('commercial-calendar');
    container.innerHTML = dates.map(d => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-[#D4AF37]/20">
            <span class="font-bold text-title">${d.name}</span>
            <span class="text-xs font-bold text-[#A8842C] dark:text-[#E6C76A]">⏳ ${d.daysLeft} días</span>
        </div>
    `).join('') || '<p class="text-desc text-center">No hay fechas próximas</p>';
}

function getDaysLeft(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      }
