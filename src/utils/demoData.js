// Demo data used when no Google Sheet URLs are configured.
// This lets the site look great out of the box.

function futureDate(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

export const demoEvents = [
  {
    'Event Name': 'Open Play Night at McNellie\'s',
    'Date': futureDate(3),
    'Time': '6:00-8:30p',
    'Venue': 'McNellie\'s South City',
    'Address': '7031 S Zurich Ave, Tulsa, OK',
    'Event Type': 'Open Play',
    'Price': '$15',
    'Description': 'Grab your friends and join us for a fun evening of American Mahjong! All skill levels welcome. Sets and cards provided.',
    'Registration Link': '',
    'Max Spots': '24',
    'Image URL': '',
  },
  {
    'Event Name': 'Birdy Basics: Learn to Play!',
    'Date': futureDate(7),
    'Time': '2:00-4:30p',
    'Venue': 'Tulsa Arts District Studio',
    'Address': '111 E Brady St, Tulsa, OK',
    'Event Type': 'Birdy Basics',
    'Price': '$25',
    'Description': 'Never played Mahjong before? No problem! Learn the fundamentals of American Mahjong in this beginner-friendly class.',
    'Registration Link': '',
    'Max Spots': '12',
    'Image URL': '',
  },
  {
    'Event Name': 'Frequent Flyers League Night',
    'Date': futureDate(10),
    'Time': '6:30-9:00p',
    'Venue': 'The Tavern',
    'Address': '201 N Main St, Tulsa, OK',
    'Event Type': 'League',
    'Price': '$20',
    'Description': 'Competitive league play for experienced players. Season standings and prizes!',
    'Registration Link': '',
    'Max Spots': '16',
    'Image URL': '',
  },
  {
    'Event Name': 'Mahj & Mimosas Brunch',
    'Date': futureDate(14),
    'Time': '10:00a-1:00p',
    'Venue': 'The Gathering Place Pavilion',
    'Address': '2650 S John Williams Way, Tulsa, OK',
    'Event Type': 'Special Event',
    'Price': '$35',
    'Description': 'A special brunch event featuring Mahjong, mimosas, and a whole lot of fun! Beginners and experienced players welcome.',
    'Registration Link': '',
    'Max Spots': '32',
    'Image URL': '',
  },
  {
    'Event Name': 'Saturday Open Play',
    'Date': futureDate(5),
    'Time': '1:00-3:30p',
    'Venue': 'Brookside Library',
    'Address': '1207 E 45th Pl, Tulsa, OK',
    'Event Type': 'Open Play',
    'Price': 'Free',
    'Description': 'Free open play at the library! Bring a friend or come solo — we\'ll find you a table.',
    'Registration Link': '',
    'Max Spots': '20',
    'Image URL': '',
  },
  {
    'Event Name': 'Birdy Basics: Evening Session',
    'Date': futureDate(21),
    'Time': '6:00-8:00p',
    'Venue': 'Mother Road Market',
    'Address': '1124 S Lewis Ave, Tulsa, OK',
    'Event Type': 'Birdy Basics',
    'Price': '$25',
    'Description': 'An evening beginner class for those who can\'t make our weekend sessions. Learn, play, and have a blast!',
    'Registration Link': '',
    'Max Spots': '12',
    'Image URL': '',
  },
]

export const demoShop = [
  {
    'Product Name': 'American Mahjong for Beginners',
    'Category': 'Books & Guides',
    'Image URL': '',
    'Buy Link': '#',
    'Price': '$14.99',
    'Description': 'The perfect guide for new players learning American Mahjong. Clear instructions, helpful illustrations, and practice exercises.',
  },
  {
    'Product Name': 'Classic Mahjong Set (166 Tiles)',
    'Category': 'Sets & Tiles',
    'Image URL': '',
    'Buy Link': '#',
    'Price': '$89.99',
    'Description': 'Beautiful melamine tile set with carrying case. Everything you need to start playing at home.',
  },
  {
    'Product Name': 'Mahjong Card Holder Rack (Set of 4)',
    'Category': 'Accessories',
    'Image URL': '',
    'Buy Link': '#',
    'Price': '$24.99',
    'Description': 'Sturdy wooden tile racks with built-in pusher. Makes organizing your hand a breeze.',
  },
  {
    'Product Name': 'Cocktail Recipe Cards: Game Night Edition',
    'Category': 'Entertaining',
    'Image URL': '',
    'Buy Link': '#',
    'Price': '$12.99',
    'Description': 'Fun cocktail and mocktail recipes perfect for your next Mahjong night. Includes themed drink names!',
  },
  {
    'Product Name': 'Mahj918 Tote Bag',
    'Category': 'Accessories',
    'Image URL': '',
    'Buy Link': '#',
    'Price': '$19.99',
    'Description': 'Carry your tiles in style! Our signature tote bag fits a full mahjong set and accessories.',
  },
  {
    'Product Name': 'The Great Mahjong Book',
    'Category': 'Books & Guides',
    'Image URL': '',
    'Buy Link': '#',
    'Price': '$18.99',
    'Description': 'Comprehensive guide covering strategy, history, and variations of Mahjong from around the world.',
  },
]

export const demoTestimonials = [
  {
    'Name': 'Sarah',
    'Quote': 'I was intimidated to try Mahjong but Candace and Nicolle made it SO fun and easy. I\'m completely hooked now!',
    'Date': '01/15/2026',
  },
  {
    'Name': 'Jennifer',
    'Quote': 'Our girls\' night Mahj event was the most fun we\'ve had in years. Everyone is already asking when we can do it again!',
    'Date': '12/05/2025',
  },
  {
    'Name': 'Lisa',
    'Quote': 'The Birdy Basics class was perfect for a total beginner like me. Now I play every week at Open Play!',
    'Date': '11/20/2025',
  },
  {
    'Name': 'Michelle',
    'Quote': 'Best team building event our company has ever done. The Mahj918 ladies are amazing teachers and hosts.',
    'Date': '02/01/2026',
  },
  {
    'Name': 'Karen',
    'Quote': 'I love the league nights! Great competition and even better company. Tulsa needed this!',
    'Date': '01/28/2026',
  },
]
