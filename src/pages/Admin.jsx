import { useState, useEffect, useMemo } from 'react'
import { EVENT_COLORS } from '../config'
import { useEvents, useShop, useTestimonials, useGallery } from '../hooks/useSiteData'
import { isFirebaseReady, saveCollection, fetchAttendees, saveAttendees, saveEventAttendees, subscribeToAttendees, uploadImage, addGalleryPhoto, deleteGalleryPhoto, getEventId, saveUserProfile, COLLECTIONS } from '../services/db'
import { db } from '../firebase'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'

const EVENT_TYPES = ['Open Play', 'Birdy Basics', 'League', 'Special Event', 'Private']
const PRODUCT_CATEGORIES = ['Sets & Tiles', 'Accessories', 'Entertaining']

const EMPTY_EVENT = {
  'Event Name': '', 'Date': '', 'Time': '', 'Venue': '', 'Address': '',
  'Event Type': 'Open Play', 'Price': '', 'Description': '',
  'Registration Link': '', 'Max Spots': '', 'Image URL': '',
  'Punch Card Eligible': 'yes',
}
const EMPTY_PRODUCT = {
  'Product Name': '', 'Category': 'Sets & Tiles', 'Image URL': '',
  'Buy Link': '', 'Price': '', 'Description': '',
}
const EMPTY_TESTIMONIAL = { 'Name': '', 'Quote': '', 'Date': '' }

const ATTENDEE_STORAGE_KEY = 'mahj918_admin_attendees'

function getLocalAttendees() {
  try {
    const stored = localStorage.getItem(ATTENDEE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function saveLocalAttendees(all) {
  try { localStorage.setItem(ATTENDEE_STORAGE_KEY, JSON.stringify(all)) } catch {}
}

// getEventId imported from ../services/db

function formatDateForInput(dateStr) {
  if (!dateStr) return ''
  const [month, day, year] = dateStr.split('/')
  if (!month || !day || !year) return ''
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function formatDateFromInput(isoStr) {
  if (!isoStr) return ''
  const [year, month, day] = isoStr.split('-')
  return `${month}/${day}/${year}`
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const [month, day, year] = dateStr.split('/')
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function isPast(dateStr) {
  if (!dateStr) return false
  const [month, day, year] = dateStr.split('/')
  const d = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 600
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function ImageUpload({ value, onChange, showToast, storagePrefix }) {
  const [uploading, setUploading] = useState(false)
  return (
    <div>
      <label className="block text-sm font-semibold text-charcoal mb-1">Image</label>
      {value && (
        <div className="mb-2 relative inline-block">
          <img src={value} alt="Preview" className="h-28 rounded-lg object-cover" />
          <button type="button" onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-6 h-6 bg-coral text-white rounded-full flex items-center justify-center cursor-pointer border-none text-xs font-bold">&times;</button>
        </div>
      )}
      <div className="flex gap-2">
        <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-charcoal-light hover:border-teal hover:text-teal transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
          {uploading ? 'Uploading...' : 'Upload Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            if (file.size > 10 * 1024 * 1024) { showToast('Image must be under 10MB'); return }
            setUploading(true)
            const compressed = await compressImage(file)
            if (!compressed) { setUploading(false); showToast('Failed to process image'); return }
            if (isFirebaseReady()) {
              const path = `${storagePrefix || 'images'}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`
              const url = await uploadImage(compressed, path)
              setUploading(false)
              if (url) { onChange(url); showToast('Image uploaded') }
              else showToast('Upload failed — check Firebase Storage')
            } else {
              // Fallback: base64 for localStorage
              const reader = new FileReader()
              reader.onload = () => { setUploading(false); onChange(reader.result); showToast('Image uploaded') }
              reader.onerror = () => { setUploading(false); showToast('Failed to process image') }
              reader.readAsDataURL(compressed)
            }
            e.target.value = ''
          }} />
        </label>
        <span className="text-xs text-charcoal-light self-center">or</span>
        <input type="text" value={value?.startsWith('data:') ? '' : (value?.startsWith('http') ? value : '') || ''}
          onChange={e => onChange(e.target.value)} placeholder="Paste image URL"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
    </div>
  )
}

// Reusable delete confirmation
function DeleteModal({ name, onCancel, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in-up">
        <h3 className="font-heading text-lg text-charcoal mb-2">Delete?</h3>
        <p className="text-sm text-charcoal-light mb-4">
          Are you sure you want to delete <strong>{name}</strong>? This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-charcoal-light font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer bg-white">Cancel</button>
          <button onClick={onDelete} className="px-4 py-2 rounded-lg bg-coral text-white font-semibold text-sm hover:bg-coral-dark transition-colors cursor-pointer border-none">Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('events')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const firebaseOn = isFirebaseReady()

  // ─── Events state ───
  const { allEvents: sheetEvents } = useEvents()
  const [events, setEvents] = useState([])
  const [eventEditing, setEventEditing] = useState(null)
  const [eventForm, setEventForm] = useState({ ...EMPTY_EVENT })
  const [eventDelete, setEventDelete] = useState(null)
  const [eventFilter, setEventFilter] = useState('all')
  const [eventSearch, setEventSearch] = useState('')
  const [attendeePanel, setAttendeePanel] = useState(null)
  const [attendees, setAttendees] = useState({})
  const [newAttendeeName, setNewAttendeeName] = useState('')

  // ─── Shop state ───
  const { products: sheetProducts } = useShop()
  const [products, setProducts] = useState([])
  const [productEditing, setProductEditing] = useState(null)
  const [productForm, setProductForm] = useState({ ...EMPTY_PRODUCT })
  const [productDelete, setProductDelete] = useState(null)

  // ─── Testimonials state ───
  const { testimonials: sheetTestimonials } = useTestimonials()
  const [testimonials, setTestimonials] = useState([])
  const [testimonialEditing, setTestimonialEditing] = useState(null)
  const [testimonialForm, setTestimonialForm] = useState({ ...EMPTY_TESTIMONIAL })
  const [testimonialDelete, setTestimonialDelete] = useState(null)

  // ─── Gallery state ───
  const { photos: galleryPhotos } = useGallery()
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryEvent, setGalleryEvent] = useState('')
  const [galleryDelete, setGalleryDelete] = useState(null)

  // ─── Load data ───
  // When Firebase is on, sheetEvents already comes from Firestore via useSiteData
  useEffect(() => { setEvents([...sheetEvents]) }, [sheetEvents])
  useEffect(() => { setProducts([...sheetProducts]) }, [sheetProducts])
  useEffect(() => { setTestimonials([...sheetTestimonials]) }, [sheetTestimonials])

  // Load attendees — real-time subscription so cross-device registrations appear live
  useEffect(() => {
    // Start with localStorage immediately
    setAttendees(getLocalAttendees())

    if (!firebaseOn) return

    // Subscribe to real-time Firestore updates
    const unsub = subscribeToAttendees((docs) => {
      const map = {}
      docs.forEach((d) => { map[d._id] = d.list || [] })
      if (Object.keys(map).length > 0) {
        setAttendees(map)
        saveLocalAttendees(map) // keep localStorage in sync
      }
    })
    return unsub
  }, [firebaseOn])

  // ─── Persist helpers ───
  async function persistEvents(next) {
    setEvents(next)
    if (firebaseOn) {
      setSaving(true)
      await saveCollection(COLLECTIONS.events, next)
      setSaving(false)
    }
  }
  async function persistProducts(next) {
    setProducts(next)
    if (firebaseOn) {
      setSaving(true)
      await saveCollection(COLLECTIONS.shop, next)
      setSaving(false)
    }
  }
  async function persistTestimonials(next) {
    setTestimonials(next)
    if (firebaseOn) {
      setSaving(true)
      await saveCollection(COLLECTIONS.testimonials, next)
      setSaving(false)
    }
  }
  async function persistAttendees(next, changedEventId) {
    setAttendees(next)
    // Always save to localStorage first (guaranteed to work)
    saveLocalAttendees(next)
    // Then try Firebase — write only the changed event doc to avoid race conditions
    if (firebaseOn) {
      try {
        if (changedEventId) {
          await saveEventAttendees(changedEventId, next[changedEventId] || [])
        } else {
          await saveAttendees(next)
        }
      } catch (e) { console.error('Firebase attendee save failed:', e) }
    }
  }

  // ─── Attendee helpers ───
  function getAttendeeList(event) { return attendees[getEventId(event)] || [] }
  function addAttendee(event) {
    if (!newAttendeeName.trim()) return
    const id = getEventId(event)
    const next = { ...attendees, [id]: [...(attendees[id] || []), { name: newAttendeeName.trim(), contact: '', paid: false, notes: 'Added by admin' }] }
    persistAttendees(next, id)
    setNewAttendeeName(''); showToast('Attendee added')
  }
  function toggleAttendeePaid(event, idx) {
    const id = getEventId(event)
    const next = { ...attendees, [id]: (attendees[id] || []).map((a, i) => i === idx ? { ...a, paid: !a.paid } : a) }
    persistAttendees(next, id)
  }
  function removeAttendee(event, idx) {
    const id = getEventId(event)
    const next = { ...attendees, [id]: (attendees[id] || []).filter((_, i) => i !== idx) }
    persistAttendees(next, id)
    showToast('Attendee removed')
  }
  function updateAttendeeNotes(event, idx, notes) {
    const id = getEventId(event)
    const next = { ...attendees, [id]: (attendees[id] || []).map((a, i) => i === idx ? { ...a, notes } : a) }
    persistAttendees(next, id)
  }

  // ─── Event stats & filtering ───
  const eventStats = useMemo(() => {
    const upcoming = events.filter(e => !isPast(e['Date']))
    return { total: events.length, upcoming: upcoming.length, past: events.length - upcoming.length, registered: Object.values(attendees).reduce((s, l) => s + l.length, 0) }
  }, [events, attendees])

  const displayedEvents = useMemo(() => {
    let list = [...events]
    if (eventFilter === 'upcoming') list = list.filter(e => !isPast(e['Date']))
    else if (eventFilter === 'past') list = list.filter(e => isPast(e['Date']))
    else if (EVENT_TYPES.includes(eventFilter)) list = list.filter(e => e['Event Type'] === eventFilter)
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase()
      list = list.filter(e => e['Event Name']?.toLowerCase().includes(q) || e['Venue']?.toLowerCase().includes(q) || e['Description']?.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const da = a['Date'] ? new Date(a['Date'].split('/')[2], a['Date'].split('/')[0] - 1, a['Date'].split('/')[1]) : new Date(0)
      const db = b['Date'] ? new Date(b['Date'].split('/')[2], b['Date'].split('/')[0] - 1, b['Date'].split('/')[1]) : new Date(0)
      return da - db
    })
    return list
  }, [events, eventFilter, eventSearch])

  // ─── Event CRUD ───
  function openEventAdd() { setEventForm({ ...EMPTY_EVENT }); setEventEditing('new') }
  function openEventEdit(i) { const ri = events.indexOf(displayedEvents[i]); setEventForm({ ...events[ri] }); setEventEditing(ri) }
  function handleEventDuplicate(i) {
    const ri = events.indexOf(displayedEvents[i])
    setEventForm({ ...events[ri], 'Date': '' })
    setEventEditing('new')
    showToast('Pick a new date for the duplicated event')
  }
  function saveEvent() {
    if (!eventForm['Event Name']?.trim() || !eventForm['Date']?.trim()) { showToast('Event name and date are required'); return }
    if (eventEditing === 'new') { persistEvents([...events, { ...eventForm }]); showToast('Event added') }
    else { persistEvents(events.map((e, i) => i === eventEditing ? { ...eventForm } : e)); showToast('Event updated') }
    setEventEditing(null)
  }
  function deleteEvent(i) {
    const ri = events.indexOf(displayedEvents[i])
    persistEvents(events.filter((_, idx) => idx !== ri)); setEventDelete(null); showToast('Event deleted')
  }

  // ─── Product CRUD ───
  function openProductAdd() { setProductForm({ ...EMPTY_PRODUCT }); setProductEditing('new') }
  function openProductEdit(i) { setProductForm({ ...products[i] }); setProductEditing(i) }
  function saveProduct() {
    if (!productForm['Product Name']?.trim()) { showToast('Product name is required'); return }
    if (productEditing === 'new') { persistProducts([...products, { ...productForm }]); showToast('Product added') }
    else { persistProducts(products.map((p, i) => i === productEditing ? { ...productForm } : p)); showToast('Product updated') }
    setProductEditing(null)
  }
  function deleteProduct(i) { persistProducts(products.filter((_, idx) => idx !== i)); setProductDelete(null); showToast('Product deleted') }

  // ─── Testimonial CRUD ───
  function openTestimonialAdd() {
    const today = new Date()
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`
    setTestimonialForm({ ...EMPTY_TESTIMONIAL, 'Date': dateStr }); setTestimonialEditing('new')
  }
  function openTestimonialEdit(i) { setTestimonialForm({ ...testimonials[i] }); setTestimonialEditing(i) }
  function saveTestimonial() {
    if (!testimonialForm['Name']?.trim() || !testimonialForm['Quote']?.trim()) { showToast('Name and quote are required'); return }
    if (testimonialEditing === 'new') { persistTestimonials([...testimonials, { ...testimonialForm }]); showToast('Testimonial added') }
    else { persistTestimonials(testimonials.map((t, i) => i === testimonialEditing ? { ...testimonialForm } : t)); showToast('Testimonial updated') }
    setTestimonialEditing(null)
  }
  function deleteTestimonial(i) { persistTestimonials(testimonials.filter((_, idx) => idx !== i)); setTestimonialDelete(null); showToast('Testimonial deleted') }

  // ─── Gallery handlers ───
  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (!firebaseOn) { showToast('Gallery requires Firebase — add your config to .env'); return }
    setGalleryUploading(true)
    let count = 0
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue
      const compressed = await compressImage(file)
      if (!compressed) continue
      const result = await addGalleryPhoto(compressed, galleryCaption, galleryEvent)
      if (result) count++
    }
    setGalleryUploading(false)
    setGalleryCaption('')
    showToast(`${count} photo${count !== 1 ? 's' : ''} uploaded`)
    e.target.value = ''
  }

  async function handleGalleryDelete() {
    if (!galleryDelete) return
    await deleteGalleryPhoto(galleryDelete)
    setGalleryDelete(null)
    showToast('Photo deleted')
  }

  // ─── Unique event names for gallery tagging ───
  const eventNames = useMemo(() => [...new Set(events.map(e => e['Event Name']).filter(Boolean))], [events])

  // ─── Punch card management ───
  const [punchUsers, setPunchUsers] = useState([])
  const [punchLoading, setPunchLoading] = useState(false)

  // Real-time listener for punch card users
  useEffect(() => {
    if (!isFirebaseReady() || !db) return
    setPunchLoading(true)
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = []
      snapshot.forEach(d => users.push({ _id: d.id, ...d.data() }))
      setPunchUsers(users)
      setPunchLoading(false)
    }, (error) => {
      console.error('Error listening to users:', error)
      setPunchLoading(false)
    })
    return unsub
  }, [])

  async function toggleUserPunchCard(uid, currentValue) {
    const newVal = !currentValue
    await saveUserProfile(uid, {
      hasPunchCard: newVal,
      ...(newVal ? { punchCardPunches: 0 } : {}),
    })
    setPunchUsers(prev => prev.map(u => u._id === uid ? { ...u, hasPunchCard: newVal, ...(newVal ? { punchCardPunches: 0 } : {}) } : u))
    showToast(newVal ? 'Punch card activated' : 'Punch card removed')
  }

  async function resetUserPunchCard(uid) {
    await saveUserProfile(uid, { punchCardPunches: 0, hasPunchCard: true })
    setPunchUsers(prev => prev.map(u => u._id === uid ? { ...u, punchCardPunches: 0, hasPunchCard: true } : u))
    showToast('Punch card reset to 0')
  }

  async function adjustPunch(uid, currentPunches, delta) {
    const newPunches = Math.max(0, Math.min(6, (currentPunches || 0) + delta))
    await saveUserProfile(uid, { punchCardPunches: newPunches })
    setPunchUsers(prev => prev.map(u => u._id === uid ? { ...u, punchCardPunches: newPunches } : u))
    showToast(delta > 0 ? `Punch added (${newPunches}/6)` : `Punch removed (${newPunches}/6)`)
  }

  async function approvePunchCardRequest(uid) {
    await saveUserProfile(uid, { hasPunchCard: true, punchCardPunches: 0, punchCardRequested: false })
    setPunchUsers(prev => prev.map(u => u._id === uid ? { ...u, hasPunchCard: true, punchCardPunches: 0, punchCardRequested: false } : u))
    showToast('Punch card activated!')
  }

  async function denyPunchCardRequest(uid) {
    await saveUserProfile(uid, { punchCardRequested: false })
    setPunchUsers(prev => prev.map(u => u._id === uid ? { ...u, punchCardRequested: false } : u))
    showToast('Request dismissed')
  }



  const TABS = [
    { key: 'events', label: 'Events', count: events.length },
    { key: 'shop', label: 'Shop', count: products.length },
    { key: 'testimonials', label: 'Testimonials', count: testimonials.length },
    { key: 'gallery', label: 'Gallery', count: galleryPhotos.length },
    { key: 'punchcards', label: 'Punch Cards', count: punchUsers.filter(u => u.hasPunchCard).length, alert: punchUsers.filter(u => u.punchCardRequested).length },
  ]

  function handleAddButton() {
    if (tab === 'events') openEventAdd()
    else if (tab === 'shop') openProductAdd()
    else if (tab === 'testimonials') openTestimonialAdd()
    // Gallery uses file input, no add button
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-charcoal text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-3xl">Admin Dashboard</h1>
              <p className="text-gray-300 text-sm mt-1">
                {firebaseOn ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal inline-block" />
                    Connected to Firebase {saving && '— saving...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow inline-block" />
                    Local mode — add Firebase config for cross-device sync
                  </span>
                )}
              </p>
            </div>
            {tab !== 'gallery' && tab !== 'punchcards' && (
              <button onClick={handleAddButton}
                className="bg-teal hover:bg-teal-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer border-none text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Add {tab === 'events' ? 'Event' : tab === 'shop' ? 'Product' : 'Testimonial'}
              </button>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors cursor-pointer border-none relative ${
                  tab === t.key ? 'bg-gray-50 text-charcoal' : 'bg-charcoal-light/30 text-gray-300 hover:text-white'
                }`}>
                {t.label} <span className="ml-1 text-xs opacity-70">({t.count})</span>
                {t.alert > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {t.alert}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">

      {/* ════════════ EVENTS TAB ════════════ */}
      {tab === 'events' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-1 pt-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-2xl font-heading text-charcoal">{eventStats.total}</p>
              <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-2xl font-heading text-teal">{eventStats.upcoming}</p>
              <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Upcoming</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-2xl font-heading text-charcoal-light">{eventStats.past}</p>
              <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Past</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className="text-2xl font-heading text-special-purple">{eventStats.registered}</p>
              <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Registered</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input type="text" placeholder="Search events..." value={eventSearch} onChange={e => setEventSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[{ key: 'all', label: 'All' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'past', label: 'Past' }, ...EVENT_TYPES.map(t => ({ key: t, label: t }))].map(f => (
                  <button key={f.key} onClick={() => setEventFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${eventFilter === f.key ? 'bg-teal text-white border-teal' : 'bg-gray-50 text-charcoal-light border-gray-200 hover:bg-gray-100'}`}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Event List */}
          <div className="mt-4 pb-12">
            {displayedEvents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-charcoal-light text-lg">No events found.</p>
                <button onClick={openEventAdd} className="mt-3 text-teal hover:text-teal-dark font-semibold text-sm cursor-pointer border-none bg-transparent">+ Add your first event</button>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedEvents.map((event, i) => {
                  const colors = EVENT_COLORS[event['Event Type']] || EVENT_COLORS['Open Play']
                  const past = isPast(event['Date'])
                  return (
                    <div key={i} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md ${past ? 'opacity-60' : ''}`}>
                      <div className="flex items-stretch">
                        <div className={`w-1.5 shrink-0 ${colors.dot}`} />
                        <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="text-center shrink-0 w-16">
                            <p className="text-xs font-semibold text-charcoal-light uppercase">{event['Date']?.split('/')[0]}/{event['Date']?.split('/')[1]}</p>
                            <p className="text-lg font-heading text-charcoal leading-tight">{formatDisplayDate(event['Date']).split(',')[0]}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <h3 className="font-heading text-base text-charcoal truncate">{event['Event Name']}</h3>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors.badge}`}>{event['Event Type']}</span>
                              {past && <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200 text-gray-500">Past</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-charcoal-light">
                              <span>{event['Time']}</span><span>{event['Venue']}</span>
                              {/free/i.test(event['Price'] || '') ? (
                                <span className="font-semibold text-teal">Free</span>
                              ) : event['Price'] ? (
                                <span className="font-semibold text-coral">{event['Price']}</span>
                              ) : null}
                              <span className="text-special-purple font-semibold">{getAttendeeList(event).length} registered</span>
                              {event['Max Spots'] && <span>{Math.max(0, parseInt(event['Max Spots']) - getAttendeeList(event).length)}/{event['Max Spots']} spots left</span>}
                            </div>
                            {event['Description'] && <p className="text-xs text-charcoal-light/70 mt-1 line-clamp-1">{event['Description']}</p>}
                          </div>
                          <div className="flex gap-1.5 shrink-0 items-center">
                            <button onClick={() => { setAttendeePanel(i); setNewAttendeeName('') }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-special-purple/10 text-special-purple hover:bg-special-purple/20 transition-colors cursor-pointer border-none text-xs font-semibold" title="Manage attendees">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                              {getAttendeeList(event).length}
                            </button>
                            <button onClick={() => openEventEdit(i)} className="p-2 rounded-lg bg-teal/10 text-teal hover:bg-teal/20 transition-colors cursor-pointer border-none" title="Edit">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button onClick={() => handleEventDuplicate(i)} className="p-2 rounded-lg bg-yellow/20 text-league-gold hover:bg-yellow/30 transition-colors cursor-pointer border-none" title="Duplicate for new date">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                            </button>
                            <button onClick={() => setEventDelete(i)} className="p-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors cursor-pointer border-none" title="Delete">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════ SHOP TAB ════════════ */}
      {tab === 'shop' && (
        <div className="pt-4 pb-12">
          {products.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-charcoal-light text-lg">No products yet.</p>
              <button onClick={openProductAdd} className="mt-3 text-teal hover:text-teal-dark font-semibold text-sm cursor-pointer border-none bg-transparent">+ Add your first product</button>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-stretch">
                    <div className="w-1.5 shrink-0 bg-coral" />
                    <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      {product['Image URL'] && (
                        <img src={product['Image URL']} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-heading text-base text-charcoal truncate">{product['Product Name']}</h3>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-coral/10 text-coral-dark">{product['Category']}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-charcoal-light">
                          <span className="font-semibold text-coral">{product['Price']}</span>
                          {product['Buy Link'] && product['Buy Link'] !== '#' && <span className="truncate max-w-48">{product['Buy Link']}</span>}
                        </div>
                        {product['Description'] && <p className="text-xs text-charcoal-light/70 mt-1 line-clamp-1">{product['Description']}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => openProductEdit(i)} className="p-2 rounded-lg bg-teal/10 text-teal hover:bg-teal/20 transition-colors cursor-pointer border-none" title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => setProductDelete(i)} className="p-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors cursor-pointer border-none" title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════ TESTIMONIALS TAB ════════════ */}
      {tab === 'testimonials' && (
        <div className="pt-4 pb-12">
          {testimonials.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-charcoal-light text-lg">No testimonials yet.</p>
              <button onClick={openTestimonialAdd} className="mt-3 text-teal hover:text-teal-dark font-semibold text-sm cursor-pointer border-none bg-transparent">+ Add your first testimonial</button>
            </div>
          ) : (
            <div className="space-y-2">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                  <div className="flex items-stretch">
                    <div className="w-1.5 shrink-0 bg-teal" />
                    <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-heading text-base text-charcoal">{t['Name']}</h3>
                          {t['Date'] && <span className="text-xs text-charcoal-light">{t['Date']}</span>}
                        </div>
                        <p className="text-sm text-charcoal-light italic line-clamp-2">&ldquo;{t['Quote']}&rdquo;</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => openTestimonialEdit(i)} className="p-2 rounded-lg bg-teal/10 text-teal hover:bg-teal/20 transition-colors cursor-pointer border-none" title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => setTestimonialDelete(i)} className="p-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors cursor-pointer border-none" title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════ GALLERY TAB ════════════ */}
      {tab === 'gallery' && (
        <div className="pt-4 pb-12">
          {/* Upload area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="font-heading text-lg text-charcoal mb-3">Upload Photos</h3>
            {!firebaseOn && (
              <div className="mb-4 p-3 bg-yellow/20 rounded-lg text-sm text-charcoal">
                Gallery requires Firebase. Add your Firebase config to <code className="bg-gray-100 px-1 rounded">.env</code> to enable photo uploads.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Caption (optional)</label>
                <input type="text" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)}
                  placeholder="e.g., Open Play Night — Feb 2026"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Tag an event (optional)</label>
                <select value={galleryEvent} onChange={e => setGalleryEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white">
                  <option value="">No event</option>
                  {eventNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <label className={`flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              galleryUploading ? 'border-gray-200 text-charcoal-light opacity-50 pointer-events-none' : 'border-teal/30 text-teal hover:border-teal hover:bg-teal/5'
            }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              {galleryUploading ? 'Uploading photos...' : 'Click to upload photos (select multiple)'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={!firebaseOn} />
            </label>
          </div>

          {/* Photo grid */}
          {galleryPhotos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-charcoal-light text-lg">No photos yet.</p>
              <p className="text-charcoal-light/60 text-sm mt-1">Upload photos from past events to create a gallery on your website.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleryPhotos.map((photo) => (
                <div key={photo._id} className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden aspect-square">
                  <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="w-full p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                      {photo.caption && <p className="text-white text-xs font-semibold truncate">{photo.caption}</p>}
                      {photo.eventName && <p className="text-white/70 text-[10px] truncate">{photo.eventName}</p>}
                    </div>
                  </div>
                  <button onClick={() => setGalleryDelete(photo)}
                    className="absolute top-2 right-2 w-7 h-7 bg-coral text-white rounded-full flex items-center justify-center cursor-pointer border-none text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'punchcards' && (
        <div className="pt-4 pb-12">
          {!firebaseOn ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-charcoal-light">Punch card management requires Firebase.</p>
              <p className="text-xs text-charcoal-light/60 mt-1">Add your Firebase config to .env to manage user punch cards.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-charcoal-light">5 rounds for $75 &bull; 6th round is FREE</p>
                <p className="text-xs text-charcoal-light/60 mt-0.5">
                  Punch cards persist permanently. Use +/- to adjust punches if needed.
                  <span className="inline-flex items-center gap-1 ml-1"><span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse inline-block" /> Updates automatically in real time</span>
                </p>
              </div>

              {/* Pending punch card requests */}
              {punchUsers.filter(u => u.punchCardRequested).length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-coral rounded-full animate-pulse" />
                    <p className="text-sm font-bold text-charcoal">Pending Requests ({punchUsers.filter(u => u.punchCardRequested).length})</p>
                  </div>
                  <div className="space-y-2">
                    {punchUsers.filter(u => u.punchCardRequested).map(u => (
                      <div key={u._id} className="bg-yellow/5 rounded-xl shadow-sm border-2 border-yellow/40 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-yellow/20 text-league-gold shrink-0">
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-charcoal">{u.name || 'No name'}</p>
                            <p className="text-xs text-charcoal-light truncate">{u.email}{u.phone ? ` \u00b7 ${u.phone}` : ''}</p>
                            {u.punchCardRequestedAt && (
                              <p className="text-[10px] text-charcoal-light/60 mt-0.5">
                                Requested {new Date(u.punchCardRequestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => approvePunchCardRequest(u._id)}
                              className="px-3 py-1.5 text-xs font-bold bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none">
                              Approve &amp; Activate
                            </button>
                            <button onClick={() => denyPunchCardRequest(u._id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-charcoal-light rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border-none">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {punchUsers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
                  <p className="text-charcoal-light">No users yet.</p>
                  <p className="text-xs text-charcoal-light/60 mt-1">Click &quot;Refresh Users&quot; to load accounts, or wait for players to sign up.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Show users with active cards first, then everyone else */}
                  {[...punchUsers].sort((a, b) => (b.hasPunchCard ? 1 : 0) - (a.hasPunchCard ? 1 : 0)).map(u => {
                    const punches = u.punchCardPunches || 0
                    const cardComplete = punches > 5
                    const statusLabel = !u.hasPunchCard ? 'No card' : cardComplete ? 'Complete (6/6)' : punches >= 5 ? 'Bonus earned' : `${punches}/5 used`
                    const statusColor = !u.hasPunchCard ? 'text-charcoal-light/60' : cardComplete ? 'text-teal' : punches >= 5 ? 'text-league-gold' : 'text-charcoal-light'

                    return (
                      <div key={u._id} className={`bg-white rounded-xl shadow-sm border p-4 ${u.hasPunchCard ? 'border-yellow/30' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            u.hasPunchCard ? 'bg-yellow/20 text-league-gold' : 'bg-gray-100 text-charcoal-light'
                          }`}>
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-charcoal">{u.name || 'No name'}</p>
                            <p className="text-xs text-charcoal-light truncate">{u.email}{u.phone ? ` \u00b7 ${u.phone}` : ''}</p>
                          </div>

                          {/* Punch card visual + controls — always shown for card holders */}
                          {u.hasPunchCard ? (
                            <div className="flex items-center gap-2">
                              {/* Punch dots */}
                              <div className="hidden sm:block">
                                <div className="flex gap-0.5 mb-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className={`w-3.5 h-3.5 rounded-sm ${i < punches ? 'bg-teal/40' : 'bg-gray-100'}`} />
                                  ))}
                                  <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center ${punches > 5 ? 'bg-yellow/40' : punches >= 5 ? 'bg-yellow/20' : 'bg-gray-100'}`}>
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={punches >= 5 ? '#F0A500' : '#D1D5DB'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                  </div>
                                </div>
                                <p className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</p>
                              </div>

                              {/* +/- controls */}
                              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                                <button onClick={() => adjustPunch(u._id, punches, -1)} disabled={punches <= 0}
                                  className="w-6 h-6 flex items-center justify-center rounded text-sm font-bold bg-white border border-gray-200 cursor-pointer hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-charcoal"
                                  title="Remove a punch">
                                  &minus;
                                </button>
                                <span className="text-xs font-bold text-charcoal w-5 text-center">{punches}</span>
                                <button onClick={() => adjustPunch(u._id, punches, 1)} disabled={punches >= 6}
                                  className="w-6 h-6 flex items-center justify-center rounded text-sm font-bold bg-white border border-gray-200 cursor-pointer hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-charcoal"
                                  title="Add a punch">
                                  +
                                </button>
                              </div>

                              {/* Reset / Remove */}
                              <div className="flex flex-col gap-1">
                                <button onClick={() => resetUserPunchCard(u._id)}
                                  className="px-2 py-0.5 text-[10px] font-semibold bg-yellow/20 text-league-gold rounded hover:bg-yellow/30 transition-colors cursor-pointer border-none"
                                  title="Reset to 0 punches (new card)">
                                  New Card
                                </button>
                                <button onClick={() => toggleUserPunchCard(u._id, true)}
                                  className="px-2 py-0.5 text-[10px] font-semibold bg-coral/10 text-coral rounded hover:bg-coral/20 transition-colors cursor-pointer border-none"
                                  title="Remove punch card entirely">
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => toggleUserPunchCard(u._id, false)}
                              className="px-3 py-1.5 text-xs font-semibold bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors cursor-pointer border-none shrink-0">
                              Give Card
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      </div>{/* end max-w container */}

      {/* ════════════ MODALS ════════════ */}

      {/* Event Form Modal */}
      {eventEditing !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading text-xl text-charcoal">{eventEditing === 'new' ? 'Add New Event' : 'Edit Event'}</h2>
              <button onClick={() => setEventEditing(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Event Name *</label>
                <input type="text" value={eventForm['Event Name']} onChange={e => setEventForm(p => ({ ...p, 'Event Name': e.target.value }))}
                  placeholder="e.g., Open Play Night at McNellie's" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Date *</label>
                  <input type="date" value={formatDateForInput(eventForm['Date'])} onChange={e => setEventForm(p => ({ ...p, 'Date': formatDateFromInput(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Time</label>
                  <input type="text" value={eventForm['Time']} onChange={e => setEventForm(p => ({ ...p, 'Time': e.target.value }))}
                    placeholder="e.g., 6:00-8:30p" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Event Type</label>
                  <select value={eventForm['Event Type']} onChange={e => setEventForm(p => ({ ...p, 'Event Type': e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white">
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Price</label>
                  <input type="text" value={eventForm['Price']} onChange={e => setEventForm(p => ({ ...p, 'Price': e.target.value }))}
                    placeholder="e.g., $15 or Free" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Venue</label>
                  <input type="text" value={eventForm['Venue']} onChange={e => setEventForm(p => ({ ...p, 'Venue': e.target.value }))}
                    placeholder="e.g., McNellie's South City" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Address</label>
                  <input type="text" value={eventForm['Address']} onChange={e => setEventForm(p => ({ ...p, 'Address': e.target.value }))}
                    placeholder="e.g., 7031 S Zurich Ave, Tulsa, OK" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Description</label>
                <textarea value={eventForm['Description']} onChange={e => setEventForm(p => ({ ...p, 'Description': e.target.value }))}
                  rows={3} placeholder="Tell people what to expect..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-vertical" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Registration Link</label>
                  <input type="text" value={eventForm['Registration Link']} onChange={e => setEventForm(p => ({ ...p, 'Registration Link': e.target.value }))}
                    placeholder="URL or leave blank" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Max Spots</label>
                  <input type="text" value={eventForm['Max Spots']} onChange={e => setEventForm(p => ({ ...p, 'Max Spots': e.target.value }))}
                    placeholder="Leave blank for unlimited" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
              </div>
              {/* Punch Card Eligible toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <input type="checkbox"
                  checked={(eventForm['Punch Card Eligible'] || 'yes') === 'yes'}
                  onChange={e => setEventForm(p => ({ ...p, 'Punch Card Eligible': e.target.checked ? 'yes' : 'no' }))}
                  className="w-4 h-4 accent-[#4ECDC4]" />
                <div>
                  <p className="text-sm font-semibold text-charcoal">Punch card eligible</p>
                  <p className="text-xs text-charcoal-light">Players can use a punch from their punch card for this event. Turn off for special pricing events.</p>
                </div>
              </label>
              <ImageUpload value={eventForm['Image URL']} onChange={v => setEventForm(p => ({ ...p, 'Image URL': v }))} showToast={showToast} storagePrefix="events" />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setEventEditing(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-charcoal-light font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer bg-white">Cancel</button>
              <button onClick={saveEvent} className="px-5 py-2.5 rounded-lg bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-colors cursor-pointer border-none">{eventEditing === 'new' ? 'Add Event' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {productEditing !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading text-xl text-charcoal">{productEditing === 'new' ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={() => setProductEditing(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Product Name *</label>
                <input type="text" value={productForm['Product Name']} onChange={e => setProductForm(p => ({ ...p, 'Product Name': e.target.value }))}
                  placeholder="e.g., Classic Mahjong Set" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Category</label>
                  <select value={productForm['Category']} onChange={e => setProductForm(p => ({ ...p, 'Category': e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white">
                    {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Price</label>
                  <input type="text" value={productForm['Price']} onChange={e => setProductForm(p => ({ ...p, 'Price': e.target.value }))}
                    placeholder="e.g., $24.99" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Buy Link</label>
                <input type="text" value={productForm['Buy Link']} onChange={e => setProductForm(p => ({ ...p, 'Buy Link': e.target.value }))}
                  placeholder="URL to purchase" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Description</label>
                <textarea value={productForm['Description']} onChange={e => setProductForm(p => ({ ...p, 'Description': e.target.value }))}
                  rows={3} placeholder="Describe the product..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-vertical" />
              </div>
              <ImageUpload value={productForm['Image URL']} onChange={v => setProductForm(p => ({ ...p, 'Image URL': v }))} showToast={showToast} storagePrefix="shop" />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setProductEditing(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-charcoal-light font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer bg-white">Cancel</button>
              <button onClick={saveProduct} className="px-5 py-2.5 rounded-lg bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-colors cursor-pointer border-none">{productEditing === 'new' ? 'Add Product' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Form Modal */}
      {testimonialEditing !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading text-xl text-charcoal">{testimonialEditing === 'new' ? 'Add Testimonial' : 'Edit Testimonial'}</h2>
              <button onClick={() => setTestimonialEditing(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Name *</label>
                <input type="text" value={testimonialForm['Name']} onChange={e => setTestimonialForm(p => ({ ...p, 'Name': e.target.value }))}
                  placeholder="e.g., Sarah" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Quote *</label>
                <textarea value={testimonialForm['Quote']} onChange={e => setTestimonialForm(p => ({ ...p, 'Quote': e.target.value }))}
                  rows={4} placeholder="What did they say?" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-vertical" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Date</label>
                <input type="date" value={formatDateForInput(testimonialForm['Date'])} onChange={e => setTestimonialForm(p => ({ ...p, 'Date': formatDateFromInput(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setTestimonialEditing(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-charcoal-light font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer bg-white">Cancel</button>
              <button onClick={saveTestimonial} className="px-5 py-2.5 rounded-lg bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-colors cursor-pointer border-none">{testimonialEditing === 'new' ? 'Add Testimonial' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modals */}
      {eventDelete !== null && <DeleteModal name={displayedEvents[eventDelete]?.['Event Name']} onCancel={() => setEventDelete(null)} onDelete={() => deleteEvent(eventDelete)} />}
      {productDelete !== null && <DeleteModal name={products[productDelete]?.['Product Name']} onCancel={() => setProductDelete(null)} onDelete={() => deleteProduct(productDelete)} />}
      {testimonialDelete !== null && <DeleteModal name={`${testimonials[testimonialDelete]?.['Name']}'s testimonial`} onCancel={() => setTestimonialDelete(null)} onDelete={() => deleteTestimonial(testimonialDelete)} />}
      {galleryDelete && <DeleteModal name="this photo" onCancel={() => setGalleryDelete(null)} onDelete={handleGalleryDelete} />}

      {/* Attendee Panel */}
      {attendeePanel !== null && displayedEvents[attendeePanel] && (() => {
        const event = displayedEvents[attendeePanel]
        const list = getAttendeeList(event)
        const paidCount = list.filter(a => a.paid).length
        const maxSpots = parseInt(event['Max Spots']) || 0
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in-up">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl text-charcoal">Attendees</h2>
                    <p className="text-sm text-charcoal-light mt-0.5">{event['Event Name']}</p>
                  </div>
                  <button onClick={() => setAttendeePanel(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-charcoal font-semibold">{list.length} registered</span>
                  <span className="text-teal font-semibold">{paidCount} paid</span>
                  <span className="text-coral font-semibold">{list.length - paidCount} unpaid</span>
                  {maxSpots > 0 && <span className="text-charcoal-light">{maxSpots - list.length} spots left</span>}
                </div>
              </div>
              <div className="p-4 border-b border-gray-100">
                <div className="flex gap-2">
                  <input type="text" value={newAttendeeName} onChange={e => setNewAttendeeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttendee(event)}
                    placeholder="Add name..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                  <button onClick={() => addAttendee(event)} className="px-4 py-2 bg-teal text-white font-semibold rounded-lg text-sm hover:bg-teal-dark transition-colors cursor-pointer border-none">Add</button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {list.length === 0 ? (
                  <div className="p-8 text-center text-charcoal-light text-sm">
                    <p>No attendees yet.</p>
                    <p className="text-xs mt-1">People will appear here when they register on the site.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {list.map((attendee, idx) => (
                      <div key={idx} className={`px-4 py-3 hover:bg-gray-50 ${!attendee.paid ? 'bg-coral/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleAttendeePaid(event, idx)}
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${attendee.paid ? 'bg-teal border-teal text-white' : 'bg-white border-gray-300 text-transparent hover:border-teal'}`}
                            title={attendee.paid ? 'Mark unpaid' : 'Mark paid'}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${attendee.paid ? 'text-charcoal' : 'text-coral'}`}>{attendee.name}</p>
                            {attendee.contact && (
                              <p className="text-xs text-charcoal-light mt-0.5 flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                                {attendee.contact}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {attendee.level && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-charcoal-light capitalize">{attendee.level}</span>
                              )}
                              {attendee.hasPunchCard && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow/20 text-league-gold">Punch Card</span>
                              )}
                            </div>
                            {attendee.tableRequests && (
                              <p className="text-xs text-charcoal-light/80 mt-1 flex items-start gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                                Table: {attendee.tableRequests}
                              </p>
                            )}
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${attendee.paid ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'}`}>{attendee.paid ? 'Paid' : 'Unpaid'}</span>
                          <button onClick={() => removeAttendee(event, idx)} className="p-1 rounded hover:bg-coral/10 text-charcoal-light hover:text-coral transition-colors cursor-pointer border-none bg-transparent shrink-0" title="Remove">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                        {attendee.notes && (
                          <p className="text-xs text-charcoal-light/60 ml-10 mt-1">{attendee.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={() => setAttendeePanel(null)} className="px-5 py-2.5 rounded-lg bg-charcoal text-white font-semibold text-sm hover:bg-charcoal/90 transition-colors cursor-pointer border-none">Done</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-charcoal text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in-up">{toast}</div>
      )}
    </div>
  )
}
