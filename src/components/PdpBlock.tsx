import { formatPrice, discountPct } from '../data/items';
import type { Piece } from '../data/items';

export type PdpProductLike = Pick<Piece, 'brand' | 'name' | 'rating' | 'price' | 'mrp' | 'imageUrl'>;

function PdpStars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="pdp__stars" aria-label={`${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
            fill={i < filled ? '#f5a623' : '#dbe3ea'}
          />
        </svg>
      ))}
    </span>
  );
}

function PdpDetails({ product }: { product: PdpProductLike }) {
  const off = discountPct(product);
  return (
    <>
      <span className="pdp__brand">{product.brand}</span>
      <h3 className="pdp__name">{product.name}</h3>
      <PdpStars rating={product.rating} />
      <div className="pdp__price">
        <span className="pdp__price-now">{formatPrice(product.price)}</span>
        {off > 0 && (
          <>
            <span className="pdp__price-mrp">
              MRP <s className="pdp__price-mrp-amt">{formatPrice(product.mrp)}</s>
            </span>
            <span className="pdp__price-off">{off}% off</span>
          </>
        )}
      </div>
    </>
  );
}

function PdpActions({ price }: { price: number }) {
  return (
    <div className="pdp__actions">
      <button className="pdp__goto" type="button">
        Go to Product
      </button>
      <button className="pdp__cta" type="button">
        Add to bag · {formatPrice(price)}
      </button>
    </div>
  );
}

/** Main outfit piece — image on top, details below, size picker, action row. */
export function PdpMainPiece({
  product,
  size,
  onSizeChange,
}: {
  product: Piece;
  size: string;
  onSizeChange: (size: string) => void;
}) {
  return (
    <>
      <div className="pdp">
        <div className="pdp__media">
          <img src={product.imageUrl} alt={product.name} draggable={false} />
        </div>
        <div className="pdp__info">
          <PdpDetails product={product} />

          <span className="pdp__size-label">Select Size</span>
          <div className="pdp__sizes">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                className={`size-chip${s === size ? ' size-chip--active' : ''}`}
                onClick={() => onSizeChange(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <PdpActions price={product.price} />
    </>
  );
}

/** Similar / stylist pick — same PDP block without size selector. */
export function PdpProduct({ product }: { product: PdpProductLike }) {
  return (
    <>
      <div className="pdp">
        <div className="pdp__media">
          <img src={product.imageUrl} alt={product.name} draggable={false} />
        </div>
        <div className="pdp__info">
          <PdpDetails product={product} />
        </div>
      </div>

      <PdpActions price={product.price} />
    </>
  );
}
