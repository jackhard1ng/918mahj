// Google Sheets CSV URLs
// To set up: Open your Google Sheet > File > Share > Publish to web
// Select each tab and publish as CSV. Paste the URLs below.
export const SHEET_URLS = {
  events: import.meta.env.VITE_EVENTS_SHEET_URL || '',
  shop: import.meta.env.VITE_SHOP_SHEET_URL || '',
  testimonials: import.meta.env.VITE_TESTIMONIALS_SHEET_URL || '',
}

// Formspree form ID for the contact form
export const FORMSPREE_URL = import.meta.env.VITE_FORMSPREE_URL || ''

// Contact info
export const CONTACT = {
  email: 'mahj918@yahoo.com',
  instagram: 'https://www.instagram.com/mahj.918/',
  facebook: 'https://www.facebook.com/Mahj.918',
  tiktok: 'https://www.tiktok.com/@mahj.918',
  venmo: '@Mahj918',
  paypal: 'Mahj918',
  zelle: 'Mahj918@yahoo.com',
}

// Event type color mapping
export const EVENT_COLORS = {
  'Open Play': { bg: 'bg-teal/10', text: 'text-teal-dark', border: 'border-teal', dot: 'bg-teal', badge: 'bg-teal text-white' },
  'Birdy Basics': { bg: 'bg-coral/10', text: 'text-coral-dark', border: 'border-coral', dot: 'bg-coral', badge: 'bg-coral text-white' },
  'League': { bg: 'bg-yellow/20', text: 'text-league-gold', border: 'border-yellow', dot: 'bg-league-gold', badge: 'bg-league-gold text-white' },
  'Special Event': { bg: 'bg-special-purple/10', text: 'text-special-purple', border: 'border-special-purple', dot: 'bg-special-purple', badge: 'bg-special-purple text-white' },
  'Private': { bg: 'bg-charcoal-light/10', text: 'text-charcoal-light', border: 'border-charcoal-light', dot: 'bg-charcoal-light', badge: 'bg-charcoal-light text-white' },
}
