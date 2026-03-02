import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../hooks/useSiteData'
import ProductCard from '../components/ProductCard'
import { CardSkeleton, ErrorFallback } from '../components/LoadingSkeleton'

const CATEGORIES = ['All', 'Sets & Tiles', 'Accessories', 'Entertaining', 'Partners']

const PARTNERS = [
  { name: 'Oh My Mahjong', url: 'https://www.ohmymahjong.com', code: '918MAHJ10' },
  { name: 'The Mahjong House', url: 'https://www.themahjonghouse.com', code: 'FRIEND-F5BH7DL' },
  { name: 'Yellow Mountain Imports', url: 'https://www.ymimports.com', code: 'MAHJ918-YMI-2025' },
  { name: 'Miss Mahjong', url: 'https://missmahjong.com/?ref=MAHJ918', code: '918MAHJ10%OFF' },
  { name: 'Peace Love Mahjong', url: 'https://www.peacelovemahjong.com', code: '918MAHJ10' },
  { name: 'Bespoke Mahjong', url: 'https://www.bespokemahjong.com', code: 'MAHJ918' },
  { name: 'Four Friends Mahjong', url: 'https://www.fourfriendsmahjong.com', code: 'MAHJ918' },
  { name: 'Hip Hip Mahjong!', url: 'https://hiphipmahjong.com', code: 'MAHJ918' },
  { name: 'My Fair Mahjong', url: 'https://www.myfairmahjong.com', code: 'MAHJ918' },
  { name: 'Bam Bird Boutique', url: 'https://www.bambirdboutique.com', code: 'MAHJ918' },
  { name: "Bam! Let's Mahjong", url: 'https://www.bamletsmahjong.com', code: 'MAHJ918' },
  { name: 'Charleston Mahjong Club', url: 'https://www.charlestonmahjongclub.com', code: 'MAHJ918' },
  { name: 'Amahj Line', url: 'https://amahjline.com', code: 'MAHJ918' },
  { name: 'Thomas Blonde', url: 'https://www.thomasblonde.com', code: 'MAHJ918' },
  { name: 'Tigre de Tartan', url: 'https://www.tigredetartan.com', code: 'MAHJ918' },
]

export default function Shop() {
  const { products, loading, error } = useShop()
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    if (activeCategory === 'Partners') return []
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
                  ? cat === 'Partners' ? 'bg-teal text-white border-teal' : 'bg-coral text-white border-coral'
                  : cat === 'Partners' ? 'bg-white text-teal border-gray-200 hover:border-teal/30' : 'bg-white text-charcoal-light border-gray-200 hover:border-coral/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeCategory === 'Partners' ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl text-charcoal mb-3">Our Favorite Partners</h2>
              <p className="text-charcoal-light text-lg max-w-2xl mx-auto">
                Shop from our favorite mahjong brands and use our code for a discount!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PARTNERS.map((partner, i) => (
                <a
                  key={partner.name}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal/30 transition-all no-underline animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
                >
                  <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-teal/20 transition-colors">
                    <span className="text-teal font-bold text-lg">{partner.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-charcoal group-hover:text-teal transition-colors truncate">{partner.name}</p>
                    <p className="text-xs text-coral font-semibold">Code: {partner.code}</p>
                  </div>
                  <svg className="w-4 h-4 text-charcoal-light/40 group-hover:text-teal shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                </a>
              ))}
            </div>
            <p className="text-xs text-charcoal-light/60 text-center mt-8">
              Some links may be affiliate links. We only recommend products we love and use ourselves!
            </p>
          </div>
        ) : loading ? (
          <CardSkeleton count={6} />
        ) : error ? (
          <ErrorFallback message="Shop items are loading — check back soon!" />
        ) : filtered.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <p className="text-xs text-charcoal-light/60 text-center mt-8">
              Some links may be affiliate links. We only recommend products we love and use ourselves!
            </p>
          </div>
        ) : (
          <p className="text-center text-charcoal-light py-8">No products in this category yet.</p>
        )}

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
