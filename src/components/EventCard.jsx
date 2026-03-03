import { useState, useEffect } from 'react'
import { EVENT_COLORS } from '../config'
import RegistrationModal from './RegistrationModal'
import { isFirebaseReady, fetchAttendees, subscribeToAttendees, getEventId } from '../services/db'
import { useAuth } from '../contexts/AuthContext'

const ATTENDEE_STORAGE_KEY = 'mahj918_admin_attendees'

function getRegisteredCountLocal(event) {
  try {
    const stored = localStorage.getItem(ATTENDEE_STORAGE_KEY)
    const all = stored ? JSON.parse(stored) : {}
    const id = getEventId(event)
    return (all[id] || []).length
  } catch {
    return 0
  }
}

function DefaultEventImage({ eventType }) {
  const themes = {
    'Open Play': { bg: 'bg-teal', pattern: 'Teal mahjong tiles', emoji: 'open-play' },
    'Birdy Basics': { bg: 'bg-coral', pattern: 'Learning session', emoji: 'birdy' },
    'League': { bg: 'bg-league-gold', pattern: 'League play', emoji: 'league' },
    'Special Event': { bg: 'bg-special-purple', pattern: 'Special event', emoji: 'special' },
  }
  const theme = themes[eventType] || themes['Open Play']

  const tiles = {
    'open-play': (
      <g>
        {/* Mahjong tiles pattern */}
        <rect x="50" y="40" width="30" height="40" rx="4" fill="white" opacity="0.3" />
        <rect x="90" y="50" width="30" height="40" rx="4" fill="white" opacity="0.2" />
        <rect x="130" y="35" width="30" height="40" rx="4" fill="white" opacity="0.25" />
        <rect x="170" y="45" width="30" height="40" rx="4" fill="white" opacity="0.15" />
        <text x="150" y="110" textAnchor="middle" fill="white" fontSize="18" fontFamily="'Lilita One', cursive" opacity="0.9">Open Play</text>
      </g>
    ),
    'birdy': (
      <g>
        {/* Bird silhouette */}
        <circle cx="150" cy="55" r="25" fill="white" opacity="0.25" />
        <ellipse cx="155" cy="75" rx="15" ry="8" fill="white" opacity="0.2" />
        <text x="150" y="110" textAnchor="middle" fill="white" fontSize="18" fontFamily="'Lilita One', cursive" opacity="0.9">Birdy Basics</text>
      </g>
    ),
    'league': (
      <g>
        {/* Trophy */}
        <rect x="130" y="30" width="40" height="35" rx="5" fill="white" opacity="0.3" />
        <rect x="140" y="65" width="20" height="10" fill="white" opacity="0.25" />
        <rect x="130" y="75" width="40" height="5" rx="2" fill="white" opacity="0.2" />
        <text x="150" y="110" textAnchor="middle" fill="white" fontSize="18" fontFamily="'Lilita One', cursive" opacity="0.9">League Night</text>
      </g>
    ),
    'special': (
      <g>
        {/* Party elements */}
        <circle cx="100" cy="45" r="8" fill="white" opacity="0.2" />
        <circle cx="200" cy="50" r="6" fill="white" opacity="0.15" />
        <circle cx="150" cy="35" r="10" fill="white" opacity="0.25" />
        <text x="150" y="110" textAnchor="middle" fill="white" fontSize="18" fontFamily="'Lilita One', cursive" opacity="0.9">Special Event</text>
      </g>
    ),
  }

  return (
    <div className={`${theme.bg} h-48 flex items-center justify-center relative overflow-hidden`}>
      <svg viewBox="0 0 300 130" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {tiles[theme.emoji]}
      </svg>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [month, day, year] = dateStr.split('/')
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function EventCard({ event, compact = false }) {
  const [showRegistration, setShowRegistration] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [registered, setRegistered] = useState(0)
  const { user, profile } = useAuth() || {}
  const colors = EVENT_COLORS[event['Event Type']] || EVENT_COLORS['Open Play']
  const hasImage = event['Image URL'] && event['Image URL'].trim()
  const isFree = /free/i.test(event['Price'] || '')
  const maxSpots = parseInt(event['Max Spots']) || 0
  const spotsLeft = maxSpots > 0 ? maxSpots - registered : 0

  // Real-time attendee count (updates when anyone registers from any device)
  useEffect(() => {
    const id = getEventId(event)
    // Start with localStorage
    setRegistered(getRegisteredCountLocal(event))

    if (!isFirebaseReady()) return

    // Subscribe to real-time updates from Firestore
    const unsub = subscribeToAttendees((docs) => {
      const match = docs.find(d => d._id === id)
      setRegistered(match?.list?.length || 0)
    })
    return unsub
  }, [event['Event Name'], event['Date'], event['Time']])

  const handleRegister = () => {
    setShowRegistration(true)
  }

  const handleCloseRegistration = () => {
    setShowRegistration(false)
    // Real-time listener handles the count update automatically
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow ${colors.bg}`}>
        <div className="flex items-start gap-3">
          <div className="text-center shrink-0">
            <p className="text-xs font-semibold text-charcoal-light uppercase">{formatDate(event['Date']).split(',')[0]}</p>
            <p className="text-2xl font-heading text-charcoal">{event['Date']?.split('/')[1]}</p>
          </div>
          <div className="min-w-0">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge} mb-1`}>
              {event['Event Type']}
            </span>
            <h3 className="font-heading text-base text-charcoal truncate">{event['Event Name']}</h3>
            <p className="text-sm text-charcoal-light">{event['Time']} &bull; {event['Venue']}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
        {hasImage ? (
          <img src={event['Image URL']} alt={event['Event Name']} className="h-48 w-full object-cover" loading="lazy" />
        ) : (
          <DefaultEventImage eventType={event['Event Type']} />
        )}

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
              {event['Event Type']}
            </span>
            <span className="text-sm font-semibold text-coral">{event['Price']}</span>
          </div>

          <h3 className="font-heading text-lg text-charcoal mb-1">{event['Event Name']}</h3>

          <div className="space-y-1 mb-3 text-sm text-charcoal-light">
            <p className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              {formatDate(event['Date'])} &bull; {event['Time']}
            </p>
            <p className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {event['Venue']}
            </p>
            {event['Address'] && (
              <p className="text-xs text-charcoal-light/70 ml-5">{event['Address']}</p>
            )}
          </div>

          {event['Description'] && (
            <div className="mb-4">
              <p className={`text-sm text-charcoal-light ${expanded ? '' : 'line-clamp-2'}`}>{event['Description']}</p>
              {event['Description'].length > 100 && (
                <button onClick={() => setExpanded(!expanded)}
                  className="text-xs text-teal font-semibold mt-1 bg-transparent border-none cursor-pointer p-0 hover:text-teal-dark">
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {maxSpots > 0 ? (
            <p className={`text-xs mb-3 ${spotsLeft <= 3 && spotsLeft > 0 ? 'text-coral font-semibold' : spotsLeft === 0 ? 'text-coral font-semibold' : 'text-charcoal-light'}`}>
              {spotsLeft > 0 ? (
                <><span className="font-semibold">{spotsLeft}</span> of {maxSpots} spots left</>
              ) : (
                'Event is full'
              )}
            </p>
          ) : registered > 0 ? (
            <p className="text-xs mb-3 text-teal font-semibold">
              {registered} {registered === 1 ? 'person' : 'people'} joined
            </p>
          ) : null}

          <div className="mt-auto">
            <button
              onClick={handleRegister}
              className="w-full py-2.5 px-4 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-sm"
            >
              {isFree ? 'Sign Up \u2014 Free' : 'Register'}
            </button>
          </div>
        </div>
      </div>

      {showRegistration && <RegistrationModal event={event} onClose={handleCloseRegistration} currentUser={user ? { uid: user.uid, ...profile } : null} />}
    </>
  )
}
