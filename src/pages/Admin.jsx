import { useState, useEffect, useMemo } from 'react'
import { EVENT_COLORS } from '../config'
import { demoEvents } from '../utils/demoData'
import { useEvents } from '../hooks/useSiteData'

const STORAGE_KEY = 'mahj918_admin_events'
const ATTENDEE_STORAGE_KEY = 'mahj918_admin_attendees'
const EVENT_TYPES = ['Open Play', 'Birdy Basics', 'League', 'Special Event', 'Private']

const EMPTY_EVENT = {
  'Event Name': '',
  'Date': '',
  'Time': '',
  'Venue': '',
  'Address': '',
  'Event Type': 'Open Play',
  'Price': '',
  'Description': '',
  'Registration Link': '',
  'Max Spots': '',
  'Image URL': '',
}

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

export default function Admin() {
  const { allEvents: sheetEvents } = useEvents()
  const [events, setEvents] = useState([])
  const [editing, setEditing] = useState(null) // null = closed, 'new' = adding, index = editing
  const [form, setForm] = useState({ ...EMPTY_EVENT })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [attendeePanel, setAttendeePanel] = useState(null) // event index in displayed[]
  const [attendees, setAttendees] = useState({}) // { eventId: [{ name, paid, notes }] }
  const [newAttendeeName, setNewAttendeeName] = useState('')

  // Load attendees from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ATTENDEE_STORAGE_KEY)
      if (stored) setAttendees(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Save attendees to localStorage
  useEffect(() => {
    if (Object.keys(attendees).length > 0) {
      localStorage.setItem(ATTENDEE_STORAGE_KEY, JSON.stringify(attendees))
    }
  }, [attendees])

  function getAttendeeList(event) {
    return attendees[getEventId(event)] || []
  }

  function addAttendee(event) {
    if (!newAttendeeName.trim()) return
    const id = getEventId(event)
    setAttendees(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), { name: newAttendeeName.trim(), paid: false, notes: '' }],
    }))
    setNewAttendeeName('')
    showToast('Attendee added')
  }

  function toggleAttendeePaid(event, idx) {
    const id = getEventId(event)
    setAttendees(prev => ({
      ...prev,
      [id]: (prev[id] || []).map((a, i) => i === idx ? { ...a, paid: !a.paid } : a),
    }))
  }

  function removeAttendee(event, idx) {
    const id = getEventId(event)
    setAttendees(prev => ({
      ...prev,
      [id]: (prev[id] || []).filter((_, i) => i !== idx),
    }))
    showToast('Attendee removed')
  }

  function updateAttendeeNotes(event, idx, notes) {
    const id = getEventId(event)
    setAttendees(prev => ({
      ...prev,
      [id]: (prev[id] || []).map((a, i) => i === idx ? { ...a, notes } : a),
    }))
  }

  // Load events from localStorage or fall back to sheet/demo data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setEvents(JSON.parse(stored))
      } catch {
        setEvents([...sheetEvents])
      }
    } else {
      setEvents([...sheetEvents])
    }
  }, [sheetEvents])

  // Save to localStorage whenever events change (skip initial empty state)
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    }
  }, [events])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // Stats
  const stats = useMemo(() => {
    const upcoming = events.filter(e => !isPast(e['Date']))
    const past = events.filter(e => isPast(e['Date']))
    const typeCounts = {}
    EVENT_TYPES.forEach(t => { typeCounts[t] = events.filter(e => e['Event Type'] === t).length })
    return { total: events.length, upcoming: upcoming.length, past: past.length, typeCounts }
  }, [events])

  // Filtered & searched events
  const displayed = useMemo(() => {
    let list = [...events]
    if (filter === 'upcoming') list = list.filter(e => !isPast(e['Date']))
    else if (filter === 'past') list = list.filter(e => isPast(e['Date']))
    else if (EVENT_TYPES.includes(filter)) list = list.filter(e => e['Event Type'] === filter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e['Event Name']?.toLowerCase().includes(q) ||
        e['Venue']?.toLowerCase().includes(q) ||
        e['Description']?.toLowerCase().includes(q)
      )
    }

    // Sort by date, upcoming first
    list.sort((a, b) => {
      const da = a['Date'] ? new Date(a['Date'].split('/')[2], a['Date'].split('/')[0] - 1, a['Date'].split('/')[1]) : new Date(0)
      const db = b['Date'] ? new Date(b['Date'].split('/')[2], b['Date'].split('/')[0] - 1, b['Date'].split('/')[1]) : new Date(0)
      return da - db
    })
    return list
  }, [events, filter, search])

  function openAdd() {
    setForm({ ...EMPTY_EVENT })
    setEditing('new')
  }

  function openEdit(index) {
    const realIndex = events.indexOf(displayed[index])
    setForm({ ...events[realIndex] })
    setEditing(realIndex)
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    if (!form['Event Name']?.trim() || !form['Date']?.trim()) {
      showToast('Event name and date are required')
      return
    }

    if (editing === 'new') {
      setEvents(prev => [...prev, { ...form }])
      showToast('Event added')
    } else {
      setEvents(prev => prev.map((e, i) => i === editing ? { ...form } : e))
      showToast('Event updated')
    }
    setEditing(null)
  }

  function handleDelete(index) {
    const realIndex = events.indexOf(displayed[index])
    setEvents(prev => prev.filter((_, i) => i !== realIndex))
    setDeleteConfirm(null)
    showToast('Event deleted')
  }

  function handleDuplicate(index) {
    const realIndex = events.indexOf(displayed[index])
    const copy = { ...events[realIndex], 'Event Name': events[realIndex]['Event Name'] + ' (Copy)' }
    setEvents(prev => [...prev, copy])
    showToast('Event duplicated')
  }

  function handleResetToDefaults() {
    localStorage.removeItem(STORAGE_KEY)
    setEvents([...demoEvents])
    showToast('Reset to default events')
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-charcoal text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-3xl">Admin Dashboard</h1>
              <p className="text-gray-300 text-sm mt-1">Manage your events, view stats, and keep everything up to date.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openAdd}
                className="bg-teal hover:bg-teal-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer border-none text-sm flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Add Event
              </button>
              <button
                onClick={handleResetToDefaults}
                className="bg-charcoal-light/50 hover:bg-charcoal-light text-white font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer border border-gray-500 text-sm"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-heading text-charcoal">{stats.total}</p>
            <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Total Events</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-heading text-teal">{stats.upcoming}</p>
            <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-heading text-charcoal-light">{stats.past}</p>
            <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Past</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-heading text-special-purple">
              {Object.values(attendees).reduce((sum, list) => sum + list.length, 0)}
            </p>
            <p className="text-xs text-charcoal-light font-semibold uppercase tracking-wide">Registered</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'past', label: 'Past' },
                ...EVENT_TYPES.map(t => ({ key: t, label: t })),
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    filter === f.key
                      ? 'bg-teal text-white border-teal'
                      : 'bg-gray-50 text-charcoal-light border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className="max-w-6xl mx-auto px-4 mt-4 pb-12">
        {displayed.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-charcoal-light text-lg">No events found.</p>
            <button onClick={openAdd} className="mt-3 text-teal hover:text-teal-dark font-semibold text-sm cursor-pointer border-none bg-transparent">
              + Add your first event
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((event, i) => {
              const colors = EVENT_COLORS[event['Event Type']] || EVENT_COLORS['Open Play']
              const past = isPast(event['Date'])
              return (
                <div
                  key={i}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md ${past ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-stretch">
                    {/* Color bar */}
                    <div className={`w-1.5 shrink-0 ${colors.dot}`} />

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Date block */}
                      <div className="text-center shrink-0 w-16">
                        <p className="text-xs font-semibold text-charcoal-light uppercase">
                          {event['Date']?.split('/')[0]}/{event['Date']?.split('/')[1]}
                        </p>
                        <p className="text-lg font-heading text-charcoal leading-tight">
                          {formatDisplayDate(event['Date']).split(',')[0]}
                        </p>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="font-heading text-base text-charcoal truncate">{event['Event Name']}</h3>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors.badge}`}>
                            {event['Event Type']}
                          </span>
                          {past && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200 text-gray-500">
                              Past
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-charcoal-light">
                          <span>{event['Time']}</span>
                          <span>{event['Venue']}</span>
                          <span className="font-semibold text-coral">{event['Price']}</span>
                          {event['Max Spots'] && <span>{event['Max Spots']} spots</span>}
                        </div>
                        {event['Description'] && (
                          <p className="text-xs text-charcoal-light/70 mt-1 line-clamp-1">{event['Description']}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 shrink-0 items-center">
                        {/* Attendee count badge */}
                        <button
                          onClick={() => { setAttendeePanel(i); setNewAttendeeName('') }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-special-purple/10 text-special-purple hover:bg-special-purple/20 transition-colors cursor-pointer border-none text-xs font-semibold"
                          title="Manage attendees"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                          {getAttendeeList(event).length}
                        </button>
                        <button
                          onClick={() => openEdit(i)}
                          className="p-2 rounded-lg bg-teal/10 text-teal hover:bg-teal/20 transition-colors cursor-pointer border-none"
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDuplicate(i)}
                          className="p-2 rounded-lg bg-yellow/20 text-league-gold hover:bg-yellow/30 transition-colors cursor-pointer border-none"
                          title="Duplicate"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(i)}
                          className="p-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors cursor-pointer border-none"
                          title="Delete"
                        >
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

        <p className="text-center text-xs text-charcoal-light/50 mt-6">
          {displayed.length} event{displayed.length !== 1 ? 's' : ''} shown &middot; Data saved to browser storage
        </p>
      </div>

      {/* Add/Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl text-charcoal">
                  {editing === 'new' ? 'Add New Event' : 'Edit Event'}
                </h2>
                <button
                  onClick={() => setEditing(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Event Name *</label>
                <input
                  type="text"
                  value={form['Event Name']}
                  onChange={e => handleFormChange('Event Name', e.target.value)}
                  placeholder="e.g., Open Play Night at McNellie's"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>

              {/* Date & Time row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Date *</label>
                  <input
                    type="date"
                    value={formatDateForInput(form['Date'])}
                    onChange={e => handleFormChange('Date', formatDateFromInput(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Time</label>
                  <input
                    type="text"
                    value={form['Time']}
                    onChange={e => handleFormChange('Time', e.target.value)}
                    placeholder="e.g., 6:00-8:30p"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
              </div>

              {/* Event Type & Price row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Event Type</label>
                  <select
                    value={form['Event Type']}
                    onChange={e => handleFormChange('Event Type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Price</label>
                  <input
                    type="text"
                    value={form['Price']}
                    onChange={e => handleFormChange('Price', e.target.value)}
                    placeholder="e.g., $15 or Free"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
              </div>

              {/* Venue & Address row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Venue</label>
                  <input
                    type="text"
                    value={form['Venue']}
                    onChange={e => handleFormChange('Venue', e.target.value)}
                    placeholder="e.g., McNellie's South City"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Address</label>
                  <input
                    type="text"
                    value={form['Address']}
                    onChange={e => handleFormChange('Address', e.target.value)}
                    placeholder="e.g., 7031 S Zurich Ave, Tulsa, OK"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Description</label>
                <textarea
                  value={form['Description']}
                  onChange={e => handleFormChange('Description', e.target.value)}
                  rows={3}
                  placeholder="Tell people what to expect at this event..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-vertical"
                />
              </div>

              {/* Registration Link & Max Spots row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Registration Link</label>
                  <input
                    type="text"
                    value={form['Registration Link']}
                    onChange={e => handleFormChange('Registration Link', e.target.value)}
                    placeholder="URL or leave blank for payment modal"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-1">Max Spots</label>
                  <input
                    type="text"
                    value={form['Max Spots']}
                    onChange={e => handleFormChange('Max Spots', e.target.value)}
                    placeholder="e.g., 24"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">Image URL</label>
                <input
                  type="text"
                  value={form['Image URL']}
                  onChange={e => handleFormChange('Image URL', e.target.value)}
                  placeholder="Optional image URL (leave blank for default)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-charcoal-light font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-lg bg-teal text-white font-semibold text-sm hover:bg-teal-dark transition-colors cursor-pointer border-none"
              >
                {editing === 'new' ? 'Add Event' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in-up">
            <h3 className="font-heading text-lg text-charcoal mb-2">Delete Event?</h3>
            <p className="text-sm text-charcoal-light mb-4">
              Are you sure you want to delete <strong>{displayed[deleteConfirm]?.['Event Name']}</strong>? This can't be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-charcoal-light font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg bg-coral text-white font-semibold text-sm hover:bg-coral-dark transition-colors cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendee Panel */}
      {attendeePanel !== null && displayed[attendeePanel] && (() => {
        const event = displayed[attendeePanel]
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
                  <button
                    onClick={() => setAttendeePanel(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                {/* Summary bar */}
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-charcoal font-semibold">{list.length} registered</span>
                  <span className="text-teal font-semibold">{paidCount} paid</span>
                  <span className="text-coral font-semibold">{list.length - paidCount} unpaid</span>
                  {maxSpots > 0 && (
                    <span className="text-charcoal-light">{maxSpots - list.length} spots left</span>
                  )}
                </div>
              </div>

              {/* Add attendee */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAttendeeName}
                    onChange={e => setNewAttendeeName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAttendee(event)}
                    placeholder="Add name..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                  />
                  <button
                    onClick={() => addAttendee(event)}
                    className="px-4 py-2 bg-teal text-white font-semibold rounded-lg text-sm hover:bg-teal-dark transition-colors cursor-pointer border-none"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Attendee list */}
              <div className="max-h-80 overflow-y-auto">
                {list.length === 0 ? (
                  <div className="p-8 text-center text-charcoal-light text-sm">
                    No attendees yet. Add someone above.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {list.map((attendee, idx) => (
                      <div key={idx} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                        {/* Paid toggle */}
                        <button
                          onClick={() => toggleAttendeePaid(event, idx)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            attendee.paid
                              ? 'bg-teal border-teal text-white'
                              : 'bg-white border-gray-300 text-transparent hover:border-teal'
                          }`}
                          title={attendee.paid ? 'Mark unpaid' : 'Mark paid'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                        </button>

                        {/* Name & notes */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${attendee.paid ? 'text-charcoal' : 'text-charcoal-light'}`}>
                            {attendee.name}
                          </p>
                          <input
                            type="text"
                            value={attendee.notes}
                            onChange={e => updateAttendeeNotes(event, idx, e.target.value)}
                            placeholder="Notes (optional)"
                            className="w-full text-xs text-charcoal-light/70 border-none bg-transparent focus:outline-none placeholder:text-charcoal-light/40 p-0 mt-0.5"
                          />
                        </div>

                        {/* Status badge */}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          attendee.paid ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'
                        }`}>
                          {attendee.paid ? 'Paid' : 'Unpaid'}
                        </span>

                        {/* Remove */}
                        <button
                          onClick={() => removeAttendee(event, idx)}
                          className="p-1 rounded hover:bg-coral/10 text-charcoal-light hover:text-coral transition-colors cursor-pointer border-none bg-transparent shrink-0"
                          title="Remove"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setAttendeePanel(null)}
                  className="px-5 py-2.5 rounded-lg bg-charcoal text-white font-semibold text-sm hover:bg-charcoal/90 transition-colors cursor-pointer border-none"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-charcoal text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  )
}
