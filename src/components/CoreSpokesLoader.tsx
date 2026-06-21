import { useEffect, useRef } from 'react';

// "Updraft" dot-matrix loader — adapted from dotmatrix.zzzzshawn.cloud
// (registry item dotm-triangle-16). A close-packed triangular pyramid (rows of
// 1, 2, 3 … ROWS circles) with a V-shaped thermal ridge sweeping through it:
// each circle's brightness is a gaussian of its distance to a front line that
// climbs and falls sinusoidally, so the glow rides up the flanks toward the
// apex. Computed per-frame in JS — the rAF loop writes opacity straight to the
// dots (no CSS keyframes), exactly as the source does.

const ROWS = 5; // packed pyramid: rows of 1..ROWS circles → ROWS*(ROWS+1)/2 total

const BASE_OPACITY = 0.12;
const HIGH_OPACITY = 0.96;
const WING = 0.6; // how strongly the flanks lead the centre → the "V" of the ridge
const FRONT_SIGMA = 0.9; // thickness of the glowing front
const FRONT_MID = (ROWS - 1) / 2;
const FRONT_AMP = (ROWS - 1) / 2 + 0.6; // overshoot so the apex + base fully light
// 2400ms base cycle / 1.55 default speed, matching the source component.
const CYCLE_MS = 2400 / 1.55;
// Phase used when motion is reduced — a single resting frame.
const STATIC_PHASE = 0.12;

// Flat list of every circle in the pyramid, with its row, in-row column, and
// triangular index (row*(row+1)/2 + col) so the rAF loop can address each dot.
const CELLS = (() => {
  const cells: { row: number; col: number; index: number }[] = [];
  let index = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col <= row; col += 1) {
      cells.push({ row, col, index });
      index += 1;
    }
  }
  return cells;
})();

function smoothstep01(edge0: number, edge1: number, x: number) {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function opacityForCell(row: number, col: number, phase: number) {
  const t = phase * Math.PI * 2;
  // Distance from the row's centre line — flanks sit lower in "v" than the core.
  const v = row - WING * Math.abs(col - row / 2);
  const front = FRONT_MID + FRONT_AMP * Math.sin(t);
  const d = Math.abs(v - front);
  const glowRaw = Math.exp(-(d * d) / (FRONT_SIGMA * FRONT_SIGMA));
  const glow = smoothstep01(0.04, 0.98, glowRaw);
  return Math.min(HIGH_OPACITY, BASE_OPACITY + glow * (HIGH_OPACITY - BASE_OPACITY));
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface CoreSpokesLoaderProps {
  compact?: boolean;
  label?: string;
  showText?: boolean;
  // When the label cycles through phrases, blur+fade each one in and out. The
  // text is keyed on the label so every change restarts the CSS cycle.
  animateLabel?: boolean;
}

export function CoreSpokesLoader({
  compact = false,
  label = 'Curating personalised outfits',
  showText = true,
  animateLabel = false,
}: CoreSpokesLoaderProps) {
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const paint = (phase: number) => {
      for (const { index, row, col } of CELLS) {
        const dot = dotRefs.current[index];
        if (dot) dot.style.opacity = String(opacityForCell(row, col, phase));
      }
    };

    if (prefersReducedMotion()) {
      paint(STATIC_PHASE);
      return undefined;
    }

    let raf = 0;
    let start = 0;
    const loop = (now: number) => {
      if (!start) start = now;
      const phase = ((now - start) / CYCLE_MS) % 1;
      paint(phase);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`core-spokes-loader${compact ? ' core-spokes-loader--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="core-spokes-loader__matrix" aria-hidden="true">
        {Array.from({ length: ROWS }).map((_, row) => (
          <div className="core-spokes-loader__row" key={row}>
            {Array.from({ length: row + 1 }).map((_, col) => {
              const index = (row * (row + 1)) / 2 + col;
              return (
                <span
                  key={col}
                  ref={(el) => {
                    dotRefs.current[index] = el;
                  }}
                  className="core-spokes-loader__dot"
                />
              );
            })}
          </div>
        ))}
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
