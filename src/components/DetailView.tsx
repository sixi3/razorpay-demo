import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import {
  items,
  outfitFor,
  formatPrice,
  discountPct,
  SIMILAR_PRODUCTS,
  type Item,
} from '../data/items';
import type { TileRect } from '../grid/useInfiniteGrid';
import { Header } from './Header';
import { QueryFab } from './QueryFab';

// Carousel geometry: the active slide is centred and the neighbours peek in.
// The model PNGs are very tall/narrow (~0.32 aspect) with wide transparent side
// margins, so a generous peek is needed for the neighbour figures to show.
const PEEK = 0.22; // fraction of the viewport each neighbour shows
const SLIDE_FRAC = 1 - PEEK * 2; // active slide width as a fraction of viewport

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const mod = (n: number, m: number) => ((n % m) + m) % m;

interface Metrics {
  vh: number;
  expandedY: number; // sheet top when fully open (just under the header)
  collapsedY: number; // sheet top at rest (carousel visible above)
  peekY: number; // sheet top when minimised to header + description (model enlarged)
}

type Detent = 'expanded' | 'collapsed' | 'peek';

interface DetailViewProps {
  startItem: Item;
  originRect: TileRect;
  onClose: () => void;
}

export function DetailView({ startItem, originRect, onClose }: DetailViewProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLImageElement>(null); // active slide image — FLIP target
  const scrollRef = useRef<HTMLDivElement>(null); // drawer content scroller
  const enteredOnce = useRef(false);

  const [trackW, setTrackW] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>({ vh: 0, expandedY: 0, collapsedY: 0, peekY: 0 });
  const metricsRef = useRef(metrics);
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const itemCount = items.length;
  const [activeRawIndex, setActiveRawIndex] = useState(itemCount + startItem.id);
  const activeIndex = mod(activeRawIndex, itemCount);
  const [flying, setFlying] = useState(true); // model is mid-flight; hide the static copy
  const [entered, setEntered] = useState(false); // drives the CSS enter/exit transitions
  const [closing, setClosing] = useState(false);
  const [detent, setDetent] = useState<Detent>('collapsed'); // sheet rest position
  const expanded = detent === 'expanded';
  // The carousel height tracks the sheet only after the enter animation settles,
  // so the enter slide-up doesn't momentarily blow the model up to full height.
  const [coupled, setCoupled] = useState(false);
  const [drawerScrolled, setDrawerScrolled] = useState(false); // top fade-mask toggle
  const [swiping, setSwiping] = useState(false); // brief blur when a snapped item commits
  const swipeTimer = useRef<number | undefined>(undefined);
  const commitFadeTimer = useRef<number | undefined>(undefined);
  const carouselIntent = useRef(false);
  const carouselIntentTimer = useRef<number | undefined>(undefined);
  const activeRawIndexRef = useRef(activeRawIndex);
  useEffect(() => {
    activeRawIndexRef.current = activeRawIndex;
  }, [activeRawIndex]);
  useEffect(() => {
    return () => {
      if (swipeTimer.current) clearTimeout(swipeTimer.current);
      if (commitFadeTimer.current) clearTimeout(commitFadeTimer.current);
      if (carouselIntentTimer.current) clearTimeout(carouselIntentTimer.current);
    };
  }, []);

  const activeItem = items[activeIndex];
  const outfit = outfitFor(activeItem);

  // Selected piece + size are reset when the outfit (carousel swipe) or piece
  // changes. Done by adjusting state during render via previous-value trackers
  // rather than effects — no extra commit, no cascading-render lint.
  const [pieceId, setPieceId] = useState(outfit.pieces[0].id);
  const [prevItemId, setPrevItemId] = useState(activeItem.id);
  if (activeItem.id !== prevItemId) {
    setPrevItemId(activeItem.id);
    setPieceId(outfit.pieces[0].id);
  }
  const piece = outfit.pieces.find((p) => p.id === pieceId) ?? outfit.pieces[0];

  const [size, setSize] = useState(piece.sizes[0]);
  const [prevPieceId, setPrevPieceId] = useState(piece.id);
  if (piece.id !== prevPieceId) {
    setPrevPieceId(piece.id);
    setSize(piece.sizes[0]);
  }

  // The flying hero — a position:fixed copy of the model that animates between
  // the grid tile and the carousel. We animate the box itself (object-fit keeps
  // the model undistorted across the changing aspect ratio).
  const [fly, flyApi] = useSpring(() => ({
    left: originRect.left,
    top: originRect.top,
    width: originRect.width,
    height: originRect.height,
  }));

  // The bottom sheet's vertical position (its top edge). Starts off-screen.
  const [{ y }, sheetApi] = useSpring(() => ({ y: window.innerHeight }));

  // Measure carousel width + sheet detents (and keep them in sync on resize).
  useLayoutEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setTrackW(trackRef.current.clientWidth);
      const vh = window.innerHeight;
      const headerEl = document.querySelector('.detail .app__header');
      const expandedY = headerEl
        ? Math.round(headerEl.getBoundingClientRect().bottom + 6)
        : 88;
      const collapsedY = Math.round(vh * 0.46);
      const peekY = Math.round(vh * 0.76);
      setMetrics({ vh, expandedY, collapsedY, peekY });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Once widths + detents are known, centre the start slide, fly the hero in
  // from the grid tile, and raise the sheet to its collapsed rest. Runs once.
  useLayoutEffect(() => {
    if (!trackW || !metrics.vh || enteredOnce.current || !trackRef.current || !heroRef.current) {
      return;
    }
    enteredOnce.current = true;

    const step = trackW * SLIDE_FRAC;
    trackRef.current.scrollLeft = activeRawIndex * step;

    const target = heroRef.current.getBoundingClientRect();
    flyApi.set({
      left: originRect.left,
      top: originRect.top,
      width: originRect.width,
      height: originRect.height,
    });
    flyApi.start({
      left: target.left,
      top: target.top,
      width: target.width,
      height: target.height,
      config: { tension: 320, friction: 34 },
      onRest: () => setFlying(false),
    });

    sheetApi.set({ y: metrics.vh });
    sheetApi.start({
      y: metrics.collapsedY,
      config: { tension: 300, friction: 34 },
      // Only now bind the carousel height to the sheet (enables the peek enlarge).
      onRest: () => setCoupled(true),
    });

    requestAnimationFrame(() => setEntered(true));
  }, [trackW, metrics, activeRawIndex, originRect, flyApi, sheetApi]);

  const finalizeCarouselSnap = () => {
    const track = trackRef.current;
    if (!track || !trackW) return;
    if (!carouselIntent.current) return;
    const step = trackW * SLIDE_FRAC;
    const settledIdx = clamp(Math.round(track.scrollLeft / step), 0, itemCount * 3 - 1);
    const normalized = mod(settledIdx, itemCount);
    const targetIdx =
      settledIdx < itemCount || settledIdx >= itemCount * 2
        ? itemCount + normalized
        : settledIdx;

    if (swipeTimer.current) clearTimeout(swipeTimer.current);
    track.scrollLeft = targetIdx * step;

    if (targetIdx !== activeRawIndexRef.current) {
      if (commitFadeTimer.current) clearTimeout(commitFadeTimer.current);
      setSwiping(true);
      activeRawIndexRef.current = targetIdx;
      setActiveRawIndex(targetIdx);
      commitFadeTimer.current = window.setTimeout(() => {
        setSwiping(false);
      }, 120);
    } else {
      setSwiping(false);
    }
    carouselIntent.current = false;
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !trackW || !carouselIntent.current) return;

    setSwiping(true);
    if (swipeTimer.current) clearTimeout(swipeTimer.current);
    if (carouselIntentTimer.current) clearTimeout(carouselIntentTimer.current);
    swipeTimer.current = window.setTimeout(finalizeCarouselSnap, 160);
  };

  const onCarouselIntent = () => {
    carouselIntent.current = true;
    if (commitFadeTimer.current) clearTimeout(commitFadeTimer.current);
    if (carouselIntentTimer.current) clearTimeout(carouselIntentTimer.current);
    carouselIntentTimer.current = window.setTimeout(() => {
      carouselIntent.current = false;
      setSwiping(false);
    }, 900);
  };

  const onDrawerScroll = () => {
    const sc = scrollRef.current;
    if (sc) setDrawerScrolled(sc.scrollTop > 4);
  };

  // Move the sheet to one of three detents: expanded (full), collapsed (rest),
  // or peek (header + description only, model enlarged behind it).
  const detentY = (d: Detent) => {
    const { expandedY, collapsedY, peekY } = metricsRef.current;
    return d === 'expanded' ? expandedY : d === 'collapsed' ? collapsedY : peekY;
  };
  const snapTo = (d: Detent) => {
    setDetent(d);
    sheetApi.start({ y: detentY(d), config: { tension: 320, friction: 34 } });
  };

  // Drag anywhere on the sheet to move it between detents, coordinated with the
  // inner scroller: when collapsed (or expanded but scrolled to the top) a drag
  // moves the sheet; otherwise the content scrolls natively. The mode is locked
  // for the duration of each gesture so the two never fight.
  type DragMemo = { startY: number; mode: 'sheet' | 'scroll' };
  const bindSheet = useDrag(
    ({ first, last, movement: [, my], velocity: [, vy], direction: [, dirY], event, memo }) => {
      const { expandedY, collapsedY, peekY } = metricsRef.current;
      let m = memo as DragMemo | undefined;
      if (first || !m) {
        const atTop = !scrollRef.current || scrollRef.current.scrollTop <= 0;
        m = { startY: y.get(), mode: !expanded || atTop ? 'sheet' : 'scroll' };
      }
      if (m.mode === 'scroll') return m; // let the content scroll natively
      // Pulling up while already open at the top: hand off to native scroll.
      if (expanded && my < 0) return m;
      if (!last) event?.preventDefault?.();

      const cur = clamp(m.startY + my, expandedY, peekY);
      if (last) {
        // Snap to the nearest detent, biased one step in the flick direction.
        const order: Detent[] = ['expanded', 'collapsed', 'peek'];
        const ys = [expandedY, collapsedY, peekY];
        let idx = 0;
        let best = Infinity;
        ys.forEach((yy, i) => {
          const d = Math.abs(yy - cur);
          if (d < best) {
            best = d;
            idx = i;
          }
        });
        const flick = dirY * vy;
        if (flick < -0.35 && idx > 0) idx -= 1;
        else if (flick > 0.35 && idx < ys.length - 1) idx += 1;
        snapTo(order[idx]);
      } else {
        sheetApi.start({ y: cur, immediate: true });
      }
      return m;
    },
    { axis: 'y', pointer: { touch: true }, eventOptions: { passive: false } },
  );

  const close = () => {
    if (closing) return;
    setClosing(true);
    setEntered(false);
    setCoupled(false); // freeze the carousel height while the sheet slides away
    sheetApi.start({ y: metricsRef.current.vh, config: { tension: 300, friction: 36 } });
    // Fly the current model back toward the grid tile as everything fades.
    const here = heroRef.current?.getBoundingClientRect();
    if (here) flyApi.set({ left: here.left, top: here.top, width: here.width, height: here.height });
    setFlying(true);
    flyApi.start({
      left: originRect.left,
      top: originRect.top,
      width: originRect.width,
      height: originRect.height,
      config: { tension: 300, friction: 36 },
      onRest: onClose,
    });
  };

  const slideW = trackW * SLIDE_FRAC;
  const peekPx = trackW * PEEK;
  const carouselItems = Array.from({ length: itemCount * 3 }, (_, rawIndex) => ({
    rawIndex,
    item: items[mod(rawIndex, itemCount)],
  }));
  const similar = SIMILAR_PRODUCTS[piece.category];
  const off = discountPct(piece);

  return (
    <div className={`detail${entered ? ' detail--entered' : ''}${closing ? ' detail--closing' : ''}`}>
      {/* ---- Top: model carousel. Its height tracks the sheet top, so the
           model enlarges as the sheet is dragged down toward the peek detent. */}
      <animated.div
        className="detail__stage"
        style={{
          top: metrics.expandedY,
          height: coupled
            ? y.to((v) => Math.max(0, v - metrics.expandedY))
            : Math.max(0, metrics.collapsedY - metrics.expandedY),
        }}
      >
        <div
          className="stage__track"
          ref={trackRef}
          onScroll={onScroll}
          onPointerDown={onCarouselIntent}
          onTouchStart={onCarouselIntent}
          onWheel={onCarouselIntent}
          style={trackW ? { paddingInline: peekPx } : undefined}
        >
          {carouselItems.map(({ item: it, rawIndex }) => (
            <div className="stage__slide" key={rawIndex} style={trackW ? { width: slideW } : undefined}>
              <img
                ref={rawIndex === activeRawIndex ? heroRef : undefined}
                className="slide__img"
                src={outfitFor(it).modelImage}
                alt={it.occasion}
                draggable={false}
                decoding="async"
                style={{ opacity: flying && rawIndex === activeRawIndex ? 0 : 1 }}
              />
            </div>
          ))}
        </div>
      </animated.div>

      {/* ---- Bottom: draggable outfit sheet ---- */}
      <animated.div
        className={`detail__drawer${expanded ? ' detail__drawer--expanded' : ''}${
          drawerScrolled ? ' detail__drawer--scrolled' : ''
        }${swiping ? ' detail__drawer--swiping' : ''}`}
        style={{ y, height: metrics.vh ? metrics.vh - metrics.expandedY : undefined }}
        {...bindSheet()}
      >
        <span className="drawer__handle" aria-hidden="true" />
        <div className="drawer__fade" aria-hidden="true" />

        <div className="drawer__scroll" ref={scrollRef} onScroll={onDrawerScroll}>
          {/* Fades with an intentional carousel swipe, then commits only once the
              snapped item is known. Sheet detent changes do not swap content. */}
          <div className="drawer__content">
          <h2 className="drawer__title">{outfit.occasion}</h2>
          <p className="drawer__desc">{outfit.description}</p>

          <div className="drawer__cta-wrap">
            <button className="drawer__cta" type="button">
              Add {outfit.pieces.length} items to cart · {formatPrice(outfit.total)}
            </button>
          </div>

          <div className="drawer__pieces" role="tablist" aria-label="Outfit pieces">
            {outfit.pieces.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === piece.id}
                className={`piece-chip${p.id === piece.id ? ' piece-chip--active' : ''}`}
                onClick={() => setPieceId(p.id)}
              >
                <img className="piece-chip__img" src={p.imageUrl} alt={p.label} draggable={false} />
              </button>
            ))}
          </div>

          <div className="pdp">
            <div className="pdp__media">
              <img src={piece.imageUrl} alt={piece.name} draggable={false} />
            </div>
            <div className="pdp__info">
              <span className="pdp__brand">{piece.brand}</span>
              <h3 className="pdp__name">{piece.name}</h3>
              <button className="pdp__rating" type="button">
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                  <path
                    d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
                    fill="#f5a623"
                  />
                </svg>
                <span>{piece.rating.toFixed(1)}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="#9bb0bf"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="pdp__price">
                <span className="pdp__price-now">{formatPrice(piece.price)}</span>
                {off > 0 && (
                  <>
                    <span className="pdp__price-mrp">{formatPrice(piece.mrp)}</span>
                    <span className="pdp__price-off">{off}% OFF</span>
                  </>
                )}
              </div>

              <span className="pdp__size-label">Select Size</span>
              <div className="pdp__sizes">
                {piece.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`size-chip${s === size ? ' size-chip--active' : ''}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pdp__actions">
            <button className="pdp__goto" type="button">
              Go to Product
            </button>
            <button className="pdp__cta" type="button">
              Add to cart · {formatPrice(piece.price)}
            </button>
          </div>

          <p className="drawer__similar-label">Similar Products</p>
          <div className="drawer__similar">
            {similar.map((s) => (
              <div className="sim" key={s.id}>
                <button className="sim__chip" type="button" aria-label={`${s.brand} ${s.name}`}>
                  <img className="sim__img" src={s.imageUrl} alt={s.name} draggable={false} />
                </button>
                <span className="sim__badge">{formatPrice(s.price)}</span>
              </div>
            ))}
          </div>
          </div>
        </div>
      </animated.div>

      {/* ---- Chrome: screen-anchored FAB, header + flying hero ---- */}
      <QueryFab />
      <Header onBack={close} />

      {flying && (
        <animated.img
          className="detail__fly"
          src={outfitFor(startItem).modelImage}
          alt=""
          draggable={false}
          style={fly}
        />
      )}
    </div>
  );
}
