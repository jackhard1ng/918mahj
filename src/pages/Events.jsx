import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useEvents } from '../hooks/useSiteData'
import { useAuth } from '../contexts/AuthContext'
import { getUserRegistrations, getEventId } from '../services/db'
import EventCard from '../components/EventCard'
import { CardSkeleton, ErrorFallback } from '../components/LoadingSkeleton'
import { EVENT_COLORS } from '../config'

const EVENT_TYPES = ['All', 'Open Play', 'Birdy Basics', 'League', 'Special Event']

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

function CalendarView({ events, onEventClick, registeredEventIds = new Set() }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const { firstDay, daysInMonth } = getMonthDays(year, month)

  const eventsByDay = useMemo(() => {
    const map = {}
    events.forEach((e) => {
      const d = parseEventDate(e['Date'])
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(e)
      }
    })
    return map
  }, [events, year, month])

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-teal-light/30">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-teal/10 cursor-pointer bg-transparent border-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D3436" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h3 className="font-heading text-xl text-charcoal">{monthName}</h3>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-teal/10 cursor-pointer bg-transparent border-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D3436" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold text-charcoal-light py-2 border-b border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayEvents = eventsByDay[day] || []
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

          return (
            <div key={day} className={`min-h-[80px] p-1 border-b border-r border-gray-50 ${isToday ? 'bg-teal/5' : ''}`}>
              <span className={`text-xs font-semibold ${isToday ? 'text-teal bg-teal/10 rounded-full w-6 h-6 inline-flex items-center justify-center' : 'text-charcoal-light'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((e, j) => {
                  const colors = EVENT_COLORS[e['Event Type']] || EVENT_COLORS['Open Play']
                  const eid = getEventId(e)
                  const isRegistered = registeredEventIds.has(eid)
                  return (
                    <button
                      key={j}
                      onClick={() => onEventClick(e)}
                      className={`block w-full text-left text-xs px-1 py-0.5 rounded truncate cursor-pointer border-none ${colors.badge} opacity-90 hover:opacity-100 ${isRegistered ? 'ring-2 ring-offset-1 ring-teal' : ''}`}
                    >
                      {isRegistered && <svg className="inline w-3 h-3 mr-0.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                      {e['Event Name']}
                    </button>
                  )
                })}
                {dayEvents.length > 2 && (
                  <span className="text-xs text-charcoal-light">+{dayEvents.length - 2} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Events() {
  const { events, loading, error } = useEvents()
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState('list')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set())

  useEffect(() => {
    if (!user) { setRegisteredEventIds(new Set()); return }
    getUserRegistrations(user.uid, profile?.name).then(regs => {
      setRegisteredEventIds(new Set(regs.map(r => r.eventId)))
    })
  }, [user, profile?.name])

  const filterType = searchParams.get('type') || 'All'

  const setFilter = (type) => {
    if (type === 'All') {
      setSearchParams({})
    } else {
      setSearchParams({ type })
    }
  }

  const filteredEvents = useMemo(() => {
    if (filterType === 'All') return events
    return events.filter((e) => e['Event Type'] === filterType)
  }, [events, filterType])

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl text-charcoal mb-3">Events & Calendar</h1>
          <p className="text-charcoal-light text-lg max-w-2xl mx-auto">
            Find your next game night, lesson, or special event. Filter by type or browse the calendar.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((type) => {
              const isActive = filterType === type
              const colors = type !== 'All' ? EVENT_COLORS[type] : null
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer border-2 transition-all ${
                    isActive
                      ? type === 'All'
                        ? 'bg-charcoal text-white border-charcoal'
                        : `${colors?.badge} border-transparent`
                      : 'bg-white text-charcoal-light border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type !== 'All' && colors && (
                    <span className={`inline-block w-2 h-2 rounded-full ${colors.dot} mr-1.5`} />
                  )}
                  {type}
                </button>
              )
            })}
          </div>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer border-none transition-colors ${
                view === 'list' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal-light'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer border-none transition-colors ${
                view === 'calendar' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal-light'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <CardSkeleton count={6} />
        ) : error ? (
          <ErrorFallback message="Events are loading — check back soon!" />
        ) : view === 'calendar' ? (
          <>
            <CalendarView events={filteredEvents} onEventClick={setSelectedEvent} registeredEventIds={registeredEventIds} />
            {selectedEvent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div className="relative z-10 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="absolute -top-3 -right-3 z-20 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-none cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D3436" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                  <EventCard event={selectedEvent} />
                </div>
              </div>
            )}
          </>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-charcoal-light text-lg">No {filterType !== 'All' ? filterType : ''} events scheduled right now.</p>
            <p className="text-charcoal-light/70 text-sm mt-2">Check back soon or follow us on Instagram for updates!</p>
          </div>
        )}
      </div>
    </div>
  )
}
