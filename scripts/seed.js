// scripts/seed.js
// ─────────────────────────────────────────────────────────────────────────────
// Script de seed para poblar Firestore con datos iniciales de demostración:
//   - Categorías del menú (con emojis)
//   - Platillos de ejemplo
//   - Mesas del restaurante
//   - Usuario administrador (debes crearlo primero en Firebase Auth)
//
// INSTRUCCIONES:
//   1. Asegúrate de que tu archivo .env esté configurado
//   2. Crea el usuario admin en Firebase Auth Console y copia su UID
//   3. Reemplaza ADMIN_UID abajo con el UID real
//   4. Ejecuta: node scripts/seed.js
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

// ── CONFIGURA ESTE UID CON EL TUYO ────────────────────────────────────────
const ADMIN_UID = 'REEMPLAZA_CON_TU_UID_DE_FIREBASE_AUTH';
// ──────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

async function seed() {
  console.log('🌱 Iniciando seed de Firestore...\n');

  /* ── Usuario Administrador ──────────────────────────────────────────── */
  await setDoc(doc(db, 'users', ADMIN_UID), {
    name:      'Administrador LLEP',
    email:     'admin@llep.com',
    role:      'admin',
    createdAt: new Date(),
  });
  console.log('✅ Usuario admin creado');

  /* ── Categorías del menú ────────────────────────────────────────────── */
  const categories = [
    { name: 'Entradas',   emoji: '🥗', order: 1 },
    { name: 'Tacos',      emoji: '🌮', order: 2 },
    { name: 'Hamburguesas', emoji: '🍔', order: 3 },
    { name: 'Bebidas',    emoji: '🥤', order: 4 },
    { name: 'Postres',    emoji: '🍮', order: 5 },
  ];

  const catIds = {};
  for (const cat of categories) {
    const ref = await addDoc(collection(db, 'menuCategories'), { ...cat, createdAt: new Date() });
    catIds[cat.name] = ref.id;
    console.log(`  📂 Categoría: ${cat.emoji} ${cat.name}`);
  }

  /* ── Platillos del menú ─────────────────────────────────────────────── */
  const items = [
    // Entradas
    { categoryId: catIds['Entradas'],    name: 'Guacamole con totopos',  price: 89,  description: 'Aguacate fresco con limón y cilantro',   available: true },
    { categoryId: catIds['Entradas'],    name: 'Orden de alitas (10pz)', price: 139, description: 'Con salsa de tu elección',               available: true },
    { categoryId: catIds['Entradas'],    name: 'Sopa de Lima',           price: 79,  description: 'Receta tradicional yucateca',            available: true },
    // Tacos
    { categoryId: catIds['Tacos'],       name: 'Taco al Pastor',         price: 25,  description: 'Con piña, cebolla y cilantro',           available: true },
    { categoryId: catIds['Tacos'],       name: 'Taco de Bistec',         price: 28,  description: 'Bistec asado a la plancha',              available: true },
    { categoryId: catIds['Tacos'],       name: 'Taco de Cochinita',      price: 26,  description: 'Con cebolla morada encurtida',           available: true },
    { categoryId: catIds['Tacos'],       name: 'Taco Vegetariano',       price: 24,  description: 'Champiñones, espinaca y queso',          available: true },
    // Hamburguesas
    { categoryId: catIds['Hamburguesas'], name: 'Hamburguesa Clásica',   price: 129, description: 'Carne 180g, lechuga, tomate, cheddar',   available: true },
    { categoryId: catIds['Hamburguesas'], name: 'Hamburguesa BBQ',       price: 149, description: 'Con tocino, aros de cebolla y BBQ',      available: true },
    { categoryId: catIds['Hamburguesas'], name: 'Hamburguesa Doble',     price: 169, description: 'Doble carne y doble queso',              available: true },
    // Bebidas
    { categoryId: catIds['Bebidas'],     name: 'Agua de Jamaica',        price: 35,  description: 'Agua fresca natural 500ml',              available: true },
    { categoryId: catIds['Bebidas'],     name: 'Refresco',               price: 30,  description: 'Coca-Cola, Sprite, Fanta',               available: true },
    { categoryId: catIds['Bebidas'],     name: 'Michelada',              price: 75,  description: 'Con clamato, limón y sal',               available: true },
    { categoryId: catIds['Bebidas'],     name: 'Agua Mineral',           price: 25,  description: '',                                       available: true },
    // Postres
    { categoryId: catIds['Postres'],     name: 'Flan Napolitano',        price: 59,  description: 'Con cajeta y nuez',                      available: true },
    { categoryId: catIds['Postres'],     name: 'Helado 2 bolas',         price: 49,  description: 'Vainilla, chocolate o fresa',            available: true },
  ];

  for (const item of items) {
    await addDoc(collection(db, 'menuItems'), { ...item, createdAt: new Date() });
    console.log(`  🍽️  Platillo: ${item.name} — $${item.price}`);
  }

  /* ── Mesas ──────────────────────────────────────────────────────────── */
  const tables = [
    'Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4',
    'Mesa 5', 'Mesa 6', 'Barra', 'Terraza',
  ];

  for (let i = 0; i < tables.length; i++) {
    await addDoc(collection(db, 'tables'), {
      name:     tables[i],
      number:   i + 1,
      status:   'closed',
      items:    [],
      openedAt: null,
      openedBy: null,
    });
    console.log(`  🪑 Mesa: ${tables[i]}`);
  }

  console.log('\n✅ Seed completado exitosamente!');
  console.log('📌 Recuerda crear el usuario en Firebase Auth y actualizar ADMIN_UID en este script.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
