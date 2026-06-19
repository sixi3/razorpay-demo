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
    // Single transparent model cutout reused across all tiles for now.
    imageUrl: `/model.png`,
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
