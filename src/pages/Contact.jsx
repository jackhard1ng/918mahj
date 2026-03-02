import { useState } from 'react'
import { CONTACT, FORMSPREE_URL } from '../config'

const EVENT_TYPES = ['General Inquiry', 'Private Event', 'Corporate Event', 'Lesson', 'Set Rental', 'Other']

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', type: 'General Inquiry', message: '' })
  const [status, setStatus] = useState(null) // 'sending' | 'sent' | 'error'

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')

    if (FORMSPREE_URL) {
      try {
        const res = await fetch(FORMSPREE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          setStatus('sent')
          setForm({ name: '', email: '', type: 'General Inquiry', message: '' })
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    } else {
      // Mailto fallback
      const subject = encodeURIComponent(`[Mahj918] ${form.type} from ${form.name}`)
      const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nType: ${form.type}\n\n${form.message}`)
      window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`
      setStatus('sent')
    }
  }

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl text-charcoal mb-3">Contact Us</h1>
          <p className="text-charcoal-light text-lg max-w-2xl mx-auto">
            Have a question, want to book a private event, or just want to say hi? We&apos;d love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="font-heading text-2xl text-charcoal mb-6">Send Us a Message</h2>

            {status === 'sent' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="font-heading text-xl text-charcoal mb-2">Message Sent!</h3>
                <p className="text-charcoal-light">We&apos;ll get back to you soon. Thanks for reaching out!</p>
                <button
                  onClick={() => setStatus(null)}
                  className="mt-4 px-6 py-2 bg-teal text-white rounded-full font-semibold cursor-pointer border-none hover:bg-teal-dark transition-colors"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-charcoal mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 text-charcoal"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 text-charcoal"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-semibold text-charcoal mb-1">What&apos;s this about?</label>
                  <select
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 text-charcoal bg-white"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-charcoal mb-1">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 text-charcoal resize-vertical"
                    placeholder="Tell us what you have in mind..."
                  />
                </div>

                {status === 'error' && (
                  <p className="text-coral text-sm">Something went wrong. Please try again or email us directly.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-3 bg-teal text-white font-semibold rounded-lg hover:bg-teal-dark transition-colors cursor-pointer border-none text-base disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Direct Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-heading text-xl text-charcoal mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 text-charcoal no-underline hover:text-teal transition-colors">
                  <span className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 4L12 13 2 4" />
                    </svg>
                  </span>
                  <span className="text-sm">{CONTACT.email}</span>
                </a>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-heading text-xl text-charcoal mb-4">Follow Us</h3>
              <div className="space-y-3">
                {[
                  { label: 'Instagram', handle: '@mahj.918', href: CONTACT.instagram, color: 'bg-pink-100' },
                  { label: 'Facebook', handle: 'Mahj.918', href: CONTACT.facebook, color: 'bg-blue-100' },
                  { label: 'TikTok', handle: '@mahj.918', href: CONTACT.tiktok, color: 'bg-gray-100' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors no-underline"
                  >
                    <span className={`w-10 h-10 ${social.color} rounded-lg flex items-center justify-center font-bold text-charcoal text-sm`}>
                      {social.label[0]}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-charcoal">{social.label}</p>
                      <p className="text-charcoal-light text-xs">{social.handle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Private Events CTA */}
            <div className="bg-gradient-to-r from-coral to-coral-dark rounded-2xl p-6 text-white">
              <h3 className="font-heading text-xl mb-3">Book a Private Event</h3>
              <p className="text-white/80 text-sm mb-4">
                Corporate team building, bridal showers, birthday parties, girls&apos; night out — we bring the fun to you!
                Custom packages available for groups of any size.
              </p>
              <a
                href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('[Mahj918] Private Event Inquiry')}`}
                className="inline-block px-6 py-2.5 bg-white text-coral-dark font-semibold rounded-full hover:bg-yellow transition-colors no-underline text-sm"
              >
                Inquire Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
