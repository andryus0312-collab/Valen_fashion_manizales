import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
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

let db, auth, isLoggedIn = false;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app); auth = getAuth(app);
} catch (initError) { 
    console.error(initError);
    throw initError; 
}

let allProducts = [], selectedCategory = 'all', base64Image = null, profileBase64Image = null, selectedRing = null;

// ============ DIAGNÓSTICO ============
const debugLogs = [];
function pushDebugLog(type, args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    debugLogs.push({ time: new Date().toLocaleTimeString(), type, msg });
    if (debugLogs.length > 150) debugLogs.shift();
    renderDebugLogs();
}
console.log = (...a) => pushDebugLog('log', a); 
console.warn = (...a) => pushDebugLog('warn', a); 
console.error = (...a) => pushDebugLog('error', a);
window.addEventListener('error', (e) => pushDebugLog('error', [e.message]));

let dbConnected = null;
onValue(ref(db, '.info/connected'), (snap) => { dbConnected = snap.val() === true; updateDebugStatus(); });

function updateDebugStatus() {
    const c=document.getElementById('debug-connection'), a=document.getElementById('debug-auth'), p=document.getElementById('debug-count');
    if(c) c.innerText = dbConnected ? '🟢 Conectado' : '🔴 Desconectado';
    if(a) a.innerText = auth && auth.currentUser ? '👤 '+auth.currentUser.email : '👤 Sin sesión';
    if(p) p.innerText = '📦 Productos: '+allProducts.length;
}

function renderDebugLogs() {
    const l=document.getElementById('debug-log-list'); if(!l) return;
    const colors = { log: 'text-slate-300', warn: 'text-yellow-400', error: 'text-rose-400' };
    l.innerHTML = debugLogs.slice().reverse().map(x => `<div class="border-b border-purple-500/10 py-1"><span class="text-slate-500">[${x.time}]</span> <span class="${colors[x.type]}">${x.msg.replace(/</g,'&lt;')}</span></div>`).join('');
}

window.toggleDebugPanel = (s) => { 
    const p=document.getElementById('debug-panel'); 
    s?(p.classList.remove('hidden'),p.classList.add('flex'),updateDebugStatus(),renderDebugLogs()):(p.classList.remove('flex'),p.classList.add('hidden')); 
};
window.clearDebugLogs = () => { debugLogs.length=0; renderDebugLogs(); };

function withTimeout(p, ms, msg) { 
    return new Promise((res, rej) => { 
        const t=setTimeout(()=>rej(new Error(msg)), ms); 
        p.then(v=>{clearTimeout(t);res(v);}).catch(e=>{clearTimeout(t);rej(e);}); 
    }); 
}

// ============ FASE 2: BOTONES FLOTANTES ============
(function initFloatingControls() {
    // 1. TEMA
    const btnTheme = document.getElementById('btn-theme');
    const savedTheme = localStorage.getItem('valen_theme') || 'light';
    if (savedTheme === 'dark') { 
        document.body.classList.add('dark-mode'); 
        document.documentElement.classList.add('dark'); 
        btnTheme.innerText = '☀️'; 
    } else { 
        document.documentElement.classList.remove('dark'); 
        btnTheme.innerText = '🌙'; 
    }
    btnTheme.onclick = () => {
        const isDark = document.body.classList.toggle('dark-mode');
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('valen_theme', isDark ? 'dark' : 'light');
        btnTheme.innerText = isDark ? '☀️' : '🌙';
    };

    // 2. TEXTO
    const btnSize = document.getElementById('btn-text-size');
    const sliderContainer = document.getElementById('text-slider-container');
    const slider = document.getElementById('text-slider');
    const sizeVal = document.getElementById('text-size-val');
    const savedSize = localStorage.getItem('valen_text_size') || '100';
    document.documentElement.style.fontSize = savedSize + '%'; 
    slider.value = savedSize; 
    sizeVal.innerText = savedSize + '%';
    
    btnSize.onclick = () => { 
        sliderContainer.style.display = sliderContainer.style.display === 'flex' ? 'none' : 'flex'; 
    };
    slider.oninput = (e) => { 
        const val = e.target.value; 
        document.documentElement.style.fontSize = val + '%'; 
        sizeVal.innerText = val + '%'; 
        localStorage.setItem('valen_text_size', val); 
    };
    document.addEventListener('click', (e) => { 
        if (!sliderContainer.contains(e.target) && e.target !== btnSize) sliderContainer.style.display = 'none'; 
    });

    // 3. MÚSICA (Oculta por estabilidad)
    const btnMusic = document.getElementById('btn-music');
    if(btnMusic) btnMusic.style.display = 'none'; 
})();

// ============ FASE 3: QR ============
(function initQR() {
    const btnOpen = document.getElementById('btn-qr-open');
    const modal = document.getElementById('qr-modal');
    const container = document.getElementById('qrcode-container');
    const btnShare = document.getElementById('btn-qr-share-action');
    const btnDownload = document.getElementById('btn-qr-download');
    const shareUrl = "https://andryus0312-collab.github.io/Valen_fashion_manizales/";
    let qrGenerated = false;

    function getGreeting() { 
        const h = new Date().getHours(); 
        return (h >= 5 && h < 12) ? '¡Buenos días' : (h >= 12 && h < 19) ? '¡Buenas tardes' : '¡Buenas noches'; 
    }

    function generateQR() { 
        if (qrGenerated) return; 
        container.innerHTML = ""; 
        new QRCode(container, { text: shareUrl, width: 256, height: 256, colorDark : "#2e1065", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H }); 
        qrGenerated = true; 
    }

    btnOpen.onclick = () => { 
        generateQR(); 
        modal.classList.remove('hidden'); 
        modal.classList.add('flex'); 
        btnShare.classList.toggle('hidden', !navigator.share); 
    };

    window.closeQRModal = () => { modal.classList.remove('flex'); modal.classList.add('hidden'); };
    modal.onclick = (e) => { if (e.target === modal) closeQRModal(); };

    btnShare.onclick = async () => {
        const msg = `${getGreeting()}! 🤍✨\n\nTe invito a conocer *Valen Fashion Manizales* 🛍️.\n\n ${shareUrl}\n\n¡Gracias por compartir! 💜`;
        try { await navigator.share({ title: 'Valen Fashion', text: msg }); } catch (err) {}
    };

    btnDownload.onclick = () => {
        const qrSource = container.querySelector('canvas') || container.querySelector('img');
        if (!qrSource) return;
        const logo = new Image();
        logo.onload = () => {
            const canvas = document.createElement('canvas'); 
            const W = 512, H = 720; 
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d'); 
            ctx.fillStyle = '#ffffff'; 
            ctx.fillRect(0, 0, W, H);
            
            const logoSize = 140; 
            ctx.save(); 
            ctx.beginPath(); 
            ctx.arc(W/2, 100, logoSize/2, 0, Math.PI*2); 
            ctx.clip(); 
            ctx.drawImage(logo, W/2 - logoSize/2, 30, logoSize, logoSize); 
            ctx.restore();
            
            ctx.beginPath(); 
            ctx.arc(W/2, 100, logoSize/2, 0, Math.PI*2); 
            ctx.lineWidth = 6; 
            ctx.strokeStyle = '#a855f7'; 
            ctx.stroke();
            
            ctx.fillStyle = '#2e1065'; 
            ctx.font = 'bold 30px Arial'; 
            ctx.textAlign = 'center'; 
            ctx.fillText('Valen Fashion', W/2, 210);
            ctx.drawImage(qrSource, 56, 265, 400, 400);
            
            const link = document.createElement('a'); 
            link.download = 'valen-qr.png'; 
            link.href = canvas.toDataURL('image/png'); 
            link.click();
        };
        logo.src = 'logo.jpg';
    };
})();

// ============ DATOS ============
const categories = [{id:'all',name:'✨ Todo'},{id:'hogar',name:'🏠 Hogar'},{id:'ninos',name:'🧸 Niños'},{id:'ropa',name:'👗 Ropa'},{id:'tendidos',name:'🛏️ Tendidos'}];
const ringPresets = [{name:'Morado',mode:'solid',color:'#a855f7'},{name:'Negro',mode:'solid',color:'#000000'},{name:'Blanco',mode:'solid',color:'#ffffff'},{name:'Rosa',mode:'solid',color:'#ec4899'}];
const defaultProfile = { 
    photo: 'https://andryus0312-collab.github.io/Valen_fashion_manizales/logo.jpg', 
    name: 'Valen Fashion', 
    tagline: '✨ Mereces lo que sueñas 🤍', 
    category: '🛍️ Compras y ventas minoristas', 
    bio: 'Tenemos cosas hermosas y exclusivas para ti 💥', 
    service: '🚚 Domicilios en Manizales 💎', 
    address: '📍 Cra 38 #66-20, Manizales', 
    ring: {mode:'solid',color:'#a855f7'} 
};
let currentProfile = defaultProfile;

function showToast(m) { 
    const e=document.getElementById('toast'); 
    if(!e)return; 
    e.innerText=m; 
    e.classList.remove('hidden'); 
    e.style.opacity='1'; 
    setTimeout(()=>{e.style.opacity='0'; setTimeout(()=>e.classList.add('hidden'),300);},2200); 
}

window.formatPriceInput = (el) => { 
    let d=el.value.replace(/\D/g,'').replace(/^0+(?=\d)/,''); 
    el.value=d?'$'+d.replace(/\B(?=(\d{3})+(?!\d))/g,'.'):''; 
};

// ============ BANNER ============
let bannerImages=[], bannerIndex=0, bannerInterval=null;

function renderBannerSlides() {
    const container = document.getElementById('banner-carousel');
    if (!container) return;
    if (bannerInterval) { clearInterval(bannerInterval); bannerInterval = null; }
    if (bannerImages.length === 0) { container.classList.add('hidden'); container.innerHTML = ''; return; }
    
    container.classList.remove('hidden'); 
    bannerIndex = 0;
    const fitMode = window.currentBannerFit || 'cover';
    let objectClass = 'object-cover';
    if (fitMode === 'contain') objectClass = 'object-contain';
    if (fitMode === 'fill') objectClass = 'object-fill';

    container.innerHTML = bannerImages.map((b, i) => `
        <img src="${b.image}" class="banner-slide absolute inset-0 w-full h-full ${objectClass} transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'opacity-0'}">
    `).join('') + (bannerImages.length > 1 ? `
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" id="banner-dots">
            ${bannerImages.map((_, i) => `<span class="h-1.5 rounded-full transition-all ${i === 0 ? 'bg-white w-4' : 'bg-white/40 w-1.5'}"></span>`).join('')}
        </div>
    ` : '');

    if (bannerImages.length > 1) {
        bannerInterval = setInterval(() => {
            bannerIndex = (bannerIndex + 1) % bannerImages.length;
            const slides = container.querySelectorAll('.banner-slide');
            slides.forEach((s, i) => { s.classList.toggle('opacity-100', i === bannerIndex); s.classList.toggle('opacity-0', i !== bannerIndex); });
            const dots = document.querySelectorAll('#banner-dots span');
            dots.forEach((d, i) => { d.classList.toggle('bg-white', i === bannerIndex); d.classList.toggle('w-4', i === bannerIndex); d.classList.toggle('bg-white/40', i !== bannerIndex); d.classList.toggle('w-1.5', i !== bannerIndex); });
        }, 5000);
    }
}

function renderAdminBannerList() { 
    const l=document.getElementById('admin-banner-list'); 
    if(!l)return; 
    l.innerHTML = bannerImages.length ? bannerImages.map(b=>`<div class="relative aspect-video rounded-xl overflow-hidden border border-purple-500/30 bg-black"><img src="${b.image}" class="w-full h-full object-cover"><button onclick="deleteBannerImage('${b.id}')" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-800/90 text-white text-[10px] flex items-center justify-center">🗑️</button></div>`).join('') : '<p class="col-span-3 text-center text-desc text-[11px] py-2">Sin imágenes.</p>'; 
}

onValue(ref(db, 'valen_banner'), (s) => { 
    const d=s.val(); 
    bannerImages=d?Object.keys(d).map(k=>({id:k,...d[k]})):[]; 
    renderBannerSlides(); 
    renderAdminBannerList(); 
});

function resizeImg(f, max, q) { 
    return new Promise((res,rej)=>{ 
        const r=new FileReader(); 
        r.onload=e=>{ 
            const i=new Image(); 
            i.onload=()=>{ 
                const c=document.createElement('canvas'); 
                let w=i.width,h=i.height; 
                if(w>h&&w>max){h*=max/w;w=max;}else if(h>max){w*=max/h;h=max;} 
                c.width=w;c.height=h; 
                c.getContext('2d').drawImage(i,0,0,w,h); 
                res(c.toDataURL('image/jpeg',q)); 
            }; 
            i.src=e.target.result; 
        }; 
        r.readAsDataURL(f); 
    }); 
}

window.handleBannerImagesInput = (e) => { 
    const f=Array.from(e.target.files||[]); 
    if(!f.length)return; 
    const st=document.getElementById('banner-image-status'); 
    let d=0; 
    st.innerText=`Subiendo...`; 
    f.forEach(file=>{ 
        resizeImg(file,1200,0.8).then(b64=>withTimeout(push(ref(db,'valen_banner'),{image:b64,createdAt:Date.now()}),12000,'Timeout')).then(()=>{ 
            if(++d===f.length){st.innerText='OK'; showToast('✅ Banner OK'); document.getElementById('banner-image-file').value='';} 
        }).catch(err=>alert('Error')); 
    }); 
};

window.deleteBannerImage = (id) => { if(confirm('¿Eliminar?')) remove(ref(db,'valen_banner/'+id)); };

if(new URLSearchParams(window.location.search).get('admin')==='1') document.getElementById('btn-admin').classList.remove('hidden');

function ringToCss(r) { return !r ? defaultProfile.ring.color : (r.mode==='gradient' ? `linear-gradient(135deg,${r.from},${r.to})` : r.color); }
function renderRingPresets() { document.getElementById('ring-presets').innerHTML = ringPresets.map((p,i)=>`<button type="button" onclick="selectRingPreset(${i})" class="ring-preset-btn w-8 h-8 rounded-full border border-purple-500/30" style="background:${p.mode==='solid'?p.color:`linear-gradient(135deg,${p.from},${p.to})`}"></button>`).join(''); }
function highlightRingPreset(i) { document.querySelectorAll('.ring-preset-btn').forEach((b,idx)=>b.classList.toggle('ring-2',idx===i)); }
window.selectRingPreset = (i) => { selectedRing=ringPresets[i].mode==='solid'?{mode:'solid',color:ringPresets[i].color}:{mode:'gradient',from:ringPresets[i].from,to:ringPresets[i].to}; highlightRingPreset(i); document.getElementById('ring-preview').style.background=ringToCss(selectedRing); };
window.selectCustomSolid = () => { selectedRing={mode:'solid',color:document.getElementById('ring-custom-solid').value}; highlightRingPreset(-1); document.getElementById('ring-preview').style.background=selectedRing.color; };
window.selectCustomGradient = () => { selectedRing={mode:'gradient',from:document.getElementById('ring-custom-from').value,to:document.getElementById('ring-custom-to').value}; highlightRingPreset(-1); document.getElementById('ring-preview').style.background=ringToCss(selectedRing); };

function renderProfile(p) { 
    p=p||defaultProfile; 
    document.getElementById('profile-photo').src=p.photo; 
    document.getElementById('profile-name').innerText=p.name; 
    document.getElementById('profile-tagline').innerText=p.tagline; 
    document.getElementById('profile-category').innerText=p.category; 
    document.getElementById('profile-bio').innerText=p.bio; 
    document.getElementById('profile-service').innerText=p.service; 
    document.getElementById('profile-address').innerText=p.address; 
    document.getElementById('profile-ring').style.background=ringToCss(p.ring); 
}

function prefillProfileForm() { 
    const p=currentProfile||defaultProfile; 
    document.getElementById('profile-category-input').value=p.category; 
    document.getElementById('profile-bio-input').value=p.bio; 
    document.getElementById('profile-service-input').value=p.service; 
    document.getElementById('profile-address-input').value=p.address; 
    selectedRing=p.ring; 
    renderRingPresets(); 
    document.getElementById('ring-preview').style.background=ringToCss(selectedRing); 
}

window.handleProfileImageInput = (e) => { 
    const f=e.target.files[0]; 
    if(!f)return; 
    resizeImg(f,600,0.85).then(b64=>{ 
        profileBase64Image=b64; 
        document.getElementById('profile-image-preview').src=b64; 
        document.getElementById('profile-image-preview-container').classList.remove('hidden'); 
    }); 
};

window.saveProfile = () => { 
    const up={...(currentProfile||defaultProfile), category:document.getElementById('profile-category-input').value, bio:document.getElementById('profile-bio-input').value, service:document.getElementById('profile-service-input').value, address:document.getElementById('profile-address-input').value, ring:selectedRing}; 
    if(profileBase64Image)up.photo=profileBase64Image; 
    withTimeout(set(ref(db,'valen_profile'),up),12000,'Timeout').then(()=>showToast('✅ Guardado')).catch(e=>alert('Error')); 
};

onValue(ref(db, 'valen_profile'), (s) => { currentProfile=s.val()||defaultProfile; renderProfile(currentProfile); });

function renderCategories() {
    document.getElementById('category-filters').innerHTML = categories.map(c => {
        const act = selectedCategory===c.id;
        return `<button onclick="setCategory('${c.id}')" class="px-4 py-2.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${act ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'btn-cat-inactive'}">${c.name}</button>`;
    }).join('');
}
window.setCategory = (id) => { selectedCategory=id; renderCategories(); renderProducts(); };

// ============ COMPARTIR PRODUCTO ============
function getGreeting() { 
    const h = new Date().getHours(); 
    return (h >= 5 && h < 12) ? '¡Buenos días' : (h >= 12 && h < 19) ? '¡Buenas tardes' : '¡Buenas noches'; 
}

window.shareProduct = async function(product) {
    const greeting = getGreeting();
    const text = `${greeting}! 🤍✨\n\nMira qué encontré en *Valen Fashion*: \n\n🛍️ *${product.title}*\n💰 ${product.price}\n\n👉 https://andryus0312-collab.github.io/Valen_fashion_manizales/\n\n¡Un abrazo! 💜`;
    try {
        const response = await fetch(product.image);
        const blob = await response.blob();
        const file = new File([blob], "valen-product.jpg", { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `Valen Fashion: ${product.title}`, text: text });
        } else {
            await navigator.share({ title: `Valen Fashion: ${product.title}`, text: text });
        }
    } catch (error) {
        if (error.name !== 'AbortError') downloadProductImage(product);
    }
};

window.downloadProductImage = function(product) {
    const img = new Image(); 
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas'); 
        const W = 600, H = 800; 
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d'); 
        ctx.fillStyle = '#fdfbf7'; 
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 100, 40, 400, 400);
        ctx.fillStyle = '#2e1065'; 
        ctx.font = 'bold 32px Arial'; 
        ctx.textAlign = 'center'; 
        ctx.fillText(product.title, W/2, 480);
        ctx.fillStyle = '#9333ea'; 
        ctx.font = 'bold 28px Arial'; 
        ctx.fillText(product.price, W/2, 520);
        ctx.fillStyle = '#2e1065'; 
        ctx.font = 'bold 20px Arial'; 
        ctx.fillText('Valen Fashion 🤍', W/2, H - 40);
        const link = document.createElement('a'); 
        link.download = `valen-${product.title}.png`; 
        link.href = canvas.toDataURL('image/png'); 
        link.click();
    };
    img.src = product.image;
};

// ============ RENDERIZADO DE PRODUCTOS (CON ETIQUETAS) ============

function renderProducts() {
    const c = document.getElementById('products-container');
    const f = selectedCategory === 'all' ? allProducts : allProducts.filter(p => p.category === selectedCategory);
    if (!f.length) { c.innerHTML = '<div class="col-span-full py-16 text-center text-desc"><p class="text-3xl">️</p><p>Sin productos.</p></div>'; return; }
    
    c.innerHTML = f.map(p => {
        const cat = categories.find(x => x.id === p.category)?.name || p.category;
        const wa = `https://wa.me/573229247605?text=${encodeURIComponent(`¡Hola! Me interesa: *${p.title}* (${p.price})`)}`;
        const safeTitle = p.title.replace(/'/g, "\\'"); 
        const safeDesc = (p.description || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');

        // --- LÓGICA DE ETIQUETAS ---
        let tagsHtml = '';
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const isNew = p.createdAt && (now - p.createdAt < sevenDays);
        
        // Contar cuántas etiquetas habrá para calcular el espacio reservado
        let tagCount = 0;
        if (p.tagType) tagCount++;
        if (isNew) tagCount++;

        // 1. Etiqueta Manual (primera posición)
        if (p.tagType) {
            const textColor = (p.tagColor === '#facc15' || p.tagColor === '#ffffff') ? '#000000' : '#ffffff';
            tagsHtml += `
               <div class="absolute z-20 px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg" 
                    style="background-color: ${p.tagColor}; color: ${textColor}; width: 110px; text-align: center; transform: rotate(-45deg); transform-origin: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); top: 14px; left: -34px;">
                   ${p.tagType}
               </div>
            `;
        }

        // 2. Etiqueta "NUEVO" Automática (segunda posición, con más espacio)
        if (isNew) {
            // Si ya hay una etiqueta manual, la de "Nuevo" va más abajo con separación amplia
            const topPos = p.tagType ? '48px' : '14px';
            tagsHtml += `
               <div class="absolute z-20 px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg bg-red-500 text-white" 
                    style="width: 110px; text-align: center; transform: rotate(-45deg); transform-origin: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); top: ${topPos}; left: -34px;">
                    Nuevo
               </div>
            `;
        }
        // ---------------------------

        // Espacio reservado arriba de la tarjeta para que todas se alineen igual
        // Si hay 2 etiquetas: 60px de padding-top. Si hay 1: 36px. Si no hay: 12px (mínimo).
        const topPadding = tagCount === 2 ? '60px' : (tagCount === 1 ? '36px' : '12px');

        return `
        <div class="relative" style="padding-top: ${topPadding};">
            <!-- Etiquetas (posicionadas absolutamente respecto al wrapper) -->
            ${tagsHtml}
            
            <!-- Contenedor de la tarjeta -->
            <div class="card-bg rounded-3xl shadow-xl flex flex-col group relative overflow-hidden">
                <div class="relative aspect-square bg-gray-100 dark:bg-black cursor-pointer overflow-hidden" onclick="openLightbox('${p.image}','${safeTitle}')">
                    <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    <span class="absolute top-2 right-2 bg-white/80 dark:bg-black/70 text-purple-700 dark:text-purple-300 text-[9px] font-bold px-2 py-1 rounded-full z-10">${cat}</span>
                </div>
                <div class="p-4 space-y-1 flex-1">
                    <div class="flex justify-between"><h3 class="text-sm font-bold text-title">${p.title}</h3><span class="text-price font-extrabold text-sm">${p.price}</span></div>
                    <p class="text-[11px] text-desc line-clamp-2">${p.description||''}</p>
                </div>
                <div class="p-4 pt-0 space-y-2">
                    <a href="${wa}" target="_blank" class="block w-full bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl text-center">Pedir 📱</a>
                    <button onclick="shareProduct({title: '${safeTitle}', price: '${p.price}', description: '${safeDesc}', image: '${p.image}'})" class="share-product-btn w-full text-xs font-bold py-2 rounded-xl text-center transition-all active:scale-95">Compartir 🔗</button>
                </div>
            </div>
        </div>`;
    }).join('');
        }

function renderAdminList() {
    const l=document.getElementById('admin-products-list'); if(!l)return;
    l.innerHTML = allProducts.length ? allProducts.map(p=>`
        <div class="flex items-center justify-between admin-item-bg p-2 rounded-xl">
            <div class="flex items-center gap-2 overflow-hidden"><img src="${p.image}" class="w-8 h-8 rounded-lg object-cover"><p class="text-xs font-bold text-title truncate">${p.title}</p></div>
            <button onclick="deleteProduct('${p.firebaseId}')" class="bg-rose-500 text-white text-[10px] px-2 py-1 rounded-lg">🗑️</button>
        </div>`).join('') : '<p class="text-center text-desc text-xs py-4">Sin productos.</p>';
}

onValue(ref(db, 'valen_products'), (s) => { 
    const d=s.val(); 
    allProducts=d?Object.keys(d).map(k=>({firebaseId:k,...d[k]})).reverse():[]; 
    renderCategories(); 
    renderProducts(); 
    renderAdminList(); 
    updateDebugStatus(); 
});

onAuthStateChanged(auth, u => { 
    isLoggedIn=!!u; 
    document.getElementById('debug-btn').classList.toggle('hidden',!isLoggedIn); 
    const ls=document.getElementById('admin-login-section'), cs=document.getElementById('admin-content-section'); 
    if(isLoggedIn){ls.classList.add('hidden'); cs.classList.remove('hidden'); prefillProfileForm();}else{ls.classList.remove('hidden'); cs.classList.add('hidden');} 
    updateDebugStatus(); 
});

window.adminLogin = () => { 
    const e=document.getElementById('admin-email').value, p=document.getElementById('admin-password').value; 
    signInWithEmailAndPassword(auth,e,p).catch(()=>alert('Error login')); 
};
window.adminLogout = () => signOut(auth);
window.toggleAdminModal = (s) => { 
    const m=document.getElementById('admin-modal'); 
    s?(m.classList.remove('hidden'),m.classList.add('flex')):(m.classList.remove('flex'),m.classList.add('hidden')); 
};

window.handleImageInput = (e) => { 
    const f=e.target.files[0]; 
    if(!f)return; 
    resizeImg(f,1000,0.8).then(b64=>{ 
        base64Image=b64; 
        document.getElementById('image-preview').src=b64; 
        document.getElementById('image-preview-container').classList.remove('hidden'); 
    }); 
};

// ============ PUBLICAR PRODUCTO (CON ETIQUETAS) ============
window.publishProduct = () => { 
    const t=document.getElementById('new-title').value, 
          p=document.getElementById('new-price').value, 
          c=document.getElementById('new-category').value, 
          d=document.getElementById('new-description').value;
    
    const tagType = document.getElementById('new-tag-type') ? document.getElementById('new-tag-type').value : '';
    const tagColor = document.getElementById('new-tag-color') ? document.getElementById('new-tag-color').value : '#ef4444';

    if(!t||!p||!base64Image) return alert('Faltan datos'); 
    
    withTimeout(push(ref(db,'valen_products'),{
        title:t,
        price:p,
        category:c,
        description:d,
        image:base64Image,
        createdAt:Date.now(),
        tagType: tagType,
        tagColor: tagColor
    }),12000,'Timeout').then(()=>{
        showToast('✅ Publicado'); 
        document.getElementById('new-title').value=''; 
        document.getElementById('new-price').value=''; 
        document.getElementById('new-description').value='';
        if(document.getElementById('new-tag-type')) document.getElementById('new-tag-type').value='';
        if(document.getElementById('new-tag-color')) document.getElementById('new-tag-color').value='#ef4444';
        
        base64Image=null; 
        document.getElementById('image-preview-container').classList.add('hidden');
    }).catch(e=>alert('Error: '+e.message)); 
};

window.deleteProduct = (id) => { if(confirm('¿Borrar?')) remove(ref(db,'valen_products/'+id)); };

window.openLightbox = (u,t) => { 
    document.getElementById('lightbox-img').src=u; 
    document.getElementById('lightbox-title').innerText=t; 
    document.getElementById('lightbox').classList.replace('hidden','flex'); 
};
window.closeLightbox = () => document.getElementById('lightbox').classList.replace('flex','hidden');

// ============ AJUSTE DE BANNER ============
onValue(ref(db, 'valen_profile'), (snapshot) => {
    const data = snapshot.val();
    const mode = (data && data.bannerFit) ? data.bannerFit : 'cover';
    window.currentBannerFit = mode;
    const selectEl = document.getElementById('banner-fit-mode');
    if (selectEl) selectEl.value = mode;
    renderBannerSlides();
});

window.updateBannerFit = function(mode) {
    const currentData = currentProfile || defaultProfile;
    const updatedData = { ...currentData, bannerFit: mode };
    set(ref(db, 'valen_profile'), updatedData).then(() => {
        showToast('✅ Ajuste guardado');
    }).catch(err => {
        console.error(err);
        alert('Error: ' + err.message);
    });
};
