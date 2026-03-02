import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
  { to: '/learn', label: 'Learn to Play' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md py-2' : 'bg-white py-4'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className={`font-heading text-teal transition-all duration-300 ${scrolled ? 'text-2xl' : 'text-3xl'}`}>
            MAHJ
          </span>
          <span className="flex gap-0.5">
            {['9', '1', '8'].map((n) => (
              <span
                key={n}
                className={`inline-flex items-center justify-center bg-coral text-white font-heading rounded transition-all duration-300 ${
                  scrolled ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'
                }`}
              >
                {n}
              </span>
            ))}
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`px-3 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${
                  location.pathname === to
                    ? 'bg-teal/10 text-teal-dark'
                    : 'text-charcoal hover:bg-teal/5 hover:text-teal-dark'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 bg-transparent border-none cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={`block w-6 h-0.5 bg-charcoal transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-charcoal transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-charcoal transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div className="fixed inset-0 top-0 bg-black/30 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
        )}

        {/* Mobile slide-in menu */}
        <div
          className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex justify-end p-4">
            <button
              className="p-2 bg-transparent border-none cursor-pointer text-charcoal"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="flex flex-col gap-1 px-4 list-none m-0">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`block px-4 py-3 rounded-lg text-lg font-semibold no-underline transition-colors ${
                    location.pathname === to
                      ? 'bg-teal/10 text-teal-dark'
                      : 'text-charcoal hover:bg-teal/5'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
