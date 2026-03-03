import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserRegistrations, isFirebaseReady } from '../services/db'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { useEvents } from '../hooks/useSiteData'
import { CONTACT } from '../config'

const LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'New to Mahjong or still learning the basics' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Know the rules and can play a full game' },
  { value: 'advanced', label: 'Advanced', desc: 'Experienced player, comfortable with strategy' },
]

function LoginForm({ onSwitch }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" required autoFocus
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password" required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      {error && <p className="text-sm text-coral font-semibold">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <p className="text-sm text-center text-charcoal-light">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitch}
          className="text-teal font-semibold bg-transparent border-none cursor-pointer p-0 hover:text-teal-dark">
          Create one
        </button>
      </p>
    </form>
  )
}

function SignupForm({ onSwitch }) {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) return
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError('')
    setLoading(true)
    try {
      await signup(email.trim(), password, name.trim(), phone.trim())
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Full Name *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Your full name" required autoFocus
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Email *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Phone</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="(optional)"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Password *</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="At least 6 characters" required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-charcoal mb-1">Confirm Password *</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="Re-enter password" required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
      </div>
      {error && <p className="text-sm text-coral font-semibold">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50">
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      <p className="text-sm text-center text-charcoal-light">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch}
          className="text-teal font-semibold bg-transparent border-none cursor-pointer p-0 hover:text-teal-dark">
          Sign in
        </button>
      </p>
    </form>
  )
}

function PunchCardDisplay({ profile }) {
  // Show if they have an active punch card OR have any punch history
  if (!profile?.hasPunchCard && !(profile?.punchCardPunches > 0)) return null

  const punches = profile.punchCardPunches || 0
  const total = 5  // 5 rounds for $75
  const filled = Math.min(punches, total)
  const bonusEarned = punches >= total
  const bonusUsed = punches > total // 6th punch = bonus was used

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-yellow/30 rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
        </div>
        <div>
          <h3 className="font-heading text-lg text-charcoal">Punch Card</h3>
          <p className="text-sm text-charcoal-light">5 rounds for $75 &bull; 6th round FREE</p>
        </div>
      </div>
      <p className="text-xs text-charcoal-light mb-3 ml-13">{filled} of {total} rounds used</p>

      {/* 5 regular punches */}
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
            i < filled
              ? 'bg-teal/10 border-teal'
              : 'bg-gray-50 border-gray-200'
          }`}>
            {i < filled ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <span className="text-sm font-semibold text-gray-300">{i + 1}</span>
            )}
          </div>
        ))}
        {/* Bonus (6th) punch */}
        <div className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
          bonusUsed
            ? 'bg-yellow/20 border-league-gold'
            : bonusEarned
              ? 'bg-yellow/10 border-league-gold animate-pulse'
              : 'bg-gray-50 border-gray-200'
        }`}>
          {bonusUsed ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={bonusEarned ? '#F0A500' : '#D1D5DB'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          )}
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-charcoal-light">Rounds 1-5</p>
        <p className={`text-[10px] font-semibold ${bonusEarned ? 'text-league-gold' : 'text-charcoal-light'}`}>FREE!</p>
      </div>

      {bonusEarned && !bonusUsed && (
        <div className="mt-3 p-3 bg-yellow/20 border-2 border-yellow rounded-lg text-center">
          <p className="text-sm font-semibold text-league-gold">You earned a FREE round!</p>
          <p className="text-xs text-charcoal-light mt-0.5">Register for your next event — it&apos;s on us.</p>
        </div>
      )}
      {bonusUsed && (
        <div className="mt-3 p-3 bg-teal/10 rounded-lg text-center">
          <p className="text-sm font-semibold text-teal">Punch card complete!</p>
          <p className="text-xs text-charcoal-light mt-0.5">All 6 rounds used. Ask about getting a new card!</p>
        </div>
      )}
    </div>
  )
}

function ProfileSection({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [level, setLevel] = useState(profile?.level || 'beginner')
  const [newsletter, setNewsletter] = useState(profile?.newsletter || false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setPhone(profile.phone || '')
      setLevel(profile.level || 'beginner')
      setNewsletter(profile.newsletter || false)
    }
  }, [profile])

  async function handleSave() {
    setSaving(true)
    await onUpdate({ name, phone, level, newsletter })
    setSaving(false)
    setEditing(false)
  }

  const levelInfo = LEVELS.find(l => l.value === (profile?.level || 'beginner'))

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-charcoal">Your Profile</h3>
          <button onClick={() => setEditing(true)}
            className="text-sm text-teal font-semibold bg-transparent border-none cursor-pointer hover:text-teal-dark">
            Edit
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-charcoal-light uppercase tracking-wide font-semibold">Name</p>
            <p className="text-sm text-charcoal font-semibold">{profile?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-light uppercase tracking-wide font-semibold">Email</p>
            <p className="text-sm text-charcoal">{profile?.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-light uppercase tracking-wide font-semibold">Phone</p>
            <p className="text-sm text-charcoal">{profile?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-light uppercase tracking-wide font-semibold">Skill Level</p>
            <p className="text-sm text-charcoal font-semibold">{levelInfo?.label || 'Beginner'}</p>
            <p className="text-xs text-charcoal-light">{levelInfo?.desc}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-light uppercase tracking-wide font-semibold">Newsletter</p>
            <p className="text-sm text-charcoal">{profile?.newsletter ? 'Subscribed' : 'Not subscribed'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-heading text-lg text-charcoal mb-4">Edit Profile</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Skill Level</label>
          <div className="space-y-2">
            {LEVELS.map(l => (
              <label key={l.value}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  level === l.value ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input type="radio" name="level" value={l.value} checked={level === l.value}
                  onChange={e => setLevel(e.target.value)} className="mt-0.5 accent-[#4ECDC4]" />
                <div>
                  <p className="text-sm font-semibold text-charcoal">{l.label}</p>
                  <p className="text-xs text-charcoal-light">{l.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
            <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)}
              className="w-4 h-4 accent-[#4ECDC4]" />
            <div>
              <p className="text-sm font-semibold text-charcoal">Subscribe to newsletter</p>
              <p className="text-xs text-charcoal-light">Get updates about events, specials, and more</p>
            </div>
          </label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={() => setEditing(false)}
          className="px-4 py-2.5 bg-gray-100 text-charcoal font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border-none text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}

function parseEventDate(dateStr) {
  if (!dateStr) return null
  const [month, day, year] = dateStr.split('/')
  return new Date(year, month - 1, day)
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function MiniCalendar({ enrichedRegs }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const { firstDay, daysInMonth } = getMonthDays(year, month)

  const eventsByDay = useMemo(() => {
    const map = {}
    enrichedRegs.forEach(reg => {
      const d = parseEventDate(reg.event['Date'])
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(reg)
      }
    })
    return map
  }, [enrichedRegs, year, month])

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer bg-transparent border-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D3436" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h4 className="font-heading text-sm text-charcoal">{monthName}</h4>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer bg-transparent border-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D3436" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-charcoal-light mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayRegs = eventsByDay[day] || []
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
          const hasEvent = dayRegs.length > 0

          return (
            <div key={day} className={`aspect-square rounded-md flex flex-col items-center justify-center relative ${
              isToday ? 'bg-teal/10' : hasEvent ? 'bg-teal/5' : ''
            }`} title={dayRegs.map(r => r.event['Event Name']).join(', ')}>
              <span className={`text-[11px] font-semibold ${isToday ? 'text-teal' : hasEvent ? 'text-charcoal' : 'text-charcoal-light'}`}>{day}</span>
              {hasEvent && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayRegs.slice(0, 3).map((r, j) => (
                    <div key={j} className={`w-1.5 h-1.5 rounded-full ${r.paid ? 'bg-teal' : 'bg-yellow'}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-teal" />
          <span className="text-[10px] text-charcoal-light">Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow" />
          <span className="text-[10px] text-charcoal-light">Payment pending</span>
        </div>
      </div>
    </div>
  )
}

function MyEventsSection({ user, profile }) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventsView, setEventsView] = useState('list')
  const { allEvents } = useEvents()

  useEffect(() => {
    if (!user) return
    getUserRegistrations(user.uid, profile?.name).then(regs => {
      setRegistrations(regs)
      setLoading(false)
    })
  }, [user, profile?.name])

  // Match registrations to event data
  const enrichedRegs = registrations.map(reg => {
    const event = allEvents?.find(e => {
      const eid = `${e['Event Name']}_${e['Date']}_${e['Time']}`.replace(/[^a-zA-Z0-9_-]/g, '_')
      return eid === reg.eventId
    })
    return { ...reg, event }
  }).filter(r => r.event)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-heading text-lg text-charcoal mb-4">My Events</h3>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg skeleton-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-charcoal">My Events</h3>
        {enrichedRegs.length > 0 && (
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setEventsView('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors ${
                eventsView === 'list' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal-light bg-transparent'
              }`}>
              List
            </button>
            <button onClick={() => setEventsView('calendar')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors ${
                eventsView === 'calendar' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal-light bg-transparent'
              }`}>
              Calendar
            </button>
          </div>
        )}
      </div>
      {enrichedRegs.length === 0 ? (
        <div className="text-center py-6">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <p className="text-sm text-charcoal-light">You haven&apos;t registered for any events yet.</p>
          <Link to="/events" className="inline-block mt-3 text-sm text-teal font-semibold hover:text-teal-dark no-underline">
            Browse Events &rarr;
          </Link>
        </div>
      ) : eventsView === 'calendar' ? (
        <MiniCalendar enrichedRegs={enrichedRegs} />
      ) : (
        <div className="space-y-3">
          {enrichedRegs.map((reg, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                reg.paid ? 'bg-teal/10' : 'bg-yellow/20'
              }`}>
                {reg.paid ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-charcoal">{reg.event['Event Name']}</p>
                <p className="text-xs text-charcoal-light">{reg.event['Date']} &bull; {reg.event['Time']}</p>
                <p className="text-xs text-charcoal-light">{reg.event['Venue']}</p>
                <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  reg.paid ? 'bg-teal/10 text-teal' : 'bg-yellow/20 text-league-gold'
                }`}>
                  {reg.paid ? 'Confirmed' : 'Payment pending'}
                </span>
                {reg.level && (
                  <span className="inline-block mt-1 ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-charcoal-light">
                    {reg.level}
                  </span>
                )}
              </div>
            </div>
          ))}
          <Link to="/events" className="block text-center text-sm text-teal font-semibold hover:text-teal-dark no-underline pt-1">
            View All Events &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}

function getPaymentUrl(label, value) {
  if (label === 'Venmo') return `https://venmo.com/${value.replace('@', '')}`
  if (label === 'PayPal') return `https://www.paypal.biz/${value}`
  if (label === 'Zelle') return 'https://www.zellepay.com/how-it-works'
  return null
}

function PaymentLink({ label, value, color, icon, hint }) {
  const url = getPaymentUrl(label, value)

  const content = (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${url ? 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200 cursor-pointer' : 'bg-gray-50'}`}>
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-charcoal">{label}</p>
          {url && <span className="text-[10px] font-semibold text-teal bg-teal/10 px-1.5 py-0.5 rounded">Tap to pay</span>}
        </div>
        <p className="text-xs text-charcoal-light truncate">{value}</p>
        {hint && <p className="text-[10px] text-charcoal-light/60 mt-0.5" dangerouslySetInnerHTML={{ __html: hint }} />}
      </div>
      {url && (
        <svg className="w-4 h-4 text-teal ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
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

function BuyPunchCardSection({ profile, onUpdate }) {
  // Show if user has no punch card, or card is fully used up (all 6 rounds)
  const punches = profile?.punchCardPunches || 0
  const hasActiveCard = profile?.hasPunchCard && punches <= 5
  if (hasActiveCard) return null

  const alreadyRequested = profile?.punchCardRequested
  const [requesting, setRequesting] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  async function handleRequest() {
    setRequesting(true)
    await onUpdate({
      punchCardRequested: true,
      punchCardRequestedAt: Date.now(),
    })
    setRequesting(false)
    setShowPayment(true)
  }

  return (
    <div className="bg-gradient-to-br from-yellow/10 to-league-gold/5 rounded-2xl shadow-sm border border-yellow/30 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-yellow/30 rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
        </div>
        <div>
          <h3 className="font-heading text-lg text-charcoal">{punches > 5 ? 'Get Another Punch Card' : 'Get a Punch Card'}</h3>
          <p className="text-sm text-charcoal-light">5 rounds for $75 &bull; 6th round FREE</p>
        </div>
      </div>
      <p className="text-sm text-charcoal-light mb-4">
        Save money with a punch card! Pay $75 upfront for 5 rounds of play, and your 6th round is on us.
        That&apos;s just $12.50 per round.
      </p>

      {alreadyRequested && !showPayment ? (
        <div className="p-4 bg-yellow/20 border-2 border-yellow rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            <p className="text-sm font-bold text-league-gold">Request Sent!</p>
          </div>
          <p className="text-xs text-charcoal-light">We&apos;ve been notified. Send payment below and your card will be activated shortly.</p>
          <button onClick={() => setShowPayment(true)}
            className="mt-2 px-4 py-2 bg-league-gold text-white font-semibold rounded-lg text-sm hover:bg-yellow-600 transition-colors cursor-pointer border-none">
            Show Payment Details
          </button>
        </div>
      ) : !alreadyRequested && !showPayment ? (
        <button onClick={handleRequest} disabled={requesting}
          className="w-full py-3 px-4 bg-league-gold text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors cursor-pointer border-none text-sm disabled:opacity-50 shadow-md">
          {requesting ? 'Sending Request...' : 'I Want a Punch Card! — $75'}
        </button>
      ) : null}

      {showPayment && (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-charcoal uppercase tracking-wide">Send $75 to:</p>
            <PaymentLink label="Venmo" value={CONTACT.venmo} color="bg-[#3D95CE]" icon="V" />
            <PaymentLink label="PayPal" value={CONTACT.paypal} color="bg-[#0070BA]" icon="P" />
            <PaymentLink label="Zelle" value={CONTACT.zelle} color="bg-[#6D1ED4]" icon="Z" hint="Open your bank app or Zelle &rarr; Send &rarr; enter email above" />
          </div>
          <div className="p-3 bg-yellow/20 border-2 border-yellow rounded-lg">
            <p className="text-xs font-bold text-charcoal uppercase tracking-wide mb-0.5">Include in your memo:</p>
            <p className="text-sm font-semibold text-charcoal">Punch Card &mdash; {profile?.name || 'Your Name'}</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-charcoal-light/60 mt-3 text-center">
        Once we confirm your payment, we&apos;ll activate your punch card. You&apos;ll see it appear on this page!
      </p>
    </div>
  )
}

function AnnouncementsSection({ profile }) {
  const [announcements, setAnnouncements] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mahj918_dismissed_nl') || '[]') } catch { return [] }
  })

  useEffect(() => {
    if (!profile?.newsletter || !isFirebaseReady() || !db) return
    const unsub = onSnapshot(collection(db, 'newsletters'), (snapshot) => {
      const items = []
      snapshot.forEach(d => items.push({ _id: d.id, ...d.data() }))
      items.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0))
      setAnnouncements(items)
    }, () => {})
    return unsub
  }, [profile?.newsletter])

  const visible = announcements.filter(a => !dismissed.includes(a._id)).slice(0, 3)
  if (!profile?.newsletter || visible.length === 0) return null

  function dismiss(id) {
    const updated = [...dismissed, id]
    setDismissed(updated)
    localStorage.setItem('mahj918_dismissed_nl', JSON.stringify(updated))
  }

  return (
    <div className="space-y-3">
      {visible.map(a => (
        <div key={a._id} className="bg-teal/5 rounded-2xl border border-teal/20 p-5 relative">
          <button onClick={() => dismiss(a._id)}
            className="absolute top-3 right-3 p-1 rounded hover:bg-gray-200 transition-colors cursor-pointer border-none bg-transparent text-charcoal-light"
            title="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            <p className="text-xs font-bold text-teal uppercase tracking-wide">Newsletter</p>
            <span className="text-[10px] text-charcoal-light/60">{new Date(a.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <h4 className="font-heading text-base text-charcoal mb-1">{a.subject}</h4>
          <p className="text-sm text-charcoal-light whitespace-pre-wrap">{a.body}</p>
        </div>
      ))}
    </div>
  )
}

function Dashboard() {
  const { user, profile, logout, updateUserProfile } = useAuth()

  return (
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-charcoal">
            Hey, {profile?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-charcoal-light text-sm mt-1">Manage your account and see your events</p>
        </div>
        <button onClick={logout}
          className="px-4 py-2 text-sm font-semibold text-charcoal-light bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border-none">
          Sign Out
        </button>
      </div>

      <div className="space-y-6">
        <AnnouncementsSection profile={profile} />
        <ProfileSection profile={profile} onUpdate={updateUserProfile} />
        <PunchCardDisplay profile={profile} onUpdate={updateUserProfile} />
        <BuyPunchCardSection profile={profile} onUpdate={updateUserProfile} />
        <MyEventsSection user={user} profile={profile} />
      </div>
    </div>
  )
}

export default function Account() {
  const { isLoggedIn, loading } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-32 pb-16 text-center">
        <div className="w-10 h-10 border-3 border-teal border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
        <p className="text-sm text-charcoal-light">Loading...</p>
      </div>
    )
  }

  if (isLoggedIn) {
    return <Dashboard />
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-28 pb-16">
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl text-charcoal mb-2">
          {mode === 'login' ? 'Welcome Back!' : 'Join Mahj918'}
        </h1>
        <p className="text-charcoal-light text-sm">
          {mode === 'login'
            ? 'Sign in to see your events and manage your account'
            : 'Create an account to register for events, track your punch card, and more'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitch={() => setMode('login')} />
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-charcoal-light/70">
          You can still register for events without an account. Having an account lets you track your registrations, punch card, and newsletter preferences.
        </p>
      </div>
    </div>
  )
}
