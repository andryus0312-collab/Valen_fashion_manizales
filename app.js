import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AlzaSyD4f9rBB|qxzyZZPmgNIK_twefNYLQTW4",
    authDomain: "nuestroespacio-3f541.firebaseapp.com",
    projectId: "nuestroespacio-3f541",
    storageBucket: "nuestroespacio-3f541.appspot.com",
    messagingSenderId: "482638926414",
    appId: "1:482638926414:web:2182581df2455d95b2a91f",
    measurementId: "G-LPC6WBQTZ0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

createApp({
    data() {
        return {
            categories: [
                { id: 'all', name: '✨ Todo' },
                { id: 'hogar', name: '🏠 Hogar' },
                { id: 'ninos', name: '🧸 Niños' },
                { id: 'ropa', name: '👗 Ropa / Cuerpo' },
                { id: 'tendidos', name: '🛏️ Tendidos' }
            ],
            selectedCategory: 'all',
            products: [],
            showAdminModal: false,
            newProduct: {
                title: '',
                price: '',
                category: 'hogar',
                description: '',
                image: null
            },
            lightboxOpen: false,
            lightboxUrl: '',
            lightboxTitle: ''
        }
    },
    computed: {
        filteredProducts() {
            if (this.selectedCategory === 'all') return this.products;
            return this.products.filter(p => p.category === this.selectedCategory);
        }
    },
    mounted() {
        onValue(ref(db, 'valen_products'), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.products = Object.keys(data).map(key => ({
                    firebaseId: key,
                    ...data[key]
                })).reverse();
            } else {
                this.products = [];
            }
        });
    },
    methods: {
        getCategoryName(catId) {
            const found = this.categories.find(c => c.id === catId);
            return found ? found.name : catId;
        },
        getWhatsAppLink(product) {
            const phone = "573229247605";
            const text = `¡Hola Valen! 🤍 Me interesa este producto de tu catálogo: *${product.title}* (${product.price}). ¿Aún lo tienes disponible?`;
            return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        },
        handleProductImage(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    const max = 1000;
                    if (w > h && w > max) { h *= max/w; w = max; }
                    else if (h > max) { w *= max/h; h = max; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    this.newProduct.image = canvas.toDataURL('image/jpeg', 0.8);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        },
        addNewProduct() {
            if (!this.newProduct.title || !this.newProduct.price || !this.newProduct.image) {
                alert('Por favor completa el título, el precio y selecciona una imagen.');
                return;
            }
            push(ref(db, 'valen_products'), { ...this.newProduct });
            this.newProduct = { title: '', price: '', category: 'hogar', description: '', image: null };
            alert('¡Producto publicado con éxito! ✨');
        },
        deleteProduct(firebaseId) {
            if (confirm('¿Estás seguro de eliminar este producto?')) {
                remove(ref(db, `valen_products/${firebaseId}`));
            }
        },
        openLightbox(url, title) {
            this.lightboxUrl = url;
            this.lightboxTitle = title;
            this.lightboxOpen = true;
        }
    }
}).mount('#app');
  
