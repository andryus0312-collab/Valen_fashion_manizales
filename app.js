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
} catch (e) { throw e; }

let allProducts = [], selectedCategory = 'all', base64Image = null, profileBase64Image = null, selectedRing = null;

// Diagnostico
const debugLogs = [];
function pushDebugLog(t, a) { debugLogs.push({ time: new Date().toLocaleTimeString(), type: t, msg: a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ') }); if(debugLogs.length>150) debugLogs.shift(); renderDebugLogs(); }
console.log = (...a) => pushDebugLog('log', a); console.warn = (...a) => pushDebugLog('warn', a); console.error = (...a) => pushDebugLog('error', a);
window.addEventListener('error', e => pushDebugLog('error', [e.message]));
let dbConnected = null;
onValue(ref(db, '.info/connected'), s => { dbConnected = s.val() === true; updateDebugStatus(); });
function updateDebugStatus() {
    const c=document.getElementById('debug-connection'), a=document.getElementById('debug-auth'), p=document.getElementById('debug-count');
    if(c) c.innerText = dbConnected ? '🟢 Conectado' : '🔴 Desconectado';
    if(a) a.innerText = auth.currentUser ? '👤 '+auth.currentUser.email : '👤 Sin sesión';
    if(p) p.innerText = '📦 Productos: '+allProducts.length;
}
function renderDebugLogs() {
    const l=document.getElementById('debug-log-list'); if(!l) return;
    const colors = { log: 'text-slate-300', warn: 'text-yellow-400', error: 'text-rose-400' };
    l.innerHTML = debugLogs.slice().reverse().map(x => `<div class="border-b border-purple-500/10 py-1"><span class="text-slate-500">[${x.time}]</span> <span class="${colors[x.type]}">${x.msg.replace(/</g,'&lt;')}</span></div>`).join('');
}
window.toggleDebugPanel = s => { const p=document.getElementById('debug-panel'); s?(p.classList.remove('hidden'),p.classList.add('flex'),updateDebugStatus(),renderDebugLogs()):(p.classList.remove('flex'),p.classList.add('hidden')); };
window.clearDebugLogs = () => { debugLogs.length=0; renderDebugLogs(); };
function withTimeout(p, ms, msg) { return new Promise((res, rej) => { const t=setTimeout(()=>rej(new Error(msg)), ms); p.then(v=>{clearTimeout(t);res(v);}).catch(e=>{clearTimeout(t);rej(e);}); }); }

const categories = [{id:'all',name:'✨ Todo'},{id:'hogar',name:'🏠 Hogar'},{id:'ninos',name:'🧸 Niños'},{id:'ropa',name:'👗 Ropa'},{id:'tendidos',name:'🛏️ Tendidos'}];
const ringPresets = [{name:'Morado',mode:'solid',color:'#a855f7'},{name:'Negro',mode:'solid',color:'#000000'},{name:'Blanco',mode:'solid',color:'#ffffff'},{name:'Rosa',mode:'solid',color:'#ec4899'},{name:'M→N',mode:'gradient',from:'#a855f7',to:'#000000'},{name:'M→R',mode:'gradient',from:'#a855f7',to:'#ec4899'}];
const defaultProfile = { photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', name: 'Valen Fashion', tagline: '✨ Mereces lo que sueñas 🤍', category: '🛍️ Compras y ventas minoristas', bio: 'Tenemos cosas hermosas y exclusivas para ti 💥\npara todos los gustos ♂️♀️', service: '🚚 Domicilios en Manizales 💎', address: '📍 Cra 38 #66-20, Manizales', ring: {mode:'solid',color:'#a855f7'} };
let currentProfile = defaultProfile;

function showToast(m) { const e=document.getElementById('toast'); if(!e)return; e.innerText=m; e.classList.remove('hidden'); e.style.opacity='1'; setTimeout(()=>{e.style.opacity='0'; setTimeout(()=>e.classList.add('hidden'),300);},2200); }
window.formatPriceInput = el => { let d=el.value.replace(/\D/g,'').replace(/^0+(?=\d)/,''); el.value=d?'$'+d.replace(/\B(?=(\d{3})+(?!\d))/g,'.'):''; };

// Banner
let bannerImages=[], bannerIndex=0, bannerInterval=null;
function renderBannerSlides() {
    const c=document.getElementById('banner-carousel'); if(!c)return;
    if(bannerInterval) clearInterval(bannerInterval);
    if(!bannerImages.length) { c.classList.add('hidden'); return; }
    c.classList.remove('hidden'); bannerIndex=0;
    c.innerHTML = bannerImages.map((b,i)=>`<img src="${b.image}" class="banner-slide absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i===0?'opacity-100':'opacity-0'}">`).join('') + (bannerImages.length>1?`<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" id="banner-dots">${bannerImages.map((_,i)=>`<span class="h-1.5 rounded-full transition-all ${i===0?'bg-white w-4':'bg-white/40 w-1.5'}"></span>`).join('')}</div>`:'');
    if(bannerImages.length>1) bannerInterval=setInterval(()=>{ bannerIndex=(bannerIndex+1)%bannerImages.length; c.querySelectorAll('.banner-slide').forEach((s,i)=>{s.classList.toggle('opacity-100',i===bannerIndex); s.classList.toggle('opacity-0',i!==bannerIndex);}); document.querySelectorAll('#banner-dots span').forEach((d,i)=>{d.classList.toggle('bg-white',i===bannerIndex); d.classList.toggle('w-4',i===bannerIndex); d.classList.toggle('bg-white/40',i!==bannerIndex); d.classList.toggle('w-1.5',i!==bannerIndex);}); }, 5000);
}
function renderAdminBannerList() {
    const l=document.getElementById('admin-banner-list'); if(!l)return;
    l.innerHTML = bannerImages.length ? bannerImages.map(b=>`<div class="relative aspect-video rounded-xl overflow-hidden border border-purple-500/30 bg-black"><img src="${b.image}" class="w-full h-full object-cover"><button onclick="deleteBannerImage('${b.id}')" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-800/90 text-white text-[10px] flex items-center justify-center">🗑️</button></div>`).join('') : '<p class="col-span-3 text-center text-desc text-[11px] py-2">Sin imágenes.</p>';
}
onValue(ref(db, 'valen_banner'), s => { const d=s.val(); bannerImages=d?Object.keys(d).map(k=>({id:k,...d[k]})):[]; renderBannerSlides(); renderAdminBannerList(); });

function resizeImg(f, max, q) { return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>{ const i=new Image(); i.onload=()=>{ const c=document.createElement('canvas'); let w=i.width,h=i.height; if(w>h&&w>max){h*=max/w;w=max;}else if(h>max){w*=max/h;h=max;} c.width=w;c.height=h; c.getContext('2d').drawImage(i,0,0,w,h); res(c.toDataURL('image/jpeg',q)); }; i.src=e.target.result; }; r.readAsDataURL(f); }); }
window.handleBannerImagesInput = e => { const f=Array.from(e.target.files||[]); if(!f.length)return; const st=document.getElementById('banner-image-status'); let d=0; st.innerText=`Subiendo 0/${f.length}...`; f.forEach(file=>{ resizeImg(file,1200,0.8).then(b64=>withTimeout(push(ref(db,'valen_banner'),{image:b64,createdAt:Date.now()}),12000,'Timeout')).then(()=>{ if(++d===f.length){st.innerText='Ninguna'; showToast('✅ Banner OK'); document.getElementById('banner-image-file').value='';} else st.innerText=`Subiendo ${d}/${f.length}...`; }).catch(err=>alert('Error: '+err.message)); }); };
window.deleteBannerImage = id => { if(confirm('¿Eliminar?')) remove(ref(db,'valen_banner/'+id)); };

if(new URLSearchParams(window.location.search).get('admin')==='1') document.getElementById('btn-admin').classList.remove('hidden');

function ringToCss(r) { return !r ? defaultProfile.ring.color : (r.mode==='gradient' ? `linear-gradient(135deg,${r.from},${r.to})` : r.color); }
function renderRingPresets() { document.getElementById('ring-presets').innerHTML = ringPresets.map((p,i)=>`<button type="button" onclick="selectRingPreset(${i})" class="ring-preset-btn w-8 h-8 rounded-full border border-purple-500/30" style="background:${p.mode==='solid'?p.color:`linear-gradient(135deg,${p.from},${p.to})`}"></button>`).join(''); }
function highlightRingPreset(i) { document.querySelectorAll('.ring-preset-btn').forEach((b,idx)=>b.classList.toggle('ring-2',idx===i)); }
window.selectRingPreset = i => { selectedRing=ringPresets[i].mode==='solid'?{mode:'solid',color:ringPresets[i].color}:{mode:'gradient',from:ringPresets[i].from,to:ringPresets[i].to}; highlightRingPreset(i); document.getElementById('ring-preview').style.background=ringToCss(selectedRing); };
window.selectCustomSolid = () => { selectedRing={mode:'solid',color:document.getElementById('ring-custom-solid').value}; highlightRingPreset(-1); document.getElementById('ring-preview').style.background=selectedRing.color; };
window.selectCustomGradient = () => { selectedRing={mode:'gradient',from:document.getElementById('ring-custom-from').value,to:document.getElementById('ring-custom-to').value}; highlightRingPreset(-1); document.getElementById('ring-preview').style.background=ringToCss(selectedRing); };

function renderProfile(p) { p=p||defaultProfile; document.getElementById('profile-photo').src=p.photo; document.getElementById('profile-name').innerText=p.name; document.getElementById('profile-tagline').innerText=p.tagline; document.getElementById('profile-category').innerText=p.category; document.getElementById('profile-bio').innerText=p.bio; document.getElementById('profile-service').innerText=p.service; document.getElementById('profile-address').innerText=p.address; document.getElementById('profile-ring').style.background=ringToCss(p.ring); }
function prefillProfileForm() { const p=currentProfile||defaultProfile; document.getElementById('profile-category-input').value=p.category; document.getElementById('profile-bio-input').value=p.bio; document.getElementById('profile-service-input').value=p.service; document.getElementById('profile-address-input').value=p.address; selectedRing=p.ring; renderRingPresets(); document.getElementById('ring-preview').style.background=ringToCss(selectedRing); }

window.handleProfileImageInput = e => { const f=e.target.files[0]; if(!f)return; resizeImg(f,600,0.85).then(b64=>{ profileBase64Image=b64; document.getElementById('profile-image-preview').src=b64; document.getElementById('profile-image-preview-container').classList.remove('hidden'); document.getElementById('profile-image-status').innerText="OK"; }); };
window.saveProfile = () => { const up={...(currentProfile||defaultProfile), category:document.getElementById('profile-category-input').value, bio:document.getElementById('profile-bio-input').value, service:document.getElementById('profile-service-input').value, address:document.getElementById('profile-address-input').value, ring:selectedRing}; if(profileBase64Image)up.photo=profileBase64Image; withTimeout(set(ref(db,'valen_profile'),up),12000,'Timeout').then(()=>showToast('✅ Guardado')).catch(e=>alert('Error: '+e.message)); };
onValue(ref(db, 'valen_profile'), s => { currentProfile=s.val()||defaultProfile; renderProfile(currentProfile); });

function renderCategories() {
    document.getElementById('category-filters').innerHTML = categories.map(c => {
        const act = selectedCategory===c.id;
        // USAMOS btn-cat-inactive QUE ES BLANCO EN CSS
        return `<button onclick="setCategory('${c.id}')" class="px-4 py-2.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${act ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'btn-cat-inactive'}">${c.name}</button>`;
    }).join('');
}
window.setCategory = id => { selectedCategory=id; renderCategories(); renderProducts(); };

function renderProducts() {
    const c=document.getElementById('products-container');
    const f=selectedCategory==='all'?allProducts:allProducts.filter(p=>p.category===selectedCategory);
    if(!f.length) { c.innerHTML='<div class="col-span-full py-16 text-center text-desc"><p class="text-3xl">🛍️</p><p>Sin productos.</p></div>'; return; }
    c.innerHTML = f.map(p => {
        const cat = categories.find(x=>x.id===p.category)?.name || p.category;
        const wa = `https://wa.me/573229247605?text=${encodeURIComponent(`¡Hola! Me interesa: *${p.title}* (${p.price})`)}`;
        // USAMOS card-bg, text-title, text-desc, text-price QUE SON BLANCOS/ADAPTATIVOS EN CSS
        return `
        <div class="card-bg rounded-3xl overflow-hidden shadow-xl flex flex-col group">
            <div class="relative aspect-square bg-gray-100 dark:bg-black cursor-pointer" onclick="openLightbox('${p.image}','${p.title}')">
                <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                <span class="absolute top-2 right-2 bg-white/80 dark:bg-black/70 text-purple-700 dark:text-purple-300 text-[9px] font-bold px-2 py-1 rounded-full">${cat}</span>
            </div>
            <div class="p-4 space-y-1 flex-1">
                <div class="flex justify-between"><h3 class="text-sm font-bold text-title">${p.title}</h3><span class="text-price font-extrabold text-sm">${p.price}</span></div>
                <p class="text-[11px] text-desc line-clamp-2">${p.description||''}</p>
            </div>
            <div class="p-4 pt-0"><a href="${wa}" target="_blank" class="block w-full bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl text-center">Pedir 📱</a></div>
        </div>`;
    }).join('');
}

function renderAdminList() {
    const l=document.getElementById('admin-products-list'); if(!l)return;
    // USAMOS admin-item-bg (que es blanco) o bg-white dark:bg...
    l.innerHTML = allProducts.length ? allProducts.map(p=>`
        <div class="flex items-center justify-between admin-item-bg p-2 rounded-xl border border-purple-500/20">
            <div class="flex items-center gap-2 overflow-hidden"><img src="${p.image}" class="w-8 h-8 rounded-lg object-cover"><p class="text-xs font-bold text-title truncate">${p.title}</p></div>
            <button onclick="deleteProduct('${p.firebaseId}')" class="bg-rose-500 text-white text-[10px] px-2 py-1 rounded-lg">🗑️</button>
        </div>`).join('') : '<p class="text-center text-desc text-xs py-4">Sin productos.</p>';
}

onValue(ref(db, 'valen_products'), s => { const d=s.val(); allProducts=d?Object.keys(d).map(k=>({firebaseId:k,...d[k]})).reverse():[]; renderCategories(); renderProducts(); renderAdminList(); updateDebugStatus(); });

onAuthStateChanged(auth, u => { isLoggedIn=!!u; document.getElementById('debug-btn').classList.toggle('hidden',!isLoggedIn); const ls=document.getElementById('admin-login-section'), cs=document.getElementById('admin-content-section'); if(isLoggedIn){ls.classList.add('hidden'); cs.classList.remove('hidden'); prefillProfileForm();}else{ls.classList.remove('hidden'); cs.classList.add('hidden');} updateDebugStatus(); });

window.adminLogin = () => { const e=document.getElementById('admin-email').value, p=document.getElementById('admin-password').value; signInWithEmailAndPassword(auth,e,p).catch(()=>alert('Error login')); };
window.adminLogout = () => signOut(auth);
window.toggleAdminModal = s => { const m=document.getElementById('admin-modal'); s?(m.classList.remove('hidden'),m.classList.add('flex')):(m.classList.remove('flex'),m.classList.add('hidden')); };

window.handleImageInput = e => { const f=e.target.files[0]; if(!f)return; resizeImg(f,1000,0.8).then(b64=>{ base64Image=b64; document.getElementById('image-preview').src=b64; document.getElementById('image-preview-container').classList.remove('hidden'); document.getElementById('image-status').innerText="OK"; }); };
window.publishProduct = () => { const t=document.getElementById('new-title').value, p=document.getElementById('new-price').value, c=document.getElementById('new-category').value, d=document.getElementById('new-description').value; if(!t||!p||!base64Image) return alert('Faltan datos'); withTimeout(push(ref(db,'valen_products'),{title:t,price:p,category:c,description:d,image:base64Image,createdAt:Date.now()}),12000,'Timeout').then(()=>{showToast('✅ Publicado'); document.getElementById('new-title').value=''; document.getElementById('new-price').value=''; base64Image=null; document.getElementById('image-preview-container').classList.add('hidden');}).catch(e=>alert('Error: '+e.message)); };
window.deleteProduct = id => { if(confirm('¿Borrar?')) remove(ref(db,'valen_products/'+id)); };

window.openLightbox = (u,t) => { document.getElementById('lightbox-img').src=u; document.getElementById('lightbox-title').innerText=t; document.getElementById('lightbox').classList.replace('hidden','flex'); };
window.closeLightbox = () => document.getElementById('lightbox').classList.replace('flex','hidden');

(function(){ if(localStorage.getItem('valen_theme')==='dark') document.body.classList.add('dark-mode'); })();
