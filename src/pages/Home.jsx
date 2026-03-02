import { Link } from 'react-router-dom'
import { useEvents, useTestimonials, useGallery } from '../hooks/useSiteData'
import { CONTACT } from '../config'
import EventCard from '../components/EventCard'
import TestimonialCarousel from '../components/TestimonialCarousel'
import PhotoGallery from '../components/PhotoGallery'
import { CardSkeleton, TestimonialSkeleton, ErrorFallback } from '../components/LoadingSkeleton'

const OFFERINGS = [
  {
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" className="mx-auto">
        <circle cx="24" cy="18" r="10" fill="#FF6B6B" opacity="0.2" />
        <circle cx="24" cy="18" r="6" fill="#FF6B6B" />
        <path d="M16 30 c0-4 4-6 8-6s8 2 8 6" fill="#FF6B6B" opacity="0.3" />
        <ellipse cx="28" cy="14" rx="3" ry="2" fill="white" opacity="0.5" />
      </svg>
    ),
    title: 'Birdy Basics',
    desc: 'Learn to play American Mahjong in a fun, beginner-friendly class.',
    link: '/learn',
    color: 'border-coral',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" className="mx-auto">
        <rect x="8" y="8" width="14" height="18" rx="3" fill="#4ECDC4" opacity="0.3" />
        <rect x="26" y="12" width="14" height="18" rx="3" fill="#4ECDC4" opacity="0.5" />
        <rect x="16" y="22" width="14" height="18" rx="3" fill="#4ECDC4" />
      </svg>
    ),
    title: 'Open Play',
    desc: 'Casual play for all skill levels. Bring friends or come solo!',
    link: '/events',
    color: 'border-teal',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" className="mx-auto">
        <rect x="14" y="10" width="20" height="18" rx="3" fill="#F0A500" opacity="0.3" />
        <rect x="18" y="28" width="12" height="4" fill="#F0A500" opacity="0.5" />
        <rect x="14" y="32" width="20" height="3" rx="1" fill="#F0A500" />
        <circle cx="24" cy="19" r="4" fill="#F0A500" opacity="0.7" />
      </svg>
    ),
    title: 'Leagues',
    desc: 'Competitive league play for experienced players. Join the Frequent Flyers!',
    link: '/events',
    color: 'border-league-gold',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" className="mx-auto">
        <circle cx="16" cy="16" r="5" fill="#A66CFF" opacity="0.3" />
        <circle cx="32" cy="14" r="4" fill="#A66CFF" opacity="0.2" />
        <circle cx="24" cy="28" r="8" fill="#A66CFF" opacity="0.4" />
        <path d="M20 24 l4-6 4 6" fill="#A66CFF" opacity="0.6" />
      </svg>
    ),
    title: 'Private Events',
    desc: 'Corporate events, parties, bridal showers & girls\' night out.',
    link: '/contact',
    color: 'border-special-purple',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" className="mx-auto">
        <rect x="10" y="14" width="28" height="22" rx="4" fill="#FFE66D" opacity="0.4" />
        <rect x="14" y="18" width="10" height="14" rx="2" fill="#F0A500" opacity="0.5" />
        <rect x="28" y="18" width="6" height="6" rx="1" fill="#F0A500" opacity="0.4" />
        <path d="M20 8 l4-4 4 4" stroke="#F0A500" strokeWidth="2" fill="none" opacity="0.5" />
      </svg>
    ),
    title: 'Set Rentals',
    desc: 'Rent a mahjong set for your next event or gathering.',
    link: '/contact',
    color: 'border-yellow',
  },
]

export default function Home() {
  const { events, loading: eventsLoading, error: eventsError } = useEvents()
  const { testimonials, loading: testLoading } = useTestimonials()
  const { photos } = useGallery()
  const upcomingEvents = events.slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-light via-white to-white pt-32 pb-20 px-4 overflow-hidden tile-pattern">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="font-heading text-teal text-5xl md:text-6xl">MAHJ</span>
            <span className="flex gap-1">
              {['9', '1', '8'].map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-coral text-white font-heading text-2xl md:text-3xl rounded-lg shadow-lg"
                >
                  {n}
                </span>
              ))}
            </span>
          </div>

          <h1 className="font-heading text-3xl md:text-5xl text-charcoal mb-4 leading-tight">
            Mahjong lessons, open play
            <br className="hidden md:block" />
            <span className="text-teal"> & special events</span> in Tulsa
          </h1>

          <p className="text-lg md:text-xl text-charcoal-light mb-8 max-w-2xl mx-auto">
            Join Candace & Nicolle for the most fun you&apos;ll have with 152 tiles.
            From beginner lessons to league play, there&apos;s a seat at our table for you!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/events"
              className="inline-block px-8 py-3 bg-teal text-white font-semibold rounded-full hover:bg-teal-dark transition-all hover:shadow-lg no-underline text-lg"
            >
              See Upcoming Events
            </Link>
            <Link
              to="/learn"
              className="inline-block px-8 py-3 bg-white text-teal-dark font-semibold rounded-full border-2 border-teal hover:bg-teal/5 transition-all no-underline text-lg"
            >
              Learn to Play
            </Link>
          </div>
        </div>

        {/* Decorative tiles */}
        <div className="absolute top-10 left-10 w-16 h-20 bg-teal/5 rounded-lg rotate-12 hidden lg:block" />
        <div className="absolute bottom-20 right-10 w-14 h-18 bg-coral/5 rounded-lg -rotate-6 hidden lg:block" />
        <div className="absolute top-1/2 right-20 w-10 h-14 bg-yellow/10 rounded-lg rotate-3 hidden lg:block" />
      </section>

      {/* Offerings */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal text-center mb-3">What We Offer</h2>
          <p className="text-charcoal-light text-center mb-12 max-w-xl mx-auto">
            Whether you&apos;re a total beginner or a seasoned player, we have something for you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {OFFERINGS.map((item) => (
              <Link
                key={item.title}
                to={item.link}
                className={`group block p-6 rounded-2xl border-2 ${item.color} bg-white hover:shadow-lg transition-all duration-300 text-center no-underline hover:-translate-y-1`}
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-heading text-lg text-charcoal mb-2">{item.title}</h3>
                <p className="text-sm text-charcoal-light">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 px-4 bg-teal-light/30 tile-pattern">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl text-charcoal mb-2">Upcoming Events</h2>
              <p className="text-charcoal-light">Don&apos;t miss out on the fun!</p>
            </div>
            <Link to="/events" className="hidden sm:inline-block text-teal-dark font-semibold hover:underline no-underline">
              View all events &rarr;
            </Link>
          </div>

          {eventsLoading ? (
            <CardSkeleton count={4} />
          ) : eventsError ? (
            <ErrorFallback message="Events are loading — check back soon!" />
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-charcoal-light py-8">No upcoming events right now. Check back soon!</p>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link to="/events" className="text-teal-dark font-semibold hover:underline no-underline">
              View all events &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal text-center mb-3">What People Are Saying</h2>
          <p className="text-charcoal-light text-center mb-12">Don&apos;t take our word for it!</p>

          {testLoading ? (
            <TestimonialSkeleton />
          ) : testimonials.length > 0 ? (
            <TestimonialCarousel testimonials={testimonials} />
          ) : null}
        </div>
      </section>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <section className="py-16 px-4 bg-teal-light/30 tile-pattern">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl text-charcoal text-center mb-3">Good Times at the Table</h2>
            <p className="text-charcoal-light text-center mb-10">Snapshots from our events &mdash; come make some memories!</p>
            <PhotoGallery photos={photos} />
          </div>
        </section>
      )}

      {/* Social / CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-teal to-teal-dark text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Follow the Fun</h2>
          <p className="text-white/80 text-lg mb-8">
            Stay up to date with events, tips, and all things mahjong. Follow us @mahj.918
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-teal-dark font-semibold rounded-full hover:bg-yellow transition-colors no-underline"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Follow on Instagram
            </a>
            <Link
              to="/contact"
              className="inline-block px-8 py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-colors no-underline"
            >
              Contact Us for Private Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
