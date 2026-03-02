import { Link } from 'react-router-dom'

const STATS = [
  { number: '500+', label: 'Students Taught' },
  { number: '200+', label: 'Events Hosted' },
  { number: '4.9', label: 'Average Rating' },
  { number: '1', label: 'Amazing City' },
]

const TEAM = [
  {
    name: 'Candace',
    role: 'Co-Founder & Instructor',
    bio: 'Candace fell in love with mahjong and knew she had to share it with everyone in Tulsa. A natural teacher with infectious energy, she makes every class feel like a party.',
    color: 'bg-coral',
  },
  {
    name: 'Nicolle',
    role: 'Co-Founder & Instructor',
    bio: 'Nicolle brings the strategy and the laughs. With a gift for making complex things simple, she\'ll have you reading the card and making mahj in no time.',
    color: 'bg-teal',
  },
]

export default function About() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl text-charcoal mb-4">About Mahj918</h1>
          <p className="text-charcoal-light text-lg max-w-2xl mx-auto">
            We&apos;re on a mission to make American Mahjong the most fun social activity in Tulsa.
            One tile at a time!
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
            <h2 className="font-heading text-3xl text-charcoal mb-6 text-center">Our Story</h2>
            <div className="space-y-4 text-charcoal-light leading-relaxed">
              <p>
                It started with a simple question: <em>&ldquo;Want to learn how to play Mahjong?&rdquo;</em>
              </p>
              <p>
                What began as casual games between friends quickly became something bigger. Candace and Nicolle
                realized there was a huge appetite in Tulsa for American Mahjong — people were curious, excited,
                and looking for a fun new way to connect. So they decided to make it happen.
              </p>
              <p>
                Mahj918 was born from a love of the game and a passion for community. The &ldquo;918&rdquo; is Tulsa&apos;s
                area code, and it&apos;s a reminder that everything we do is rooted right here in our amazing city.
                From brewery taprooms to library community rooms, we bring the tiles, the laughs, and the lessons
                to wherever the fun is happening.
              </p>
              <p>
                Whether you&apos;re picking up tiles for the first time or you&apos;ve been playing for years,
                we believe there&apos;s always room for one more at the table. That&apos;s the Mahj918 way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="px-4 mb-16 bg-teal-light/30 py-16 tile-pattern">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal text-center mb-12">Meet the Team</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TEAM.map((person) => (
              <div key={person.name} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Photo placeholder */}
                <div className={`${person.color} h-48 flex items-center justify-center`}>
                  <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="font-heading text-4xl text-white">{person.name[0]}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-xl text-charcoal">{person.name}</h3>
                  <p className="text-sm text-teal-dark font-semibold mb-3">{person.role}</p>
                  <p className="text-charcoal-light text-sm leading-relaxed">{person.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl text-charcoal mb-6">Our Mission</h2>
          <div className="bg-gradient-to-r from-teal to-teal-dark rounded-2xl p-8 md:p-12 text-white">
            <p className="text-xl md:text-2xl font-heading leading-relaxed">
              Making mahjong social, fun, and welcoming for everyone.
            </p>
            <p className="text-white/80 mt-4 max-w-xl mx-auto">
              We believe the best things in life happen around a table with good company.
              Mahjong is our way of bringing people together.
            </p>
          </div>
        </div>
      </section>

      {/* Fun Stats */}
      <section className="px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="font-heading text-3xl md:text-4xl text-teal mb-1">{stat.number}</p>
                <p className="text-sm text-charcoal-light font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl text-charcoal mb-4">Come Play With Us!</h2>
          <p className="text-charcoal-light mb-6">
            Ready to join the Mahj918 community? Check out our events or get in touch!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/events"
              className="inline-block px-8 py-3 bg-teal text-white font-semibold rounded-full hover:bg-teal-dark transition-colors no-underline"
            >
              View Events
            </Link>
            <Link
              to="/contact"
              className="inline-block px-8 py-3 bg-coral text-white font-semibold rounded-full hover:bg-coral-dark transition-colors no-underline"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
