import { CONTACT } from '../config'

export default function PaymentModal({ event, onClose }) {
  if (!event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-1 bg-transparent border-none cursor-pointer text-charcoal-light hover:text-charcoal"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-heading text-xl text-charcoal mb-1">Register for Event</h3>
        <p className="text-charcoal-light text-sm mb-4">{event['Event Name']} &mdash; {event['Price']}</p>

        <div className="space-y-3">
          <PaymentOption
            label="Venmo"
            value={CONTACT.venmo}
            color="bg-[#3D95CE]"
            icon="V"
          />
          <PaymentOption
            label="PayPal"
            value={CONTACT.paypal}
            color="bg-[#0070BA]"
            icon="P"
          />
          <PaymentOption
            label="Zelle"
            value={CONTACT.zelle}
            color="bg-[#6D1ED4]"
            icon="Z"
          />
        </div>

        <div className="mt-4 p-3 bg-yellow/20 rounded-lg">
          <p className="text-sm text-charcoal">
            <strong>Memo:</strong> {event['Event Name']} &mdash; {event['Date']}
          </p>
        </div>

        <p className="text-xs text-charcoal-light mt-3 text-center">
          Include the event name in your payment memo so we can confirm your spot!
        </p>
      </div>
    </div>
  )
}

function PaymentOption({ label, value, color, icon }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`w-10 h-10 ${color} text-white font-bold rounded-lg flex items-center justify-center text-lg`}>
        {icon}
      </span>
      <div>
        <p className="font-semibold text-sm text-charcoal">{label}</p>
        <p className="text-charcoal-light text-sm">{value}</p>
      </div>
    </div>
  )
}
