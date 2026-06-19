import type { RefObject } from 'react';
import { TILE_W, TILE_H, type Cell } from '../grid/useInfiniteGrid';

interface GridProps {
  bind: (...args: never[]) => Record<string, unknown>;
  panRef: RefObject<HTMLDivElement | null>;
  cells: Cell[];
}

export function Grid({ bind, panRef, cells }: GridProps) {
  return (
    <div className="grid-surface" {...bind()}>
      <div className="grid-pan" ref={panRef}>
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`tile${cell.isCenter ? ' tile--center' : ''}`}
            style={{
              transform: `translate3d(${cell.x}px, ${cell.y}px, 0)`,
              width: TILE_W,
              height: TILE_H,
            }}
          >
            <img
              className="tile__img"
              src={cell.item.imageUrl}
              alt={cell.item.occasion}
              draggable={false}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
