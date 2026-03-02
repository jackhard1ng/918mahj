import { useState } from 'react'
import { CONTACT } from '../config'
import { isFirebaseReady, fetchAttendees, saveEventAttendees } from '../services/db'

const ATTENDEE_STORAGE_KEY = 'mahj918_admin_attendees'

function getEventId(event) {
  return `${event['Event Name']}_${event['Date']}_${event['Time']}`.replace(/\s+/g, '_')
}

function getLocalAttendees() {
  try {
    const stored = localStorage.getItem(ATTENDEE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function saveLocalAttendees(all) {
  try { localStorage.setItem(ATTENDEE_STORAGE_KEY, JSON.stringify(all)) } catch {}
}

async function getAttendees(event) {
  const id = getEventId(event)
  // Try Firebase first, fall back to localStorage
  if (isFirebaseReady()) {
    try {
      const all = await fetchAttendees()
      if (Object.keys(all).length > 0) return all[id] || []
    } catch (e) { console.error('Firebase read failed:', e) }
  }
  return getLocalAttendees()[id] || []
}

async function addAttendeeToStorage(event, name, contact) {
  try {
    const id = getEventId(event)
    const isFree = /free/i.test(event['Price'] || '')
    const newAttendee = {
      name: name.trim(),
      contact: contact.trim(),
      paid: isFree,
      notes: isFree ? 'Self-registered (free event)' : '',
    }

    // Always save to localStorage first (guaranteed to work)
    const localAll = getLocalAttendees()
    const localList = localAll[id] || []
    localAll[id] = [...localList, newAttendee]
    saveLocalAttendees(localAll)

    // Then try Firebase
    if (isFirebaseReady()) {
      try {
        const fbAll = await fetchAttendees()
        const fbList = fbAll[id] || []
        await saveEventAttendees(id, [...fbList, newAttendee])
      } catch (e) { console.error('Firebase attendee save failed:', e) }
    }

    return true
  } catch {
    return false
  }
}

function getPaymentUrl(label, value) {
  if (label === 'Venmo') return `https://venmo.com/${value.replace('@', '')}`
  if (label === 'PayPal') return `https://paypal.me/${value}`
  return null
}

function PaymentOption({ label, value, color, icon, hint }) {
  const url = getPaymentUrl(label, value)

  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${url ? 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200 cursor-pointer' : 'bg-gray-50'}`}>
      <span className={`w-10 h-10 ${color} text-white font-bold rounded-lg flex items-center justify-center text-lg shrink-0`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-charcoal">{label}</p>
          {url && <span className="text-[10px] font-semibold text-teal bg-teal/10 px-1.5 py-0.5 rounded">Tap to pay</span>}
        </div>
        <p className="text-charcoal-light text-sm">{value}</p>
        {hint && <p className="text-charcoal-light/60 text-xs mt-0.5">{hint}</p>}
      </div>
      {url && (
        <svg className="w-5 h-5 text-teal ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
      )}
    </div>
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block no-underline">
        {content}
      </a>
    )
  }
  return content
}

export default function RegistrationModal({ event, onClose }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [checkName, setCheckName] = useState('')
  const [view, setView] = useState('register') // 'register' | 'check' | 'success'
  const [checkResult, setCheckResult] = useState(null)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Load initial count
  useState(() => {
    getAttendees(event).then(list => setAttendeeCount(list.length))
  })

  if (!event) return null

  const isFree = /free/i.test(event['Price'] || '')
  const maxSpots = parseInt(event['Max Spots']) || 0
  const isFull = maxSpots > 0 && attendeeCount >= maxSpots

  async function handleRegister() {
    if (!name.trim() || !contact.trim() || submitting) return
    setSubmitting(true)
    const attendees = await getAttendees(event)
    const already = attendees.some(a => a.name.toLowerCase() === name.trim().toLowerCase())
    if (already) {
      setCheckResult({ found: true, name: name.trim(), paid: attendees.find(a => a.name.toLowerCase() === name.trim().toLowerCase())?.paid })
      setCheckName(name.trim())
      setView('check')
      setSubmitting(false)
      return
    }
    if (maxSpots > 0 && attendees.length >= maxSpots) { setSubmitting(false); return }
    const success = await addAttendeeToStorage(event, name, contact)
    setSubmitting(false)
    if (success) setView('success')
  }

  async function handleCheck() {
    if (!checkName.trim()) return
    const attendees = await getAttendees(event)
    const match = attendees.find(a => a.name.toLowerCase() === checkName.trim().toLowerCase())
    setCheckResult({ found: !!match, name: checkName.trim(), paid: match?.paid || false })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 p-1 bg-transparent border-none cursor-pointer text-charcoal-light hover:text-charcoal" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {view === 'success' ? (
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h3 className="font-heading text-xl text-charcoal mb-1">You&apos;re Registered!</h3>
            <p className="text-charcoal-light text-sm mb-1">{name.trim()}, you&apos;re all set for:</p>
            <p className="font-semibold text-charcoal text-sm">{event['Event Name']}</p>
            <p className="text-charcoal-light text-xs mt-1">{event['Date']} &bull; {event['Time']} &bull; {event['Venue']}</p>

            {/* Payment info for paid events */}
            {!isFree && (
              <div className="mt-5 text-left">
                <div className="bg-coral/10 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-coral mb-0.5">Send payment to confirm your spot</p>
                  <p className="text-xs text-charcoal-light">
                    Your spot is reserved but not confirmed until we receive <strong>{event['Price']}</strong>. Please send payment using one of the options below.
                  </p>
                </div>
                <div className="space-y-2">
                  <PaymentOption label="Venmo" value={CONTACT.venmo} color="bg-[#3D95CE]" icon="V" />
                  <PaymentOption label="PayPal" value={CONTACT.paypal} color="bg-[#0070BA]" icon="P" />
                  <PaymentOption label="Zelle" value={CONTACT.zelle} color="bg-[#6D1ED4]" icon="Z" hint="Open your bank app → Send with Zelle → enter email above" />
                </div>
                <div className="mt-3 p-3 bg-yellow/30 border-2 border-yellow rounded-lg">
                  <p className="text-xs font-bold text-charcoal uppercase tracking-wide mb-1">Include this in your memo</p>
                  <p className="text-sm font-semibold text-charcoal">{event['Event Name']} &mdash; {event['Date']}</p>
                </div>
                <p className="text-xs text-charcoal-light/70 mt-2 text-center">
                  We need the event name in your memo to confirm your spot. If payment is not received, we may reach out using the contact info you provided.
                </p>
              </div>
            )}

            <button onClick={onClose}
              className="mt-5 px-6 py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm">
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-heading text-xl text-charcoal mb-1">
              Register for Event
            </h3>
            <p className="text-charcoal-light text-sm mb-4">
              {event['Event Name']} &mdash; <span className="font-semibold text-teal">{event['Price']}</span>
            </p>

            {/* Tab toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
              <button onClick={() => { setView('register'); setCheckResult(null) }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer border-none ${view === 'register' ? 'bg-white text-charcoal shadow-sm' : 'bg-transparent text-charcoal-light'}`}>
                Register
              </button>
              <button onClick={() => { setView('check'); setCheckResult(null) }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer border-none ${view === 'check' ? 'bg-white text-charcoal shadow-sm' : 'bg-transparent text-charcoal-light'}`}>
                Check Status
              </button>
            </div>

            {view === 'register' ? (
              <div>
                {isFull ? (
                  <div className="p-4 bg-coral/10 rounded-lg text-center">
                    <p className="text-coral font-semibold text-sm">This event is full!</p>
                    <p className="text-charcoal-light text-xs mt-1">All {maxSpots} spots have been taken.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="block text-sm font-semibold text-charcoal mb-1">Your Name *</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" autoFocus />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-semibold text-charcoal mb-1">Phone or Email *</label>
                      <input type="text" value={contact} onChange={e => setContact(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        placeholder="How can we reach you?"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                    </div>
                    {maxSpots > 0 && (
                      <p className="text-xs text-charcoal-light mb-3">
                        {maxSpots - attendeeCount} of {maxSpots} spots remaining
                      </p>
                    )}
                    {!isFree && (
                      <p className="text-xs text-charcoal-light/70 mb-3">
                        After registering, you&apos;ll see payment options to complete your spot.
                      </p>
                    )}
                    <button onClick={handleRegister} disabled={!name.trim() || !contact.trim() || submitting}
                      className="w-full py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? 'Registering...' : 'Register Now'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-charcoal mb-1">Your Name</label>
                  <input type="text" value={checkName} onChange={e => { setCheckName(e.target.value); setCheckResult(null) }}
                    onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Enter the name you registered with"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" autoFocus />
                </div>
                <button onClick={handleCheck} disabled={!checkName.trim()}
                  className="w-full py-2.5 bg-charcoal text-white font-semibold rounded-lg hover:bg-charcoal/90 transition-colors cursor-pointer border-none text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  Check Registration
                </button>
                {checkResult && (
                  <div className={`mt-3 p-3 rounded-lg ${checkResult.found ? (checkResult.paid ? 'bg-teal/10' : 'bg-yellow/20') : 'bg-coral/10'}`}>
                    {checkResult.found ? (
                      checkResult.paid ? (
                        <div className="flex items-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                          <p className="text-sm text-teal font-semibold">{checkResult.name} is registered and payment has been received!</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                            <p className="text-sm text-league-gold font-semibold">{checkResult.name} is registered — payment pending</p>
                          </div>
                          {!isFree && (
                            <p className="text-xs text-charcoal-light mt-1.5 ml-6.5">Your spot is reserved but not confirmed until payment is received. Please send {event['Price']} to complete your registration. Note: it may take a little time for us to verify your payment — if you just sent it, check back soon!</p>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                        <p className="text-sm text-coral font-semibold">No registration found for {checkResult.name}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
