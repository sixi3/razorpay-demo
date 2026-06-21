import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import {
  items,
  outfitFor,
  formatPrice,
  previewProductImage,
  SIMILAR_PRODUCTS,
  type Item,
  type PieceCategory,
  type SimilarProduct,
} from '../data/items';
import type { TileRect } from '../grid/useInfiniteGrid';
import { Header } from './Header';
import { PdpMainPiece, PdpProduct } from './PdpBlock';
import { QueryFab } from './QueryFab';
import { CoreSpokesLoader } from './CoreSpokesLoader';

// Carousel geometry: the active slide is centred and the neighbours peek in.
// The model PNGs are very tall/narrow (~0.32 aspect) with wide transparent side
// margins, so a generous peek is needed for the neighbour figures to show.
const PEEK = 0.22; // fraction of the viewport each neighbour shows
const SLIDE_FRAC = 1 - PEEK * 2; // active slide width as a fraction of viewport

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const mod = (n: number, m: number) => ((n % m) + m) % m;
const similarProductLabel = (product: SimilarProduct) => `${product.brand} ${product.name}`;
const STYLIST_LOADING_STEPS = ['Thinking through the palette', 'Searching for products', 'Curating darker matches'];
const STYLIST_RESPONSE =
  'I kept the relaxed dinner silhouette, but shifted the palette deeper: charcoal trousers, a black leather loafer, a tobacco belt, and a richer neutral shirt. The result feels moodier without becoming formal.';
const STYLIST_PRODUCTS: SimilarProduct[] = [
  SIMILAR_PRODUCTS.Shirt[1],
  SIMILAR_PRODUCTS.Trousers[4],
  SIMILAR_PRODUCTS.Belt[0],
  SIMILAR_PRODUCTS.Footwear[0],
];
const stylistProductCategory = (product: SimilarProduct): PieceCategory => {
  const match = Object.entries(SIMILAR_PRODUCTS).find(([, products]) =>
    products.some((candidate) => candidate.id === product.id),
  );
  return (match?.[0] as PieceCategory | undefined) ?? 'Shirt';
};

interface Metrics {
  vh: number;
  expandedY: number; // sheet top when fully open (just under the header)
  collapsedY: number; // sheet top at rest (carousel visible above)
  peekY: number; // sheet top when minimised to header + description (model enlarged)
}

type Detent = 'expanded' | 'collapsed' | 'peek';
type StylistStatus = 'loading' | 'streaming' | 'done';

interface StylistRun {
  id: number;
  message: string;
  status: StylistStatus;
  loadingStep: number;
  streamedText: string;
  selectedProductId: string;
}

type StylistRunsByItem = Record<number, StylistRun[]>;

interface DetailViewProps {
  startItem: Item;
  initialPieceId?: string;
  originRect: TileRect;
  bagCount: number;
  bagPulseKey: number;
  onAddToBag: (quantity?: number) => void;
  onClose: () => void;
}

export function DetailView({
  startItem,
  initialPieceId,
  originRect,
  bagCount,
  bagPulseKey,
  onAddToBag,
  onClose,
}: DetailViewProps) {
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
  const [drawerAtBottom, setDrawerAtBottom] = useState(false); // expands the stylist FAB near the end
  const [swiping, setSwiping] = useState(false); // brief blur when a snapped item commits
  const [stylistRunsByItem, setStylistRunsByItem] = useState<StylistRunsByItem>({});
  const carouselAnimating = useRef(false);
  const pendingCarouselReset = useRef(false);
  const stylistTimers = useRef<number[]>([]);
  const activeRawIndexRef = useRef(activeRawIndex);
  useEffect(() => {
    activeRawIndexRef.current = activeRawIndex;
  }, [activeRawIndex]);
  useEffect(() => {
    const timers = stylistTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const activeItem = items[activeIndex];
  const outfit = outfitFor(activeItem);
  const activeStylistRuns = stylistRunsByItem[activeItem.id] ?? [];
  const latestActiveStylistRun = activeStylistRuns[activeStylistRuns.length - 1];

  useEffect(() => {
    if (activeStylistRuns.length === 0 || !scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeItem.id, activeStylistRuns.length, latestActiveStylistRun?.status, latestActiveStylistRun?.streamedText.length]);

  // Selected piece + size are reset when the outfit (carousel swipe) or piece
  // changes. Done by adjusting state during render via previous-value trackers
  // rather than effects — no extra commit, no cascading-render lint.
  const initialPiece = outfit.pieces.find((p) => p.id === initialPieceId) ?? outfit.pieces[0];
  const [pieceId, setPieceId] = useState(initialPiece.id);
  const [prevItemId, setPrevItemId] = useState(activeItem.id);
  if (activeItem.id !== prevItemId) {
    setPrevItemId(activeItem.id);
    setPieceId(outfit.pieces[0].id);
  }
  const piece = outfit.pieces.find((p) => p.id === pieceId) ?? outfit.pieces[0];

  const [size, setSize] = useState(piece.sizes[0]);
  const [similarId, setSimilarId] = useState<string | null>(null);
  const [prevPieceId, setPrevPieceId] = useState(piece.id);
  if (piece.id !== prevPieceId) {
    setPrevPieceId(piece.id);
    setSize(piece.sizes[0]);
    setSimilarId(null);
  }
  const similar = SIMILAR_PRODUCTS[piece.category];
  const selectedSimilar = similar.find((s) => s.id === similarId) ?? null;

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
  const [{ carouselX }, carouselApi] = useSpring(() => ({ carouselX: 0 }));

  useLayoutEffect(() => {
    if (!pendingCarouselReset.current) return;
    pendingCarouselReset.current = false;
    carouselApi.set({ carouselX: 0 });
    carouselAnimating.current = false;
    setSwiping(false);
  }, [activeRawIndex, carouselApi]);

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
  }, [trackW, metrics, originRect, flyApi, sheetApi]);

  const resetCarouselMotion = () => {
    carouselAnimating.current = false;
    carouselApi.start({ carouselX: 0, immediate: true });
    setSwiping(false);
  };

  const bindCarousel = useDrag(
    ({ first, last, movement: [mx], velocity: [vx], direction: [dx] }) => {
      if (!trackW || carouselAnimating.current) return;
      const step = trackW * SLIDE_FRAC;
      const dragX = clamp(mx, -step, step);
      if (first) setSwiping(false);

      if (!last) {
        if (Math.abs(dragX) > 6) setSwiping(true);
        carouselApi.start({ carouselX: dragX, immediate: true });
        return;
      }

      const flick = dx * vx;
      const threshold = step * 0.22;
      let delta = 0;
      if (dragX < -threshold || flick < -0.35) delta = 1;
      else if (dragX > threshold || flick > 0.35) delta = -1;

      if (delta === 0) {
        carouselApi.start({
          carouselX: 0,
          config: { tension: 320, friction: 34 },
          onRest: () => setSwiping(false),
        });
        return;
      }

      carouselAnimating.current = true;
      setSwiping(true);
      carouselApi.start({
        carouselX: -delta * step,
        config: { tension: 320, friction: 34 },
        onRest: () => {
          const next = activeRawIndexRef.current + delta;
          pendingCarouselReset.current = true;
          activeRawIndexRef.current = next;
          setActiveRawIndex(next);
        },
      });
    },
    {
      axis: 'x',
      pointer: { touch: true },
      filterTaps: true,
    },
  );

  const updateDrawerScrollState = useCallback(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const scrollable = sc.scrollHeight > sc.clientHeight + 2;
    const distanceFromBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight;
    setDrawerScrolled(sc.scrollTop > 4);
    setDrawerAtBottom(scrollable && distanceFromBottom <= 8);
  }, []);

  const onDrawerScroll = () => {
    updateDrawerScrollState();
  };

  useLayoutEffect(() => {
    updateDrawerScrollState();
  }, [
    activeItem.id,
    piece.id,
    selectedSimilar?.id,
    activeStylistRuns.length,
    latestActiveStylistRun?.streamedText.length,
    updateDrawerScrollState,
  ]);

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

  const queueStylistTimer = (fn: () => void, delay: number) => {
    const timer = window.setTimeout(fn, delay);
    stylistTimers.current.push(timer);
  };

  const updateStylistRun = (itemId: number, runId: number, update: (run: StylistRun) => StylistRun) => {
    setStylistRunsByItem((runsByItem) => {
      const runs = runsByItem[itemId] ?? [];
      return {
        ...runsByItem,
        [itemId]: runs.map((run) => (run.id === runId ? update(run) : run)),
      };
    });
  };

  const startStylistResponse = (itemId: number, runId: number) => {
    updateStylistRun(itemId, runId, (run) => ({
      ...run,
      status: 'streaming',
      loadingStep: STYLIST_LOADING_STEPS.length - 1,
    }));

    Array.from(STYLIST_RESPONSE).forEach((_, index) => {
      queueStylistTimer(() => {
        updateStylistRun(itemId, runId, (run) => {
          const streamedText = STYLIST_RESPONSE.slice(0, index + 1);
          return {
            ...run,
            streamedText,
            status: streamedText.length === STYLIST_RESPONSE.length ? 'done' : 'streaming',
          };
        });
      }, index * 18);
    });
  };

  const submitStylistQuery = (message: string) => {
    const itemId = activeItem.id;
    const runId = Date.now() + Math.round(Math.random() * 1000);
    setStylistRunsByItem((runsByItem) => ({
      ...runsByItem,
      [itemId]: [
        ...(runsByItem[itemId] ?? []),
        {
          id: runId,
          message,
          status: 'loading',
          loadingStep: 0,
          streamedText: '',
          selectedProductId: STYLIST_PRODUCTS[0].id,
        },
      ],
    }));
    snapTo('expanded');

    STYLIST_LOADING_STEPS.slice(1).forEach((_, index) => {
      queueStylistTimer(() => {
        updateStylistRun(itemId, runId, (run) => ({
          ...run,
          loadingStep: Math.min(index + 1, STYLIST_LOADING_STEPS.length - 1),
        }));
      }, (index + 1) * 650);
    });
    queueStylistTimer(() => startStylistResponse(itemId, runId), 2100);

    requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });
  };

  const selectStylistProduct = (itemId: number, runId: number, productId: string) => {
    updateStylistRun(itemId, runId, (run) => ({ ...run, selectedProductId: productId }));
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
        resetCarouselMotion();
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
    resetCarouselMotion();
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
  const carouselItems = [-1, 0, 1].map((offset) => ({
    offset,
    rawIndex: activeRawIndex + offset,
    item: items[mod(activeRawIndex + offset, itemCount)],
  }));

  const slideStyle = (offset: number) => ({
    width: slideW,
    transform: carouselX.to((x) => `translate3d(${offset * slideW + x - slideW / 2}px, 0, 0)`),
  });

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
          {...bindCarousel()}
        >
          {carouselItems.map(({ item: it, rawIndex, offset }) => (
            <animated.div
              className="stage__slide"
              key={`${rawIndex}:${it.id}`}
              style={trackW ? slideStyle(offset) : undefined}
            >
              <img
                ref={offset === 0 ? heroRef : undefined}
                className="slide__img"
                src={outfitFor(it).modelImage}
                alt={it.occasion}
                draggable={false}
                decoding="async"
                loading={offset === 0 ? 'eager' : 'lazy'}
                fetchPriority={offset === 0 ? 'high' : 'low'}
                style={{ opacity: flying && offset === 0 ? 0 : 1 }}
              />
            </animated.div>
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
            <button className="drawer__cta" type="button" onClick={() => onAddToBag(outfit.pieces.length)}>
              Add {outfit.pieces.length} items to bag · {formatPrice(outfit.total)}
            </button>
          </div>

          <div
            className={`drawer__pieces${outfit.pieces.length < 5 ? ' drawer__pieces--centered' : ''}`}
            role="tablist"
            aria-label="Outfit pieces"
          >
            {outfit.pieces.map((p) => (
              <div className="piece" key={p.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={p.id === piece.id}
                  className={`piece-chip${p.id === piece.id ? ' piece-chip--active' : ''}`}
                  onClick={() => setPieceId(p.id)}
                >
                  <img
                    className="piece-chip__img"
                    src={previewProductImage(p.imageUrl)}
                    alt={p.label}
                    draggable={false}
                    decoding="async"
                    loading="lazy"
                  />
                </button>
                <span className="piece-chip__badge">{formatPrice(p.price)}</span>
              </div>
            ))}
          </div>

          <PdpMainPiece product={piece} size={size} onSizeChange={setSize} onAddToBag={onAddToBag} />

          <p className="drawer__similar-label">Similar Products</p>
          <div className="drawer__similar">
            {similar.map((s) => (
              <div className="sim" key={s.id}>
                <button
                  className={`sim__chip${s.id === selectedSimilar?.id ? ' sim__chip--active' : ''}`}
                  type="button"
                  aria-label={similarProductLabel(s)}
                  onClick={() => setSimilarId(s.id)}
                >
                  <img
                    className="sim__img"
                    src={s.previewImageUrl}
                    alt={s.name}
                    draggable={false}
                    decoding="async"
                    loading="lazy"
                  />
                </button>
                <span className="sim__badge">{formatPrice(s.price)}</span>
              </div>
            ))}
          </div>

          {selectedSimilar && <PdpProduct product={selectedSimilar} onAddToBag={onAddToBag} />}

          {activeStylistRuns.map((stylistRun) => (
	            <section className="stylist-thread" aria-label="Stylist response" key={stylistRun.id}>
	              <div className="stylist-thread__user">
	                <div className="stylist-thread__bubble">{stylistRun.message}</div>
	                <span className="stylist-thread__avatar" aria-hidden="true">
	                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
	                    <path
	                      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c1.2-3.5 4-5.5 7.5-5.5s6.3 2 7.5 5.5"
	                      stroke="currentColor"
	                      strokeWidth="2"
	                      strokeLinecap="round"
	                    />
	                  </svg>
	                </span>
	              </div>

	              {stylistRun.status === 'loading' ? (
	                <div className="stylist-thread__agent">
	                  <CoreSpokesLoader
	                    compact
	                    showText={false}
	                    label={STYLIST_LOADING_STEPS[stylistRun.loadingStep]}
	                  />
	                  <span>{STYLIST_LOADING_STEPS[stylistRun.loadingStep]}</span>
	                </div>
	              ) : (
	                <div className="stylist-thread__response">
	                  <p>{stylistRun.streamedText}</p>
                  {stylistRun.status === 'done' && (
                    (() => {
                      const selectedProduct =
                        STYLIST_PRODUCTS.find((product) => product.id === stylistRun.selectedProductId) ??
                        STYLIST_PRODUCTS[0];
                      const selectedCategory = stylistProductCategory(selectedProduct);
                      const selectedProductSimilar = SIMILAR_PRODUCTS[selectedCategory].filter(
                        (product) => product.id !== selectedProduct.id,
                      );
                      return (
                        <>
                          <div className="drawer__similar stylist-thread__products" aria-label="Curated products">
                            {STYLIST_PRODUCTS.map((product) => (
                              <div className="sim" key={product.id}>
                                <button
                                  className={`sim__chip${
                                    product.id === selectedProduct.id ? ' sim__chip--active' : ''
                                  }`}
                                  type="button"
                                  aria-label={similarProductLabel(product)}
                                  onClick={() => selectStylistProduct(activeItem.id, stylistRun.id, product.id)}
                                >
                                  <img
                                    className="sim__img"
                                    src={product.previewImageUrl}
                                    alt={product.name}
                                    draggable={false}
                                    decoding="async"
                                    loading="lazy"
                                  />
                                </button>
                                <span className="sim__badge">{formatPrice(product.price)}</span>
                              </div>
                            ))}
                          </div>

                          <PdpProduct product={selectedProduct} onAddToBag={onAddToBag} />

                          <div className="stylist-thread__related">
                            <p className="drawer__similar-label">Similar Products</p>
                            <div className="drawer__similar" aria-label={`${selectedProduct.name} similar products`}>
                              {selectedProductSimilar.map((product) => (
                                <div className="sim" key={product.id}>
                                  <button className="sim__chip" type="button" aria-label={similarProductLabel(product)}>
                                    <img
                                      className="sim__img"
                                      src={product.previewImageUrl}
                                      alt={product.name}
                                      draggable={false}
                                      decoding="async"
                                      loading="lazy"
                                    />
                                  </button>
                                  <span className="sim__badge">{formatPrice(product.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()
                  )}
	                </div>
	              )}
	            </section>
	          ))}
	          </div>
	        </div>
	      </animated.div>

      {/* ---- Chrome: screen-anchored FAB, header + flying hero ---- */}
      <QueryFab autoExpanded={drawerAtBottom} onSubmit={submitStylistQuery} />
      <Header onBack={close} bagCount={bagCount} bagPulseKey={bagPulseKey} />

      {flying && (
        <animated.img
          className="detail__fly"
          src={outfitFor(startItem).modelImage}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
          style={fly}
        />
      )}
    </div>
  );
}
