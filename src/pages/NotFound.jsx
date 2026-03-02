import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="pt-24 pb-16 px-4 min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        {/* Fun mahjong 404 graphic */}
        <div className="flex justify-center gap-2 mb-8">
          {['4', '0', '4'].map((n, i) => (
            <div
              key={i}
              className="w-20 h-28 bg-white rounded-xl shadow-lg border-2 border-gray-200 flex items-center justify-center transform hover:rotate-3 transition-transform"
            >
              <span className="font-heading text-4xl text-teal">{n}</span>
            </div>
          ))}
        </div>

        <h1 className="font-heading text-3xl md:text-4xl text-charcoal mb-4">Oops! Wrong Tile</h1>
        <p className="text-charcoal-light text-lg mb-8">
          Looks like this page got discarded. Don&apos;t worry — there are plenty of good tiles left in the wall!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-teal text-white font-semibold rounded-full hover:bg-teal-dark transition-colors no-underline"
          >
            Go Home
          </Link>
          <Link
            to="/events"
            className="inline-block px-8 py-3 bg-white text-teal-dark font-semibold rounded-full border-2 border-teal hover:bg-teal/5 transition-colors no-underline"
          >
            View Events
          </Link>
        </div>
      </div>
    </div>
  )
}
