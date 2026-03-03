import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserRegistrations } from '../services/db'
import { useEvents } from '../hooks/useSiteData'

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
  if (!profile?.hasPunchCard) return null

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

function MyEventsSection({ user, profile }) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
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
      <h3 className="font-heading text-lg text-charcoal mb-4">My Events</h3>
      {enrichedRegs.length === 0 ? (
        <div className="text-center py-6">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <p className="text-sm text-charcoal-light">You haven&apos;t registered for any events yet.</p>
          <a href="/events" className="inline-block mt-3 text-sm text-teal font-semibold hover:text-teal-dark no-underline">
            Browse Events &rarr;
          </a>
        </div>
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
        </div>
      )}
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
        <ProfileSection profile={profile} onUpdate={updateUserProfile} />
        <PunchCardDisplay profile={profile} onUpdate={updateUserProfile} />
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
