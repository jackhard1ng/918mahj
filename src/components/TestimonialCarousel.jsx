import { useState, useEffect, useCallback } from 'react'

export default function TestimonialCarousel({ testimonials }) {
  const [current, setCurrent] = useState(0)
  const count = testimonials.length

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % count)
  }, [count])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + count) % count)
  }, [count])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  if (!count) return null

  const t = testimonials[current]

  return (
    <div className="relative max-w-2xl mx-auto text-center px-8">
      <svg className="w-10 h-10 mx-auto mb-4 text-teal/30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
      </svg>

      <div className="min-h-[120px] flex items-center justify-center">
        <div key={current} className="animate-fade-in-up">
          <p className="text-lg md:text-xl text-charcoal italic leading-relaxed mb-4">
            &ldquo;{t['Quote']}&rdquo;
          </p>
          <p className="font-semibold text-teal-dark">&mdash; {t['Name']}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center hover:bg-teal/20 transition-colors cursor-pointer border-none"
          aria-label="Previous testimonial"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full border-none cursor-pointer transition-all ${
                i === current ? 'bg-teal scale-125' : 'bg-teal/30'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center hover:bg-teal/20 transition-colors cursor-pointer border-none"
          aria-label="Next testimonial"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ECDC4" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  )
}
