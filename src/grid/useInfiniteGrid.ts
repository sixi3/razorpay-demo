import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import { OCCASIONS, items, type Item, type Occasion } from '../data/items';

// Tile geometry (px). Portrait 3:4 to match full-body model framing.
export const CELL_W = 168; // includes horizontal gutter
export const CELL_H = 232; // includes vertical gutter
export const TILE_W = 148;
export const TILE_H = 208;

// Horizontal period of the wrap pattern. Moving one column steps one item,
// moving one row jumps by COLS — gives variety in both axes.
const COLS = 7;
const SAFE_COLUMN_STEP = 2;

// Inertia: time-based decay so 60Hz and 120Hz screens travel similarly.
const INERTIA_DECAY_MS = 260;
const INERTIA_STOP_VELOCITY = 0.018;
const INERTIA_MAX_MS = 900;
const MAX_RELEASE_VELOCITY = 1.45;

// Pinch-zoom limits.
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 2.0;
const INITIAL_ZOOM = 1.20;
const TILE_OFFSET_X = (CELL_W - TILE_W) / 2;
const TILE_OFFSET_Y = (CELL_H - TILE_H) / 2;

// Snap-to-item tuning. Radius is screen-space around the fixed reticle.
const SNAP_RADIUS_PADDING = 1;
const SNAP_IDLE_MS = 100;
const SNAP_DURATION_MS = 260;

// Max finger travel (px) still treated as a tap rather than a pan.
const TAP_SLOP = 6;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const shuffleWithSeed = <T,>(values: readonly T[], seed: number): T[] => {
  const arr = values.slice();
  let s = (seed * 2654435761) >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Seeded reshuffle for a "new search" that keeps the no-touching outfit layout:
// we shuffle which occasion owns each safe slot, but never shuffle individual
// tiles freely. seed 0 keeps the original order; same seed -> same arrangement.
const orderItems = (seed: number): Item[] => {
  if (seed <= 0) return items;

  const occasionOrder = shuffleWithSeed(OCCASIONS, seed);
  const buckets = new Map<Occasion, Item[]>();
  for (const occasion of OCCASIONS) {
    buckets.set(
      occasion,
      shuffleWithSeed(
        items.filter((item) => item.occasion === occasion),
        seed + occasion.length,
      ),
    );
  }

  const nextByOccasion = new Map<Occasion, number>();
  return Array.from({ length: items.length }, (_, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const occasion = occasionOrder[mod(row + col * SAFE_COLUMN_STEP, occasionOrder.length)];
    const bucket = buckets.get(occasion) ?? items;
    const next = nextByOccasion.get(occasion) ?? 0;
    nextByOccasion.set(occasion, next + 1);
    return bucket[next % bucket.length];
  });
};

export interface Cell {
  key: string;
  col: number;
  row: number;
  x: number; // absolute px inside the panned container
  y: number;
  item: Item;
  isCenter: boolean;
}

// On-screen rectangle of a tile's image box — handed to the detail view so it
// can fly the selected model from exactly where it sat in the grid.
export interface TileRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function useInfiniteGrid(
  onSelect?: (item: Item, rect: TileRect) => void,
  shuffleSeed = 0,
) {
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [center, setCenter] = useState({ col: 0, row: 0 });
  const centerRef = useRef(center);

  // Current tile ordering — reshuffled whenever shuffleSeed changes (a search).
  const orderedItems = useMemo(() => orderItems(shuffleSeed), [shuffleSeed]);
  const itemAt = useCallback(
    (col: number, row: number): Item => orderedItems[mod(row * COLS + col, orderedItems.length)],
    [orderedItems],
  );

  const panRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const tf = useRef({ x: 0, y: 0, s: INITIAL_ZOOM }); // live transform (not React state)
  const raf = useRef<number | null>(null); // inertia loop id
  const snapRaf = useRef<number | null>(null);
  const snapTimer = useRef<number | null>(null);
  const driftRaf = useRef<number | null>(null);
  const driftActive = useRef(false);
  const pinchActive = useRef(false);
  const markerLit = useRef(false); // last reticle state, to avoid redundant writes

  // Write the current transform to the DOM and recompute the centered cell.
  const apply = useCallback(() => {
    const el = panRef.current;
    if (!el) return;
    const { x, y, s } = tf.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Screen centre -> local grid coords: local = (screen - offset) / scale.
    const localX = (vw / 2 - x) / s;
    const localY = (vh / 2 - y) / s;
    const col = Math.round((localX - CELL_W / 2) / CELL_W);
    const row = Math.round((localY - CELL_H / 2) / CELL_H);

    // Keep the reticle size constant; only brighten it while the focal point is
    // inside an image tile.
    const dx = Math.abs(localX - (col * CELL_W + CELL_W / 2));
    const dy = Math.abs(localY - (row * CELL_H + CELL_H / 2));
    const isOverImage = dx <= TILE_W / 2 && dy <= TILE_H / 2;
    // Only touch the DOM when the lit state actually flips — writing the same
    // opacity every frame still triggers a style recalc.
    if (isOverImage !== markerLit.current) {
      markerLit.current = isOverImage;
      const m = markerRef.current;
      if (m) {
        m.style.opacity = isOverImage ? '1' : '0.25';
        m.classList.toggle('app__center-marker--focused', isOverImage);
      }
    }

    if (col !== centerRef.current.col || row !== centerRef.current.row) {
      centerRef.current = { col, row };
      setCenter({ col, row });
      // Light tactile "notch" as each item locks in (Android; no-op on iOS web).
      // Skip during inertia: a fast fling crosses many items and would buzz
      // continuously while adding main-thread work mid-glide.
      if (raf.current == null && !driftActive.current) navigator.vibrate?.(6);
    }
  }, []);

  const stopInertia = () => {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  const stopSnap = () => {
    if (snapTimer.current != null) {
      window.clearTimeout(snapTimer.current);
      snapTimer.current = null;
    }
    if (snapRaf.current != null) {
      cancelAnimationFrame(snapRaf.current);
      snapRaf.current = null;
    }
  };

  // While the grid is in motion: blur+fade the outfit preview and drop the
  // expensive backdrop-filter/gradients on the header & dock (CSS keys off this
  // class). Driven imperatively — a single class toggle, no React render here.
  const setPanning = (panning: boolean) => {
    chromeRef.current?.classList.toggle('is-panning', panning);
  };

  const nearestSnapTarget = () => {
    const { x, y, s } = tf.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const localX = (vw / 2 - x) / s;
    const localY = (vh / 2 - y) / s;
    const col = Math.round((localX - CELL_W / 2) / CELL_W);
    const row = Math.round((localY - CELL_H / 2) / CELL_H);
    const itemX = col * CELL_W + CELL_W / 2;
    const itemY = row * CELL_H + CELL_H / 2;
    const distance = Math.hypot((localX - itemX) * s, (localY - itemY) * s);
    const snapRadius = Math.hypot((CELL_W * s) / 2, (CELL_H * s) / 2) + SNAP_RADIUS_PADDING;

    return {
      distance,
      snapRadius,
      x: vw / 2 - itemX * s,
      y: vh / 2 - itemY * s,
    };
  };

  const animateTo = (targetX: number, targetY: number) => {
    const startX = tf.current.x;
    const startY = tf.current.y;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SNAP_DURATION_MS);
      const eased = easeOutCubic(t);
      tf.current.x = startX + (targetX - startX) * eased;
      tf.current.y = startY + (targetY - startY) * eased;
      apply();

      if (t < 1) {
        snapRaf.current = requestAnimationFrame(step);
      } else {
        snapRaf.current = null;
      }
    };

    snapRaf.current = requestAnimationFrame(step);
  };

  const scheduleSnap = () => {
    stopSnap();
    snapTimer.current = window.setTimeout(() => {
      snapTimer.current = null;
      if (pinchActive.current || raf.current != null) return;

      const target = nearestSnapTarget();
      if (target.distance > 1 && target.distance <= target.snapRadius) {
        animateTo(target.x, target.y);
      }
    }, SNAP_IDLE_MS);
  };

  // Autonomous "discover" drift for the onboarding walkthrough: gently orbits
  // the grid so tiles glide past on their own, previewing what a pan does. No
  // snap or haptics while it runs; settles onto the nearest item when stopped.
  const [demoDrift] = useState(() => ({
    start: () => {
      if (driftActive.current) return;
      driftActive.current = true;
      stopInertia();
      stopSnap();
      const baseX = tf.current.x;
      const baseY = tf.current.y;
      const t0 = performance.now();
      const loop = (now: number) => {
        const t = (now - t0) / 1000;
        tf.current.x = baseX + Math.sin(t * 0.55) * CELL_W * 0.92;
        tf.current.y = baseY + Math.sin(t * 0.43 + 1.1) * CELL_H * 0.6;
        apply();
        driftRaf.current = requestAnimationFrame(loop);
      };
      driftRaf.current = requestAnimationFrame(loop);
    },
    stop: () => {
      if (!driftActive.current) return;
      driftActive.current = false;
      if (driftRaf.current != null) {
        cancelAnimationFrame(driftRaf.current);
        driftRaf.current = null;
      }
      scheduleSnap();
    },
  }));

  // Initialise: measure viewport and centre cell (0,0) before first paint.
  useLayoutEffect(() => {
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    tf.current.s = INITIAL_ZOOM;
    tf.current.x = window.innerWidth / 2 - (CELL_W / 2) * INITIAL_ZOOM;
    tf.current.y = window.innerHeight / 2 - (CELL_H / 2) * INITIAL_ZOOM;
    apply();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      stopInertia();
      stopSnap();
      if (driftRaf.current != null) cancelAnimationFrame(driftRaf.current);
    };
  }, [apply]);

  const bind = useGesture(
    {
      onDrag: ({ xy: [px, py], movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], pinching, last, cancel, memo }) => {
        if (pinching || pinchActive.current) {
          cancel();
          return;
        }
        // Capture the start transform + whether a glide/snap was in flight when
        // this gesture began (so a tap that merely halts a fling won't navigate).
        // Detect taps by total movement rather than @use-gesture's `tap` flag,
        // which can miss the very first gesture after mount.
        const start = (memo as { x: number; y: number; fling: boolean }) ?? {
          x: tf.current.x,
          y: tf.current.y,
          fling: raf.current != null || snapRaf.current != null,
        };
        stopInertia();
        stopSnap();

        const moved = Math.hypot(mx, my);
        if (moved > TAP_SLOP) setPanning(true);
        tf.current.x = start.x + mx;
        tf.current.y = start.y + my;
        apply();

        if (last && moved <= TAP_SLOP) {
          // A tap: open the tile under the finger (unless we just stopped a fling).
          setPanning(false);
          if (onSelect && !start.fling) {
            const { x, y, s } = tf.current;
            const localX = (px - x) / s;
            const localY = (py - y) / s;
            const col = Math.round((localX - CELL_W / 2) / CELL_W);
            const row = Math.round((localY - CELL_H / 2) / CELL_H);
            const cx = col * CELL_W + CELL_W / 2;
            const cy = row * CELL_H + CELL_H / 2;
            // Ignore taps that land in the gutter between tiles.
            if (Math.abs(localX - cx) <= TILE_W / 2 && Math.abs(localY - cy) <= TILE_H / 2) {
              const width = TILE_W * s;
              const height = TILE_H * s;
              onSelect(itemAt(col, row), {
                left: cx * s + x - width / 2,
                top: cy * s + y - height / 2,
                width,
                height,
              });
            }
          }
          return start;
        }

        if (last) {
          // Project a short, decelerating glide from release velocity.
          let velX = clamp(dx * vx, -MAX_RELEASE_VELOCITY, MAX_RELEASE_VELOCITY);
          let velY = clamp(dy * vy, -MAX_RELEASE_VELOCITY, MAX_RELEASE_VELOCITY);

          if (Math.hypot(velX, velY) <= INERTIA_STOP_VELOCITY) {
            scheduleSnap();
            setPanning(false);
            return start;
          }

          let previous = performance.now();
          const started = previous;
          const step = (now: number) => {
            const dt = Math.min(32, now - previous);
            previous = now;

            const decay = Math.exp(-dt / INERTIA_DECAY_MS);
            velX *= decay;
            velY *= decay;
            tf.current.x += velX * dt;
            tf.current.y += velY * dt;
            apply();

            const moving = Math.hypot(velX, velY) > INERTIA_STOP_VELOCITY;
            const withinBudget = now - started < INERTIA_MAX_MS;
            if (moving && withinBudget) {
              raf.current = requestAnimationFrame(step);
            } else {
              raf.current = null;
              scheduleSnap();
              setPanning(false);
            }
          };
          raf.current = requestAnimationFrame(step);
        }
        return start;
      },
      onPinchStart: () => {
        pinchActive.current = true;
        stopInertia();
        stopSnap();
        setPanning(true);
      },
      onPinch: ({ offset: [s], origin: [ox, oy], memo }) => {
        const start = (memo as { x: number; y: number; s: number }) ?? {
          x: tf.current.x,
          y: tf.current.y,
          s: tf.current.s,
        };
        // Keep the grid point under the fingers fixed while scaling.
        const k = s / start.s;
        tf.current.s = s;
        tf.current.x = ox - k * (ox - start.x);
        tf.current.y = oy - k * (oy - start.y);
        apply();
        return start;
      },
      onPinchEnd: () => {
        // Defer clearing so the drag end fired by the lifting fingers is ignored.
        requestAnimationFrame(() => {
          pinchActive.current = false;
          scheduleSnap();
          setPanning(false);
        });
      },
    },
    {
      drag: { pointer: { touch: true } },
      pinch: {
        scaleBounds: { min: MIN_ZOOM, max: MAX_ZOOM },
        rubberband: true,
        pointer: { touch: true },
        from: () => [tf.current.s, 0],
      },
    },
  );

  // Build the virtualized window around the centered cell. Size it for the
  // most zoomed-out case (MIN_ZOOM) so it always fills the screen at any zoom.
  const halfCols = Math.ceil(viewport.w / (CELL_W * MIN_ZOOM) / 2) + 1;
  const halfRows = Math.ceil(viewport.h / (CELL_H * MIN_ZOOM) / 2) + 1;
  const cells: Cell[] = [];
  if (viewport.w > 0) {
    for (let row = center.row - halfRows; row <= center.row + halfRows; row++) {
      for (let col = center.col - halfCols; col <= center.col + halfCols; col++) {
        cells.push({
          key: `${col}:${row}`,
          col,
          row,
          x: col * CELL_W + TILE_OFFSET_X,
          y: row * CELL_H + TILE_OFFSET_Y,
          item: itemAt(col, row),
          isCenter: col === center.col && row === center.row,
        });
      }
    }
  }

  const centeredItem = itemAt(center.col, center.row);

  return {
    bind,
    panRef,
    markerRef,
    chromeRef,
    cells,
    centeredItem,
    ready: viewport.w > 0,
    demoDrift,
  };
}
