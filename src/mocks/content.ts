/**
 * Human-written source copy for the seed. Everything here is real-sounding
 * merchandising language for Magic Show, a Gulf-region footwear & apparel
 * retailer — no lorem ipsum, no "Item 1".
 */

export const BRAND_NAMES = [
  'Aurelian',
  'Northmoor',
  'Vela Studio',
  'Calder & Co.',
  'Sable Row',
  'Kestrel Athletics',
  'Mirador',
  'Halcyon Works',
  'Terra Bianca',
  'Lumen Field',
] as const;

export const BRAND_COUNTRIES = [
  'Italy',
  'United Kingdom',
  'Portugal',
  'Spain',
  'Germany',
  'United Arab Emirates',
  'Denmark',
  'Türkiye',
] as const;

/** [name, parentName | null] — a two-level tree, exactly like the Blade admin. */
export const CATEGORY_TREE: readonly (readonly [string, string | null])[] = [
  ['Footwear', null],
  ['Sneakers', 'Footwear'],
  ['Boots', 'Footwear'],
  ['Loafers & Flats', 'Footwear'],
  ['Sandals', 'Footwear'],
  ['Heels', 'Footwear'],
  ['Apparel', null],
  ['Outerwear', 'Apparel'],
  ['Knitwear', 'Apparel'],
  ['Shirts & Tops', 'Apparel'],
  ['Accessories', null],
  ['Bags', 'Accessories'],
  ['Belts & Small Leather', 'Accessories'],
];

export const COLORS: readonly (readonly [string, string, string])[] = [
  ['Onyx Black', '#111114', 'Black'],
  ['Bone White', '#f2ece1', 'White'],
  ['Sand Dune', '#d8c3a3', 'Beige'],
  ['Espresso', '#4a332a', 'Brown'],
  ['Cognac', '#9c5a2b', 'Brown'],
  ['Slate Grey', '#5d6169', 'Grey'],
  ['Desert Clay', '#c07a5e', 'Red'],
  ['Burnt Sienna', '#a8462b', 'Red'],
  ['Deep Olive', '#4c5231', 'Green'],
  ['Sea Glass', '#7fa8a0', 'Green'],
  ['Midnight Navy', '#1f2a44', 'Blue'],
  ['Cobalt', '#2a54c6', 'Blue'],
  ['Powder Blue', '#a9c4dd', 'Blue'],
  ['Dusty Rose', '#c99a9a', 'Pink'],
  ['Saffron', '#e0a12c', 'Yellow'],
  ['Plum Wine', '#5c2b45', 'Purple'],
];

export const MATERIALS: readonly (readonly [string, string])[] = [
  ['Full-Grain Leather', 'Leather'],
  ['Suede', 'Leather'],
  ['Nubuck', 'Leather'],
  ['Italian Calfskin', 'Leather'],
  ['Organic Cotton Canvas', 'Textile'],
  ['Merino Wool', 'Textile'],
  ['Technical Mesh', 'Synthetic'],
  ['Recycled Nylon', 'Synthetic'],
  ['Natural Rubber', 'Rubber'],
  ['Cork Footbed', 'Composite'],
];

export const SEASONS: readonly (readonly [string, string])[] = [
  ['Spring / Summer 25', 'ss25'],
  ['Autumn / Winter 25', 'aw25'],
  ['Spring / Summer 26', 'ss26'],
  ['All Season', 'all-season'],
];

/** [name, scale, sortOrder] */
export const SIZES: readonly (readonly [string, 'eu' | 'uk' | 'us' | 'alpha'])[] = [
  ['EU 36', 'eu'],
  ['EU 37', 'eu'],
  ['EU 38', 'eu'],
  ['EU 39', 'eu'],
  ['EU 40', 'eu'],
  ['EU 41', 'eu'],
  ['EU 42', 'eu'],
  ['EU 43', 'eu'],
  ['EU 44', 'eu'],
  ['EU 45', 'eu'],
  ['XS', 'alpha'],
  ['S', 'alpha'],
  ['M', 'alpha'],
  ['L', 'alpha'],
  ['XL', 'alpha'],
];

/** [productName, categoryName, basePrice, blurb] */
export const PRODUCTS: readonly (readonly [string, string, number, string])[] = [
  ['Meridian Low Sneaker', 'Sneakers', 640, 'A pared-back court silhouette on a cupsole, cut from full-grain leather that softens with wear.'],
  ['Meridian High Sneaker', 'Sneakers', 720, 'The Meridian raised to the ankle, with a padded collar and a reinforced heel counter.'],
  ['Drift Runner', 'Sneakers', 545, 'Everyday running-inspired trainer with a knitted upper and a compression-moulded midsole.'],
  ['Cassia Court Sneaker', 'Sneakers', 480, 'Slim tennis profile in soft calfskin with a tonal rubber outsole.'],
  ['Halden Trail Sneaker', 'Sneakers', 810, 'Grippy lugged outsole, water-resistant nubuck, built for shoulder-season city trails.'],
  ['Vega Slip-On', 'Sneakers', 395, 'Elasticated gore panels and a clean vamp — the fastest shoe in the collection.'],
  ['Orin Canvas Sneaker', 'Sneakers', 310, 'Organic cotton canvas over a vulcanised sole. Washes well, ages better.'],
  ['Solene Retro Trainer', 'Sneakers', 590, 'Seventies-leaning runner with suede overlays and a gum outsole.'],
  ['Ardleigh Chelsea Boot', 'Boots', 1180, 'A classic Chelsea in Italian calfskin, Goodyear-welted and resoleable.'],
  ['Bramwell Lace Boot', 'Boots', 1320, 'Six-eyelet derby boot on a storm welt, made for a wet commute.'],
  ['Kestrel Hiker', 'Boots', 1090, 'Padded ankle support, waxed laces, and a Vibram-style lugged sole.'],
  ['Marlowe Desert Boot', 'Boots', 870, 'Two-eyelet suede desert boot on a crepe sole. Unstructured and light.'],
  ['Fenwick Combat Boot', 'Boots', 1240, 'A heavier last with a metal hardware kit and a shock-absorbing footbed.'],
  ['Isolde Riding Boot', 'Boots', 1490, 'Knee-height leather with an elasticated calf gusset and a stacked heel.'],
  ['Calder Penny Loafer', 'Loafers & Flats', 940, 'Hand-stitched apron with a classic penny strap, on a lightweight leather sole.'],
  ['Rowan Horsebit Loafer', 'Loafers & Flats', 1080, 'Polished hardware, a softly rounded last, and a fully leather-lined interior.'],
  ['Neve Ballet Flat', 'Loafers & Flats', 520, 'A low-cut ballet shape in supple nappa with a padded footbed.'],
  ['Pell Driving Shoe', 'Loafers & Flats', 690, 'Rubber-pebbled sole that wraps the heel, made for long drives.'],
  ['Thea Mule', 'Loafers & Flats', 610, 'A backless loafer with a square toe and a whipstitched trim.'],
  ['Lira Slide Sandal', 'Sandals', 340, 'Wide moulded strap over a contoured cork footbed.'],
  ['Cove Cross Sandal', 'Sandals', 420, 'Crossed leather straps and an adjustable ankle buckle.'],
  ['Sable Espadrille', 'Sandals', 380, 'Braided jute midsole with a canvas upper and a soft toe box.'],
  ['Juno Strap Sandal', 'Sandals', 460, 'Three-strap silhouette on a low block heel.'],
  ['Selene Stiletto', 'Heels', 980, 'A 90mm pointed stiletto in satin-finish leather, with a leather-lined insole.'],
  ['Cora Block Heel', 'Heels', 820, 'A stable 60mm block heel that carries a full day of meetings.'],
  ['Verity Slingback', 'Heels', 890, 'Pointed slingback with an adjustable elastic heel strap.'],
  ['Nadia Platform Heel', 'Heels', 1050, 'A concealed platform takes the pitch out of a 110mm heel.'],
  ['Northmoor Wool Overcoat', 'Outerwear', 2450, 'Double-faced merino in a relaxed drop-shoulder cut, fully lined.'],
  ['Harlow Quilted Jacket', 'Outerwear', 1380, 'Diamond-quilted recycled nylon with a corduroy collar.'],
  ['Vela Trench Coat', 'Outerwear', 1990, 'Water-repellent cotton gabardine, storm flap, removable belt.'],
  ['Ridgeway Field Jacket', 'Outerwear', 1240, 'Four-pocket waxed cotton shell with a button-through storm placket.'],
  ['Kell Puffer Vest', 'Outerwear', 890, 'Lightweight recycled fill that packs into its own inner pocket.'],
  ['Aster Cashmere Crew', 'Knitwear', 1150, 'Two-ply grade-A cashmere knitted to a fine 12-gauge.'],
  ['Bryn Cable Knit', 'Knitwear', 780, 'Chunky lambswool cable with a rolled crew neckline.'],
  ['Corin Merino Half-Zip', 'Knitwear', 690, 'Fine-gauge merino with a stand collar and a matte zip pull.'],
  ['Elin Ribbed Cardigan', 'Knitwear', 720, 'A relaxed rib cardigan with tonal shell buttons.'],
  ['Oxley Oxford Shirt', 'Shirts & Tops', 420, 'Yarn-dyed Oxford cotton with a soft-roll button-down collar.'],
  ['Perrin Poplin Shirt', 'Shirts & Tops', 460, 'Crisp compact-cotton poplin in a straight, tuckable cut.'],
  ['Mara Silk Blouse', 'Shirts & Tops', 780, 'Sandwashed silk with a concealed placket and a fluid drape.'],
  ['Tarn Heavyweight Tee', 'Shirts & Tops', 210, '240gsm organic cotton, garment-dyed so the colour holds.'],
  ['Wren Linen Shirt', 'Shirts & Tops', 490, 'European flax in a breathable open weave for high summer.'],
  ['Alden Weekender Bag', 'Bags', 1680, 'Vegetable-tanned leather holdall with a detachable webbing strap.'],
  ['Sorrel Tote', 'Bags', 1120, 'A structured shopper that takes a 15" laptop without slouching.'],
  ['Mira Crossbody', 'Bags', 860, 'Compact body with a magnetic flap and an adjustable chain strap.'],
  ['Fenn Backpack', 'Bags', 980, 'Roll-top recycled nylon with a padded laptop sleeve.'],
  ['Ivo Card Holder', 'Belts & Small Leather', 240, 'Four-card slim holder in the same calfskin as our loafers.'],
  ['Lowen Leather Belt', 'Belts & Small Leather', 380, '35mm bridle leather with a solid brass buckle.'],
  ['Hale Bifold Wallet', 'Belts & Small Leather', 420, 'Eight card slots, two note sections, edge-painted by hand.'],
  ['Nyla Woven Belt', 'Belts & Small Leather', 290, 'Elastic woven body with leather tabs — sizes with you.'],
];

export const FIRST_NAMES = [
  'Layla', 'Omar', 'Nadia', 'Youssef', 'Mariam', 'Karim', 'Salma', 'Rami',
  'Dana', 'Faisal', 'Hind', 'Tarek', 'Reem', 'Ziad', 'Noor', 'Hassan',
  'Amira', 'Sami', 'Lina', 'Adel', 'Farah', 'Bilal', 'Rania', 'Waleed',
  'Sophie', 'Marcus', 'Elena', 'Jonas', 'Clara', 'Theo', 'Ines', 'Lukas',
  'Priya', 'Arjun', 'Mei', 'Daniel', 'Isabel', 'Nikolai', 'Grace', 'Andres',
] as const;

export const LAST_NAMES = [
  'Al-Sayed', 'Haddad', 'Nasser', 'Khalil', 'Mansour', 'Darwish', 'Fadel',
  'Zahra', 'Barakat', 'Chalhoub', 'Rahim', 'Saleh', 'Tannous', 'Yassin',
  'Whitfield', 'Lindqvist', 'Moreau', 'Bergmann', 'Okafor', 'Ferreira',
  'Novak', 'Castellano', 'Halvorsen', 'Ricci', 'Brandt', 'Silva', 'Petrov',
  'Marchetti', 'Duarte', 'Nakamura',
] as const;

export const CITIES: readonly (readonly [string, string, string])[] = [
  ['Dubai', 'Dubai', 'United Arab Emirates'],
  ['Abu Dhabi', 'Abu Dhabi', 'United Arab Emirates'],
  ['Sharjah', 'Sharjah', 'United Arab Emirates'],
  ['Doha', 'Ad-Dawhah', 'Qatar'],
  ['Riyadh', 'Riyadh', 'Saudi Arabia'],
  ['Jeddah', 'Makkah', 'Saudi Arabia'],
  ['Kuwait City', 'Al Asimah', 'Kuwait'],
  ['Manama', 'Capital', 'Bahrain'],
  ['Muscat', 'Muscat', 'Oman'],
  ['Amman', 'Amman', 'Jordan'],
  ['Beirut', 'Beirut', 'Lebanon'],
  ['Cairo', 'Cairo', 'Egypt'],
];

export const STREETS = [
  'Al Wasl Road', 'Jumeirah Beach Road', 'Sheikh Zayed Road', 'Khalifa Street',
  'Corniche Road', 'Al Maktoum Street', 'Olaya Street', 'Tahlia Street',
  'Salem Al Mubarak Street', 'Sultan Qaboos Street', 'Rainbow Street',
  'Hamra Street', 'Al Ittihad Road', 'Marina Walk', 'Umm Suqeim Road',
] as const;

export const SHIPPING_METHODS = [
  'Standard Delivery (3-5 days)',
  'Express Delivery (next day)',
  'Same-Day Dubai',
  'Click & Collect — Dubai Mall',
  'International Economy',
] as const;

export const REVIEW_TITLES = [
  'Exactly what I hoped for',
  'Beautiful leather, runs slightly small',
  'Worth every dirham',
  'Comfortable from day one',
  'Great shoe, slow delivery',
  'The colour is even better in person',
  'Solid build, would buy again',
  'Not quite my fit but lovely quality',
  'My third pair',
  'Held up through a rainy week',
  'A bit stiff at first',
  'Perfect for the office',
] as const;

export const REVIEW_BODIES = [
  'Ordered a half size up on the advice of the size guide and the fit is spot on. The leather has already started to soften around the toe box.',
  'I wear these five days a week and they still look sharp. The sole has worn evenly, which says a lot for the price.',
  'Delivery took a day longer than promised but the packaging was excellent and the shoes were flawless.',
  'The photos do not do the colour justice — it reads much warmer in daylight. Very happy.',
  'Comfortable straight out of the box, no break-in period at all. The footbed has real cushioning.',
  'Quality is clearly there but the arch support is minimal for all-day standing. Fine for the office.',
  'Second purchase from Magic Show and the consistency between orders is impressive.',
  'Ran narrow for me across the ball of the foot. Exchange process was painless though.',
  'The stitching is neat and the edges are properly finished. You can tell where the money went.',
  'Wore them through a wet week in Dubai and the water resistance held up better than expected.',
] as const;

export const BLOG_POSTS: readonly (readonly [string, string, string[]])[] = [
  ['How to Break In a Leather Boot Without Ruining It', 'Full-grain leather needs time, not force. Here is the method our workshop uses on every returned pair.', ['care', 'boots', 'leather']],
  ['The Autumn/Winter 25 Lookbook Is Live', 'Six silhouettes, three materials, and a colour story built around the winter light in the Gulf.', ['collection', 'aw25']],
  ['A Field Guide to Sneaker Soles', 'Cupsole, vulcanised, or moulded EVA — what each construction actually does for your feet.', ['sneakers', 'guide']],
  ['Why We Moved to Vegetable-Tanned Leather', 'It costs more and takes longer. We think the trade is worth explaining in full.', ['sustainability', 'leather']],
  ['Sizing Between EU, UK and US', 'Our conversion chart, plus the three measurements that matter more than the number.', ['guide', 'sizing']],
  ['Inside the Sable Row Atelier', 'A morning with the team that lasts and finishes every pair of our Chelsea boots.', ['brands', 'craft']],
  ['Five Ways to Wear the Meridian Low', 'From an airport run to a Friday dinner — one sneaker, five outfits.', ['styling', 'sneakers']],
  ['Caring for Suede in a Humid Climate', 'Brushes, protectors, and the one product you should never use.', ['care', 'suede']],
  ['The Case for Buying Fewer, Better Shoes', 'Cost per wear is a boring metric that happens to be the right one.', ['essays']],
  ['Our Resole Programme, Explained', 'Every Goodyear-welted pair we sell can come back to us. Here is how it works.', ['service', 'sustainability']],
  ['What Changed in Our Fit After 4,000 Returns', 'We read the return notes. Two lasts were redrawn because of them.', ['product', 'fit']],
  ['Packing a Carry-On for a Week in Europe', 'Two pairs, one bag, no compromises.', ['travel', 'styling']],
  ['Meet the Kestrel Athletics Design Team', 'The people behind our best-selling trail silhouette.', ['brands', 'interview']],
  ['A Short History of the Penny Loafer', 'From Norwegian fishing villages to the trading floor.', ['essays', 'loafers']],
];

export const BLOG_BODY = `Every pair that leaves our warehouse has passed through four sets of hands. That is not a marketing line — it is the reason our lead times look the way they do.

The first pass is material selection. Hides are graded before they are cut, and anything with a scar across the vamp panel goes back into the offcut pile for small leather goods. We lose roughly eleven percent of every hide this way. It is the single biggest cost in the build, and it is also the reason two pairs of the same shoe look like siblings rather than clones.

The second pass is lasting. A last is the foot-shaped form the upper is stretched over, and ours were redrawn last year after we read four thousand return notes. Two things came out of that reading: our women's court shapes were too narrow across the ball, and our men's boots were half a size long. Both were fixed in the AW25 run.

Third comes the sole. Goodyear welting stitches the upper, the insole rib and the welt together, and only then is the outsole attached. It costs more and takes longer than cementing, and it means the shoe can be taken apart and resoled instead of thrown away.

The last pass is finishing: edge paint, burnishing, laces, and a final inspection under daylight-balanced lamps. If a pair does not clear that bench, it does not ship.`;

export const CONTACT_SUBJECTS: readonly (readonly [string, string])[] = [
  ['Wrong size delivered', 'I ordered the Ardleigh Chelsea in EU 42 but received a 40. The box label says 42. Could you arrange a swap? Order MS-2026-0418.'],
  ['Question about the resole programme', 'Do you resole boots that were bought more than three years ago? Mine are the Bramwell in cognac and the welt is still sound.'],
  ['Bulk order for a corporate gift', 'We are looking at 60 units of the Ivo Card Holder with a debossed logo. Is that something you can quote for, and what lead time should I plan around?'],
  ['Delivery to Muscat', 'Your checkout would not accept my Omani address. Do you ship to Oman, and is there a duty charge on top?'],
  ['Missing item from my parcel', 'The Lowen belt arrived but the Hale wallet from the same order was not in the box. Packing slip lists both.'],
  ['Suede protector recommendation', 'Which protector do you use in store on the Marlowe desert boot? I would rather buy the same one than guess.'],
  ['Store opening hours during Eid', 'Is the Dubai Mall branch open through the Eid holiday? Planning to come in for a fitting.'],
  ['Newsletter unsubscribe not working', 'I have clicked the unsubscribe link twice and still received the AW25 mailing. Please remove me manually.'],
  ['Partnership enquiry', 'I run a menswear editorial with 90k readers in the GCC. Would you be open to a seeding collaboration for the Meridian?'],
  ['Gift receipt request', 'Could you send a gift receipt without pricing for order MS-2026-0377? It is going to my brother directly.'],
  ['Damaged box on arrival', 'The outer carton was crushed but the shoes look fine. Flagging in case it is a courier issue on your end.'],
  ['Width fitting available?', 'Do any of your lasts come in a wide fitting? I take an EU 44 but need extra room across the ball.'],
  ['Exchange for a different colour', 'I would like to swap the Onyx Black Vega Slip-On for the Bone White. Unworn, tags on.'],
  ['Invoice with VAT number', 'Our finance team needs a tax invoice showing our TRN. Order MS-2026-0402.'],
  ['Restock alert for Isolde EU 39', 'The Isolde Riding Boot has been out of stock in 39 for three weeks. Any restock date?'],
  ['Loyalty points not applied', 'I had 1,200 points at checkout and none were deducted from the total.'],
  ['Careers — retail associate', 'Attaching my CV for the Abu Dhabi floor role advertised on your careers page.'],
  ['Shipping cutoff for the weekend', 'If I order Thursday morning, will it arrive before Saturday?'],
  ['Product care instructions missing', 'The Aster Cashmere Crew arrived without the care card mentioned on the product page.'],
  ['Wrong VAT on my invoice', 'The invoice shows 5% but my order shipped to Saudi Arabia where it should be 15%.'],
  ['Click & collect confirmation', 'I selected collect at Dubai Mall but never got the ready-for-pickup email.'],
  ['Wholesale line sheet', 'We operate three multi-brand stores in Kuwait. Could you send your wholesale terms?'],
];

export const COUPONS: readonly (readonly [string, string, string, number])[] = [
  ['WELCOME10', 'Welcome discount', 'percentage', 10],
  ['AW25LAUNCH', 'AW25 launch offer', 'percentage', 15],
  ['FREESHIP', 'Free standard shipping', 'free_shipping', 0],
  ['VIP200', 'VIP AED 200 credit', 'fixed_amount', 200],
  ['EIDSALE', 'Eid weekend sale', 'percentage', 25],
  ['LOYAL5', 'Loyalty member discount', 'percentage', 5],
  ['BOOTS100', 'AED 100 off boots', 'fixed_amount', 100],
  ['STUDENT12', 'Student discount', 'percentage', 12],
  ['WINBACK150', 'Win-back credit', 'fixed_amount', 150],
  ['SUMMER20', 'Summer clearance', 'percentage', 20],
];

export const TESTIMONIALS: readonly (readonly [string, string, string])[] = [
  ['Layla Haddad', 'Architect, Dubai', 'I have bought four pairs in two years and not one has needed more than a polish. The Calder loafer in particular has aged beautifully.'],
  ['Marcus Whitfield', 'Consultant, Abu Dhabi', 'The fit guidance on the product pages is the most accurate I have used. Ordered blind, got it right first time.'],
  ['Nadia Nasser', 'Creative Director, Doha', 'Their exchange process took four days door to door. That is faster than most local stores.'],
  ['Youssef Khalil', 'Photographer, Riyadh', 'The Kestrel Hiker handled a week in the Hajar mountains without a complaint. Genuinely surprised.'],
  ['Sophie Moreau', 'Editor, Dubai', 'The Vela trench is the only coat I packed for Milan. It photographed as well as it wore.'],
  ['Rami Barakat', 'Founder, Sharjah', 'I resoled a three-year-old pair through their programme for less than a third of a new pair.'],
  ['Grace Okafor', 'Lawyer, Dubai', 'Cora block heel — six hours in court, zero regrets. That is the whole review.'],
  ['Faisal Mansour', 'Chef, Kuwait City', 'Bought the Orin canvas for the kitchen commute. Machine washed twice, still fine.'],
];

export const TEAM: readonly (readonly [string, string, string])[] = [
  ['Amira Chalhoub', 'Founder & Creative Director', 'Started Magic Show in a Karama workshop in 2016 after eight years in Milanese footwear development.'],
  ['Tarek Darwish', 'Head of Product', 'Owns the last library and the fit programme. Reads every return note personally.'],
  ['Elena Ricci', 'Design Lead — Footwear', 'Trained at Polimoda; previously three seasons on the Terra Bianca women’s line.'],
  ['Hassan Fadel', 'Operations Director', 'Runs the Jebel Ali warehouse and every retail fulfilment route in the GCC.'],
  ['Clara Bergmann', 'Head of Sustainability', 'Led the move to vegetable-tanned leather and the resole programme.'],
  ['Ziad Yassin', 'Retail Director', 'Opened all five branches. Still works a Saturday floor shift once a month.'],
  ['Priya Nair', 'Head of Customer Experience', 'Built the fit-advice service that cut return rates by nine points.'],
  ['Jonas Halvorsen', 'Head of Digital', 'Responsible for the storefront, this console, and the data behind both.'],
];

export const WAREHOUSES: readonly (readonly [string, string, string, string])[] = [
  ['Jebel Ali Distribution Centre', 'JAFZA-01', 'main', 'Dubai'],
  ['Dubai Investment Park Store', 'DIP-02', 'storage', 'Dubai'],
  ['Abu Dhabi Fulfilment Hub', 'AUH-03', 'distribution', 'Abu Dhabi'],
  ['Riyadh Forward Stock', 'RUH-04', 'distribution', 'Riyadh'],
];

export const BRANCHES: readonly (readonly [string, string, string])[] = [
  ['Magic Show — Dubai Mall', 'BR-DXB-01', 'Dubai'],
  ['Magic Show — Mall of the Emirates', 'BR-DXB-02', 'Dubai'],
  ['Magic Show — Yas Mall', 'BR-AUH-01', 'Abu Dhabi'],
  ['Magic Show — City Centre Sharjah', 'BR-SHJ-01', 'Sharjah'],
  ['Magic Show — Kingdom Centre Riyadh', 'BR-RUH-01', 'Riyadh'],
];

export const CURRENCIES: readonly (readonly [string, string, string, number, boolean])[] = [
  ['AED', 'UAE Dirham', 'AED', 1, true],
  ['USD', 'US Dollar', '$', 0.2723, false],
  ['EUR', 'Euro', '€', 0.2512, false],
  ['GBP', 'British Pound', '£', 0.2148, false],
  ['SAR', 'Saudi Riyal', 'SAR', 1.0211, false],
  ['KWD', 'Kuwaiti Dinar', 'KWD', 0.0834, false],
];

export const ADMIN_USERS: readonly (readonly [string, string, string])[] = [
  ['Amira Chalhoub', 'amira.chalhoub@magicshow.test', 'super_admin'],
  ['Jonas Halvorsen', 'jonas.halvorsen@magicshow.test', 'super_admin'],
  ['Tarek Darwish', 'tarek.darwish@magicshow.test', 'product_manager'],
  ['Ziad Yassin', 'ziad.yassin@magicshow.test', 'store_manager'],
  ['Hassan Fadel', 'hassan.fadel@magicshow.test', 'store_manager'],
  ['Priya Nair', 'priya.nair@magicshow.test', 'customer_service'],
  ['Elena Ricci', 'elena.ricci@magicshow.test', 'analytics_team'],
];

export const PERMISSION_MODULES: readonly (readonly [string, string[]])[] = [
  ['catalog', ['create', 'read', 'update', 'delete']],
  ['orders', ['read', 'update', 'export', 'manage']],
  ['customers', ['read', 'update', 'export']],
  ['inventory', ['read', 'update', 'manage']],
  ['marketing', ['create', 'read', 'update', 'delete']],
  ['content', ['create', 'read', 'update', 'approve']],
  ['settings', ['read', 'manage']],
];

export const HOME_SECTIONS: readonly (readonly [string, string, string, string])[] = [
  ['hero', 'Built to be worn, not stored', 'AW25 is here', 'Six silhouettes cut from vegetable-tanned leather and built on lasts we redrew this year.'],
  ['featured_products', 'This week at Magic Show', 'Featured', 'A rotating edit of the pieces our floor teams keep reaching for.'],
  ['new_arrivals', 'Just landed', 'New arrivals', 'Fresh into the Jebel Ali warehouse and live across all five branches.'],
  ['categories', 'Shop by category', 'Browse', 'Footwear, apparel and the small leather goods that finish an outfit.'],
  ['brand_story', 'From a Karama workshop, 2016', 'Our story', 'Nine years of making shoes that can be resoled instead of replaced.'],
  ['testimonials', 'What customers tell us', 'Reviews', 'Unedited, verified-purchase feedback from across the GCC.'],
  ['newsletter', 'Get the drop before it drops', 'Newsletter', 'Restock alerts, collection previews, and nothing else.'],
];

export const ABOUT_SECTIONS: readonly (readonly [string, string, string, string, string[]])[] = [
  ['intro', 'We make shoes that outlast the season', 'About Magic Show', 'Magic Show began in a two-bench workshop in Karama in 2016. Nine years on we run five branches, a Jebel Ali distribution centre, and a resole programme that has kept over eleven thousand pairs out of landfill.', ['Founded in Dubai, 2016', 'Five GCC retail branches', 'Goodyear-welted construction']],
  ['craft', 'Four sets of hands, every pair', 'Craft', 'Material selection, lasting, soling, finishing. Each stage has a named owner and a bench that a pair has to clear before it ships.', ['Graded hides only', 'Lasts redrawn from return data', 'Daylight-balanced final inspection']],
  ['sustainability', 'The slower, better trade', 'Sustainability', 'Vegetable tanning takes weeks longer than chrome and costs more per hide. We publish the difference rather than absorb it quietly.', ['Vegetable-tanned leather', 'Recycled nylon shells', 'Resole instead of replace']],
  ['stores', 'Come and try a pair on', 'Visit us', 'Fit is the one thing a website cannot do for you. Every branch runs a free fitting service, no appointment needed.', ['Free fittings, no booking', 'Same-day Dubai delivery', 'Click & collect in 2 hours']],
];
