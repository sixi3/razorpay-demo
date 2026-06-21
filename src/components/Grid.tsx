import { memo, type RefObject } from 'react';
import { TILE_W, TILE_H, type Cell } from '../grid/useInfiniteGrid';

interface GridProps {
  bind: (...args: never[]) => Record<string, unknown>;
  panRef: RefObject<HTMLDivElement | null>;
  cells: Cell[];
}

interface TileProps {
  x: number;
  y: number;
  src: string;
  alt: string;
  isCenter: boolean;
}

// Memoized so a recenter (which rebuilds the cell window every item crossing)
// only re-renders the handful of tiles whose props actually changed — the new
// edges and the two tiles toggling `isCenter` — instead of all ~49.
const Tile = memo(function Tile({ x, y, src, alt, isCenter }: TileProps) {
  return (
    <div
      className={`tile${isCenter ? ' tile--center' : ''}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)`, width: TILE_W, height: TILE_H }}
    >
      <img
        className="tile__img"
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        loading={isCenter ? 'eager' : 'lazy'}
        fetchPriority={isCenter ? 'high' : 'auto'}
      />
    </div>
  );
});

export function Grid({ bind, panRef, cells }: GridProps) {
  return (
    <div className="grid-surface" {...bind()}>
      <div className="grid-pan" ref={panRef}>
        {cells.map((cell) => (
          <Tile
            key={cell.key}
            x={cell.x}
            y={cell.y}
            src={cell.item.gridImageUrl}
            alt={cell.item.occasion}
            isCenter={cell.isCenter}
          />
        ))}
      </div>
    </div>
  );
}
