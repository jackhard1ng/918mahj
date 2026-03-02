import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../hooks/useSiteData'
import ProductCard from '../components/ProductCard'
import { CardSkeleton, ErrorFallback } from '../components/LoadingSkeleton'

const CATEGORIES = ['All', 'Books & Guides', 'Sets & Tiles', 'Accessories', 'Entertaining']

export default function Shop() {
  const { products, loading, error } = useShop()
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return products
    return products.filter((p) => p['Category'] === activeCategory)
  }, [products, activeCategory])

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl text-charcoal mb-3">Birdy Buys</h1>
          <p className="text-charcoal-light text-lg max-w-2xl mx-auto">
            Our favorite mahjong sets, books, accessories, and entertaining essentials.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer border-2 transition-all ${
                activeCategory === cat
                  ? 'bg-coral text-white border-coral'
                  : 'bg-white text-charcoal-light border-gray-200 hover:border-coral/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <CardSkeleton count={6} />
        ) : error ? (
          <ErrorFallback message="Shop items are loading — check back soon!" />
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-charcoal-light py-8">No products in this category yet.</p>
        )}

        {/* Affiliate disclaimer */}
        <p className="text-xs text-charcoal-light/60 text-center mt-8">
          Some links may be affiliate links. We only recommend products we love and use ourselves!
        </p>

        {/* Set Rentals */}
        <section className="mt-16 bg-gradient-to-r from-yellow/20 to-yellow/5 rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl text-charcoal mb-4">Set Rentals</h2>
            <p className="text-charcoal-light text-lg mb-6">
              Don&apos;t have your own mahjong set yet? No problem! Rent one of our beautiful sets
              for your next game night, party, or event. Each rental includes tiles, racks, and a card.
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-3 bg-teal text-white font-semibold rounded-full hover:bg-teal-dark transition-colors no-underline"
            >
              Inquire About Rentals
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
