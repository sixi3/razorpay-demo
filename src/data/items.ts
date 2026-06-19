// Style-discovery data for the outfit grid.
// V1 uses deterministic placeholder images (picsum seeds) at 3:4 portrait,
// matching the full-body model framing of the reference. Swap `imageUrl`
// for real fashion images (DeepFashion / VITON-HD / generated) in a later version.

export const OCCASIONS = ['Client Meeting', 'Date Night', 'Relaxed Dinner'] as const;

export type Occasion = (typeof OCCASIONS)[number];

export interface Item {
  id: number;
  imageUrl: string;
  occasion: Occasion;
  price: number; // INR
}

// A small curated price spread per occasion so the bubble feels intentional.
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
  // Round to the nearest 100 and shave 1 (e.g. 4299 -> ₹4,299) for a retail feel.
  return Math.round(raw / 100) * 100 - 1;
}

const COUNT = 48;

export const items: Item[] = Array.from({ length: COUNT }, (_, i) => {
  const occasion = OCCASIONS[i % OCCASIONS.length];
  return {
    id: i,
    // Each outfit lives in its own folder under public/ (model.png + piece
    // PNGs). Only `relaxed-dinner` is shot so far, so every tile points there
    // for now; map per-item folders as more outfits are added.
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

// ---- Outfit composition (constituent items shown in the preview strip) ----
// We currently ship one fully-shot outfit (public/relaxed-dinner). The grid is
// data-driven from this lineup; per-item rotation + subsetting below makes the
// strip and total visibly change as you pan, so the blur/fade effect has
// something to react to. Swap in per-outfit asset sets in a later version.
export interface Piece {
  id: string;
  label: string;
  imageUrl: string;
  price: number; // INR
}

export const RELAXED_DINNER_PIECES: Piece[] = [
  { id: 'glasses', label: 'Sunglasses', imageUrl: '/relaxed-dinner/glasses.png', price: 1290 },
  { id: 'shirt', label: 'Camp-Collar Shirt', imageUrl: '/relaxed-dinner/shirt.png', price: 1990 },
  { id: 'belt', label: 'Leather Belt', imageUrl: '/relaxed-dinner/belt.png', price: 990 },
  { id: 'pants', label: 'Linen Trousers', imageUrl: '/relaxed-dinner/pants.png', price: 1690 },
  { id: 'shoes', label: 'Leather Loafers', imageUrl: '/relaxed-dinner/shoes.png', price: 2390 },
];

export interface Outfit {
  pieces: Piece[];
  total: number;
}

// Deterministic per-item lineup so every cell feels distinct on pan, while
// reusing the single asset set we have. Same input id -> same output (stable
// across renders, no flicker).
export function outfitFor(item: Item): Outfit {
  const all = RELAXED_DINNER_PIECES;
  const n = all.length;
  const shift = item.id % n;
  const rotated = [...all.slice(shift), ...all.slice(0, shift)];
  const size = 4 + (item.id % 2); // 4 or 5 pieces
  const pieces = rotated.slice(0, size);
  const total = pieces.reduce((sum, p) => sum + p.price, 0);
  return { pieces, total };
}
