import { Link } from 'react-router-dom'
import { useState } from 'react'

const STEPS = [
  { step: '1', title: 'Welcome & Introductions', desc: 'Meet your fellow players and get comfortable. No experience needed!' },
  { step: '2', title: 'Learn the Basics', desc: 'We walk you through tiles, racks, and the fundamental rules of American Mahjong.' },
  { step: '3', title: 'Practice Round', desc: 'Play a guided practice game with hands-on help from your instructors.' },
  { step: '4', title: 'Play for Real!', desc: 'Feeling confident? Play a real game! We\'re right there if you have questions.' },
]

const FORMATS = [
  {
    title: 'Group Classes',
    subtitle: 'Birdy Basics',
    desc: 'Join a public class at one of our Tulsa venues. Great for making new friends who love games!',
    price: 'Starting at $25/person',
    color: 'border-coral bg-coral/5',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40">
        <circle cx="16" cy="16" r="8" fill="#FF6B6B" opacity="0.3" />
        <circle cx="32" cy="16" r="8" fill="#FF6B6B" opacity="0.3" />
        <circle cx="24" cy="28" r="8" fill="#FF6B6B" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: 'Private Lessons',
    subtitle: 'One-on-One or Small Group',
    desc: 'Personalized instruction at your pace. Perfect for learning with friends or family.',
    price: 'Starting at $50/session',
    color: 'border-teal bg-teal/5',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40">
        <circle cx="24" cy="18" r="10" fill="#4ECDC4" opacity="0.3" />
        <circle cx="24" cy="18" r="5" fill="#4ECDC4" opacity="0.6" />
      </svg>
    ),
  },
  {
    title: 'Corporate & Party Events',
    subtitle: 'Team Building & Celebrations',
    desc: 'The ultimate team-building activity! We bring everything — sets, cards, instruction, and fun.',
    price: 'Custom pricing',
    color: 'border-special-purple bg-special-purple/5',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40">
        <rect x="8" y="16" width="32" height="20" rx="4" fill="#A66CFF" opacity="0.3" />
        <circle cx="24" cy="12" r="6" fill="#A66CFF" opacity="0.4" />
        <path d="M16 26 h16" stroke="#A66CFF" strokeWidth="2" opacity="0.5" />
      </svg>
    ),
  },
]

const FAQS = [
  { q: 'Do I need any experience to attend?', a: 'Absolutely not! Birdy Basics is designed for total beginners. We teach you everything from scratch.' },
  { q: 'What do I need to bring?', a: 'Just yourself and a great attitude! We provide mahjong sets, cards, and all supplies. You may want to bring a pen and a drink.' },
  { q: 'How long is a lesson?', a: 'Most Birdy Basics classes run about 2-2.5 hours. That gives us time for instruction and at least one full practice game.' },
  { q: 'Do I need my own mahjong set?', a: 'Not at all! We provide everything. If you fall in love with the game (you will!), check out our Shop page for set recommendations.' },
  { q: 'Is American Mahjong different from other types?', a: 'Yes! American Mahjong uses a different card (updated yearly by the National Mah Jongg League), joker tiles, and slightly different rules than Chinese or Japanese Mahjong.' },
  { q: 'Can I bring friends?', a: 'Please do! Mahjong is more fun with friends. Group classes typically seat 12-24 people, so there\'s room for everyone.' },
  { q: 'What age group is this for?', a: 'All ages are welcome! We\'ve taught players from their 20s to their 80s. Mahjong is truly a game for everyone.' },
]

export default function LearnToPlay() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1 bg-coral/10 text-coral-dark rounded-full text-sm font-semibold mb-4">
            Birdy Basics
          </span>
          <h1 className="font-heading text-4xl md:text-5xl text-charcoal mb-4">Learn to Play American Mahjong</h1>
          <p className="text-charcoal-light text-lg max-w-2xl mx-auto mb-8">
            American Mahjong is a tile-based game that&apos;s part strategy, part luck, and all fun.
            Played with 4 players, the goal is to collect sets of tiles to complete a winning hand.
            Think of it like gin rummy meets puzzles — with beautiful tiles!
          </p>
          <Link
            to="/events?type=Birdy+Basics"
            className="inline-block px-8 py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-all hover:shadow-lg no-underline text-lg"
          >
            Find a Birdy Basics Class
          </Link>
        </div>
      </section>

      {/* What to Expect */}
      <section className="px-4 mb-16 bg-teal-light/30 py-16 tile-pattern">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal text-center mb-12">What to Expect</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="flex gap-4 bg-white rounded-xl p-6 shadow-sm">
                <span className="shrink-0 w-10 h-10 bg-teal text-white font-heading text-lg rounded-full flex items-center justify-center">
                  {s.step}
                </span>
                <div>
                  <h3 className="font-heading text-lg text-charcoal mb-1">{s.title}</h3>
                  <p className="text-sm text-charcoal-light">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lesson Formats */}
      <section className="px-4 mb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal text-center mb-3">Lesson Formats</h2>
          <p className="text-charcoal-light text-center mb-12 max-w-xl mx-auto">
            Choose the learning style that works best for you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FORMATS.map((f) => (
              <div key={f.title} className={`rounded-2xl border-2 ${f.color} p-6 text-center`}>
                <div className="mb-4 flex justify-center">{f.icon}</div>
                <h3 className="font-heading text-xl text-charcoal mb-1">{f.title}</h3>
                <p className="text-sm text-charcoal-light font-semibold mb-3">{f.subtitle}</p>
                <p className="text-sm text-charcoal-light mb-4">{f.desc}</p>
                <p className="text-coral font-bold">{f.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 mb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal text-center mb-3">Frequently Asked Questions</h2>
          <p className="text-charcoal-light text-center mb-8">Everything you need to know before your first game.</p>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left bg-transparent border-none cursor-pointer"
                >
                  <span className="font-semibold text-charcoal pr-4">{faq.q}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#636E72"
                    strokeWidth="2"
                    className={`shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-charcoal-light text-sm">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-coral to-coral-dark rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Ready to Learn?</h2>
          <p className="text-white/80 text-lg mb-6">Find an upcoming Birdy Basics class and grab your seat!</p>
          <Link
            to="/events?type=Birdy+Basics"
            className="inline-block px-8 py-3 bg-white text-coral-dark font-semibold rounded-full hover:bg-yellow transition-colors no-underline text-lg"
          >
            Find a Class
          </Link>
        </div>
      </section>
    </div>
  )
}
