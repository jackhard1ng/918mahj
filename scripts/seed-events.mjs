import { initializeApp } from 'firebase/app'
import { getFirestore, writeBatch, doc, getDocs, collection } from 'firebase/firestore'

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

const events = [
  {
    'Event Name': 'Open Play at McNellie\'s',
    'Date': '03/02/2026',
    'Time': '6-8:30p',
    'Venue': 'McNellie\'s South City',
    'Address': 'Tulsa, OK',
    'Event Type': 'Open Play',
    'Price': '',
    'Description': 'Monday night open play for all skill levels!',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Birdy\'s March Madness',
    'Date': '03/05/2026',
    'Time': '6:30-9p',
    'Venue': 'Bello Boardroom',
    'Address': 'Broken Arrow, OK',
    'Event Type': 'Special Event',
    'Price': '',
    'Description': 'Open Play & Birdy Basics — a special March Madness combo night!',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Birdy Basics at Jewish Federation',
    'Date': '03/08/2026',
    'Time': '',
    'Venue': 'Jewish Federation of Tulsa',
    'Address': 'Tulsa, OK',
    'Event Type': 'Birdy Basics',
    'Price': '',
    'Description': 'Learn to play American Mahjong in a beginner-friendly class.',
    'Registration Link': 'https://jewishtulsa.org/event/mahj918',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Private Birdy Basics',
    'Date': '03/10/2026',
    'Time': '',
    'Venue': '',
    'Address': '',
    'Event Type': 'Private',
    'Price': '',
    'Description': 'Private beginner lesson.',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Open Play & Birdy Basics',
    'Date': '03/12/2026',
    'Time': '6-8:30p',
    'Venue': 'Cyntergy',
    'Address': 'Downtown Tulsa, OK',
    'Event Type': 'Open Play',
    'Price': '',
    'Description': 'Open Play & Birdy Basics at Cyntergy in Downtown Tulsa.',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Private Birdy Basics Weekend',
    'Date': '03/13/2026',
    'Time': 'Fri–Sun',
    'Venue': '',
    'Address': '',
    'Event Type': 'Private',
    'Price': '',
    'Description': 'Private Birdy Basics event running Friday March 13 through Sunday March 15.',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Shamrock & Mahj Open Play',
    'Date': '03/16/2026',
    'Time': '6-8:30p',
    'Venue': 'McNellie\'s South City',
    'Address': 'Tulsa, OK',
    'Event Type': 'Special Event',
    'Price': '',
    'Description': 'St. Patrick\'s Day themed open play — come celebrate Shamrock & Mahj!',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Open Play & Birdy Basics',
    'Date': '03/26/2026',
    'Time': '6-8:30p',
    'Venue': 'Cyntergy',
    'Address': 'Downtown Tulsa, OK',
    'Event Type': 'Open Play',
    'Price': '',
    'Description': 'Open Play & Birdy Basics at Cyntergy in Downtown Tulsa.',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
  {
    'Event Name': 'Open Play at McNellie\'s',
    'Date': '03/30/2026',
    'Time': '6-8:30p',
    'Venue': 'McNellie\'s South City',
    'Address': 'Tulsa, OK',
    'Event Type': 'Open Play',
    'Price': '',
    'Description': 'Monday night open play for all skill levels!',
    'Registration Link': '',
    'Max Spots': '',
    'Image URL': '',
  },
]

async function seed() {
  // Clear existing events
  const existing = await getDocs(collection(db, 'events'))
  if (existing.size > 0) {
    const delBatch = writeBatch(db)
    existing.forEach(d => delBatch.delete(d.ref))
    await delBatch.commit()
    console.log(`Cleared ${existing.size} existing events`)
  }

  // Add new events
  const batch = writeBatch(db)
  events.forEach((event, i) => {
    const id = `event_${i}_${Date.now()}`
    batch.set(doc(db, 'events', id), event)
  })
  await batch.commit()
  console.log(`Added ${events.length} events to Firestore!`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
