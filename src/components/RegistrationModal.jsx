import { useState } from 'react'
import { CONTACT } from '../config'

const ATTENDEE_STORAGE_KEY = 'mahj918_admin_attendees'

function getEventId(event) {
  return `${event['Event Name']}_${event['Date']}_${event['Time']}`.replace(/\s+/g, '_')
}

function getAttendees(event) {
  try {
    const stored = localStorage.getItem(ATTENDEE_STORAGE_KEY)
    const all = stored ? JSON.parse(stored) : {}
    return all[getEventId(event)] || []
  } catch {
    return []
  }
}

function addAttendeeToStorage(event, name, contact) {
  try {
    const stored = localStorage.getItem(ATTENDEE_STORAGE_KEY)
    const all = stored ? JSON.parse(stored) : {}
    const id = getEventId(event)
    const list = all[id] || []
    const isFree = /free/i.test(event['Price'] || '')
    all[id] = [...list, {
      name: name.trim(),
      contact: contact.trim(),
      paid: isFree,
      notes: isFree ? 'Self-registered (free event)' : '',
    }]
    localStorage.setItem(ATTENDEE_STORAGE_KEY, JSON.stringify(all))
    return true
  } catch {
    return false
  }
}

function PaymentOption({ label, value, color, icon }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`w-10 h-10 ${color} text-white font-bold rounded-lg flex items-center justify-center text-lg`}>
        {icon}
      </span>
      <div>
        <p className="font-semibold text-sm text-charcoal">{label}</p>
        <p className="text-charcoal-light text-sm">{value}</p>
      </div>
    </div>
  )
}

export default function RegistrationModal({ event, onClose }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [checkName, setCheckName] = useState('')
  const [view, setView] = useState('register') // 'register' | 'check' | 'success'
  const [checkResult, setCheckResult] = useState(null)

  if (!event) return null

  const isFree = /free/i.test(event['Price'] || '')
  const maxSpots = parseInt(event['Max Spots']) || 0
  const currentCount = getAttendees(event).length
  const isFull = maxSpots > 0 && currentCount >= maxSpots

  function handleRegister() {
    if (!name.trim() || !contact.trim()) return
    const attendees = getAttendees(event)
    const already = attendees.some(a => a.name.toLowerCase() === name.trim().toLowerCase())
    if (already) {
      setCheckResult({ found: true, name: name.trim() })
      setCheckName(name.trim())
      setView('check')
      return
    }
    if (isFull) return
    const success = addAttendeeToStorage(event, name, contact)
    if (success) setView('success')
  }

  function handleCheck() {
    if (!checkName.trim()) return
    const attendees = getAttendees(event)
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
            <h3 className="font-heading text-xl text-charcoal mb-1">You're Registered!</h3>
            <p className="text-charcoal-light text-sm mb-1">{name.trim()}, you're all set for:</p>
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
                  <PaymentOption label="Zelle" value={CONTACT.zelle} color="bg-[#6D1ED4]" icon="Z" />
                </div>
                <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
                  <p className="text-xs text-charcoal"><strong>Memo:</strong> {event['Event Name']} &mdash; {event['Date']}</p>
                </div>
                <p className="text-xs text-charcoal-light/70 mt-2 text-center">
                  Please include the event name in your memo. If payment is not received, we may reach out using the contact info you provided.
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
                        {maxSpots - currentCount} of {maxSpots} spots remaining
                      </p>
                    )}
                    {!isFree && (
                      <p className="text-xs text-charcoal-light/70 mb-3">
                        After registering, you'll see payment options to complete your spot.
                      </p>
                    )}
                    <button onClick={handleRegister} disabled={!name.trim() || !contact.trim()}
                      className="w-full py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      Register Now
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
                            <p className="text-xs text-charcoal-light mt-1.5 ml-6.5">Your spot is reserved but not confirmed until payment is received. Please send {event['Price']} to complete your registration.</p>
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
