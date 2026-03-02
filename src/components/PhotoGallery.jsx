import { useState } from 'react'

export default function PhotoGallery({ photos }) {
  const [lightbox, setLightbox] = useState(null)

  if (!photos || photos.length === 0) return null

  // Create a varied masonry-like layout using predefined size classes
  const sizePatterns = ['col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-1 row-span-1', 'col-span-1 row-span-2', 'col-span-1 row-span-1', 'col-span-2 row-span-1']

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[160px] gap-2 md:gap-3">
        {photos.slice(0, 12).map((photo, i) => {
          const sizeClass = sizePatterns[i % sizePatterns.length]
          return (
            <div
              key={photo._id || i}
              className={`${sizeClass} relative rounded-xl overflow-hidden cursor-pointer group`}
              onClick={() => setLightbox(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption || 'Gallery photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {photo.caption && (
                    <p className="text-white text-sm font-semibold truncate">{photo.caption}</p>
                  )}
                  {photo.eventName && (
                    <p className="text-white/70 text-xs truncate">{photo.eventName}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer border-none text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div className="max-w-4xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt={lightbox.caption || ''}
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
            />
            {(lightbox.caption || lightbox.eventName) && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
                {lightbox.caption && <p className="text-white font-semibold">{lightbox.caption}</p>}
                {lightbox.eventName && <p className="text-white/70 text-sm">{lightbox.eventName}</p>}
              </div>
            )}
          </div>
          {/* Nav arrows */}
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer border-none text-white transition-colors"
                onClick={e => {
                  e.stopPropagation()
                  const idx = photos.findIndex(p => p._id === lightbox._id)
                  setLightbox(photos[(idx - 1 + photos.length) % photos.length])
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer border-none text-white transition-colors"
                onClick={e => {
                  e.stopPropagation()
                  const idx = photos.findIndex(p => p._id === lightbox._id)
                  setLightbox(photos[(idx + 1) % photos.length])
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
