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

        let db;
        let auth;
        let isLoggedIn = false;
        try {
            const app = initializeApp(firebaseConfig);
            db = getDatabase(app);
            auth = getAuth(app);
        } catch (initError) {
            document.getElementById('products-container').innerHTML = `
                <div class="col-span-full py-12 px-6 bg-rose-950/80 border-2 border-rose-500 rounded-3xl text-center space-y-3">
                    <p class="text-3xl">🚨</p>
                    <p class="text-base font-bold text-rose-200">Error al inicializar Firebase</p>
                    <p class="text-xs text-slate-300 font-mono bg-black/40 p-3 rounded-xl overflow-x-auto">${initError.message}</p>
                </div>
            `;
            throw initError;
        }

        let allProducts = [];
        let selectedCategory = 'all';
        let base64Image = null;
        let profileBase64Image = null;
        let selectedRing = null;

        // ============ PANEL DE DIAGNÓSTICO (solo admin) ============
        const debugLogs = [];
        function pushDebugLog(type, args) {
            const time = new Date().toLocaleTimeString();
            const msg = args.map(a => {
                try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch (e) { return String(a); }
            }).join(' ');
            debugLogs.push({ time, type, msg });
            if (debugLogs.length > 150) debugLogs.shift();
            renderDebugLogs();
        }
        const _origLog = console.log.bind(console);
        const _origWarn = console.warn.bind(console);
        const _origError = console.error.bind(console);
        console.log = function (...args) { pushDebugLog('log', args); _origLog(...args); };
        console.warn = function (...args) { pushDebugLog('warn', args); _origWarn(...args); };
        console.error = function (...args) { pushDebugLog('error', args); _origError(...args); };

        window.addEventListener('error', (e) => {
            pushDebugLog('error', ['Error no capturado: ' + e.message + ' (' + e.filename + ':' + e.lineno + ')']);
        });
        window.addEventListener('unhandledrejection', (e) => {
            pushDebugLog('error', ['Promesa rechazada sin capturar: ' + (e.reason && e.reason.message ? e.reason.message : e.reason)]);
        });

        let dbConnected = null;
        onValue(ref(db, '.info/connected'), (snap) => {
            dbConnected = snap.val() === true;
            console.log('Estado de conexión con Firebase:', dbConnected ? 'CONECTADO ✅' : 'DESCONECTADO ❌');
            updateDebugStatus();
        });

        function updateDebugStatus() {
            const connEl = document.getElementById('debug-connection');
            const authEl = document.getElementById('debug-auth');
            const countEl = document.getElementById('debug-count');
            if (connEl) {
                connEl.innerText = dbConnected === null ? '⏳ Verificando...' : (dbConnected ? '🟢 Conectado a Firebase' : '🔴 Sin conexión a Firebase');
            }
            if (authEl) {
                const user = auth && auth.currentUser;
                authEl.innerText = user ? ('👤 Sesión activa: ' + user.email) : '👤 Sin sesión';
            }
            if (countEl) {
                countEl.innerText = '📦 Productos cargados: ' + allProducts.length;
            }
        }

        function renderDebugLogs() {
            const list = document.getElementById('debug-log-list');
            if (!list) return;
            const colors = { log: 'text-slate-300', warn: 'text-yellow-400', error: 'text-rose-400' };
            list.innerHTML = debugLogs.slice().reverse().map(l => `
                <div class="border-b border-purple-500/10 py-1.5">
                    <span class="text-slate-500">[${l.time}]</span>
                    <span class="${colors[l.type] || 'text-slate-300'}">${(l.msg || '').replace(/</g, '&lt;')}</span>
                </div>
            `).join('');
        }

        window.toggleDebugPanel = function (show) {
            const panel = document.getElementById('debug-panel');
            if (!panel) return;
            if (show) {
                panel.classList.remove('hidden');
                panel.classList.add('flex');
                updateDebugStatus();
                renderDebugLogs();
            } else {
                panel.classList.remove('flex');
                panel.classList.add('hidden');
            }
        }

        window.clearDebugLogs = function () {
            debugLogs.length = 0;
            renderDebugLogs();
        }

        // Envuelve una promesa con un límite de tiempo, para que ningún botón quede trabado para siempre
        function withTimeout(promise, ms, timeoutMsg) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    reject(new Error(timeoutMsg || ('Tiempo de espera agotado (' + ms + 'ms)')));
                }, ms);
                promise.then((val) => { clearTimeout(timer); resolve(val); })
                       .catch((err) => { clearTimeout(timer); reject(err); });
            });
        }
        // ============ FIN PANEL DE DIAGNÓSTICO ============

        const categories = [
            { id: 'all', name: '✨ Todo' },
            { id: 'hogar', name: '🏠 Hogar' },
            { id: 'ninos', name: '🧸 Niños' },
            { id: 'ropa', name: '👗 Ropa / Cuerpo' },
            { id: 'tendidos', name: '🛏️ Tendidos' }
        ];

        // Presets de color/degradado a juego con el logo (morado / negro / blanco)
        const ringPresets = [
            { name: 'Morado', mode: 'solid', color: '#a855f7' },
            { name: 'Negro', mode: 'solid', color: '#000000' },
            { name: 'Blanco', mode: 'solid', color: '#ffffff' },
            { name: 'Rosa', mode: 'solid', color: '#ec4899' },
            { name: 'Morado → Negro', mode: 'gradient', from: '#a855f7', to: '#000000' },
            { name: 'Morado → Rosa', mode: 'gradient', from: '#a855f7', to: '#ec4899' },
            { name: 'Negro → Morado', mode: 'gradient', from: '#000000', to: '#7e22ce' },
            { name: 'Blanco → Morado', mode: 'gradient', from: '#ffffff', to: '#a855f7' }
        ];

        // Perfil por defecto (texto tomado del Instagram @valen_fashion_manizales)
        const defaultProfile = {
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            name: 'Valen Fashion',
            tagline: '✨ Mereces lo que sueñas 🤍',
            category: '🛍️ Compras y ventas minoristas',
            bio: 'Tenemos cosas hermosas y exclusivas para ti 💥\npara todos los gustos ♂️♀️',
            service: '🚚 Contamos con servicio de domicilio en Manizales 💎',
            address: '📍 Cra 38 #66-20, Manizales, Caldas',
            ring: { mode: 'solid', color: '#a855f7' }
        };

        let currentProfile = defaultProfile;

        function showToast(msg) {
            const el = document.getElementById('toast');
            if (!el) return;
            el.innerText = msg;
            el.classList.remove('hidden');
            requestAnimationFrame(() => { el.style.opacity = '1'; });
            clearTimeout(showToast._t);
            showToast._t = setTimeout(() => {
                el.style.opacity = '0';
                setTimeout(() => el.classList.add('hidden'), 300);
            }, 2200);
        }

        // Detección de admin por URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === '1') {
            document.getElementById('btn-admin').classList.remove('hidden');
        }

        function ringToCss(ring) {
            if (!ring) return defaultProfile.ring.color;
            if (ring.mode === 'gradient') return `linear-gradient(135deg, ${ring.from}, ${ring.to})`;
            return ring.color;
        }

        function findPresetIndex(ring) {
            if (!ring) return -1;
            return ringPresets.findIndex(p => {
                if (p.mode !== ring.mode) return false;
                if (p.mode === 'solid') return p.color === ring.color;
                return p.from === ring.from && p.to === ring.to;
            });
        }

        function renderRingPresets() {
            const container = document.getElementById('ring-presets');
            container.innerHTML = ringPresets.map((p, i) => {
                const bg = p.mode === 'solid' ? p.color : `linear-gradient(135deg, ${p.from}, ${p.to})`;
                return `<button type="button" onclick="selectRingPreset(${i})" title="${p.name}" class="ring-preset-btn w-9 h-9 rounded-full border-2 border-purple-500/30 hover:scale-110 transition-all" style="background:${bg}"></button>`;
            }).join('');
        }

        function highlightRingPreset(idx) {
            document.querySelectorAll('.ring-preset-btn').forEach((btn, i) => {
                if (i === idx) {
                    btn.classList.add('ring-2', 'ring-white', 'scale-110');
                } else {
                    btn.classList.remove('ring-2', 'ring-white', 'scale-110');
                }
            });
        }

        function applyRingToPreview(ring) {
            const el = document.getElementById('ring-preview');
            if (el) el.style.background = ringToCss(ring);
        }

        window.selectRingPreset = function(idx) {
            const p = ringPresets[idx];
            selectedRing = p.mode === 'solid' ? { mode: 'solid', color: p.color } : { mode: 'gradient', from: p.from, to: p.to };
            highlightRingPreset(idx);
            applyRingToPreview(selectedRing);
        }

        window.selectCustomSolid = function() {
            const color = document.getElementById('ring-custom-solid').value;
            selectedRing = { mode: 'solid', color };
            highlightRingPreset(-1);
            applyRingToPreview(selectedRing);
        }

        window.selectCustomGradient = function() {
            const from = document.getElementById('ring-custom-from').value;
            const to = document.getElementById('ring-custom-to').value;
            selectedRing = { mode: 'gradient', from, to };
            highlightRingPreset(-1);
            applyRingToPreview(selectedRing);
        }

        function renderProfile(profile) {
            const p = profile || defaultProfile;
            document.getElementById('profile-photo').src = p.photo || defaultProfile.photo;
            document.getElementById('profile-name').innerText = p.name || defaultProfile.name;
            document.getElementById('profile-tagline').innerText = p.tagline || defaultProfile.tagline;
            document.getElementById('profile-category').innerText = p.category || '';
            document.getElementById('profile-bio').innerText = p.bio || '';
            document.getElementById('profile-service').innerText = p.service || '';
            document.getElementById('profile-address').innerText = p.address || '';
            document.getElementById('profile-ring').style.background = ringToCss(p.ring);
        }

        function prefillProfileForm() {
            const p = currentProfile || defaultProfile;
            document.getElementById('profile-category-input').value = p.category || '';
            document.getElementById('profile-bio-input').value = p.bio || '';
            document.getElementById('profile-service-input').value = p.service || '';
            document.getElementById('profile-address-input').value = p.address || '';

            document.getElementById('profile-image-preview-container').classList.add('hidden');
            document.getElementById('profile-image-status').innerText = 'Sin cambios';
            profileBase64Image = null;

            selectedRing = p.ring || defaultProfile.ring;
            renderRingPresets();
            const idx = findPresetIndex(selectedRing);
            highlightRingPreset(idx);
            applyRingToPreview(selectedRing);

            if (selectedRing.mode === 'solid') {
                document.getElementById('ring-custom-solid').value = selectedRing.color;
            } else {
                document.getElementById('ring-custom-from').value = selectedRing.from;
                document.getElementById('ring-custom-to').value = selectedRing.to;
            }
        }

        window.handleProfileImageInput = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            document.getElementById('profile-image-status').innerText = "Cargando imagen...";
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    const max = 600;
                    if (w > h && w > max) { h *= max / w; w = max; }
                    else if (h > max) { w *= max / h; h = max; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    profileBase64Image = canvas.toDataURL('image/jpeg', 0.85);

                    document.getElementById('profile-image-preview').src = profileBase64Image;
                    document.getElementById('profile-image-preview-container').classList.remove('hidden');
                    document.getElementById('profile-image-status').innerText = "Imagen cargada ✨";
                };
                img.onerror = () => {
                    document.getElementById('profile-image-status').innerText = "Error al leer la imagen ⚠️";
                };
                img.src = ev.target.result;
            };
            reader.onerror = () => {
                document.getElementById('profile-image-status').innerText = "Error al leer el archivo ⚠️";
            };
            reader.readAsDataURL(file);
        }

        window.saveProfile = function() {
            const category = document.getElementById('profile-category-input').value.trim();
            const bio = document.getElementById('profile-bio-input').value.trim();
            const service = document.getElementById('profile-service-input').value.trim();
            const address = document.getElementById('profile-address-input').value.trim();

            const updatedProfile = {
                ...(currentProfile || defaultProfile),
                category,
                bio,
                service,
                address,
                ring: selectedRing || (currentProfile && currentProfile.ring) || defaultProfile.ring
            };
            if (profileBase64Image) updatedProfile.photo = profileBase64Image;

            const btn = document.getElementById('save-profile-btn');
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            console.log('Iniciando guardado de perfil...');
            withTimeout(
                set(ref(db, 'valen_profile'), updatedProfile),
                12000,
                'La conexión con Firebase tardó demasiado (más de 12s). Revisa tu internet o un posible bloqueador (Brave Shields, adblock).'
            ).then(() => {
                console.log('Perfil guardado con éxito ✅');
                profileBase64Image = null;
                document.getElementById('profile-image-status').innerText = 'Sin cambios';
                document.getElementById('profile-image-preview-container').classList.add('hidden');
                showToast('✅ Perfil actualizado con éxito');
            }).catch((error) => {
                console.error('Error al guardar perfil:', error.code || '', error.message);
                alert('🚨 Error al guardar el perfil: ' + error.message);
            }).finally(() => {
                btn.disabled = false;
                btn.innerText = 'Guardar Perfil 💾';
            });
        }

        // Escucha cambios del perfil en tiempo real
        onValue(ref(db, 'valen_profile'), (snapshot) => {
            const data = snapshot.val();
            currentProfile = data || defaultProfile;
            renderProfile(currentProfile);
        }, (error) => {
            console.error('Firebase Profile Read Error:', error);
            renderProfile(defaultProfile);
        });

        function renderCategories() {
            const nav = document.getElementById('category-filters');
            nav.innerHTML = categories.map(cat => {
                const active = selectedCategory === cat.id;
                const activeClasses = 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-pink-400 shadow-[0_4px_0_#581c87,0_8px_18px_rgba(236,72,153,0.45)] active:translate-y-1 active:shadow-[0_1px_0_#581c87]';
                const inactiveClasses = 'bg-[#1b0c1b] text-slate-300 border-purple-900/50 shadow-[0_4px_0_#2e1065] hover:bg-purple-950/60 active:translate-y-1 active:shadow-[0_1px_0_#2e1065]';
                return `
                <button onclick="setCategory('${cat.id}')" class="px-4 py-2.5 rounded-full text-xs font-bold border transition-all duration-150 whitespace-nowrap ${active ? activeClasses : inactiveClasses}">
                    ${cat.name}
                </button>
            `;
            }).join('');
        }

        window.setCategory = function(catId) {
            selectedCategory = catId;
            renderCategories();
            renderProducts();
        }

        function renderProducts() {
            const container = document.getElementById('products-container');
            const filtered = selectedCategory === 'all'
                ? allProducts
                : allProducts.filter(p => p.category === selectedCategory);

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full py-16 text-center text-slate-400 space-y-2">
                        <p class="text-3xl">🛍️</p>
                        <p class="text-sm">No hay productos disponibles en esta categoría todavía.</p>
                        <p class="text-[11px] text-purple-400">Si eres admin, entra con ?admin=1 para publicar.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map(p => {
                const catObj = categories.find(c => c.id === p.category);
                const catName = catObj ? catObj.name : p.category;
                const phone = "573229247605";
                const text = encodeURIComponent(`¡Hola Valen! 🤍 Me interesa este producto de tu catálogo: *${p.title}* (${p.price}). ¿Aún lo tienes disponible?`);
                const waLink = `https://wa.me/${phone}?text=${text}`;

                return `
                    <div class="bg-[#1b0c1b]/85 backdrop-blur-md border border-purple-500/20 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all hover:border-purple-500/50">
                        <div>
                            <div class="relative aspect-square overflow-hidden bg-black cursor-pointer" onclick="openLightbox('${p.image}', '${(p.title || '').replace(/'/g, "\\'")}')">
                                <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                <span class="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-purple-300 text-[10px] font-bold px-3 py-1 rounded-full border border-purple-500/30">
                                    ${catName}
                                </span>
                            </div>
                            <div class="p-5 space-y-2">
                                <div class="flex items-start justify-between gap-2">
                                    <h3 class="text-lg font-bold text-white leading-snug">${p.title}</h3>
                                    <span class="text-purple-400 font-extrabold text-base whitespace-nowrap">${p.price}</span>
                                </div>
                                <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${p.description || ''}</p>
                            </div>
                        </div>
                        <div class="p-5 pt-0">
                            <a href="${waLink}" target="_blank" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                                <span>Pedir por WhatsApp 📱</span>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderAdminList() {
            const list = document.getElementById('admin-products-list');
            if (!list) return;
            if (allProducts.length === 0) {
                list.innerHTML = '<div class="text-center py-6 text-slate-500 text-xs">No hay productos registrados aún.</div>';
                return;
            }

            list.innerHTML = allProducts.map(p => `
                <div class="flex items-center justify-between bg-[#0d0310]/90 p-3 rounded-2xl border border-purple-500/30">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <img src="${p.image}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-purple-500/40">
                        <div class="truncate">
                            <p class="text-xs font-bold text-white truncate">${p.title}</p>
                            <p class="text-[10px] text-pink-400 font-semibold">${p.price}</p>
                        </div>
                    </div>
                    <button onclick="deleteProduct('${p.firebaseId}')" class="bg-rose-800 hover:bg-rose-700 text-rose-100 font-bold text-[11px] px-3.5 py-2 rounded-xl transition-all">
                        🗑️ Borrar
                    </button>
                </div>
            `).join('');
        }

        // Conexión a Firebase con visor de errores en pantalla
        onValue(ref(db, 'valen_products'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                allProducts = Object.keys(data).map(key => ({
                    firebaseId: key,
                    ...data[key]
                })).reverse();
            } else {
                allProducts = [];
            }
            console.log('Productos recibidos desde Firebase:', allProducts.length);
            renderCategories();
            renderProducts();
            renderAdminList();
            updateDebugStatus();
        }, (error) => {
            console.error("Firebase Read Error:", error.code || '', error.message);
            document.getElementById('products-container').innerHTML = `
                <div class="col-span-full py-12 px-6 bg-rose-950/80 border-2 border-rose-500 rounded-3xl text-center space-y-3">
                    <p class="text-3xl">⚠️</p>
                    <p class="text-base font-bold text-rose-200">Error de conexión o permisos en Firebase</p>
                    <p class="text-xs text-slate-300 font-mono bg-black/40 p-3 rounded-xl overflow-x-auto">${error.message}</p>
                    <p class="text-xs text-purple-300 pt-2">Asegúrate de que la <strong>Realtime Database</strong> esté creada en tu consola de Firebase y las reglas permitan lectura/escritura.</p>
                </div>
            `;
        });

        function updateAdminUI() {
            const loginSection = document.getElementById('admin-login-section');
            const contentSection = document.getElementById('admin-content-section');
            if (!loginSection || !contentSection) return;
            if (isLoggedIn) {
                loginSection.classList.add('hidden');
                contentSection.classList.remove('hidden');
                prefillProfileForm();
            } else {
                loginSection.classList.remove('hidden');
                contentSection.classList.add('hidden');
            }
        }

        onAuthStateChanged(auth, (user) => {
            isLoggedIn = !!user;
            console.log('Estado de sesión:', isLoggedIn ? ('activa (' + user.email + ')') : 'sin sesión');
            const debugBtn = document.getElementById('debug-btn');
            if (debugBtn) debugBtn.classList.toggle('hidden', !isLoggedIn);
            updateAdminUI();
            updateDebugStatus();
        });

        window.adminLogin = function() {
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value;
            const errorEl = document.getElementById('admin-login-error');
            errorEl.classList.add('hidden');

            if (!email || !password) {
                errorEl.innerText = '⚠️ Escribe tu correo y contraseña.';
                errorEl.classList.remove('hidden');
                return;
            }

            const btn = document.getElementById('admin-login-btn');
            btn.disabled = true;
            btn.innerText = 'Ingresando...';

            signInWithEmailAndPassword(auth, email, password).then(() => {
                btn.disabled = false;
                btn.innerText = 'Ingresar 🔑';
                document.getElementById('admin-password').value = '';
            }).catch((error) => {
                console.error('Login error:', error);
                errorEl.innerText = '🚨 Correo o contraseña incorrectos.';
                errorEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerText = 'Ingresar 🔑';
            });
        }

        window.adminLogout = function() {
            signOut(auth).then(() => {
                toggleAdminModal(false);
            });
        }

        window.toggleAdminModal = function(show) {
            const modal = document.getElementById('admin-modal');
            if (show) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                updateAdminUI();
            } else {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }
        }

        window.handleImageInput = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            document.getElementById('image-status').innerText = "Cargando imagen...";
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    const max = 1000;
                    if (w > h && w > max) { h *= max / w; w = max; }
                    else if (h > max) { w *= max / h; h = max; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    base64Image = canvas.toDataURL('image/jpeg', 0.8);

                    document.getElementById('image-preview').src = base64Image;
                    document.getElementById('image-preview-container').classList.remove('hidden');
                    document.getElementById('image-status').innerText = "Imagen cargada ✨";
                };
                img.onerror = () => {
                    document.getElementById('image-status').innerText = "Error al leer la imagen ⚠️";
                };
                img.src = ev.target.result;
            };
            reader.onerror = () => {
                document.getElementById('image-status').innerText = "Error al leer el archivo ⚠️";
            };
            reader.readAsDataURL(file);
        }

        window.publishProduct = function() {
            const title = document.getElementById('new-title').value.trim();
            const price = document.getElementById('new-price').value.trim();
            const category = document.getElementById('new-category').value;
            const description = document.getElementById('new-description').value.trim();

            if (!title || !price) {
                alert('⚠️ El nombre y el precio son obligatorios.');
                return;
            }
            if (!base64Image) {
                alert('⚠️ Selecciona una fotografía del producto.');
                return;
            }

            const btn = document.getElementById('publish-btn');
            btn.disabled = true;
            btn.innerText = 'Publicando...';

            console.log('Iniciando publicación de producto:', title);
            withTimeout(
                push(ref(db, 'valen_products'), {
                    title,
                    price,
                    category,
                    description,
                    image: base64Image,
                    createdAt: Date.now()
                }),
                12000,
                'La conexión con Firebase tardó demasiado (más de 12s). Revisa tu internet o un posible bloqueador (Brave Shields, adblock).'
            ).then(() => {
                console.log('Producto publicado con éxito ✅:', title);
                document.getElementById('new-title').value = '';
                document.getElementById('new-price').value = '';
                document.getElementById('new-description').value = '';
                document.getElementById('image-preview-container').classList.add('hidden');
                document.getElementById('image-status').innerText = 'Ningún archivo';
                document.getElementById('new-image-file').value = '';
                base64Image = null;
                showToast('✅ Producto publicado con éxito');
            }).catch((error) => {
                console.error('Error al publicar:', error.code || '', error.message);
                alert('🚨 Error al publicar: ' + error.message);
            }).finally(() => {
                btn.disabled = false;
                btn.innerText = 'Publicar Producto ✨';
            });
        }

        window.deleteProduct = function(firebaseId) {
            if (!confirm('¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.')) return;
            remove(ref(db, 'valen_products/' + firebaseId)).catch((error) => {
                console.error('Error al eliminar:', error);
                alert('🚨 Error al eliminar: ' + error.message);
            });
        }

        window.openLightbox = function(imageUrl, title) {
            document.getElementById('lightbox-img').src = imageUrl;
            document.getElementById('lightbox-title').innerText = title || '';
            const lightbox = document.getElementById('lightbox');
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
        }

        window.closeLightbox = function() {
            const lightbox = document.getElementById('lightbox');
            lightbox.classList.remove('flex');
            lightbox.classList.add('hidden');
        }
