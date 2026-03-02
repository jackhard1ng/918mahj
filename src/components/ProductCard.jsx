const CATEGORY_COLORS = {
  'Books & Guides': 'bg-teal/10 text-teal-dark',
  'Sets & Tiles': 'bg-coral/10 text-coral-dark',
  'Accessories': 'bg-yellow/30 text-league-gold',
  'Entertaining': 'bg-special-purple/10 text-special-purple',
}

function DefaultProductImage({ category }) {
  const colors = {
    'Books & Guides': '#4ECDC4',
    'Sets & Tiles': '#FF6B6B',
    'Accessories': '#F0A500',
    'Entertaining': '#A66CFF',
  }
  const color = colors[category] || '#4ECDC4'

  return (
    <div className="h-48 flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
      <svg viewBox="0 0 80 80" width="64" height="64">
        <rect x="10" y="10" width="60" height="60" rx="8" fill={color} opacity="0.3" />
        <rect x="20" y="20" width="40" height="40" rx="4" fill={color} opacity="0.5" />
        <text x="40" y="48" textAnchor="middle" fill={color} fontSize="20" fontWeight="bold">$</text>
      </svg>
    </div>
  )
}

export default function ProductCard({ product }) {
  const hasImage = product['Image URL'] && product['Image URL'].trim()
  const categoryColor = CATEGORY_COLORS[product['Category']] || CATEGORY_COLORS['Books & Guides']

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
      {hasImage ? (
        <img src={product['Image URL']} alt={product['Product Name']} className="h-48 w-full object-cover" loading="lazy" />
      ) : (
        <DefaultProductImage category={product['Category']} />
      )}

      <div className="p-5 flex flex-col flex-1">
        <span className={`inline-block self-start px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColor} mb-2`}>
          {product['Category']}
        </span>

        <h3 className="font-heading text-lg text-charcoal mb-1">{product['Product Name']}</h3>
        <p className="text-sm text-charcoal-light mb-3 line-clamp-2">{product['Description']}</p>
        <p className="text-lg font-bold text-coral mb-4">{product['Price']}</p>

        <div className="mt-auto">
          <a
            href={product['Buy Link']}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 px-4 bg-coral text-white font-semibold rounded-lg hover:bg-coral-dark transition-colors text-center no-underline text-sm"
          >
            Shop Now
          </a>
        </div>
      </div>
    </div>
  )
}
