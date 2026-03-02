import { useState, useEffect, useMemo } from 'react'
import { EVENT_COLORS } from '../config'
import { useEvents, useShop, useTestimonials } from '../hooks/useSiteData'

const STORAGE_KEY = 'mahj918_admin_events'
const SHOP_STORAGE_KEY = 'mahj918_admin_shop'
const TESTIMONIAL_STORAGE_KEY = 'mahj918_admin_testimonials'
const ATTENDEE_STORAGE_KEY = 'mahj918_admin_attendees'
const EVENT_TYPES = ['Open Play', 'Birdy Basics', 'League', 'Special Event', 'Private']
const PRODUCT_CATEGORIES = ['Books & Guides', 'Sets & Tiles', 'Accessories', 'Entertaining']

const EMPTY_EVENT = {
  'Event Name': '', 'Date': '', 'Time': '', 'Venue': '', 'Address': '',
  'Event Type': 'Open Play', 'Price': '', 'Description': '',
  'Registration Link': '', 'Max Spots': '', 'Image URL': '',
}
const EMPTY_PRODUCT = {
  'Product Name': '', 'Category': 'Books & Guides', 'Image URL': '',
  'Buy Link': '', 'Price': '', 'Description': '',
}
const EMPTY_TESTIMONIAL = { 'Name': '', 'Quote': '', 'Date': '' }

function getEventId(event) {
  return `${event['Event Name']}_${event['Date']}_${event['Time']}`.replace(/\s+/g, '_')
}

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
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function ImageUpload({ value, onChange, showToast }) {
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
          {uploading ? 'Compressing...' : 'Upload Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB'); return }
            setUploading(true)
            const compressed = await compressImage(file)
            setUploading(false)
            if (compressed) { onChange(compressed); showToast('Image uploaded') }
            else showToast('Failed to process image')
            e.target.value = ''
          }} />
        </label>
        <span className="text-xs text-charcoal-light self-center">or</span>
        <input type="text" value={value?.startsWith('data:') ? '' : (value || '')}
          onChange={e => onChange(e.target.value)} placeholder="Paste image URL"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      <p className="text-xs text-charcoal-light/50 mt-1">Upload compresses to ~50-100KB. Or paste a URL.</p>
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
          Are you sure you want to delete <strong>{name}</strong>? This can't be undone.
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
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000) }

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

  // ─── Load / save events ───
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) { try { setEvents(JSON.parse(stored)) } catch { setEvents([...sheetEvents]) } }
    else setEvents([...sheetEvents])
  }, [sheetEvents])
  useEffect(() => { if (events.length > 0) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)) } catch { showToast('Storage full — try removing some images') } } }, [events])

  // ─── Load / save attendees ───
  useEffect(() => { try { const s = localStorage.getItem(ATTENDEE_STORAGE_KEY); if (s) setAttendees(JSON.parse(s)) } catch {} }, [])
  useEffect(() => { if (Object.keys(attendees).length > 0) { try { localStorage.setItem(ATTENDEE_STORAGE_KEY, JSON.stringify(attendees)) } catch {} } }, [attendees])

  // ─── Load / save products ───
  useEffect(() => {
    const stored = localStorage.getItem(SHOP_STORAGE_KEY)
    if (stored) { try { setProducts(JSON.parse(stored)) } catch { setProducts([...sheetProducts]) } }
    else setProducts([...sheetProducts])
  }, [sheetProducts])
  useEffect(() => { if (products.length > 0) { try { localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(products)) } catch { showToast('Storage full — try removing some images') } } }, [products])

  // ─── Load / save testimonials ───
  useEffect(() => {
    const stored = localStorage.getItem(TESTIMONIAL_STORAGE_KEY)
    if (stored) { try { setTestimonials(JSON.parse(stored)) } catch { setTestimonials([...sheetTestimonials]) } }
    else setTestimonials([...sheetTestimonials])
  }, [sheetTestimonials])
  useEffect(() => { if (testimonials.length > 0) { try { localStorage.setItem(TESTIMONIAL_STORAGE_KEY, JSON.stringify(testimonials)) } catch { showToast('Storage full — try removing some images') } } }, [testimonials])

  // ─── Attendee helpers ───
  function getAttendeeList(event) { return attendees[getEventId(event)] || [] }
  function addAttendee(event) {
    if (!newAttendeeName.trim()) return
    const id = getEventId(event)
    setAttendees(prev => ({ ...prev, [id]: [...(prev[id] || []), { name: newAttendeeName.trim(), contact: '', paid: false, notes: 'Added by admin' }] }))
    setNewAttendeeName(''); showToast('Attendee added')
  }
  function toggleAttendeePaid(event, idx) {
    const id = getEventId(event)
    setAttendees(prev => ({ ...prev, [id]: (prev[id] || []).map((a, i) => i === idx ? { ...a, paid: !a.paid } : a) }))
  }
  function removeAttendee(event, idx) {
    const id = getEventId(event)
    setAttendees(prev => ({ ...prev, [id]: (prev[id] || []).filter((_, i) => i !== idx) }))
    showToast('Attendee removed')
  }
  function updateAttendeeNotes(event, idx, notes) {
    const id = getEventId(event)
    setAttendees(prev => ({ ...prev, [id]: (prev[id] || []).map((a, i) => i === idx ? { ...a, notes } : a) }))
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
    if (eventEditing === 'new') { setEvents(prev => [...prev, { ...eventForm }]); showToast('Event added') }
    else { setEvents(prev => prev.map((e, i) => i === eventEditing ? { ...eventForm } : e)); showToast('Event updated') }
    setEventEditing(null)
  }
  function deleteEvent(i) {
    const ri = events.indexOf(displayedEvents[i])
    setEvents(prev => prev.filter((_, idx) => idx !== ri)); setEventDelete(null); showToast('Event deleted')
  }

  // ─── Product CRUD ───
  function openProductAdd() { setProductForm({ ...EMPTY_PRODUCT }); setProductEditing('new') }
  function openProductEdit(i) { setProductForm({ ...products[i] }); setProductEditing(i) }
  function saveProduct() {
    if (!productForm['Product Name']?.trim()) { showToast('Product name is required'); return }
    if (productEditing === 'new') { setProducts(prev => [...prev, { ...productForm }]); showToast('Product added') }
    else { setProducts(prev => prev.map((p, i) => i === productEditing ? { ...productForm } : p)); showToast('Product updated') }
    setProductEditing(null)
  }
  function deleteProduct(i) { setProducts(prev => prev.filter((_, idx) => idx !== i)); setProductDelete(null); showToast('Product deleted') }

  // ─── Testimonial CRUD ───
  function openTestimonialAdd() {
    const today = new Date()
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`
    setTestimonialForm({ ...EMPTY_TESTIMONIAL, 'Date': dateStr }); setTestimonialEditing('new')
  }
  function openTestimonialEdit(i) { setTestimonialForm({ ...testimonials[i] }); setTestimonialEditing(i) }
  function saveTestimonial() {
    if (!testimonialForm['Name']?.trim() || !testimonialForm['Quote']?.trim()) { showToast('Name and quote are required'); return }
    if (testimonialEditing === 'new') { setTestimonials(prev => [...prev, { ...testimonialForm }]); showToast('Testimonial added') }
    else { setTestimonials(prev => prev.map((t, i) => i === testimonialEditing ? { ...testimonialForm } : t)); showToast('Testimonial updated') }
    setTestimonialEditing(null)
  }
  function deleteTestimonial(i) { setTestimonials(prev => prev.filter((_, idx) => idx !== i)); setTestimonialDelete(null); showToast('Testimonial deleted') }

  const TABS = [
    { key: 'events', label: 'Events', count: events.length },
    { key: 'shop', label: 'Shop', count: products.length },
    { key: 'testimonials', label: 'Testimonials', count: testimonials.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-charcoal text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-3xl">Admin Dashboard</h1>
              <p className="text-gray-300 text-sm mt-1">Manage events, shop, and testimonials.</p>
            </div>
            <button onClick={tab === 'events' ? openEventAdd : tab === 'shop' ? openProductAdd : openTestimonialAdd}
              className="bg-teal hover:bg-teal-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer border-none text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              Add {tab === 'events' ? 'Event' : tab === 'shop' ? 'Product' : 'Testimonial'}
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors cursor-pointer border-none ${
                  tab === t.key ? 'bg-gray-50 text-charcoal' : 'bg-charcoal-light/30 text-gray-300 hover:text-white'
                }`}>
                {t.label} <span className="ml-1 text-xs opacity-70">({t.count})</span>
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
                              <span className="font-semibold text-coral">{event['Price']}</span>
                              {event['Max Spots'] && <span>{event['Max Spots']} spots</span>}
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
              <ImageUpload value={eventForm['Image URL']} onChange={v => setEventForm(p => ({ ...p, 'Image URL': v }))} showToast={showToast} />
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
              <ImageUpload value={productForm['Image URL']} onChange={v => setProductForm(p => ({ ...p, 'Image URL': v }))} showToast={showToast} />
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
