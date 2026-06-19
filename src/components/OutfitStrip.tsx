import { outfitFor, formatPrice, type Item } from '../data/items';

interface OutfitStripProps {
  item: Item;
}

function BagIcon() {
  return (
    <svg viewBox="0 0 256 256" className="preview__bag-icon" aria-hidden="true">
      <path
        d="M80 96V72a48 48 0 0 1 96 0v24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <path
        d="M44 96h168l-12 120H56L44 96Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    </svg>
  );
}

export function OutfitStrip({ item }: OutfitStripProps) {
  const { pieces, total } = outfitFor(item);

  return (
    <div className="preview">
      <div className="preview__price">
        <span className="preview__price-bag">
          <BagIcon />
        </span>
        <span className="preview__price-amount">{formatPrice(total)}</span>
      </div>

      <div className="preview__strip" role="list">
        {pieces.map((piece) => (
          <button
            key={piece.id}
            className="preview__chip"
            type="button"
            role="listitem"
            aria-label={piece.label}
          >
            <img
              className="preview__chip-img"
              src={piece.imageUrl}
              alt={piece.label}
              draggable={false}
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
