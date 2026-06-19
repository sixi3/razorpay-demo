import { outfitFor, formatPrice, type Item } from '../data/items';

interface OutfitStripProps {
  item: Item;
}

export function OutfitStrip({ item }: OutfitStripProps) {
  const { pieces } = outfitFor(item);

  return (
    <div className="preview">
      <p className="preview__label"> Includes:</p>
      <div className="preview__strip" role="list">
        {pieces.map((piece) => (
          <div className="preview__item" role="listitem" key={piece.id}>
            <button className="preview__chip" type="button" aria-label={piece.label}>
              <img
                className="preview__chip-img"
                src={piece.imageUrl}
                alt={piece.label}
                draggable={false}
                decoding="async"
              />
            </button>
            <span className="preview__badge">{formatPrice(piece.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
