import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, getDocs, collection } from 'firebase/firestore'
import { readFileSync } from 'fs'

const firebaseConfig = {
  apiKey: "AIzaSyC-lu-hKjRJS7WABr8oHL7SWuNFP1SRHJ8",
  authDomain: "mahj918-b6bea.firebaseapp.com",
  projectId: "mahj918-b6bea",
  storageBucket: "mahj918-b6bea.firebasestorage.app",
  messagingSenderId: "599823613046",
  appId: "1:599823613046:web:9a9fabcb9d4957381df357",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const raw = JSON.parse(readFileSync('/tmp/shop_products.json', 'utf8'))

// Clean up product names and map to our schema
const products = raw.map(p => {
  let name = p.name
  // Shorten overly long Amazon names
  if (name.length > 60) {
    const parts = name.split(' - ')
    name = parts[0]
    if (name.length > 60) {
      const commaParts = name.split(',')
      name = commaParts[0]
    }
  }
  // Map categories
  let category = 'Accessories'
  if (p.category === 'Entertaining') category = 'Entertaining'
  else if (p.category === 'Mahjong Tiles, Mats, Racks') category = 'Sets & Tiles'
  else if (p.category === 'Mahj Apparel') category = 'Accessories'

  return {
    'Product Name': name.trim(),
    'Category': category,
    'Image URL': p.image || '',
    'Buy Link': p.url || '',
    'Price': p.price || '',
    'Description': '',
  }
})

async function seed() {
  // Clear existing shop
  const existing = await getDocs(collection(db, 'shop'))
  if (existing.size > 0) {
    const delBatch = writeBatch(db)
    existing.forEach(d => delBatch.delete(d.ref))
    await delBatch.commit()
    console.log(`Cleared ${existing.size} existing products`)
  }

  // Firestore batches max 500 ops, we have ~53 so one batch is fine
  const batch = writeBatch(db)
  products.forEach((product, i) => {
    const id = `shop_${i}_${Date.now()}`
    batch.set(doc(db, 'shop', id), product)
  })
  await batch.commit()
  console.log(`Added ${products.length} products to Firestore!`)

  // Print summary
  const cats = {}
  products.forEach(p => { cats[p.Category] = (cats[p.Category] || 0) + 1 })
  Object.entries(cats).forEach(([cat, count]) => console.log(`  ${cat}: ${count}`))

  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
