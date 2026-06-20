// Style-discovery data for the outfit grid + detail view.
//
// V1 ships a single fully-shot outfit (public/relaxed-dinner: model.png + one
// PNG per piece). All imagery points there for now; the metadata below is
// modelled on the real Indian fashion market (brands, MRPs, ratings, sizes)
// so the detail drawer reads like a live PDP. Swap in per-outfit asset sets +
// real SKUs in a later version — the shapes here are the contract the UI uses.

export const OCCASIONS = ['Client Meeting', 'Date Night', 'Relaxed Dinner'] as const;

export type Occasion = (typeof OCCASIONS)[number];

export interface Item {
  id: number;
  imageUrl: string;
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
      'Wear this outfit to meetings or lunches for a sharp, trustworthy impression.',
    modelImage: '/relaxed-dinner/model.png',
  },
  'Date Night': {
    description:
      'Easy, put-together pieces that look intentional without trying too hard — dinner-and-drinks ready.',
    modelImage: '/relaxed-dinner/model.png',
  },
  'Relaxed Dinner': {
    description:
      'Soft fabrics and unfussy tailoring for long evenings — comfortable enough to linger, sharp enough to photograph.',
    modelImage: '/relaxed-dinner/model.png',
  },
};

// A small curated price spread per occasion so the grid bubble feels intentional.
const PRICE_BANDS: Record<Occasion, [number, number]> = {
  'Client Meeting': [3499, 6999],
  'Date Night': [2499, 5999],
  'Relaxed Dinner': [1499, 3999],
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

const COUNT = 48;

export const items: Item[] = Array.from({ length: COUNT }, (_, i) => {
  const occasion = OCCASIONS[i % OCCASIONS.length];
  return {
    id: i,
    // Only `relaxed-dinner` is shot so far, so every tile points there for now;
    // map per-item folders as more outfits are added.
    imageUrl: `/relaxed-dinner/model.png`,
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

export type PieceCategory = 'Eyewear' | 'Shirt' | 'Belt' | 'Trousers' | 'Footwear';

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

export const RELAXED_DINNER_PIECES: Piece[] = [
  {
    id: 'glasses',
    category: 'Eyewear',
    label: 'Sunglasses',
    brand: 'John Jacobs',
    name: 'Unisex Polarized Lens Round Sunglasses — 0RB3016901/5855',
    imageUrl: '/relaxed-dinner/glasses.png',
    price: 990,
    mrp: 2500,
    rating: 4.2,
    ratingCount: 1248,
    sizes: ['OS'],
    description:
      'Polarised round lenses in a lightweight gold metal frame with UV400 protection — glare-free clarity for bright Indian afternoons.',
  },
  {
    id: 'shirt',
    category: 'Shirt',
    label: 'Camp-Collar Shirt',
    brand: 'Snitch',
    name: 'Ecru Cloud-Cotton Camp Collar Shirt',
    imageUrl: '/relaxed-dinner/shirt.png',
    price: 1299,
    mrp: 1999,
    rating: 4.3,
    ratingCount: 3127,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Breathable cloud-cotton in a relaxed camp-collar cut. A soft ecru that pairs with everything from denim to linen.',
  },
  {
    id: 'belt',
    category: 'Belt',
    label: 'Leather Belt',
    brand: 'Hidesign',
    name: 'Ranch Full-Grain Leather Belt — Brown',
    imageUrl: '/relaxed-dinner/belt.png',
    price: 1395,
    mrp: 2095,
    rating: 4.5,
    ratingCount: 842,
    sizes: ['32', '34', '36', '38', '40'],
    description:
      'Hand-finished full-grain leather with a matte antique-brass buckle. Ages beautifully with everyday wear.',
  },
  {
    id: 'pants',
    category: 'Trousers',
    label: 'Linen Trousers',
    brand: 'Fabindia',
    name: 'Pure Linen Relaxed-Fit Trousers — Ivory',
    imageUrl: '/relaxed-dinner/pants.png',
    price: 2290,
    mrp: 2990,
    rating: 4.1,
    ratingCount: 1564,
    sizes: ['30', '32', '34', '36', '38'],
    description:
      '100% pure linen with a relaxed straight leg. Stays cool through Indian summers and drapes sharp for evenings.',
  },
  {
    id: 'shoes',
    category: 'Footwear',
    label: 'Leather Loafers',
    brand: 'Hush Puppies',
    name: 'Genuine Leather Penny Loafers — Black',
    imageUrl: '/relaxed-dinner/shoes.png',
    price: 3499,
    mrp: 4999,
    rating: 4.4,
    ratingCount: 967,
    sizes: ['6', '7', '8', '9', '10', '11'],
    description:
      'Genuine leather slip-on loafers with cushioned Bounce™ insoles. Polished for meetings, easy enough for dinner.',
  },
];

export const discountPct = (piece: Pick<Piece, 'price' | 'mrp'>): number =>
  Math.round(((piece.mrp - piece.price) / piece.mrp) * 100);

// ---- Similar products (the "Similar Products" rail in the drawer) ----------
// Real Indian alternatives per category. Imagery reuses the category's piece
// shot until per-SKU images land. Same shape as a slimmed-down Piece so the
// rail can reuse the same card.

export interface SimilarProduct {
  id: string;
  brand: string;
  name: string;
  imageUrl: string;
  price: number;
  mrp: number;
  rating: number;
}

export const SIMILAR_PRODUCTS: Record<PieceCategory, SimilarProduct[]> = {
  Eyewear: [
    { id: 'eye-1', brand: 'Vincent Chase', name: 'Polarized Round Sunglasses', imageUrl: '/relaxed-dinner/glasses.png', price: 1200, mrp: 3000, rating: 4.3 },
    { id: 'eye-2', brand: 'Ray-Ban', name: 'Round Metal Classic', imageUrl: '/relaxed-dinner/glasses.png', price: 6790, mrp: 8990, rating: 4.6 },
    { id: 'eye-3', brand: 'Fastrack', name: 'Gold-Tone Round UV400', imageUrl: '/relaxed-dinner/glasses.png', price: 1095, mrp: 1795, rating: 4.0 },
    { id: 'eye-4', brand: 'IDEE', name: 'Slim Metal Aviator', imageUrl: '/relaxed-dinner/glasses.png', price: 2499, mrp: 4999, rating: 4.2 },
    { id: 'eye-5', brand: 'Lenskart Air', name: 'Featherweight Round', imageUrl: '/relaxed-dinner/glasses.png', price: 1500, mrp: 3500, rating: 4.4 },
  ],
  Shirt: [
    { id: 'shirt-1', brand: 'Bombay Shirt Company', name: 'Linen Camp Collar Shirt', imageUrl: '/relaxed-dinner/shirt.png', price: 2400, mrp: 2400, rating: 4.4 },
    { id: 'shirt-2', brand: 'Andamen', name: 'Premium Cuban Collar Shirt', imageUrl: '/relaxed-dinner/shirt.png', price: 2999, mrp: 4999, rating: 4.5 },
    { id: 'shirt-3', brand: 'The Souled Store', name: 'Solid Resort Shirt', imageUrl: '/relaxed-dinner/shirt.png', price: 1199, mrp: 1799, rating: 4.1 },
    { id: 'shirt-4', brand: 'Bewakoof', name: 'Relaxed Camp Collar Shirt', imageUrl: '/relaxed-dinner/shirt.png', price: 899, mrp: 1499, rating: 4.0 },
    { id: 'shirt-5', brand: 'H&M', name: 'Regular Fit Linen-Blend Shirt', imageUrl: '/relaxed-dinner/shirt.png', price: 1499, mrp: 1999, rating: 4.2 },
  ],
  Belt: [
    { id: 'belt-1', brand: 'Tommy Hilfiger', name: 'Reversible Leather Belt', imageUrl: '/relaxed-dinner/belt.png', price: 2199, mrp: 2999, rating: 4.4 },
    { id: 'belt-2', brand: 'Woodland', name: 'Textured Leather Belt', imageUrl: '/relaxed-dinner/belt.png', price: 1295, mrp: 1695, rating: 4.2 },
    { id: 'belt-3', brand: 'Da Milano', name: 'Italian Leather Belt', imageUrl: '/relaxed-dinner/belt.png', price: 3450, mrp: 4600, rating: 4.6 },
    { id: 'belt-4', brand: 'U.S. Polo Assn.', name: 'Pin-Buckle Leather Belt', imageUrl: '/relaxed-dinner/belt.png', price: 999, mrp: 1799, rating: 4.1 },
    { id: 'belt-5', brand: 'Bata', name: 'Formal Leather Belt', imageUrl: '/relaxed-dinner/belt.png', price: 799, mrp: 1299, rating: 3.9 },
  ],
  Trousers: [
    { id: 'tr-1', brand: 'Andamen', name: 'Pure Linen Trousers', imageUrl: '/relaxed-dinner/pants.png', price: 2799, mrp: 4499, rating: 4.4 },
    { id: 'tr-2', brand: 'Linen Club', name: 'Pleated Linen Trousers', imageUrl: '/relaxed-dinner/pants.png', price: 1999, mrp: 2799, rating: 4.2 },
    { id: 'tr-3', brand: 'Allen Solly', name: 'Slim Fit Linen-Blend Chinos', imageUrl: '/relaxed-dinner/pants.png', price: 1799, mrp: 2999, rating: 4.1 },
    { id: 'tr-4', brand: 'Westside', name: 'Ascot Tapered Trousers', imageUrl: '/relaxed-dinner/pants.png', price: 1499, mrp: 1999, rating: 4.0 },
    { id: 'tr-5', brand: 'Van Heusen', name: 'Crinkle Linen Trousers', imageUrl: '/relaxed-dinner/pants.png', price: 2199, mrp: 3499, rating: 4.3 },
  ],
  Footwear: [
    { id: 'shoe-1', brand: 'Clarks', name: 'Leather Penny Loafers', imageUrl: '/relaxed-dinner/shoes.png', price: 4999, mrp: 6999, rating: 4.5 },
    { id: 'shoe-2', brand: 'Bata', name: 'Slip-On Leather Loafers', imageUrl: '/relaxed-dinner/shoes.png', price: 2299, mrp: 3499, rating: 4.0 },
    { id: 'shoe-3', brand: 'Ruosh', name: 'Hand-Stitched Loafers', imageUrl: '/relaxed-dinner/shoes.png', price: 4490, mrp: 5990, rating: 4.4 },
    { id: 'shoe-4', brand: 'Metro', name: 'Tassel Leather Loafers', imageUrl: '/relaxed-dinner/shoes.png', price: 2990, mrp: 3990, rating: 4.2 },
    { id: 'shoe-5', brand: 'Red Tape', name: 'Cushioned Driving Loafers', imageUrl: '/relaxed-dinner/shoes.png', price: 1799, mrp: 3299, rating: 4.1 },
  ],
};

// ---- Outfit composition ----------------------------------------------------
// Deterministic per-item lineup so every cell feels distinct on pan while
// reusing the single asset set we have. Same input id -> same output (stable
// across renders, no flicker).

export interface Outfit {
  occasion: Occasion;
  description: string;
  modelImage: string;
  pieces: Piece[];
  total: number;
  mrpTotal: number;
}

export function outfitFor(item: Item): Outfit {
  const all = RELAXED_DINNER_PIECES;
  const n = all.length;
  const shift = item.id % n;
  const rotated = [...all.slice(shift), ...all.slice(0, shift)];
  const size = 4 + (item.id % 2); // 4 or 5 pieces
  const pieces = rotated.slice(0, size);
  const total = pieces.reduce((sum, p) => sum + p.price, 0);
  const mrpTotal = pieces.reduce((sum, p) => sum + p.mrp, 0);
  const meta = OCCASION_META[item.occasion];
  return {
    occasion: item.occasion,
    description: meta.description,
    modelImage: meta.modelImage,
    pieces,
    total,
    mrpTotal,
  };
}
