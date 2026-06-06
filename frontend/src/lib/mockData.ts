import type { DBProfile, DBReview, DBResponse } from './supabase'

// ─────────────────────────────────────────────────────────────
// Mock user / brand IDs
// ─────────────────────────────────────────────────────────────

export const MOCK_USER_PASTA  = 'mock-user-pasta-001'
export const MOCK_USER_ROYAL  = 'mock-user-royal-001'
export const MOCK_USER_BURGER = 'mock-user-burger-001'

// ─────────────────────────────────────────────────────────────
// Brand Profiles (3)
// ─────────────────────────────────────────────────────────────

export const MOCK_BRANDS: DBProfile[] = [
  {
    id:             MOCK_USER_PASTA,
    brand_name:     'Pasta & More',
    brand_voice:    'We speak like a favourite local trattoria — warm, personal, and genuinely happy to see you. We use first names when we know them, acknowledge specifics from the review, and always end with an invitation to return. We never sound corporate or scripted.',
    brand_rules: [
      'Always thank the reviewer by name if provided',
      'Acknowledge specific dishes or staff mentioned',
      'For negative reviews: apologise first, explain second, offer a remedy third',
      'Never make excuses for cold food or wrong orders',
      'Include the manager\'s name in the sign-off: "— Sofia, Manager"',
    ],
    contact_info:   'feedback@pastaandmore.com | +91-98765-43210 | Linking Road, Bandra West, Mumbai',
    offer_template: 'To make it right, we\'d love to offer you a complimentary dessert on your next visit — just mention this note to your server or show them this response.',
    platforms:      ['google', 'zomato', 'swiggy', 'tripadvisor'],
    tone_formality: 2,
    tone_warmth:    5,
    tone_verbosity: 3,
    created_at:     '2024-02-10T09:00:00Z',
    updated_at:     '2024-11-01T14:22:00Z',
  },
  {
    id:             MOCK_USER_ROYAL,
    brand_name:     'The Royal Table',
    brand_voice:    'We embody understated luxury. Our responses are polished, precise, and gracious — never defensive. We acknowledge imperfections as opportunities to uphold our standards. Every word reflects the care we put into every plate.',
    brand_rules: [
      'Never over-explain or justify poor experiences with logistics',
      'Use "I" rather than "we" for personal accountability from the GM',
      'Reference our commitment to excellence, not generic platitudes',
      'For lost reservations or service failures: offer a private dining experience as remedy',
      'Sign off: "— James Whitfield, General Manager"',
    ],
    contact_info:   'gm@theroyaltable.in | +91-11-4567-8900 | The Oberoi, New Delhi',
    offer_template: 'I would be honoured to personally host you for a complimentary dinner for two in our private dining room — please reach me directly at gm@theroyaltable.in to arrange.',
    platforms:      ['google', 'tripadvisor', 'zomato'],
    tone_formality: 5,
    tone_warmth:    3,
    tone_verbosity: 4,
    created_at:     '2024-01-05T10:00:00Z',
    updated_at:     '2024-10-15T11:00:00Z',
  },
  {
    id:             MOCK_USER_BURGER,
    brand_name:     'Burger Rush',
    brand_voice:    'We\'re fast, fun, and proud of our burgers. Our voice is energetic and real — no fluff. We own our mistakes quickly and fix them faster. Think: the confident manager who actually eats their own food.',
    brand_rules: [
      'Keep responses punchy — no more than 4 sentences for positive reviews',
      'For negative reviews: lead with "You\'re right, and we\'re sorry."',
      'Never blame third-party delivery for cold food',
      'Mention specific menu items by name to show we listened',
      'Sign off: "— The Burger Rush Team"',
    ],
    contact_info:   'help@burgerrush.in | @BurgerRushIndia on all platforms',
    offer_template: 'We\'re dropping a free upgrade on your next order — just use code RUSHBACK at checkout or mention this at the counter.',
    platforms:      ['google', 'zomato', 'swiggy'],
    tone_formality: 1,
    tone_warmth:    4,
    tone_verbosity: 2,
    created_at:     '2024-03-20T08:00:00Z',
    updated_at:     '2024-11-12T09:30:00Z',
  },
]

// ─────────────────────────────────────────────────────────────
// Reviews (15)
// 6 Google · 4 Zomato · 3 Swiggy · 2 TripAdvisor
// 2 × 1★  · 3 × 2★  · 2 × 3★  · 4 × 4★  · 4 × 5★
// All status: 'pending'
// ─────────────────────────────────────────────────────────────

export const MOCK_REVIEWS: DBReview[] = [

  // ── 1★ Reviews ───────────────────────────────────────────

  {
    id:            'review-001',
    user_id:       MOCK_USER_BURGER,
    platform:      'google',
    reviewer_name: 'Ravi Sharma',
    rating:        1,
    review_text:   'Waited over an hour for my order, and when I finally got it the fries were completely cold. Staff at the counter were dismissive when I raised the issue — one of them literally rolled their eyes at me. Ordered the Classic Smash Burger combo, paid ₹640, and left genuinely disappointed. This used to be my favourite quick lunch spot. Not coming back.',
    review_date:   '2024-10-18T13:20:00Z',
    location_name: 'Burger Rush — Koramangala',
    tags:          { praises: [], complaints: ['1-hour wait', 'cold fries', 'dismissive staff', 'eye roll', 'overpriced for experience'] },
    status:        'pending',
    created_at:    '2024-10-18T14:00:00Z',
  },
  {
    id:            'review-002',
    user_id:       MOCK_USER_ROYAL,
    platform:      'zomato',
    reviewer_name: 'Meena Iyer',
    rating:        1,
    review_text:   'I found a hair in my biryani. Not at the end of the meal — at the very first bite. I told the waiter and he just offered to replace the dish rather than removing it from the bill or offering a genuine apology. The manager never came to the table. For a restaurant that charges ₹3,500 a head, this level of quality control and service recovery is completely unacceptable.',
    review_date:   '2024-10-22T20:45:00Z',
    location_name: 'The Royal Table — New Delhi',
    tags:          { praises: [], complaints: ['hair in food', 'poor service recovery', 'manager absent', 'no bill adjustment', 'overpriced for quality'] },
    status:        'pending',
    created_at:    '2024-10-22T21:30:00Z',
  },

  // ── 2★ Reviews ───────────────────────────────────────────

  {
    id:            'review-003',
    user_id:       MOCK_USER_PASTA,
    platform:      'swiggy',
    reviewer_name: 'Aarav Joshi',
    rating:        2,
    review_text:   'I\'ve been ordering from Pasta & More for two years, and something has definitely changed. The portions are at least 30% smaller than they were six months ago — the arrabbiata used to be a generous bowl, now it looks like a starter. The taste is still good, but I\'m paying the same price for noticeably less food. I hope this is a temporary thing and not a permanent change.',
    review_date:   '2024-11-01T20:10:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['taste still good'], complaints: ['portions reduced 30%', 'same price for less food', 'arrabbiata too small'] },
    status:        'pending',
    created_at:    '2024-11-01T21:00:00Z',
  },
  {
    id:            'review-004',
    user_id:       MOCK_USER_ROYAL,
    platform:      'google',
    reviewer_name: 'Tanvi Kapoor',
    rating:        2,
    review_text:   'Our table booking was confirmed for 8 PM. We arrived on time but were made to wait 35 minutes because "the previous party hadn\'t finished." No apology, no complimentary drinks while we waited. Then we found the AC in our section had not been working — on a humid October evening, sitting in a warm corner of a formal restaurant is not pleasant. Food was good but the experience was not worth ₹8,000.',
    review_date:   '2024-10-29T22:00:00Z',
    location_name: 'The Royal Table — New Delhi',
    tags:          { praises: ['food was good'], complaints: ['35-minute wait despite booking', 'no apology', 'no complimentary drinks', 'AC not working', 'overpriced given experience'] },
    status:        'pending',
    created_at:    '2024-10-29T22:45:00Z',
  },
  {
    id:            'review-005',
    user_id:       MOCK_USER_BURGER,
    platform:      'zomato',
    reviewer_name: 'Kunal Malhotra',
    rating:        2,
    review_text:   'Order arrived 20 minutes late and when I opened it, someone else\'s order was in the bag — a Chicken Crispy combo instead of my Veg Smash Double. I\'m vegetarian. Called the helpline; was put on hold for 12 minutes and then told a refund would take 7 business days. The burger itself (based on a previous visit) is great, but this delivery experience was a disaster.',
    review_date:   '2024-11-03T19:45:00Z',
    location_name: 'Burger Rush — Koramangala',
    tags:          { praises: ['burger itself is great'], complaints: ['wrong order (vegetarian concern)', '20 minutes late', '12-minute hold time', '7-day refund timeline'] },
    status:        'pending',
    created_at:    '2024-11-03T20:30:00Z',
  },

  // ── 3★ Reviews ───────────────────────────────────────────

  {
    id:            'review-006',
    user_id:       MOCK_USER_PASTA,
    platform:      'tripadvisor',
    reviewer_name: 'Divya Reddy',
    rating:        3,
    review_text:   'Stopped in for a quick lunch during a work trip. The pasta was fine — cooked properly, seasoning okay, nothing memorable. Service was efficient but impersonal. The restaurant looked nice inside but the lunch menu felt limited for a place with this reputation. I expected to be wowed based on the reviews, so perhaps my expectations were too high. Worth visiting but perhaps not worth a special trip.',
    review_date:   '2024-10-25T13:30:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['pasta cooked properly', 'nice interior', 'efficient service'], complaints: ['nothing memorable', 'impersonal service', 'limited lunch menu', 'expectations not met'] },
    status:        'pending',
    created_at:    '2024-10-25T15:00:00Z',
  },
  {
    id:            'review-007',
    user_id:       MOCK_USER_PASTA,
    platform:      'google',
    reviewer_name: 'Suresh Pillai',
    rating:        3,
    review_text:   'The ambiance here is genuinely lovely — warm lighting, wooden interiors, tables spaced well so you can actually have a conversation. But the menu hasn\'t changed in what feels like a year. Same dishes, same specials board. If you\'re a regular, there\'s nothing new to try. I\'d love to see seasonal specials or a rotating menu. Three stars for the atmosphere and the existing dishes, minus two for the stagnation.',
    review_date:   '2024-11-10T20:00:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['warm lighting', 'wooden interiors', 'well-spaced tables', 'great ambiance'], complaints: ['menu unchanged', 'no seasonal specials', 'nothing new for regulars'] },
    status:        'pending',
    created_at:    '2024-11-10T21:15:00Z',
  },

  // ── 4★ Reviews ───────────────────────────────────────────

  {
    id:            'review-008',
    user_id:       MOCK_USER_PASTA,
    platform:      'google',
    reviewer_name: 'Neha Gupta',
    rating:        4,
    review_text:   'Came in for a birthday dinner and had a really lovely time. The cacio e pepe was perfectly balanced — not too salty, generous with the pepper. Our server Rahul was friendly and checked in at the right moments without hovering. Only small complaint is we waited about 20 minutes for a table even with a reservation — not a dealbreaker but worth noting. Will definitely come back for the truffle pasta.',
    review_date:   '2024-11-14T21:00:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['cacio e pepe', 'server Rahul', 'birthday dinner', 'well-balanced seasoning', 'truffle pasta'], complaints: ['20-minute wait despite reservation'] },
    status:        'pending',
    created_at:    '2024-11-14T22:30:00Z',
  },
  {
    id:            'review-009',
    user_id:       MOCK_USER_ROYAL,
    platform:      'zomato',
    reviewer_name: 'Farhan Shaikh',
    rating:        4,
    review_text:   'What stood out most was that the staff actually remembered my partner\'s nut allergy without being prompted — we\'d mentioned it when booking and every dish that arrived came with a quiet confirmation that it was allergen-free. The lamb rogan josh was exceptional, and the wine list is thoughtfully curated. Docking one star only because the dessert cart felt rushed at the end.',
    review_date:   '2024-11-06T22:15:00Z',
    location_name: 'The Royal Table — New Delhi',
    tags:          { praises: ['allergy awareness', 'lamb rogan josh', 'wine list', 'staff attentiveness', 'allergen communication'], complaints: ['dessert cart felt rushed'] },
    status:        'pending',
    created_at:    '2024-11-06T23:00:00Z',
  },
  {
    id:            'review-010',
    user_id:       MOCK_USER_BURGER,
    platform:      'swiggy',
    reviewer_name: 'Isha Nair',
    rating:        4,
    review_text:   'Solid burgers — the Smash Double is legitimately one of the best fast-casual burgers in the city. Arrived hot, packed well, no soggy bun issues. The only reason this isn\'t five stars is that the seating area is cramped and uncomfortable if you\'re dining in. But for delivery? Pretty much perfect. Will keep ordering.',
    review_date:   '2024-11-08T20:30:00Z',
    location_name: 'Burger Rush — Koramangala',
    tags:          { praises: ['Smash Double burger', 'hot on arrival', 'good packaging', 'no soggy bun'], complaints: ['seating area cramped'] },
    status:        'pending',
    created_at:    '2024-11-08T21:15:00Z',
  },
  {
    id:            'review-011',
    user_id:       MOCK_USER_ROYAL,
    platform:      'tripadvisor',
    reviewer_name: 'Alok Verma',
    rating:        4,
    review_text:   'The sommelier\'s wine pairing recommendation for our tasting menu was spot-on — a Burgundy with the duck and a Gewürztraminer with the Thai prawn starter were both inspired choices. The food is genuinely excellent. The only thing holding this back from five stars is the price: for a couple, we spent ₹14,000 including wine. Worth it for a special occasion, but not something you\'d do casually.',
    review_date:   '2024-10-31T22:45:00Z',
    location_name: 'The Royal Table — New Delhi',
    tags:          { praises: ['sommelier wine pairing', 'Burgundy with duck', 'tasting menu', 'excellent food', 'Gewürztraminer pairing'], complaints: ['very expensive (₹14,000 for two)'] },
    status:        'pending',
    created_at:    '2024-10-31T23:30:00Z',
  },

  // ── 5★ Reviews ───────────────────────────────────────────

  {
    id:            'review-012',
    user_id:       MOCK_USER_PASTA,
    platform:      'google',
    reviewer_name: 'Priya Murthy',
    rating:        5,
    review_text:   'I don\'t usually write reviews but Chef Arjun\'s truffle mushroom pasta last Thursday genuinely moved me. It\'s the kind of dish that makes you stop talking mid-sentence. Every element — the pasta texture, the earthy truffle oil, the parmesan balance — was precise. This is the best pasta I\'ve had in Mumbai, maybe in India. Thank you for making a Tuesday evening feel like something to remember.',
    review_date:   '2024-11-12T21:30:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['Chef Arjun', 'truffle mushroom pasta', 'pasta texture', 'truffle oil', 'parmesan balance', 'best pasta in Mumbai'], complaints: [] },
    status:        'pending',
    created_at:    '2024-11-12T22:00:00Z',
  },
  {
    id:            'review-013',
    user_id:       MOCK_USER_ROYAL,
    platform:      'tripadvisor',
    reviewer_name: 'Rohit Shetty',
    rating:        5,
    review_text:   'An exceptional evening from start to finish. Every course of the tasting menu told a story — the amuse-bouche, the mid-course sorbet, the mains, the dessert. The service struck exactly the right balance: present when needed, invisible otherwise. I\'ve dined in Michelin-starred restaurants in Paris and London, and The Royal Table belongs in that conversation. James and his team have built something truly special here.',
    review_date:   '2024-11-15T22:00:00Z',
    location_name: 'The Royal Table — New Delhi',
    tags:          { praises: ['tasting menu', 'amuse-bouche', 'mid-course sorbet', 'GM James', 'service balance', 'Michelin-level quality', 'exceptional evening'], complaints: [] },
    status:        'pending',
    created_at:    '2024-11-15T22:45:00Z',
  },
  {
    id:            'review-014',
    user_id:       MOCK_USER_BURGER,
    platform:      'swiggy',
    reviewer_name: 'Simran Kaur',
    rating:        5,
    review_text:   'My go-to for a quick, satisfying dinner when I don\'t want to cook. The Classic Smash is always consistent — never once had a bad experience in 15+ orders. Hot, fresh, right condiments every time. And the loaded fries are criminally underrated. You don\'t need to reinvent the wheel, Burger Rush — just keep doing exactly this.',
    review_date:   '2024-11-17T19:45:00Z',
    location_name: 'Burger Rush — Koramangala',
    tags:          { praises: ['Classic Smash', 'consistency', 'hot and fresh', 'loaded fries', 'right condiments', '15+ orders no bad experience'], complaints: [] },
    status:        'pending',
    created_at:    '2024-11-17T20:30:00Z',
  },
  {
    id:            'review-015',
    user_id:       MOCK_USER_ROYAL,
    platform:      'google',
    reviewer_name: 'Vikas Nanda',
    rating:        5,
    review_text:   'My wife and I came for our 10th anniversary and the team at The Royal Table went above and beyond — they had decorated our table with flowers and a handwritten card that someone had clearly spent real time on. We hadn\'t asked for any of this. The lamb and the sea bass were both perfect. I cried happy tears at one point. This is the most memorable meal of my life.',
    review_date:   '2024-11-20T21:15:00Z',
    location_name: 'The Royal Table — New Delhi',
    tags:          { praises: ['anniversary table decoration', 'handwritten card', 'table flowers', 'lamb', 'sea bass', 'surprise personal touch', 'most memorable meal'], complaints: [] },
    status:        'pending',
    created_at:    '2024-11-20T22:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────
// Responses (8) — one per review for reviews 001, 003, 005,
// 008, 012, 013, 014, 015. Each has 3–4 edit history entries.
// ─────────────────────────────────────────────────────────────

export const MOCK_RESPONSES: DBResponse[] = [

  // ── Response 001: review-001 (1★ · Burger Rush · Google) ──
  {
    id:          'response-001',
    review_id:   'review-001',
    user_id:     MOCK_USER_BURGER,
    content:     'Ravi — you\'re right, and we\'re sorry. A 1-hour wait and cold fries is a fail on our end, full stop. The way our team handled your concern wasn\'t good enough either, and we\'ve had a direct conversation about it. Please DM us @BurgerRushIndia or email help@burgerrush.in — we\'re dropping a free upgrade on your next order, just mention this response at the counter. You deserve better from us. — The Burger Rush Team',
    version:     3,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Ravi, we\'re sorry your visit didn\'t meet expectations. There were some delays in our kitchen that day and we understand that was frustrating. Our staff always aims to be helpful. Please reach out to us at help@burgerrush.in and we\'ll make it right. — The Burger Rush Team',
        action:    'AI generated',
        timestamp: '2024-10-18T15:00:00Z',
      },
      {
        version:   2,
        content:   'Ravi — you\'re right, and we\'re sorry. A 1-hour wait and cold fries is a fail on our end, full stop. The way our staff handled your concern wasn\'t good enough either. This isn\'t who we are. Please DM us @BurgerRushIndia or email help@burgerrush.in — we want to make this right for you. — The Burger Rush Team',
        action:    'Removed defensive language, led with accountability',
        timestamp: '2024-10-18T15:12:00Z',
      },
      {
        version:   3,
        content:   'Ravi — you\'re right, and we\'re sorry. A 1-hour wait and cold fries is a fail on our end, full stop. The way our team handled your concern wasn\'t good enough either, and we\'ve had a direct conversation about it. Please DM us @BurgerRushIndia or email help@burgerrush.in — we\'re dropping a free upgrade on your next order, just mention this response at the counter. You deserve better from us. — The Burger Rush Team',
        action:    'Added recovery offer and team accountability note',
        timestamp: '2024-10-18T15:25:00Z',
      },
    ],
    created_at:  '2024-10-18T15:00:00Z',
    updated_at:  '2024-10-18T15:25:00Z',
  },

  // ── Response 002: review-003 (2★ · Pasta & More · Swiggy) ──
  {
    id:          'response-002',
    review_id:   'review-003',
    user_id:     MOCK_USER_PASTA,
    content:     'Aarav, two years of loyalty means the world to us — thank you. I hear your concern about the portions, and I want to take it seriously rather than dismiss it. We\'ve been reviewing our delivery packaging recently and I\'d love to understand exactly what you experienced. Please email us at feedback@pastaandmore.com or call +91-98765-43210 and ask for Sofia. As a thank-you for your honesty, we\'d like to offer you a complimentary dessert on your next visit — just mention this note to your server. — Sofia, Manager',
    version:     3,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Hi Aarav, thank you for the kind words about the taste! We haven\'t changed our recipes or portion sizes, so it\'s possible there may have been a variance that day. Do reach out to us at feedback@pastaandmore.com and we\'ll look into it. — Pasta & More',
        action:    'AI generated',
        timestamp: '2024-11-01T22:00:00Z',
      },
      {
        version:   2,
        content:   'Hi Aarav, thank you for being such a loyal customer — two years means the world to us. I hear you on the portion concern, and I want to be honest: we did make some adjustments to our delivery packaging recently which may have affected how the food presents in the box. Let us know and we\'ll make it right. — Sofia, Manager',
        action:    'Removed denial, added packaging context and personal tone',
        timestamp: '2024-11-01T22:15:00Z',
      },
      {
        version:   3,
        content:   'Aarav, two years of loyalty means the world to us — thank you. I hear your concern about the portions, and I want to take it seriously rather than dismiss it. We\'ve been reviewing our delivery packaging recently and I\'d love to understand exactly what you experienced. Please email us at feedback@pastaandmore.com or call +91-98765-43210 and ask for Sofia. As a thank-you for your honesty, we\'d like to offer you a complimentary dessert on your next visit — just mention this note to your server. — Sofia, Manager',
        action:    'Added direct contact ask and recovery offer',
        timestamp: '2024-11-01T22:35:00Z',
      },
    ],
    created_at:  '2024-11-01T22:00:00Z',
    updated_at:  '2024-11-01T22:35:00Z',
  },

  // ── Response 003: review-005 (2★ · Burger Rush · Zomato) ──
  {
    id:          'response-003',
    review_id:   'review-005',
    user_id:     MOCK_USER_BURGER,
    content:     'Kunal — you\'re right, and we\'re sorry. A wrong order is bad. A wrong order when you\'re vegetarian, followed by a 12-minute hold and a 7-day refund wait, is unacceptable. We don\'t pass the buck on this — our packing station should have caught it. Email help@burgerrush.in with your order number and we\'ll process your refund today, not in 7 days. We\'re also dropping a free upgrade code RUSHBACK for your next order. — The Burger Rush Team',
    version:     3,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Kunal, we\'re sorry for the mix-up with your order. There was unfortunately an error on the delivery partner\'s side that caused the wrong items to be packed. We understand this was especially problematic given your dietary preferences. Please contact the delivery platform for a refund. — The Burger Rush Team',
        action:    'AI generated',
        timestamp: '2024-11-03T21:00:00Z',
      },
      {
        version:   2,
        content:   'Kunal — the wrong order is on us, not on the delivery platform, and we\'re sorry. Being vegetarian and receiving a chicken order is a serious problem. Please DM us @BurgerRushIndia and we\'ll arrange a refund and a replacement as quickly as possible. — The Burger Rush Team',
        action:    'Removed delivery blame, took direct ownership',
        timestamp: '2024-11-03T21:15:00Z',
      },
      {
        version:   3,
        content:   'Kunal — you\'re right, and we\'re sorry. A wrong order is bad. A wrong order when you\'re vegetarian, followed by a 12-minute hold and a 7-day refund wait, is unacceptable. We don\'t pass the buck on this — our packing station should have caught it. Email help@burgerrush.in with your order number and we\'ll process your refund today, not in 7 days. We\'re also dropping a free upgrade code RUSHBACK for your next order. — The Burger Rush Team',
        action:    'Addressed the hold time and refund timeline specifically, added recovery code',
        timestamp: '2024-11-03T21:40:00Z',
      },
    ],
    created_at:  '2024-11-03T21:00:00Z',
    updated_at:  '2024-11-03T21:40:00Z',
  },

  // ── Response 004: review-008 (4★ · Pasta & More · Google) ──
  {
    id:          'response-004',
    review_id:   'review-008',
    user_id:     MOCK_USER_PASTA,
    content:     'Neha, thank you for choosing Pasta & More for such a special evening — happy birthday! We\'re so glad the cacio e pepe hit the spot, and that Rahul made your experience a warm one. You\'re right about the reservation wait, and it\'s something we\'re actively working on improving — no one should have to wait with a booking in hand. We hope to have a table ready the moment you walk in next time, especially for that truffle pasta visit! — Sofia, Manager',
    version:     3,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Thank you so much for your wonderful review, Neha! We\'re thrilled you had a lovely birthday dinner with us. Your feedback is much appreciated and we look forward to seeing you again soon. — Pasta & More',
        action:    'AI generated',
        timestamp: '2024-11-14T23:00:00Z',
      },
      {
        version:   2,
        content:   'Neha, happy birthday and thank you for spending it with us! We\'re so glad the cacio e pepe delivered and that Rahul looked after you well. We hear you on the reservation wait and we\'re working on it — you shouldn\'t have to wait with a confirmed booking. See you for the truffle pasta! — Sofia, Manager',
        action:    'Personalised, acknowledged complaint, named staff',
        timestamp: '2024-11-14T23:15:00Z',
      },
      {
        version:   3,
        content:   'Neha, thank you for choosing Pasta & More for such a special evening — happy birthday! We\'re so glad the cacio e pepe hit the spot, and that Rahul made your experience a warm one. You\'re right about the reservation wait, and it\'s something we\'re actively working on improving — no one should have to wait with a booking in hand. We hope to have a table ready the moment you walk in next time, especially for that truffle pasta visit! — Sofia, Manager',
        action:    'Polished tone, strengthened reservation acknowledgement',
        timestamp: '2024-11-14T23:30:00Z',
      },
    ],
    created_at:  '2024-11-14T23:00:00Z',
    updated_at:  '2024-11-14T23:30:00Z',
  },

  // ── Response 005: review-012 (5★ · Pasta & More · Google) ──
  {
    id:          'response-005',
    review_id:   'review-012',
    user_id:     MOCK_USER_PASTA,
    content:     'Priya — Chef Arjun read your review this morning and it made his day. Words like yours are the reason he does what he does. The truffle mushroom pasta is his personal favourite on the menu, and the fact that it moved you means everything to this team. We\'d love to welcome you back soon — ask about the seasonal specials when you arrive, there\'s something new we think you\'ll adore. Thank you for writing this. — Sofia, Manager',
    version:     4,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Thank you so much, Priya! We\'re absolutely delighted you enjoyed the truffle mushroom pasta. Reviews like yours make our whole team\'s day. We look forward to welcoming you back soon! — Pasta & More',
        action:    'AI generated',
        timestamp: '2024-11-12T22:30:00Z',
      },
      {
        version:   2,
        content:   'Priya, this made Chef Arjun\'s week — honestly, we read him your review and he just smiled and went back to work. That\'s exactly what he\'s after. Thank you for taking the time to write this. — Sofia, Manager',
        action:    'Added Chef Arjun personal reaction',
        timestamp: '2024-11-12T22:45:00Z',
      },
      {
        version:   3,
        content:   'Priya, we showed Chef Arjun your review and he went a little quiet and then said, "Tell her thank you." That\'s the highest praise you can give him. The truffle mushroom pasta is his personal favourite on the menu, so knowing it moved you means everything to us. Come back soon — ask about the seasonal specials. — Sofia, Manager',
        action:    'Added Chef Arjun quote and seasonal specials hook',
        timestamp: '2024-11-12T23:00:00Z',
      },
      {
        version:   4,
        content:   'Priya — Chef Arjun read your review this morning and it made his day. Words like yours are the reason he does what he does. The truffle mushroom pasta is his personal favourite on the menu, and the fact that it moved you means everything to this team. We\'d love to welcome you back soon — ask about the seasonal specials when you arrive, there\'s something new we think you\'ll adore. Thank you for writing this. — Sofia, Manager',
        action:    'Final polish — warmer opening, stronger invitation',
        timestamp: '2024-11-12T23:20:00Z',
      },
    ],
    created_at:  '2024-11-12T22:30:00Z',
    updated_at:  '2024-11-12T23:20:00Z',
  },

  // ── Response 006: review-013 (5★ · Royal Table · TripAdvisor) ──
  {
    id:          'response-006',
    review_id:   'review-013',
    user_id:     MOCK_USER_ROYAL,
    content:     'Rohit, thank you for such a generous and considered review. The comparison you\'ve drawn to Michelin-starred restaurants in Paris and London is something I will share with every member of our team — they deserve to hear it. We strive to create evenings that feel both effortless and memorable, and it means a great deal to know we achieved that. I hope we have the privilege of welcoming you again. — James Whitfield, General Manager',
    version:     3,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Dear Rohit, thank you so much for your wonderful review of The Royal Table. We are delighted that you enjoyed your tasting menu experience and that our team\'s service met your expectations. Your kind words mean a great deal. We hope to welcome you back again soon. — James Whitfield, General Manager',
        action:    'AI generated',
        timestamp: '2024-11-15T23:00:00Z',
      },
      {
        version:   2,
        content:   'Rohit, thank you for a review that captures exactly what we strive for. Knowing the evening balanced presence and invisibility in service is especially gratifying — that balance is the hardest thing to teach and maintain. I\'ll be sharing your words with the full team. — James Whitfield, General Manager',
        action:    'More specific and personal, acknowledged service philosophy',
        timestamp: '2024-11-15T23:20:00Z',
      },
      {
        version:   3,
        content:   'Rohit, thank you for such a generous and considered review. The comparison you\'ve drawn to Michelin-starred restaurants in Paris and London is something I will share with every member of our team — they deserve to hear it. We strive to create evenings that feel both effortless and memorable, and it means a great deal to know we achieved that. I hope we have the privilege of welcoming you again. — James Whitfield, General Manager',
        action:    'Acknowledged Michelin comparison specifically, elevated tone',
        timestamp: '2024-11-15T23:40:00Z',
      },
    ],
    created_at:  '2024-11-15T23:00:00Z',
    updated_at:  '2024-11-15T23:40:00Z',
  },

  // ── Response 007: review-014 (5★ · Burger Rush · Swiggy) ──
  {
    id:          'response-007',
    review_id:   'review-014',
    user_id:     MOCK_USER_BURGER,
    content:     'Simran — 15+ orders and still going strong, that means everything to us. The Classic Smash is our baby and consistency is the one thing we will never compromise on. And yes, the loaded fries absolutely deserve more recognition. See you on order 16. — The Burger Rush Team',
    version:     3,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Thank you, Simran! We\'re so happy to be your go-to spot and glad the Classic Smash always delivers. Great to hear the loaded fries are getting some love too. We\'ll keep doing what we\'re doing! — The Burger Rush Team',
        action:    'AI generated',
        timestamp: '2024-11-17T21:00:00Z',
      },
      {
        version:   2,
        content:   'Simran — 15+ orders and zero bad ones, that\'s a standard we take seriously. The Classic Smash is our cornerstone and we\'ll never let it slip. The loaded fries appreciation is long overdue and we accept it. — The Burger Rush Team',
        action:    'Added Burger Rush brand voice and energy',
        timestamp: '2024-11-17T21:15:00Z',
      },
      {
        version:   3,
        content:   'Simran — 15+ orders and still going strong, that means everything to us. The Classic Smash is our baby and consistency is the one thing we will never compromise on. And yes, the loaded fries absolutely deserve more recognition. See you on order 16. — The Burger Rush Team',
        action:    'Tightened, punchy finish with "order 16" callback',
        timestamp: '2024-11-17T21:30:00Z',
      },
    ],
    created_at:  '2024-11-17T21:00:00Z',
    updated_at:  '2024-11-17T21:30:00Z',
  },

  // ── Response 008: review-015 (5★ · Royal Table · Google) ──
  {
    id:          'response-008',
    review_id:   'review-015',
    user_id:     MOCK_USER_ROYAL,
    content:     'A 10th anniversary deserves to be marked properly, and I am deeply moved to hear that our team rose to the occasion entirely on their own initiative — they saw the booking note and took it from there. That is the spirit of The Royal Table. The lamb and sea bass are two dishes I am particularly proud of, and knowing they were part of such a meaningful evening is genuinely gratifying. Thank you for trusting us with something so precious. We would be truly honoured to host you again — perhaps for the 15th. — James Whitfield, General Manager',
    version:     4,
    is_active:   true,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'Dear Vikas, thank you for your heartfelt review. We are so pleased your 10th anniversary dinner was a memorable one and that our team\'s efforts added to the occasion. It was our honour to be part of your celebration. We hope to welcome you again. — James Whitfield, General Manager',
        action:    'AI generated',
        timestamp: '2024-11-20T22:30:00Z',
      },
      {
        version:   2,
        content:   'Vikas, what a privilege it was to be part of your 10th anniversary. The team takes genuine pride in those details — the flowers, the card — because we believe the moments around the meal matter as much as the meal itself. I am so glad the lamb and sea bass were to your taste. — James Whitfield, General Manager',
        action:    'Named the specific details, elevated to personal reflection',
        timestamp: '2024-11-20T22:45:00Z',
      },
      {
        version:   3,
        content:   'A 10th anniversary is a milestone worth honouring properly, and I am moved to hear our team made it so special entirely on their own initiative — they saw the booking note and acted. That initiative, that care, is what I am most proud of at The Royal Table. Thank you for trusting us with such a significant evening. — James Whitfield, General Manager',
        action:    'Reframed around team initiative, more personal from GM',
        timestamp: '2024-11-20T23:00:00Z',
      },
      {
        version:   4,
        content:   'A 10th anniversary deserves to be marked properly, and I am deeply moved to hear that our team rose to the occasion entirely on their own initiative — they saw the booking note and took it from there. That is the spirit of The Royal Table. The lamb and sea bass are two dishes I am particularly proud of, and knowing they were part of such a meaningful evening is genuinely gratifying. Thank you for trusting us with something so precious. We would be truly honoured to host you again — perhaps for the 15th. — James Whitfield, General Manager',
        action:    'Added dish pride, "perhaps for the 15th" invitation',
        timestamp: '2024-11-20T23:20:00Z',
      },
    ],
    created_at:  '2024-11-20T22:30:00Z',
    updated_at:  '2024-11-20T23:20:00Z',
  },
]

// ─────────────────────────────────────────────────────────────
// Convenience maps for O(1) lookup
// ─────────────────────────────────────────────────────────────

export const MOCK_REVIEWS_BY_ID = new Map(
  MOCK_REVIEWS.map((r) => [r.id, r])
)

export const MOCK_RESPONSES_BY_REVIEW_ID = new Map(
  MOCK_RESPONSES.map((r) => [r.review_id, r])
)

export const MOCK_BRANDS_BY_ID = new Map(
  MOCK_BRANDS.map((b) => [b.id, b])
)

// ─────────────────────────────────────────────────────────────
// Dev flag — set VITE_USE_MOCK_DATA=true in .env.local
// or run without VITE_SUPABASE_URL in dev mode
// ─────────────────────────────────────────────────────────────

export const USE_MOCK_DATA =
  import.meta.env.VITE_USE_MOCK_DATA === 'true' ||
  (import.meta.env.DEV === true && !import.meta.env.VITE_SUPABASE_URL)
