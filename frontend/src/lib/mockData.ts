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
    platforms:      ['google', 'zomato', 'swiggy'],
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
// ─────────────────────────────────────────────────────────────

export const MOCK_REVIEWS: DBReview[] = [
  // ── Pasta & More ─────────────────────────────────────────
  {
    id:            'review-001',
    user_id:       MOCK_USER_PASTA,
    platform:      'google',
    reviewer_name: 'Ananya Krishnan',
    rating:        5,
    review_text:   'Visited for our anniversary dinner last Friday and it was absolutely magical. Chef Marco\'s carbonara is simply the best I\'ve had outside of Rome — perfectly creamy, not too heavy. Our server Priya was attentive without being intrusive and even brought us a complimentary limoncello at the end. The candlelit ambiance made the whole evening feel truly special. Will definitely be back for the truffle risotto next time!',
    review_date:   '2024-11-08T19:45:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['carbonara', 'ambiance', 'server Priya', 'date night', 'limoncello'], complaints: [] },
    status:        'posted',
    created_at:    '2024-11-08T22:10:00Z',
  },
  {
    id:            'review-002',
    user_id:       MOCK_USER_PASTA,
    platform:      'google',
    reviewer_name: 'Rohan Mehta',
    rating:        4,
    review_text:   'The pasta here is genuinely excellent — had the cacio e pepe and my girlfriend had the arrabbiata, both were cooked perfectly al dente. Only issue was a 45-minute wait for a table on a Tuesday! They really need a reservation system or at least a waitlist app. Food taste: 5/5. Overall experience: 4/5 because of the wait.',
    review_date:   '2024-11-05T20:30:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['cacio e pepe', 'arrabbiata', 'pasta quality'], complaints: ['45-minute wait', 'no reservation system'] },
    status:        'draft',
    created_at:    '2024-11-05T23:00:00Z',
  },
  {
    id:            'review-003',
    user_id:       MOCK_USER_PASTA,
    platform:      'google',
    reviewer_name: 'Vikram Sood',
    rating:        1,
    review_text:   'Absolute disaster. We waited 20 minutes to be seated despite having a booking confirmation in hand. Then our pasta arrived stone cold — the lasagna tasted like it had been sitting out for hours. The server (tall guy with glasses, didn\'t catch his name) was dismissive when we raised the issue and walked away mid-sentence. Spent ₹3,400 for a ruined birthday dinner. This used to be a great spot. Whatever changed, please fix it.',
    review_date:   '2024-11-02T21:15:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: [], complaints: ['cold food', 'rude server', '20-minute wait despite booking', 'overpriced', 'birthday ruined'] },
    status:        'posted',
    created_at:    '2024-11-03T08:40:00Z',
  },
  {
    id:            'review-004',
    user_id:       MOCK_USER_PASTA,
    platform:      'zomato',
    reviewer_name: 'Preethi Nair',
    rating:        5,
    review_text:   'Ordered the tiramisu and pasta primavera for delivery. Everything arrived piping hot in 32 minutes during peak Friday dinner hour — remarkable. The tiramisu was silky, perfectly balanced between mascarpone and espresso, not overly sweet. The pasta was actually al dente even after the delivery ride, which is honestly a miracle. Going to make this my Friday ritual.',
    review_date:   '2024-11-01T20:55:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['tiramisu', 'pasta primavera', 'fast delivery', 'hot on arrival', 'al dente'], complaints: [] },
    status:        'posted',
    created_at:    '2024-11-01T23:30:00Z',
  },
  {
    id:            'review-005',
    user_id:       MOCK_USER_PASTA,
    platform:      'zomato',
    reviewer_name: 'Arjun Kapoor',
    rating:        2,
    review_text:   'Ordered the mushroom risotto and garlic bread. What arrived was spaghetti bolognese and a caesar salad — a completely different order. Called the restaurant number three times over 25 minutes, no one answered. Raised a Zomato complaint and got a copy-paste response three hours later. The food that arrived wasn\'t even bad, but this is the second time I\'ve been sent the wrong order. Just own the mistake and actually fix it.',
    review_date:   '2024-10-28T19:20:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: [], complaints: ['wrong order', 'phone unanswered', 'slow complaint response', 'repeat issue'] },
    status:        'pending',
    created_at:    '2024-10-28T22:45:00Z',
  },
  {
    id:            'review-006',
    user_id:       MOCK_USER_PASTA,
    platform:      'swiggy',
    reviewer_name: 'Meera Joshi',
    rating:        3,
    review_text:   'Had the arrabiata and minestrone soup delivered. Both were decent — not bad, just not particularly memorable either. For ₹850 a head I expected a bit more depth of flavour. The portions were also on the smaller side. It\'s fine if you\'re craving Italian and are nearby, but I wouldn\'t go out of my way or pay delivery charges for this again.',
    review_date:   '2024-10-25T13:10:00Z',
    location_name: 'Pasta & More — Bandra West',
    tags:          { praises: ['decent taste'], complaints: ['small portions', 'value for money', 'bland flavour'] },
    status:        'pending',
    created_at:    '2024-10-25T15:00:00Z',
  },

  // ── The Royal Table ───────────────────────────────────────
  {
    id:            'review-007',
    user_id:       MOCK_USER_ROYAL,
    platform:      'google',
    reviewer_name: 'Siddharth Rao',
    rating:        5,
    review_text:   'The Royal Table continues to be the gold standard for fine dining in Delhi. The eight-course tasting menu was a masterpiece — each dish more thoughtful than the last. The aged duck breast with cherry reduction was revelatory. Special mention to James on the sommelier team who paired wines perfectly without being pretentious about it. The room is beautiful, the service impeccable. Worth every rupee.',
    review_date:   '2024-11-06T21:00:00Z',
    location_name: 'The Royal Table — The Oberoi, New Delhi',
    tags:          { praises: ['tasting menu', 'duck breast', 'wine pairing', 'sommelier James', 'service', 'ambiance'], complaints: [] },
    status:        'posted',
    created_at:    '2024-11-07T09:15:00Z',
  },
  {
    id:            'review-008',
    user_id:       MOCK_USER_ROYAL,
    platform:      'google',
    reviewer_name: 'Nisha Patel',
    rating:        3,
    review_text:   'The food is certainly well-prepared and the setting is beautiful. But for ₹14,000 per person I expected an emotional experience, not just technically correct dishes. The portion sizes were almost comically small even by tasting-menu standards. Service was polished but robotic — our waiter recited descriptions like he was reading off a teleprompter. The wine list is impressive. Three stars: high execution, low soul.',
    review_date:   '2024-10-30T20:40:00Z',
    location_name: 'The Royal Table — The Oberoi, New Delhi',
    tags:          { praises: ['technique', 'setting', 'wine list'], complaints: ['small portions', 'overpriced', 'robotic service', 'emotionally flat'] },
    status:        'draft',
    created_at:    '2024-10-31T10:00:00Z',
  },
  {
    id:            'review-009',
    user_id:       MOCK_USER_ROYAL,
    platform:      'zomato',
    reviewer_name: 'Deepak Malhotra',
    rating:        1,
    review_text:   'Had a confirmed reservation for our 10th anniversary. Arrived on time at 8 PM only to be told there was "a system mix-up" and our table had been double-booked. We waited at the bar for over 70 minutes — standing, because the bar stools were taken — with zero complimentary drinks offered. When the manager finally appeared, he seemed annoyed that we were frustrated rather than sorry. We eventually left and had pizza down the road. For a restaurant positioning itself as ultra-luxury, the customer recovery was genuinely appalling.',
    review_date:   '2024-10-20T23:05:00Z',
    location_name: 'The Royal Table — The Oberoi, New Delhi',
    tags:          { praises: [], complaints: ['lost reservation', '70-minute wait', 'no apology drinks', 'dismissive manager', 'anniversary ruined'] },
    status:        'pending',
    created_at:    '2024-10-21T07:30:00Z',
  },
  {
    id:            'review-010',
    user_id:       MOCK_USER_ROYAL,
    platform:      'tripadvisor',
    reviewer_name: 'Catherine Osei',
    rating:        4,
    review_text:   'Visited for a business dinner last month and booked the private dining room. Beautifully appointed — the room has a quiet confidence to it that sets the right tone for serious conversation. The wagyu was a highlight, and the lobster bisque was superb. The wine list is world-class. Knocking one star off only because the pacing between courses felt rushed — we were pushed through the meal in under two hours for a tasting format. Otherwise an excellent experience.',
    review_date:   '2024-10-15T19:30:00Z',
    location_name: 'The Royal Table — The Oberoi, New Delhi',
    tags:          { praises: ['private dining room', 'wagyu', 'lobster bisque', 'wine list', 'ambiance'], complaints: ['rushed pacing between courses'] },
    status:        'posted',
    created_at:    '2024-10-16T08:00:00Z',
  },
  {
    id:            'review-011',
    user_id:       MOCK_USER_ROYAL,
    platform:      'tripadvisor',
    reviewer_name: 'Ramesh Iyer',
    rating:        2,
    review_text:   'Expected a lot more from a restaurant with this reputation. The sea bass was overcooked and dry, the mushroom risotto was underseasoned to the point of tasting like hot water with rice. We sat for 15 minutes before anyone took our drinks order. The bread service was genuinely excellent — crusty, warm, excellent butter — but you can\'t save a ₹22,000 bill on the strength of bread alone. Deeply disappointing.',
    review_date:   '2024-10-08T21:50:00Z',
    location_name: 'The Royal Table — The Oberoi, New Delhi',
    tags:          { praises: ['bread service'], complaints: ['overcooked sea bass', 'underseasoned risotto', 'slow service', 'overpriced', 'disappointing'] },
    status:        'pending',
    created_at:    '2024-10-09T09:20:00Z',
  },

  // ── Burger Rush ───────────────────────────────────────────
  {
    id:            'review-012',
    user_id:       MOCK_USER_BURGER,
    platform:      'google',
    reviewer_name: 'Kunal Sharma',
    rating:        4,
    review_text:   'Burger Rush never disappoints. Got the double smash with extra special sauce and a side of loaded fries. The patty had a perfect dark crust from the griddle, cheese was fully melted into every crevice, and the brioche bun held together through to the last bite. Was in and out in 9 minutes during lunch rush. Exactly what a great burger joint should be. Lose one star because the loaded fries have gotten a bit stingy with the cheese lately.',
    review_date:   '2024-11-07T13:20:00Z',
    location_name: 'Burger Rush — Koramangala, Bengaluru',
    tags:          { praises: ['double smash burger', 'special sauce', 'fast service', 'brioche bun', 'cheese melt'], complaints: ['loaded fries - less cheese lately'] },
    status:        'draft',
    created_at:    '2024-11-07T14:00:00Z',
  },
  {
    id:            'review-013',
    user_id:       MOCK_USER_BURGER,
    platform:      'zomato',
    reviewer_name: 'Sanjana Bose',
    rating:        4,
    review_text:   'Third order from Burger Rush this month and the quality is remarkably consistent for a quick-service restaurant. The burgers always arrive fresh, the buns are toasted correctly, and the patties are never overdone. Their packaging is also excellent — everything was intact and separated properly. The only reason I don\'t give 5 stars: the fries do go soft if you don\'t eat them within 10 minutes of delivery. Order and eat immediately for full marks.',
    review_date:   '2024-11-03T19:45:00Z',
    location_name: 'Burger Rush — Koramangala, Bengaluru',
    tags:          { praises: ['consistency', 'freshness', 'packaging', 'toasted buns'], complaints: ['fries go soft quickly'] },
    status:        'pending',
    created_at:    '2024-11-03T21:10:00Z',
  },
  {
    id:            'review-014',
    user_id:       MOCK_USER_BURGER,
    platform:      'swiggy',
    reviewer_name: 'Aditya Verma',
    rating:        5,
    review_text:   'I have tried every burger joint in Bangalore and Burger Rush is UNDEFEATED. That smash burger with the caramelised onions and special sauce is literal perfection. The crinkle-cut fries were crispy even after 35 minutes of delivery — how are they doing that?! The mango milkshake is criminally underrated. 5 stars without hesitation, no notes.',
    review_date:   '2024-10-29T20:15:00Z',
    location_name: 'Burger Rush — Koramangala, Bengaluru',
    tags:          { praises: ['smash burger', 'caramelised onions', 'special sauce', 'crispy fries', 'mango milkshake', 'delivery'], complaints: [] },
    status:        'posted',
    created_at:    '2024-10-29T22:00:00Z',
  },
  {
    id:            'review-015',
    user_id:       MOCK_USER_BURGER,
    platform:      'swiggy',
    reviewer_name: 'Tanvi Reddy',
    rating:        2,
    review_text:   'Ordered the Classic Burger with absolutely no pickles — I have a strong aversion to them. Received the burger with what looked like extra pickles. The fries were completely soggy, clearly had been sitting too long before dispatch. The patty was lukewarm. This is the second time this specific location has messed up my order. I genuinely like your burgers when they\'re right, which is why I keep giving chances. Please sort out your order accuracy.',
    review_date:   '2024-10-22T18:30:00Z',
    location_name: 'Burger Rush — Koramangala, Bengaluru',
    tags:          { praises: [], complaints: ['wrong toppings - pickles despite request', 'soggy fries', 'lukewarm patty', 'repeat order error'] },
    status:        'pending',
    created_at:    '2024-10-22T20:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────
// Responses with edit histories (8)
// ─────────────────────────────────────────────────────────────

export const MOCK_RESPONSES: DBResponse[] = [
  // ── Response 001: review-001 (5★, Pasta & More, Google) ──
  {
    id:          'response-001',
    review_id:   'review-001',
    user_id:     MOCK_USER_PASTA,
    content:     'Thank you so much, Ananya! Chef Marco and Priya will both be thrilled to read this — your words about the carbonara and the service genuinely made our morning. An anniversary dinner is one of the most important evenings of the year, and it means everything to know we were part of yours. We can\'t wait to welcome you back for the truffle risotto — and perhaps another limoncello on us. — Sofia, Manager',
    version:     3,
    is_active:   true,
    posted_at:   '2024-11-09T10:30:00Z',
    edit_history: [
      {
        version:   1,
        content:   'Thank you so much for this wonderful review! We are absolutely delighted that you enjoyed your anniversary dinner with us and that Chef Marco\'s carbonara and our ambiance made your evening special. Your kind words about Priya have been passed along to her and she is thrilled. We look forward to welcoming you back soon for the truffle risotto. Thank you for choosing Pasta & More! — The Pasta & More Team',
        action:    'AI generated',
        timestamp: '2024-11-09T09:45:00Z',
      },
      {
        version:   2,
        content:   'Thank you, Ananya! Chef Marco and Priya will both be overjoyed to read this — your kind words about the carbonara and the service made our morning. An anniversary dinner is one of the most special evenings of the year, and knowing we were part of yours means everything. Come back soon for that truffle risotto — and we\'ll make sure there\'s a limoncello waiting. — Sofia, Manager',
        action:    'Shortened + personalised sign-off',
        timestamp: '2024-11-09T10:00:00Z',
      },
    ],
    created_at:  '2024-11-09T09:45:00Z',
    updated_at:  '2024-11-09T10:30:00Z',
  },

  // ── Response 002: review-003 (1★, Pasta & More, Google) ──
  {
    id:          'response-002',
    review_id:   'review-003',
    user_id:     MOCK_USER_PASTA,
    content:     'Vikram, I am so sorry. A birthday dinner should be one of the best evenings of the year — what you experienced was the opposite, and there is no acceptable explanation. Cold lasagna, a long wait despite a booking, and a dismissive server: none of that should ever happen, and I want you to know this has been addressed with our team directly. I\'d like to personally make this right. Please reach out to me at sofia@pastaandmore.com and I\'ll arrange a dinner for you and your guests — on us, no conditions. — Sofia, Manager',
    version:     4,
    is_active:   true,
    posted_at:   '2024-11-04T11:00:00Z',
    edit_history: [
      {
        version:   1,
        content:   'Thank you for bringing this to our attention. We sincerely apologise for the poor experience you had during your birthday dinner. We take all feedback seriously and will be addressing the issues with cold food and service quality with our team. We hope you will give us another opportunity to serve you better. — The Pasta & More Team',
        action:    'AI generated',
        timestamp: '2024-11-03T14:00:00Z',
      },
      {
        version:   2,
        content:   'Vikram, I am deeply sorry about your birthday dinner. Cold food, a wait despite a confirmed booking, and a server who walked away mid-conversation — none of that is acceptable. This has been escalated to our kitchen and floor managers. I would love the opportunity to make it right and host you personally. — Sofia, Manager',
        action:    'Made personal, added accountability',
        timestamp: '2024-11-03T14:30:00Z',
      },
      {
        version:   3,
        content:   'Vikram, I am so sorry. A birthday dinner should be one of the best evenings of the year — what you experienced was the opposite. Cold food, a long wait despite a booking, and a dismissive server: none of that is acceptable and all three have been addressed directly with our team. I\'d like to personally make this right. Please email me at sofia@pastaandmore.com — I want to host you and your guests at no cost. — Sofia, Manager',
        action:    'Added specific remedy + contact',
        timestamp: '2024-11-03T15:00:00Z',
      },
    ],
    created_at:  '2024-11-03T14:00:00Z',
    updated_at:  '2024-11-04T11:00:00Z',
  },

  // ── Response 003: review-004 (5★, Pasta & More, Zomato) ──
  {
    id:          'response-003',
    review_id:   'review-004',
    user_id:     MOCK_USER_PASTA,
    content:     'Preethi, this made our whole Friday! Getting food to you hot and al dente across Mumbai in under 35 minutes — that\'s our delivery team doing their absolute best, and your review tells them it\'s working. The tiramisu is our most labour-intensive dessert and we\'re thrilled it landed perfectly. We\'ll hold that Friday ritual spot open for you. 🍝 — Sofia, Manager',
    version:     3,
    is_active:   true,
    posted_at:   '2024-11-02T09:00:00Z',
    edit_history: [
      {
        version:   1,
        content:   'Thank you so much for your wonderful review, Preethi! We are so happy that your delivery order arrived hot and that you enjoyed the tiramisu and pasta primavera. Our delivery team works very hard to ensure food arrives in perfect condition and your feedback motivates them to keep up the great work. We look forward to being your Friday ritual! — The Pasta & More Team',
        action:    'AI generated',
        timestamp: '2024-11-01T23:45:00Z',
      },
      {
        version:   2,
        content:   'Preethi, this is such a lovely review — thank you! Getting pasta to you al dente across Mumbai during Friday peak hour is exactly what our delivery team trains for. The tiramisu takes our kitchen team hours to prepare and knowing it arrived perfectly is incredibly rewarding. Consider that Friday slot yours! — Sofia, Manager',
        action:    'Made warmer + highlighted team pride',
        timestamp: '2024-11-02T08:00:00Z',
      },
    ],
    created_at:  '2024-11-01T23:45:00Z',
    updated_at:  '2024-11-02T09:00:00Z',
  },

  // ── Response 004: review-005 (2★, Pasta & More, Zomato) ──
  {
    id:          'response-004',
    review_id:   'review-005',
    user_id:     MOCK_USER_PASTA,
    content:     'Arjun, you\'re completely right, and I\'m sorry. A wrong order — twice — plus an unanswered phone is genuinely unacceptable and I\'m not going to dress it up. I\'ve reviewed our fulfilment process and the phone line situation directly, and changes are being made this week. I\'d like to refund your last order and offer you a fresh delivery on us, at a time that suits you — please message us on Zomato or email feedback@pastaandmore.com and I\'ll sort it personally. — Sofia, Manager',
    version:     3,
    is_active:   false,
    posted_at:   null,
    edit_history: [
      {
        version:   1,
        content:   'We are very sorry to hear about your order experience, Arjun. Receiving the wrong items is not acceptable and we apologise for the inconvenience caused. We are looking into why our phone lines were unresponsive and will ensure this does not happen again. Please contact us and we will make it right. — Pasta & More',
        action:    'AI generated',
        timestamp: '2024-10-29T09:00:00Z',
      },
      {
        version:   2,
        content:   'Arjun, I\'m sorry — a wrong order and an unanswered phone is a double failure and you deserve better. This has been raised with our operations manager and I\'m personally reviewing the fulfilment process. Please reach out to feedback@pastaandmore.com so I can arrange a refund and a fresh delivery on us. — Sofia, Manager',
        action:    'Owned the failure, added remedy',
        timestamp: '2024-10-29T10:00:00Z',
      },
    ],
    created_at:  '2024-10-29T09:00:00Z',
    updated_at:  '2024-10-29T10:30:00Z',
  },

  // ── Response 005: review-007 (5★, The Royal Table, Google) ──
  {
    id:          'response-005',
    review_id:   'review-007',
    user_id:     MOCK_USER_ROYAL,
    content:     'Dear Siddharth, thank you for such a gracious and thoughtful review. It is guests like you — who notice the intention behind each course, and who allow James the room to guide the evening — who make our work deeply meaningful. The aged duck with cherry reduction was developed over six weeks of R&D, and hearing that it was revelatory is the highest compliment our kitchen could receive. We look forward to welcoming you again. — James Whitfield, General Manager',
    version:     3,
    is_active:   true,
    posted_at:   '2024-11-08T10:00:00Z',
    edit_history: [
      {
        version:   1,
        content:   'Dear Siddharth, thank you so much for your wonderful review of The Royal Table. We are absolutely delighted that you enjoyed your eight-course tasting menu experience and that our sommelier James was able to enhance your evening with his wine pairings. Your kind words mean a great deal to our entire team. We hope to welcome you back soon. — James Whitfield, General Manager',
        action:    'AI generated',
        timestamp: '2024-11-07T10:00:00Z',
      },
      {
        version:   2,
        content:   'Dear Siddharth, thank you for a review that captures exactly what we set out to create. That you noticed James\'s ability to guide without pretension — and that the duck resonated so deeply — tells me the evening landed as intended. Our kitchen team has been informed and are genuinely moved. We look forward to your return. — James Whitfield, General Manager',
        action:    'More refined language, added kitchen context',
        timestamp: '2024-11-07T11:00:00Z',
      },
    ],
    created_at:  '2024-11-07T10:00:00Z',
    updated_at:  '2024-11-08T10:00:00Z',
  },

  // ── Response 006: review-009 (1★, The Royal Table, Zomato) ──
  {
    id:          'response-006',
    review_id:   'review-009',
    user_id:     MOCK_USER_ROYAL,
    content:     'Dear Deepak, I read your review with great sadness and no qualification. Losing a reservation on your 10th anniversary, leaving you standing at the bar without so much as a glass of water, and then meeting a manager who failed to offer a genuine apology — this represents a complete failure of what we stand for. I take personal responsibility for what happened that evening. I would be honoured if you would allow me to host you and your partner for a private anniversary dinner, at a time of your choosing, as my guest. Please write to me directly at gm@theroyaltable.in. — James Whitfield, General Manager',
    version:     4,
    is_active:   true,
    posted_at:   '2024-10-22T09:00:00Z',
    edit_history: [
      {
        version:   1,
        content:   'Dear Deepak, we are deeply sorry to hear about your experience on what should have been a very special evening. A double booking is a serious operational failure and we sincerely apologise for the inconvenience caused to you and your partner on your anniversary. We will be reviewing our reservation management system immediately. Please contact us so we can discuss how to make this right. — The Royal Table',
        action:    'AI generated',
        timestamp: '2024-10-21T10:00:00Z',
      },
      {
        version:   2,
        content:   'Dear Deepak, there is no adequate justification for what happened on your anniversary. A lost reservation, an unacceptable wait with no hospitality offered, and then a manager who failed to respond with appropriate care — all of this is a breach of our standards. I would like to personally host you for a private dinner. Please contact me at gm@theroyaltable.in. — James Whitfield, General Manager',
        action:    'Full accountability, offered personal remedy',
        timestamp: '2024-10-21T11:30:00Z',
      },
      {
        version:   3,
        content:   'Dear Deepak, I read this with real sadness. There is nothing I can say that will restore what we took from your anniversary evening — but I can own it completely. A lost reservation. Seventy minutes standing at a bar. A manager who appeared annoyed rather than devastated. Every one of these is a failure. I would be honoured to host you privately as my personal guests. Please write to gm@theroyaltable.in. — James Whitfield, General Manager',
        action:    'Humanised, listed specific failures',
        timestamp: '2024-10-21T13:00:00Z',
      },
    ],
    created_at:  '2024-10-21T10:00:00Z',
    updated_at:  '2024-10-22T09:00:00Z',
  },

  // ── Response 007: review-012 (4★, Burger Rush, Google) ──
  {
    id:          'response-007',
    review_id:   'review-012',
    user_id:     MOCK_USER_BURGER,
    content:     'Kunal — double smash with extra sauce, in and out in 9 minutes. That\'s the dream and we\'re glad we delivered it. Noted on the loaded fries cheese situation — we\'ve flagged it to the Koramangala kitchen, so your next round should be more loaded than ever. See you at lunch. — The Burger Rush Team',
    version:     3,
    is_active:   true,
    posted_at:   '2024-11-08T09:00:00Z',
    edit_history: [
      {
        version:   1,
        content:   'Thank you so much for your review, Kunal! We\'re really happy to hear that you enjoyed your double smash burger and that our service was fast during the lunch rush. We take all feedback seriously and will look into the loaded fries cheese situation. We hope to see you again soon! — The Burger Rush Team',
        action:    'AI generated',
        timestamp: '2024-11-07T15:00:00Z',
      },
      {
        version:   2,
        content:   'Kunal, 9 minutes during lunch rush — our kitchen team will take that as a compliment. Thanks for the heads-up on the loaded fries, we\'re on it. The double smash will keep being the double smash. Come back soon. — The Burger Rush Team',
        action:    'Shortened and punched up the voice',
        timestamp: '2024-11-07T15:30:00Z',
      },
    ],
    created_at:  '2024-11-07T15:00:00Z',
    updated_at:  '2024-11-08T09:00:00Z',
  },

  // ── Response 008: review-014 (5★, Burger Rush, Swiggy) ──
  {
    id:          'response-008',
    review_id:   'review-014',
    user_id:     MOCK_USER_BURGER,
    content:     'Aditya — UNDEFEATED is a standard we fully intend to defend. Crispy fries after 35 minutes of delivery is a packaging trick we\'ve been perfecting for two years (no spoilers, trade secret). Genuinely stoked the mango milkshake finally got its flowers. No notes back. — The Burger Rush Team',
    version:     3,
    is_active:   true,
    posted_at:   '2024-10-30T10:00:00Z',
    edit_history: [
      {
        version:   1,
        content:   'Thank you so much for the amazing review, Aditya! We are thrilled to be your top burger pick in Bangalore. Our team works hard to ensure the smash burger and fries arrive in perfect condition and we\'re glad the packaging is working. The mango milkshake deserves all the love! See you next time! — The Burger Rush Team',
        action:    'AI generated',
        timestamp: '2024-10-29T22:30:00Z',
      },
      {
        version:   2,
        content:   'Aditya, UNDEFEATED is a title we take very seriously. The crispy-fries-after-35-minutes thing is a result of two years of packaging R&D — we\'re glad it\'s working. Thrilled the milkshake is finally getting recognised. Thanks for this. — The Burger Rush Team',
        action:    'Matched the energy of the review, more personality',
        timestamp: '2024-10-30T09:00:00Z',
      },
    ],
    created_at:  '2024-10-29T22:30:00Z',
    updated_at:  '2024-10-30T10:00:00Z',
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
// ─────────────────────────────────────────────────────────────

export const USE_MOCK_DATA =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
