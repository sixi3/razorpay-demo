import type { CSSProperties } from 'react';

const MATRIX_SIZE = 7;
const HIGH_OPACITY = 0.94;

const TRIANGLE_CELLS = new Set([
  '1,3',
  '2,2',
  '2,4',
  '3,1',
  '3,3',
  '3,5',
  '4,0',
  '4,2',
  '4,4',
  '4,6',
]);

const SPOKE_STEPS = new Map([
  ['3,3', 0],
  ['2,2', 1],
  ['2,4', 1],
  ['4,2', 1],
  ['4,4', 1],
  ['1,3', 2],
  ['3,1', 2],
  ['3,5', 2],
  ['4,0', 2],
  ['4,6', 2],
]);

interface CoreSpokesLoaderProps {
  compact?: boolean;
  label?: string;
  showText?: boolean;
  // When the label cycles through phrases, blur+fade each one in and out. The
  // text is keyed on the label so every change restarts the CSS cycle.
  animateLabel?: boolean;
}

function isWithinTriangleMask(row: number, col: number) {
  return TRIANGLE_CELLS.has(`${row},${col}`);
}

function spokeStepFor(row: number, col: number) {
  return SPOKE_STEPS.get(`${row},${col}`) ?? 0;
}

export function CoreSpokesLoader({
  compact = false,
  label = 'Curating personalised outfits',
  showText = true,
  animateLabel = false,
}: CoreSpokesLoaderProps) {
  return (
    <div
      className={`core-spokes-loader${compact ? ' core-spokes-loader--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="core-spokes-loader__matrix" aria-hidden="true">
        {Array.from({ length: MATRIX_SIZE * MATRIX_SIZE }).map((_, index) => {
          const row = Math.floor(index / MATRIX_SIZE);
          const col = index % MATRIX_SIZE;
          const isActive = isWithinTriangleMask(row, col);

          return (
            <span
              key={index}
              className={`core-spokes-loader__dot${isActive ? '' : ' core-spokes-loader__dot--inactive'}`}
              style={
                {
                  '--dot-peak': isActive ? HIGH_OPACITY : 0,
                  '--dot-delay': `${-spokeStepFor(row, col) * 150}ms`,
                } as CSSProperties
              }
            />
          );
        })}
      </div>
      {showText && (
        <p
          key={label}
          className={`core-spokes-loader__text${
            animateLabel ? ' core-spokes-loader__text--cycling' : ''
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
}
