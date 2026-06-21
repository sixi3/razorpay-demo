// Style-discovery data for the outfit grid + detail view.
//
// Seven fully-shot outfits live under public/, one folder each:
//   client-meeting/      shirt + shoes                         (a sharp, formal look)
//   dinner-plans/        glasses/shirt/belt/pants/shoes        (the full evening look)
//   team-collaboration/  shirt/belt/pants/shoes                (smart-casual desk wear)
//   market-visit/        shirt/watch/belt/jeans/shoes          (easy daytime errands)
//   modern-street/       hoodie/tee/shorts/socks/sneakers      (relaxed streetwear)
//   power-dressing/      shirt/belt/trousers/briefcase/oxfords (commanding formalwear)
//   urban-oversize/      tee/chain/cargos/sneakers             (oversized off-duty street)
// Each occasion maps to one folder, so the grid shows seven distinct models and
// the detail drawer reads like a live PDP. Metadata (brands, MRPs, ratings,
// sizes) is modelled on the real Indian fashion market.

export const OCCASIONS = [
  'Client Meeting',
  'Power Dressing',
  'Team Collaboration',
  'Market Visit',
  'Dinner Plans',
  'Modern Street',
  'Urban Oversize',
] as const;

export type Occasion = (typeof OCCASIONS)[number];

export interface Item {
  id: number;
  imageUrl: string;
  gridImageUrl: string;
  occasion: Occasion;
  price: number; // INR — kept for the grid; the drawer total comes from outfitFor()
}

// Copy + hero shot per occasion. modelImage is the shared-element hero that
// animates from the tapped grid tile into the detail carousel.
export interface OccasionMeta {
  description: string;
  modelImage: string;
}

export const OCCASION_META: Record<Occasion, OccasionMeta> = {
  'Client Meeting': {
    description:
      'Wear this to meetings or client lunches for a sharp, trustworthy impression — crisp tailoring that means business.',
    modelImage: '/client-meeting/model.png',
  },
  'Power Dressing': {
    description:
      'Commanding, boardroom-ready tailoring — structured lines and rich neutrals that take the room.',
    modelImage: '/power-dressing/model.png',
  },
  'Team Collaboration': {
    description:
      'Smart-casual desk-to-standup staples — relaxed enough to focus in, polished enough for the room.',
    modelImage: '/team-collaboration/model.png',
  },
  'Market Visit': {
    description:
      'Easy, hard-wearing pieces for errands and weekend markets — comfortable on your feet, sharp enough to run into anyone.',
    modelImage: '/market-visit/model.png',
  },
  'Dinner Plans': {
    description:
      'Easy, put-together pieces that look intentional without trying too hard — dinner-and-drinks ready.',
    modelImage: '/dinner-plans/model.png',
  },
  'Modern Street': {
    description:
      'Relaxed streetwear with attitude — oversized layers, clean sneakers, and just enough swagger for the city.',
    modelImage: '/modern-street/model.png',
  },
  'Urban Oversize': {
    description:
      'Oversized, off-duty streetwear — drop-shoulder layers, roomy cuts, and statement accessories.',
    modelImage: '/urban-oversize/model.png',
  },
};

const gridModelImage = (modelImage: string) => `/grid-models${modelImage}`;

// A small curated price spread per occasion so the grid bubble feels intentional.
const PRICE_BANDS: Record<Occasion, [number, number]> = {
  'Client Meeting': [3499, 6999],
  'Power Dressing': [3999, 8999],
  'Team Collaboration': [1499, 3999],
  'Market Visit': [1499, 3499],
  'Dinner Plans': [2499, 5999],
  'Modern Street': [1999, 4999],
  'Urban Oversize': [1999, 4999],
};

// Deterministic pseudo-random so the demo looks identical on every load.
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function priceFor(occasion: Occasion, n: number): number {
  const [lo, hi] = PRICE_BANDS[occasion];
  const raw = lo + seeded(n) * (hi - lo);
  // Round to the nearest 100 and shave 1 for a retail feel.
  return Math.round(raw / 100) * 100 - 1;
}

const COUNT = 49; // 7 occasions × 7 — a balanced spread across the grid.
const GRID_COLS = 7;
const SAFE_COLUMN_STEP = 2;

// A 7x7 Latin-style layout. Horizontal neighbours differ by +2, vertical
// neighbours by +1, and diagonals by +3/-1 modulo 7, so the same outfit never
// touches itself horizontally, vertically, or diagonally.
const OCCASION_ASSIGNMENT: number[] = Array.from({ length: COUNT }, (_, i) => {
  const row = Math.floor(i / GRID_COLS);
  const col = i % GRID_COLS;
  return (row + col * SAFE_COLUMN_STEP) % OCCASIONS.length;
});

export const items: Item[] = Array.from({ length: COUNT }, (_, i) => {
  const occasion = OCCASIONS[OCCASION_ASSIGNMENT[i]];
  return {
    id: i,
    // The tile hero is the occasion's model shot, which the detail carousel
    // flies from; cycling occasions puts all seven models across the grid.
    imageUrl: OCCASION_META[occasion].modelImage,
    gridImageUrl: gridModelImage(OCCASION_META[occasion].modelImage),
    occasion,
    price: priceFor(occasion, i + 1),
  };
});

export const formatPrice = (inr: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr);

// ---- Pieces (the constituent products of an outfit) -----------------------
// Each piece is a real-shaped PDP: an Indian brand, an SKU-style name, MRP vs
// selling price (Indian retail leans hard on the strike-through discount),
// star rating + count, and a size run appropriate to the category.

export type PieceCategory =
  | 'Eyewear'
  | 'Watch'
  | 'Jewellery'
  | 'Shirt'
  | 'T-Shirt'
  | 'Hoodie'
  | 'Belt'
  | 'Trousers'
  | 'Shorts'
  | 'Footwear'
  | 'Socks'
  | 'Briefcase';

export interface Piece {
  id: string;
  category: PieceCategory;
  label: string; // short label for the "Includes" strip / chips
  brand: string;
  name: string; // full PDP title
  imageUrl: string;
  price: number; // selling price, INR
  mrp: number; // original, INR — for the strike-through + % off
  rating: number; // 0–5, one decimal
  ratingCount: number;
  sizes: string[];
  description: string;
}

// Each outfit's real lineup, shot in its own folder. Piece ids are prefixed by
// occasion so the same category across outfits stays uniquely keyed.
export const OUTFIT_PIECES: Record<Occasion, Piece[]> = {
  'Client Meeting': [
    {
      id: 'cm-shirt',
      category: 'Shirt',
      label: 'Formal Shirt',
      brand: 'Louis Philippe',
      name: 'Pure Cotton Slim-Fit Formal Shirt — White',
      imageUrl: '/client-meeting/shirt.png',
      price: 1799,
      mrp: 2999,
      rating: 4.4,
      ratingCount: 2210,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Wrinkle-resistant pure cotton in a slim formal cut. A clean white that anchors any boardroom look.',
    },
    {
      id: 'cm-shoes',
      category: 'Footwear',
      label: 'Derby Shoes',
      brand: 'Clarks',
      name: 'Whiddon Cap-Toe Leather Derby — Black',
      imageUrl: '/client-meeting/shoes.png',
      price: 5499,
      mrp: 7999,
      rating: 4.5,
      ratingCount: 731,
      sizes: ['6', '7', '8', '9', '10', '11'],
      description:
        'Cap-toe derbies in polished full-grain leather with cushioned footbeds — formal enough to close the deal.',
    },
  ],
  'Power Dressing': [
    {
      id: 'pd-shirt',
      category: 'Shirt',
      label: 'Formal Shirt',
      brand: 'Van Heusen',
      name: 'Slim-Fit Twill Formal Shirt — Powder Blue',
      imageUrl: '/power-dressing/shirt.png',
      price: 1699,
      mrp: 2799,
      rating: 4.4,
      ratingCount: 2410,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Wrinkle-resistant twill with a structured slim collar — a powder blue that reads confident under a jacket.',
    },
    {
      id: 'pd-belt',
      category: 'Belt',
      label: 'Leather Belt',
      brand: 'Hidesign',
      name: 'Classic Formal Leather Belt — Black',
      imageUrl: '/power-dressing/belt.png',
      price: 1695,
      mrp: 2495,
      rating: 4.5,
      ratingCount: 760,
      sizes: ['32', '34', '36', '38', '40'],
      description:
        'Full-grain black leather with a polished buckle — the sharp finish a formal trouser asks for.',
    },
    {
      id: 'pd-pants',
      category: 'Trousers',
      label: 'Formal Trousers',
      brand: 'Louis Philippe',
      name: 'Slim-Fit Formal Trousers — Charcoal',
      imageUrl: '/power-dressing/pants.png',
      price: 2499,
      mrp: 3999,
      rating: 4.3,
      ratingCount: 1520,
      sizes: ['30', '32', '34', '36', '38'],
      description:
        'Crease-resistant wool-blend trousers with a clean slim line — charcoal that commands the boardroom.',
    },
    {
      id: 'pd-case',
      category: 'Briefcase',
      label: 'Briefcase',
      brand: 'Hidesign',
      name: 'Leather Laptop Briefcase — Brown',
      imageUrl: '/power-dressing/case.png',
      price: 8995,
      mrp: 12995,
      rating: 4.6,
      ratingCount: 430,
      sizes: ['OS'],
      description:
        'Hand-finished full-grain leather with a padded laptop sleeve — the case that makes an entrance.',
    },
    {
      id: 'pd-shoes',
      category: 'Footwear',
      label: 'Oxford Shoes',
      brand: 'Ruosh',
      name: 'Hand-Stitched Oxford — Black',
      imageUrl: '/power-dressing/shoes.png',
      price: 5490,
      mrp: 6990,
      rating: 4.4,
      ratingCount: 690,
      sizes: ['6', '7', '8', '9', '10', '11'],
      description:
        'Closed-lacing oxfords in hand-stitched calf leather — the most formal note in the wardrobe.',
    },
  ],
  'Team Collaboration': [
    {
      id: 'tc-shirt',
      category: 'Shirt',
      label: 'Oxford Shirt',
      brand: 'Allen Solly',
      name: 'Slim-Fit Cotton Oxford Shirt — Sky Blue',
      imageUrl: '/team-collaboration/shirt.png',
      price: 1399,
      mrp: 2199,
      rating: 4.2,
      ratingCount: 1893,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Breathable cotton oxford in a slim cut. A soft sky blue that takes a blazer or stands on its own at the desk.',
    },
    {
      id: 'tc-belt',
      category: 'Belt',
      label: 'Leather Belt',
      brand: 'U.S. Polo Assn.',
      name: 'Pin-Buckle Grain Leather Belt — Tan',
      imageUrl: '/team-collaboration/belt.png',
      price: 1199,
      mrp: 1999,
      rating: 4.1,
      ratingCount: 604,
      sizes: ['32', '34', '36', '38', '40'],
      description:
        'Grain-leather belt with a brushed pin buckle. A versatile tan that bridges denim and chinos with ease.',
    },
    {
      id: 'tc-pants',
      category: 'Trousers',
      label: 'Chinos',
      brand: "Levi's",
      name: 'XX Chino Slim-Fit Trousers — Khaki',
      imageUrl: '/team-collaboration/pants.png',
      price: 2299,
      mrp: 3499,
      rating: 4.3,
      ratingCount: 1450,
      sizes: ['30', '32', '34', '36', '38'],
      description:
        'Stretch-cotton chinos with a slim, tapered leg. Khaki that reads sharp at standups and easy after.',
    },
    {
      id: 'tc-shoes',
      category: 'Footwear',
      label: 'Sneakers',
      brand: 'Adidas',
      name: 'Grand Court Leather Sneakers — White',
      imageUrl: '/team-collaboration/shoes.png',
      price: 3299,
      mrp: 4599,
      rating: 4.4,
      ratingCount: 2876,
      sizes: ['6', '7', '8', '9', '10', '11'],
      description:
        'Clean white leather sneakers with a cushioned Cloudfoam sole — desk-to-drinks comfort without the slouch.',
    },
  ],
  'Market Visit': [
    {
      id: 'mv-shirt',
      category: 'Shirt',
      label: 'Checked Shirt',
      brand: 'Peter England',
      name: 'Cotton Casual Checked Shirt — Olive',
      imageUrl: '/market-visit/shirt.png',
      price: 1199,
      mrp: 1999,
      rating: 4.2,
      ratingCount: 1340,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Soft brushed cotton in an easy checked weave — breathable for a morning of errands, smart enough to keep on.',
    },
    {
      id: 'mv-watch',
      category: 'Watch',
      label: 'Watch',
      brand: 'Titan',
      name: 'Neo Analog Watch — Brown Leather Strap',
      imageUrl: '/market-visit/watch.png',
      price: 4995,
      mrp: 6995,
      rating: 4.4,
      ratingCount: 2105,
      sizes: ['OS'],
      description:
        'A clean analog dial on a tan leather strap — understated enough for daily wear, sharp on the wrist.',
    },
    {
      id: 'mv-belt',
      category: 'Belt',
      label: 'Leather Belt',
      brand: 'Woodland',
      name: 'Textured Leather Belt — Brown',
      imageUrl: '/market-visit/belt.png',
      price: 1295,
      mrp: 1695,
      rating: 4.2,
      ratingCount: 540,
      sizes: ['32', '34', '36', '38', '40'],
      description:
        'Rugged textured leather with a brushed buckle. Built to take everyday wear and pair with denim or chinos.',
    },
    {
      id: 'mv-pants',
      category: 'Trousers',
      label: 'Jeans',
      brand: 'Wrangler',
      name: 'Greensboro Straight-Fit Jeans — Stone Wash',
      imageUrl: '/market-visit/pants.png',
      price: 2299,
      mrp: 3499,
      rating: 4.3,
      ratingCount: 1880,
      sizes: ['30', '32', '34', '36', '38'],
      description:
        'Mid-weight stretch denim in a straight leg — a versatile stone wash that goes anywhere on a day out.',
    },
    {
      id: 'mv-shoes',
      category: 'Footwear',
      label: 'Sneakers',
      brand: 'Red Tape',
      name: 'Casual Leather Sneakers — Brown',
      imageUrl: '/market-visit/shoes.png',
      price: 2499,
      mrp: 3999,
      rating: 4.1,
      ratingCount: 1260,
      sizes: ['6', '7', '8', '9', '10', '11'],
      description:
        'Cushioned leather sneakers with a grippy sole — comfortable for hours on your feet without looking sporty.',
    },
  ],
  'Dinner Plans': [
    {
      id: 'dp-glasses',
      category: 'Eyewear',
      label: 'Sunglasses',
      brand: 'John Jacobs',
      name: 'Unisex Polarized Lens Round Sunglasses — 0RB3016901/5855',
      imageUrl: '/dinner-plans/glasses.png',
      price: 990,
      mrp: 2500,
      rating: 4.2,
      ratingCount: 1248,
      sizes: ['OS'],
      description:
        'Polarised round lenses in a lightweight gold metal frame with UV400 protection — glare-free clarity for bright Indian afternoons.',
    },
    {
      id: 'dp-shirt',
      category: 'Shirt',
      label: 'Camp-Collar Shirt',
      brand: 'Snitch',
      name: 'Ecru Cloud-Cotton Camp Collar Shirt',
      imageUrl: '/dinner-plans/shirt.png',
      price: 1299,
      mrp: 1999,
      rating: 4.3,
      ratingCount: 3127,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Breathable cloud-cotton in a relaxed camp-collar cut. A soft ecru that pairs with everything from denim to linen.',
    },
    {
      id: 'dp-belt',
      category: 'Belt',
      label: 'Leather Belt',
      brand: 'Hidesign',
      name: 'Ranch Full-Grain Leather Belt — Brown',
      imageUrl: '/dinner-plans/belt.png',
      price: 1395,
      mrp: 2095,
      rating: 4.5,
      ratingCount: 842,
      sizes: ['32', '34', '36', '38', '40'],
      description:
        'Hand-finished full-grain leather with a matte antique-brass buckle. Ages beautifully with everyday wear.',
    },
    {
      id: 'dp-pants',
      category: 'Trousers',
      label: 'Linen Trousers',
      brand: 'Fabindia',
      name: 'Pure Linen Relaxed-Fit Trousers — Ivory',
      imageUrl: '/dinner-plans/pants.png',
      price: 2290,
      mrp: 2990,
      rating: 4.1,
      ratingCount: 1564,
      sizes: ['30', '32', '34', '36', '38'],
      description:
        '100% pure linen with a relaxed straight leg. Stays cool through Indian summers and drapes sharp for evenings.',
    },
    {
      id: 'dp-shoes',
      category: 'Footwear',
      label: 'Leather Loafers',
      brand: 'Hush Puppies',
      name: 'Genuine Leather Penny Loafers — Black',
      imageUrl: '/dinner-plans/shoes.png',
      price: 3499,
      mrp: 4999,
      rating: 4.4,
      ratingCount: 967,
      sizes: ['6', '7', '8', '9', '10', '11'],
      description:
        'Genuine leather slip-on loafers with cushioned Bounce™ insoles. Polished for meetings, easy enough for dinner.',
    },
  ],
  'Modern Street': [
    {
      id: 'ms-hoodie',
      category: 'Hoodie',
      label: 'Hoodie',
      brand: 'Bewakoof',
      name: 'Oversized Cotton Hoodie — Black',
      imageUrl: '/modern-street/hoodie.png',
      price: 1299,
      mrp: 1999,
      rating: 4.3,
      ratingCount: 3420,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Heavyweight fleece-back cotton in a relaxed oversized cut. Drops off the shoulder for that easy street silhouette.',
    },
    {
      id: 'ms-tshirt',
      category: 'T-Shirt',
      label: 'Tee',
      brand: 'The Souled Store',
      name: 'Oversized Drop-Shoulder Tee — Off White',
      imageUrl: '/modern-street/t-shirt.png',
      price: 799,
      mrp: 1199,
      rating: 4.3,
      ratingCount: 5210,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Boxy drop-shoulder tee in heavy off-white cotton — the foundation layer for any street fit.',
    },
    {
      id: 'ms-shorts',
      category: 'Shorts',
      label: 'Shorts',
      brand: 'HRX',
      name: 'Loose-Fit Cotton Shorts — Grey',
      imageUrl: '/modern-street/shorts.png',
      price: 999,
      mrp: 1499,
      rating: 4.2,
      ratingCount: 980,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Roomy cotton shorts with an elastic drawcord waist — breathable and built for movement.',
    },
    {
      id: 'ms-socks',
      category: 'Socks',
      label: 'Socks',
      brand: 'Nike',
      name: 'Everyday Cushioned Crew Socks (3-Pack)',
      imageUrl: '/modern-street/socks.png',
      price: 745,
      mrp: 995,
      rating: 4.5,
      ratingCount: 6700,
      sizes: ['Free'],
      description:
        'Sweat-wicking cushioned crew socks with arch support — the quiet upgrade under every sneaker.',
    },
    {
      id: 'ms-shoes',
      category: 'Footwear',
      label: 'Sneakers',
      brand: 'Nike',
      name: "Air Force 1 '07 Sneakers — White",
      imageUrl: '/modern-street/shoes.png',
      price: 8295,
      mrp: 9295,
      rating: 4.7,
      ratingCount: 8900,
      sizes: ['6', '7', '8', '9', '10', '11'],
      description:
        'The icon: full-grain leather, Air cushioning, and a clean white finish that anchors any street look.',
    },
  ],
  'Urban Oversize': [
    {
      id: 'uo-tshirt',
      category: 'T-Shirt',
      label: 'Tee',
      brand: 'Urban Monkey',
      name: 'Oversized Graphic Tee — Washed Black',
      imageUrl: '/urban-oversize/t-shirt.png',
      price: 1199,
      mrp: 1799,
      rating: 4.4,
      ratingCount: 2980,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description:
        'Acid-washed heavyweight cotton with a back graphic — cut long and boxy for a true oversized drape.',
    },
    {
      id: 'uo-chain',
      category: 'Jewellery',
      label: 'Chain',
      brand: 'Urban Monkey',
      name: 'Cuban Link Chain — Silver',
      imageUrl: '/urban-oversize/chain.png',
      price: 1499,
      mrp: 2499,
      rating: 4.3,
      ratingCount: 1140,
      sizes: ['OS'],
      description:
        'A chunky stainless Cuban link with a tarnish-free finish — the accessory that finishes the fit.',
    },
    {
      id: 'uo-pants',
      category: 'Trousers',
      label: 'Cargo Pants',
      brand: 'Bewakoof',
      name: 'Loose-Fit Cargo Pants — Black',
      imageUrl: '/urban-oversize/pants.png',
      price: 1599,
      mrp: 2499,
      rating: 4.2,
      ratingCount: 2210,
      sizes: ['28', '30', '32', '34', '36'],
      description:
        'Relaxed cargo pants with utility pockets and a tapered cuff — roomy without losing shape.',
    },
    {
      id: 'uo-shoes',
      category: 'Footwear',
      label: 'Sneakers',
      brand: 'Puma',
      name: 'Slipstream Bulky Sneakers — White',
      imageUrl: '/urban-oversize/shoes.png',
      price: 6499,
      mrp: 8999,
      rating: 4.4,
      ratingCount: 1760,
      sizes: ['6', '7', '8', '9', '10', '11'],
      description:
        'Chunky leather basketball-inspired sneakers with a bold sole — the loud base every oversized fit needs.',
    },
  ],
};

export const discountPct = (piece: Pick<Piece, 'price' | 'mrp'>): number =>
  Math.round(((piece.mrp - piece.price) / piece.mrp) * 100);

// ---- Similar products (the "Similar Products" rail in the drawer) ----------
// Real Indian alternatives per category. Imagery mixes-and-matches the actual
// article shots across all seven outfits — e.g. the Shirt rail cycles every
// outfit's shirt — so the rail shows genuinely different garments you can swap
// between, not one repeated PNG.

export interface SimilarProduct {
  id: string;
  brand: string;
  name: string;
  imageUrl: string;
  price: number;
  mrp: number;
  rating: number;
}

// Distinct real article shots per category, gathered from every outfit that
// includes that category. Drives the mix-and-match imagery below.
const CATEGORY_IMAGES: Record<PieceCategory, string[]> = (() => {
  const map = {} as Record<PieceCategory, string[]>;
  for (const occasion of OCCASIONS) {
    for (const piece of OUTFIT_PIECES[occasion]) {
      (map[piece.category] ??= []).push(piece.imageUrl);
    }
  }
  return map;
})();

// Curated brand alternatives per category (imagery is attached below by cycling
// through CATEGORY_IMAGES so each card shows a real, different garment).
const CURATED_SIMILAR: Record<PieceCategory, Omit<SimilarProduct, 'imageUrl'>[]> = {
  Eyewear: [
    { id: 'eye-1', brand: 'Vincent Chase', name: 'Polarized Round Sunglasses', price: 1200, mrp: 3000, rating: 4.3 },
    { id: 'eye-2', brand: 'Ray-Ban', name: 'Round Metal Classic', price: 6790, mrp: 8990, rating: 4.6 },
    { id: 'eye-3', brand: 'Fastrack', name: 'Gold-Tone Round UV400', price: 1095, mrp: 1795, rating: 4.0 },
    { id: 'eye-4', brand: 'IDEE', name: 'Slim Metal Aviator', price: 2499, mrp: 4999, rating: 4.2 },
    { id: 'eye-5', brand: 'Lenskart Air', name: 'Featherweight Round', price: 1500, mrp: 3500, rating: 4.4 },
  ],
  Watch: [
    { id: 'watch-1', brand: 'Titan', name: 'Neo Analog Leather Watch', price: 4995, mrp: 6995, rating: 4.4 },
    { id: 'watch-2', brand: 'Fossil', name: 'Minimalist Three-Hand Watch', price: 8995, mrp: 11995, rating: 4.5 },
    { id: 'watch-3', brand: 'Casio', name: 'Enticer Analog Watch', price: 3495, mrp: 4995, rating: 4.3 },
    { id: 'watch-4', brand: 'Daniel Wellington', name: 'Classic Petite Watch', price: 11900, mrp: 14900, rating: 4.6 },
    { id: 'watch-5', brand: 'Fastrack', name: 'Stunners Analog Watch', price: 2495, mrp: 3495, rating: 4.1 },
  ],
  Jewellery: [
    { id: 'jewel-1', brand: 'Urban Monkey', name: 'Cuban Link Chain — Silver', price: 1499, mrp: 2499, rating: 4.3 },
    { id: 'jewel-2', brand: 'The Bro Code', name: 'Stainless Steel Rope Chain', price: 899, mrp: 1599, rating: 4.0 },
    { id: 'jewel-3', brand: 'Salty', name: 'Minimal Box Chain', price: 1299, mrp: 1999, rating: 4.4 },
    { id: 'jewel-4', brand: 'March Label', name: 'Layered Pendant Chain', price: 1799, mrp: 2799, rating: 4.2 },
  ],
  Shirt: [
    { id: 'shirt-1', brand: 'Bombay Shirt Company', name: 'Linen Camp Collar Shirt', price: 2400, mrp: 2400, rating: 4.4 },
    { id: 'shirt-2', brand: 'Andamen', name: 'Premium Cuban Collar Shirt', price: 2999, mrp: 4999, rating: 4.5 },
    { id: 'shirt-3', brand: 'The Souled Store', name: 'Solid Resort Shirt', price: 1199, mrp: 1799, rating: 4.1 },
    { id: 'shirt-4', brand: 'Bewakoof', name: 'Relaxed Camp Collar Shirt', price: 899, mrp: 1499, rating: 4.0 },
    { id: 'shirt-5', brand: 'H&M', name: 'Regular Fit Linen-Blend Shirt', price: 1499, mrp: 1999, rating: 4.2 },
  ],
  'T-Shirt': [
    { id: 'tee-1', brand: 'The Souled Store', name: 'Oversized Drop-Shoulder Tee', price: 799, mrp: 1199, rating: 4.3 },
    { id: 'tee-2', brand: 'Bewakoof', name: 'Loose-Fit Cotton Tee', price: 599, mrp: 999, rating: 4.1 },
    { id: 'tee-3', brand: 'H&M', name: 'Relaxed-Fit Cotton T-Shirt', price: 799, mrp: 1099, rating: 4.2 },
    { id: 'tee-4', brand: 'Urban Monkey', name: 'Graphic Oversized Tee', price: 1199, mrp: 1799, rating: 4.4 },
    { id: 'tee-5', brand: 'Snitch', name: 'Heavyweight Boxy Tee', price: 899, mrp: 1499, rating: 4.2 },
  ],
  Hoodie: [
    { id: 'hood-1', brand: 'Bewakoof', name: 'Oversized Cotton Hoodie', price: 1299, mrp: 1999, rating: 4.3 },
    { id: 'hood-2', brand: 'HRX', name: 'Fleece Pullover Hoodie', price: 1499, mrp: 2499, rating: 4.2 },
    { id: 'hood-3', brand: 'The Souled Store', name: 'Graphic Drop-Shoulder Hoodie', price: 1699, mrp: 2499, rating: 4.4 },
    { id: 'hood-4', brand: 'Puma', name: 'Essentials Logo Hoodie', price: 2299, mrp: 3499, rating: 4.5 },
  ],
  Belt: [
    { id: 'belt-1', brand: 'Tommy Hilfiger', name: 'Reversible Leather Belt', price: 2199, mrp: 2999, rating: 4.4 },
    { id: 'belt-2', brand: 'Woodland', name: 'Textured Leather Belt', price: 1295, mrp: 1695, rating: 4.2 },
    { id: 'belt-3', brand: 'Da Milano', name: 'Italian Leather Belt', price: 3450, mrp: 4600, rating: 4.6 },
    { id: 'belt-4', brand: 'U.S. Polo Assn.', name: 'Pin-Buckle Leather Belt', price: 999, mrp: 1799, rating: 4.1 },
    { id: 'belt-5', brand: 'Bata', name: 'Formal Leather Belt', price: 799, mrp: 1299, rating: 3.9 },
  ],
  Trousers: [
    { id: 'tr-1', brand: 'Andamen', name: 'Pure Linen Trousers', price: 2799, mrp: 4499, rating: 4.4 },
    { id: 'tr-2', brand: 'Linen Club', name: 'Pleated Linen Trousers', price: 1999, mrp: 2799, rating: 4.2 },
    { id: 'tr-3', brand: 'Allen Solly', name: 'Slim Fit Linen-Blend Chinos', price: 1799, mrp: 2999, rating: 4.1 },
    { id: 'tr-4', brand: 'Westside', name: 'Ascot Tapered Trousers', price: 1499, mrp: 1999, rating: 4.0 },
    { id: 'tr-5', brand: 'Van Heusen', name: 'Crinkle Linen Trousers', price: 2199, mrp: 3499, rating: 4.3 },
  ],
  Shorts: [
    { id: 'short-1', brand: 'HRX', name: 'Loose-Fit Cotton Shorts', price: 999, mrp: 1499, rating: 4.2 },
    { id: 'short-2', brand: 'Bewakoof', name: 'Relaxed Lounge Shorts', price: 699, mrp: 1199, rating: 4.0 },
    { id: 'short-3', brand: 'Nike', name: 'Sportswear Club Fleece Shorts', price: 2295, mrp: 2995, rating: 4.5 },
    { id: 'short-4', brand: 'Puma', name: 'Cotton Jersey Shorts', price: 1299, mrp: 1999, rating: 4.3 },
  ],
  Footwear: [
    { id: 'shoe-1', brand: 'Clarks', name: 'Leather Penny Loafers', price: 4999, mrp: 6999, rating: 4.5 },
    { id: 'shoe-2', brand: 'Bata', name: 'Slip-On Leather Loafers', price: 2299, mrp: 3499, rating: 4.0 },
    { id: 'shoe-3', brand: 'Ruosh', name: 'Hand-Stitched Loafers', price: 4490, mrp: 5990, rating: 4.4 },
    { id: 'shoe-4', brand: 'Metro', name: 'Tassel Leather Loafers', price: 2990, mrp: 3990, rating: 4.2 },
    { id: 'shoe-5', brand: 'Red Tape', name: 'Cushioned Driving Loafers', price: 1799, mrp: 3299, rating: 4.1 },
  ],
  Socks: [
    { id: 'sock-1', brand: 'Nike', name: 'Everyday Cushioned Crew Socks (3-Pack)', price: 745, mrp: 995, rating: 4.5 },
    { id: 'sock-2', brand: 'Adidas', name: 'Cushioned Crew Socks (3-Pack)', price: 699, mrp: 999, rating: 4.4 },
    { id: 'sock-3', brand: 'Puma', name: 'Sport Ankle Socks (3-Pack)', price: 499, mrp: 799, rating: 4.2 },
    { id: 'sock-4', brand: 'Jockey', name: 'Cotton Crew Socks (3-Pack)', price: 549, mrp: 749, rating: 4.1 },
  ],
  Briefcase: [
    { id: 'case-1', brand: 'Hidesign', name: 'Leather Laptop Briefcase', price: 8995, mrp: 12995, rating: 4.6 },
    { id: 'case-2', brand: 'American Tourister', name: 'Laptop Messenger Bag', price: 2999, mrp: 4999, rating: 4.2 },
    { id: 'case-3', brand: 'Da Milano', name: 'Italian Leather Briefcase', price: 14500, mrp: 19000, rating: 4.5 },
    { id: 'case-4', brand: 'Lino Perros', name: 'Faux-Leather Office Bag', price: 2199, mrp: 3499, rating: 4.0 },
  ],
};

export const SIMILAR_PRODUCTS: Record<PieceCategory, SimilarProduct[]> = Object.fromEntries(
  (Object.keys(CURATED_SIMILAR) as PieceCategory[]).map((category) => {
    const images = CATEGORY_IMAGES[category] ?? [];
    return [
      category,
      CURATED_SIMILAR[category].map((product, i) => ({
        ...product,
        // Cycle the real cross-outfit shots so the rail mixes-and-matches the
        // actual articles instead of repeating a single image.
        imageUrl: images[i % images.length],
      })),
    ];
  }),
) as Record<PieceCategory, SimilarProduct[]>;

// ---- Outfit composition ----------------------------------------------------
// Each occasion resolves to its own fully-shot outfit. Same input id -> same
// output (stable across renders, no flicker).

export interface Outfit {
  occasion: Occasion;
  description: string;
  modelImage: string;
  pieces: Piece[];
  total: number;
  mrpTotal: number;
}

export function outfitFor(item: Item): Outfit {
  const meta = OCCASION_META[item.occasion];
  const pieces = OUTFIT_PIECES[item.occasion];
  const total = pieces.reduce((sum, p) => sum + p.price, 0);
  const mrpTotal = pieces.reduce((sum, p) => sum + p.mrp, 0);
  return {
    occasion: item.occasion,
    description: meta.description,
    modelImage: meta.modelImage,
    pieces,
    total,
    mrpTotal,
  };
}
