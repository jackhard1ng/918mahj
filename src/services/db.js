import { db, storage, hasConfig } from '../firebase'
import {
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// ─── Collection names ───
const COLLECTIONS = {
  events: 'events',
  shop: 'shop',
  testimonials: 'testimonials',
  attendees: 'attendees',
  gallery: 'gallery',
}

// ─── Check if Firebase is configured ───
export function isFirebaseReady() {
  return hasConfig && db !== null
}

// ─── Generic snapshot listener ───
// Returns an unsubscribe function
export function subscribeToCollection(collectionName, callback) {
  if (!isFirebaseReady()) return () => {}
  return onSnapshot(collection(db, collectionName), (snapshot) => {
    const data = []
    snapshot.forEach((doc) => data.push({ _id: doc.id, ...doc.data() }))
    callback(data)
  }, (error) => {
    console.error(`Error listening to ${collectionName}:`, error)
    callback([])
  })
}

// ─── Generic fetch ───
export async function fetchCollection(collectionName) {
  if (!isFirebaseReady()) return []
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((doc) => ({ _id: doc.id, ...doc.data() }))
}

// ─── Save a full array (replaces entire collection) ───
export async function saveCollection(collectionName, items) {
  if (!isFirebaseReady()) return false
  try {
    // Delete existing docs, then write new ones, in batches of 500
    const existing = await getDocs(collection(db, collectionName))
    const batch1 = writeBatch(db)
    existing.forEach((d) => batch1.delete(d.ref))
    await batch1.commit()

    // Write new items
    const batch2 = writeBatch(db)
    items.forEach((item, i) => {
      const id = item._id || `${collectionName}_${i}_${Date.now()}`
      const { _id, ...data } = item
      batch2.set(doc(db, collectionName, id), data)
    })
    await batch2.commit()
    return true
  } catch (error) {
    console.error(`Error saving ${collectionName}:`, error)
    return false
  }
}

// ─── Save single document ───
export async function saveDocument(collectionName, docId, data) {
  if (!isFirebaseReady()) return false
  try {
    const { _id, ...cleanData } = data
    await setDoc(doc(db, collectionName, docId), cleanData)
    return true
  } catch (error) {
    console.error(`Error saving document:`, error)
    return false
  }
}

// ─── Delete single document ───
export async function deleteDocument(collectionName, docId) {
  if (!isFirebaseReady()) return false
  try {
    await deleteDoc(doc(db, collectionName, docId))
    return true
  } catch (error) {
    console.error(`Error deleting document:`, error)
    return false
  }
}

// ─── Image upload to Firebase Storage ───
export async function uploadImage(file, path) {
  if (!isFirebaseReady() || !storage) return null
  try {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

// ─── Delete image from Firebase Storage ───
export async function deleteImage(url) {
  if (!isFirebaseReady() || !storage || !url) return
  try {
    // Only delete Firebase Storage URLs
    if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
      const storageRef = ref(storage, url)
      await deleteObject(storageRef)
    }
  } catch (error) {
    // Ignore — image may already be deleted
  }
}

// ─── Event ID helper (Firestore-safe: no slashes, quotes, dots) ───
export function getEventId(event) {
  return `${event['Event Name']}_${event['Date']}_${event['Time']}`.replace(/[^a-zA-Z0-9_-]/g, '_')
}

// ─── Attendees (stored as a single document per event) ───
export function subscribeToAttendees(callback) {
  return subscribeToCollection(COLLECTIONS.attendees, callback)
}

export async function saveAttendees(attendeesMap) {
  if (!isFirebaseReady()) return false
  try {
    // Each key in the map becomes a document
    const existing = await getDocs(collection(db, COLLECTIONS.attendees))
    const batch = writeBatch(db)
    existing.forEach((d) => batch.delete(d.ref))
    Object.entries(attendeesMap).forEach(([eventId, list]) => {
      batch.set(doc(db, COLLECTIONS.attendees, eventId), { list })
    })
    await batch.commit()
    return true
  } catch (error) {
    console.error('Error saving attendees:', error)
    return false
  }
}

export async function saveEventAttendees(eventId, list) {
  if (!isFirebaseReady()) return false
  try {
    await setDoc(doc(db, COLLECTIONS.attendees, eventId), { list })
    return true
  } catch (error) {
    console.error('Error saving event attendees:', error)
    return false
  }
}

export async function fetchAttendees() {
  if (!isFirebaseReady()) return {}
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.attendees))
    const map = {}
    snapshot.forEach((d) => { map[d.id] = d.data().list || [] })
    return map
  } catch {
    return {}
  }
}

// ─── Gallery photos ───
export function subscribeToGallery(callback) {
  return subscribeToCollection(COLLECTIONS.gallery, callback)
}

export async function addGalleryPhoto(file, caption, eventName) {
  if (!isFirebaseReady()) return null
  try {
    const id = `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const url = await uploadImage(file, `gallery/${id}`)
    if (!url) return null
    const data = { url, caption: caption || '', eventName: eventName || '', createdAt: Date.now() }
    await setDoc(doc(db, COLLECTIONS.gallery, id), data)
    return { _id: id, ...data }
  } catch (error) {
    console.error('Error adding gallery photo:', error)
    return null
  }
}

export async function deleteGalleryPhoto(photo) {
  if (!isFirebaseReady()) return false
  try {
    if (photo.url) await deleteImage(photo.url)
    await deleteDoc(doc(db, COLLECTIONS.gallery, photo._id))
    return true
  } catch (error) {
    console.error('Error deleting gallery photo:', error)
    return false
  }
}

export { COLLECTIONS }
