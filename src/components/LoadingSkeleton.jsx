export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-gray-200 skeleton-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-gray-200 rounded skeleton-pulse w-1/4" />
            <div className="h-6 bg-gray-200 rounded skeleton-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded skeleton-pulse w-1/2" />
            <div className="h-4 bg-gray-200 rounded skeleton-pulse w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TestimonialSkeleton() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-4">
      <div className="h-6 bg-gray-200 rounded skeleton-pulse w-3/4 mx-auto" />
      <div className="h-6 bg-gray-200 rounded skeleton-pulse w-1/2 mx-auto" />
      <div className="h-4 bg-gray-200 rounded skeleton-pulse w-1/4 mx-auto mt-4" />
    </div>
  )
}

export function ErrorFallback({ message }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-coral/10 rounded-full mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p className="text-charcoal-light text-lg mb-2">{message || 'Something went wrong loading this content.'}</p>
      <p className="text-charcoal-light/70 text-sm">
        Check back soon or visit us on{' '}
        <a href="https://www.instagram.com/mahj.918/" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
          Instagram @mahj.918
        </a>
      </p>
    </div>
  )
}
