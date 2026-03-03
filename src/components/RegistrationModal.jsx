import { useState } from 'react'
import { CONTACT } from '../config'
import { isFirebaseReady, fetchAttendees, saveEventAttendees, getEventId, saveUserProfile } from '../services/db'

const ATTENDEE_STORAGE_KEY = 'mahj918_admin_attendees'

function getLocalAttendees() {
  try {
    const stored = localStorage.getItem(ATTENDEE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function saveLocalAttendees(all) {
  try { localStorage.setItem(ATTENDEE_STORAGE_KEY, JSON.stringify(all)) } catch { /* storage full */ }
}

async function getAttendees(event) {
  const id = getEventId(event)
  if (isFirebaseReady()) {
    try {
      const all = await fetchAttendees()
      if (Object.keys(all).length > 0) return all[id] || []
    } catch (e) { console.error('Firebase read failed:', e) }
  }
  return getLocalAttendees()[id] || []
}

async function addAttendeeToStorage(event, attendeeData) {
  try {
    const id = getEventId(event)

    // Always save to localStorage first (guaranteed to work)
    const localAll = getLocalAttendees()
    const localList = localAll[id] || []
    localAll[id] = [...localList, attendeeData]
    saveLocalAttendees(localAll)

    // Then try Firebase
    if (isFirebaseReady()) {
      try {
        const fbAll = await fetchAttendees()
        const fbList = fbAll[id] || []
        await saveEventAttendees(id, [...fbList, attendeeData])
      } catch (e) { console.error('Firebase attendee save failed:', e) }
    }

    return true
  } catch {
    return false
  }
}

function getPaymentUrl(label, value) {
  if (label === 'Venmo') return `https://venmo.com/${value.replace('@', '')}`
  if (label === 'PayPal') return `https://www.paypal.biz/${value}`
  if (label === 'Zelle') return 'https://www.zellepay.com/how-it-works'
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

// Step indicator dots
function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
          i === current ? 'w-6 bg-teal' : i < current ? 'w-1.5 bg-teal/40' : 'w-1.5 bg-gray-200'
        }`} />
      ))}
    </div>
  )
}

export default function RegistrationModal({ event, onClose, currentUser }) {
  // Step 1: Name + contact + level
  // Step 2: Punch card + table requests
  // Step 3: Payment (if needed) or success
  const [step, setStep] = useState(1)
  const [name, setName] = useState(currentUser?.name || '')
  const [contact, setContact] = useState(currentUser?.email || currentUser?.phone || '')
  const [level, setLevel] = useState(currentUser?.level || '')
  const [hasPunchCard, setHasPunchCard] = useState(currentUser?.hasPunchCard || false)
  const [tableRequests, setTableRequests] = useState('')
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
  const eventPunchEligible = (event['Punch Card Eligible'] || 'yes') !== 'no'

  // Punch card: 5 paid rounds + 1 free bonus = 6 total uses
  const punchesUsed = currentUser?.punchCardPunches || 0
  const punchCardFull = punchesUsed >= 5  // earned the free bonus
  const punchCardExpired = punchesUsed > 5 // all 6 used up
  const canUsePunchCard = hasPunchCard && !punchCardExpired && eventPunchEligible

  // Determine total steps: 3 for paid events without punch card, 2 if free or has punch card
  const paidNoPunch = !isFree && !canUsePunchCard
  const totalSteps = paidNoPunch ? 3 : 2

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

    const usingPunchCard = canUsePunchCard && !isFree
    const isBonusRound = usingPunchCard && punchCardFull

    const newAttendee = {
      name: name.trim(),
      contact: contact.trim(),
      level: level || '',
      hasPunchCard: usingPunchCard,
      tableRequests: tableRequests.trim(),
      paid: isFree || usingPunchCard,
      notes: isFree ? 'Self-registered (free event)' : isBonusRound ? 'Punch card FREE bonus round' : usingPunchCard ? `Punch card (${punchesUsed + 1}/5)` : '',
      userId: currentUser?.uid || '',
    }

    const success = await addAttendeeToStorage(event, newAttendee)

    // Deduct a punch from the user's card
    if (success && usingPunchCard && currentUser?.uid) {
      const newPunches = punchesUsed + 1
      const cardUsedUp = newPunches > 5 // used all 5 + bonus
      await saveUserProfile(currentUser.uid, {
        punchCardPunches: newPunches,
        // If all 6 rounds used, mark card as expired
        ...(cardUsedUp ? { hasPunchCard: false } : {}),
      })
    }

    setSubmitting(false)
    if (success) {
      if (paidNoPunch) {
        // Go to payment step
        setStep(3)
      } else {
        // Free event or punch card — go straight to success
        setView('success')
      }
    }
  }

  function handleNextStep() {
    if (step === 1) {
      if (!name.trim() || !contact.trim()) return
      setStep(2)
    } else if (step === 2) {
      handleRegister()
    }
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 p-1 bg-transparent border-none cursor-pointer text-charcoal-light hover:text-charcoal" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {/* Payment step (step 3 for paid events without punch card) */}
        {step === 3 && view !== 'success' ? (
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h3 className="font-heading text-xl text-charcoal mb-1">You&apos;re Registered!</h3>
            <p className="text-charcoal-light text-sm mb-1">{name.trim()}, you&apos;re all set for:</p>
            <p className="font-semibold text-charcoal text-sm">{event['Event Name']}</p>
            <p className="text-charcoal-light text-xs mt-1">{event['Date']} &bull; {event['Time']} &bull; {event['Venue']}</p>

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
                <PaymentOption label="Zelle" value={CONTACT.zelle} color="bg-[#6D1ED4]" icon="Z" hint="Open your bank app or Zelle &rarr; Send &rarr; enter email above" />
              </div>
              <div className="mt-3 p-3 bg-yellow/30 border-2 border-yellow rounded-lg">
                <p className="text-xs font-bold text-charcoal uppercase tracking-wide mb-1">Include this in your memo</p>
                <p className="text-sm font-semibold text-charcoal">{event['Event Name']} &mdash; {event['Date']}</p>
              </div>
              <p className="text-xs text-charcoal-light/70 mt-2 text-center">
                We need the event name in your memo to confirm your spot. If payment is not received, we may reach out using the contact info you provided.
              </p>
            </div>

            <button onClick={onClose}
              className="mt-5 px-6 py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm">
              Done
            </button>
          </div>
        ) : view === 'success' ? (
          /* Success screen for free events or punch card users */
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h3 className="font-heading text-xl text-charcoal mb-1">You&apos;re Registered!</h3>
            <p className="text-charcoal-light text-sm mb-1">{name.trim()}, you&apos;re all set for:</p>
            <p className="font-semibold text-charcoal text-sm">{event['Event Name']}</p>
            <p className="text-charcoal-light text-xs mt-1">{event['Date']} &bull; {event['Time']} &bull; {event['Venue']}</p>

            {canUsePunchCard && !isFree && (
              <div className="mt-4 p-3 bg-yellow/20 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
                  <p className="text-sm font-semibold text-league-gold">
                    {punchCardFull ? 'FREE bonus round used!' : `Punch ${punchesUsed + 1} of 5 used`}
                  </p>
                </div>
                <p className="text-xs text-charcoal-light mt-1">
                  {punchCardFull
                    ? 'That was your free bonus — nice!'
                    : punchesUsed + 1 >= 5
                      ? 'That was your last punch — next one is FREE!'
                      : `${5 - punchesUsed - 1} punches remaining on your card.`}
                </p>
              </div>
            )}

            {isFree && (
              <div className="mt-4 p-3 bg-teal/10 rounded-lg">
                <p className="text-sm font-semibold text-teal">This event is free — no payment needed!</p>
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
              <button onClick={() => { setView('register'); setCheckResult(null); setStep(1) }}
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
                    <StepIndicator current={step - 1} total={totalSteps} />

                    {/* STEP 1: Name, Contact, Level */}
                    {step === 1 && (
                      <div>
                        <div className="mb-3">
                          <label className="block text-sm font-semibold text-charcoal mb-1">Your Name *</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" autoFocus />
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-semibold text-charcoal mb-1">Phone or Email *</label>
                          <input type="text" value={contact} onChange={e => setContact(e.target.value)}
                            placeholder="How can we reach you?"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm font-semibold text-charcoal mb-1">Your Level</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'beginner', label: 'Beginner', desc: 'New to Mahj' },
                              { value: 'intermediate', label: 'Intermediate', desc: 'Know the basics' },
                              { value: 'advanced', label: 'Advanced', desc: 'Experienced' },
                            ].map(l => (
                              <button key={l.value} type="button"
                                onClick={() => setLevel(l.value)}
                                className={`p-2 rounded-lg border-2 text-center cursor-pointer transition-all ${
                                  level === l.value
                                    ? 'border-teal bg-teal/5'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}>
                                <p className={`text-xs font-semibold ${level === l.value ? 'text-teal' : 'text-charcoal'}`}>{l.label}</p>
                                <p className="text-[10px] text-charcoal-light mt-0.5">{l.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        {maxSpots > 0 && (
                          <p className="text-xs text-charcoal-light mb-3">
                            {maxSpots - attendeeCount} of {maxSpots} spots remaining
                          </p>
                        )}
                        <button onClick={handleNextStep} disabled={!name.trim() || !contact.trim()}
                          className="w-full py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                          Next
                        </button>
                      </div>
                    )}

                    {/* STEP 2: Punch Card + Table Requests */}
                    {step === 2 && (
                      <div>
                        {!isFree && eventPunchEligible && (
                          <div className="mb-4">
                            <label className="block text-sm font-semibold text-charcoal mb-2">Do you have a punch card?</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button"
                                onClick={() => setHasPunchCard(true)}
                                className={`p-3 rounded-lg border-2 text-center cursor-pointer transition-all ${
                                  hasPunchCard
                                    ? 'border-teal bg-teal/5'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}>
                                <div className="flex items-center justify-center gap-2">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hasPunchCard ? '#4ECDC4' : '#636E72'} strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
                                  <span className={`text-sm font-semibold ${hasPunchCard ? 'text-teal' : 'text-charcoal'}`}>Yes, I do!</span>
                                </div>
                                <p className="text-[10px] text-charcoal-light mt-1">Use a punch</p>
                              </button>
                              <button type="button"
                                onClick={() => setHasPunchCard(false)}
                                className={`p-3 rounded-lg border-2 text-center cursor-pointer transition-all ${
                                  !hasPunchCard
                                    ? 'border-charcoal bg-charcoal/5'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}>
                                <div className="flex items-center justify-center gap-2">
                                  <span className={`text-sm font-semibold ${!hasPunchCard ? 'text-charcoal' : 'text-charcoal-light'}`}>No</span>
                                </div>
                                <p className="text-[10px] text-charcoal-light mt-1">I&apos;ll pay {event['Price']}</p>
                              </button>
                            </div>
                            {hasPunchCard && canUsePunchCard && currentUser && (
                              <div className="mt-2 p-2.5 bg-teal/5 rounded-lg">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                                  <span className="text-xs font-semibold text-teal">
                                    {punchCardFull ? 'FREE bonus round!' : `Punch ${punchesUsed + 1} of 5`}
                                  </span>
                                </div>
                                {/* Mini punch indicator */}
                                <div className="flex gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                                      i < punchesUsed ? 'bg-teal/20' : i === punchesUsed && !punchCardFull ? 'bg-teal/40 ring-1 ring-teal' : 'bg-gray-100'
                                    }`}>
                                      {i < punchesUsed && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                      )}
                                    </div>
                                  ))}
                                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                                    punchCardFull ? 'bg-yellow/30 ring-1 ring-league-gold' : 'bg-gray-100'
                                  }`}>
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={punchCardFull ? '#F0A500' : '#D1D5DB'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                  </div>
                                </div>
                              </div>
                            )}
                            {hasPunchCard && !currentUser && (
                              <p className="text-xs text-teal mt-2 flex items-center gap-1">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                                No payment needed — punch card applied.
                              </p>
                            )}
                            {hasPunchCard && punchCardExpired && (
                              <p className="text-xs text-coral mt-2">Your punch card is all used up. You&apos;ll need to pay or get a new card.</p>
                            )}
                          </div>
                        )}

                        <div className="mb-4">
                          <label className="block text-sm font-semibold text-charcoal mb-1">Table Requests</label>
                          <textarea value={tableRequests} onChange={e => setTableRequests(e.target.value)}
                            placeholder="Want to sit with someone specific? Any seating preferences?"
                            rows={2}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none" />
                          <p className="text-xs text-charcoal-light/60 mt-1">Optional — we&apos;ll do our best to accommodate!</p>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => setStep(1)}
                            className="px-4 py-2.5 bg-gray-100 text-charcoal font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border-none text-sm">
                            Back
                          </button>
                          <button onClick={handleNextStep} disabled={submitting}
                            className="flex-1 py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? 'Registering...' : (paidNoPunch ? 'Register & Pay' : 'Register Now')}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Check Status tab */
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
                            <p className="text-sm text-league-gold font-semibold">{checkResult.name} is registered &mdash; payment pending</p>
                          </div>
                          {!isFree && (
                            <p className="text-xs text-charcoal-light mt-1.5 ml-6.5">Your spot is reserved but not confirmed until payment is received. Please send {event['Price']} to complete your registration. Note: it may take a little time for us to verify your payment &mdash; if you just sent it, check back soon!</p>
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
