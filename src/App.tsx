import { useCallback, useEffect, useState } from 'react';
import { Grid } from './components/Grid';
import { Header } from './components/Header';
import { OutfitStrip } from './components/OutfitStrip';
import { QueryInput } from './components/QueryInput';
import { DetailView } from './components/DetailView';
import { Onboarding } from './components/Onboarding';
import { Walkthrough } from './components/Walkthrough';
import { CoreSpokesLoader } from './components/CoreSpokesLoader';
import { SearchingOverlay } from './components/SearchingOverlay';
import { formatPrice, items, outfitFor, type Item } from './data/items';
import { useInfiniteGrid, type TileRect } from './grid/useInfiniteGrid';
import './App.css';

interface Selection {
  item: Item;
  rect: TileRect;
  pieceId?: string;
}

type AppPhase = 'onboarding' | 'loading' | 'grid';

function App() {
  const params = new URLSearchParams(window.location.search);
  const startsWithOnboarding = params.get('onboarding') === 'true';
  const startsWithWalkthrough = params.get('walkthrough') === 'true';
  const [phase, setPhase] = useState<AppPhase>(startsWithOnboarding ? 'onboarding' : 'loading');
  const [showWalkthroughOnGrid, setShowWalkthroughOnGrid] = useState(
    startsWithOnboarding || startsWithWalkthrough,
  );

  useEffect(() => {
    if (phase !== 'loading') return undefined;

    const preloadImages = Array.from(new Set(items.map((item) => item.gridImageUrl))).map((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      return img;
    });
    const timer = window.setTimeout(() => setPhase('grid'), 5000);

    return () => {
      preloadImages.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
      window.clearTimeout(timer);
    };
  }, [phase]);

  if (phase === 'onboarding') {
    return (
      <Onboarding
        onDone={() => {
          setShowWalkthroughOnGrid(true);
          setPhase('loading');
        }}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <div className="app app--loading">
        <CoreSpokesLoader />
      </div>
    );
  }

  return <GridExperience showWalkthroughOnMount={showWalkthroughOnGrid} />;
}

interface GridExperienceProps {
  showWalkthroughOnMount: boolean;
}

function GridExperience({ showWalkthroughOnMount }: GridExperienceProps) {
  const [showWalkthrough, setShowWalkthrough] = useState(showWalkthroughOnMount);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [bagCount, setBagCount] = useState(0);
  const [bagPulseKey, setBagPulseKey] = useState(0);
  const [searching, setSearching] = useState(false);
  // True once a search has completed and reshuffled results are on screen — the
  // query bar then offers a clear (✕) button instead of send.
  const [searched, setSearched] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const handleSelect = useCallback((item: Item, rect: TileRect, pieceId?: string) => {
    setSelection({ item, rect, pieceId });
  }, []);
  const handleAddToBag = useCallback((quantity = 1) => {
    setBagCount((count) => count + quantity);
    setBagPulseKey((key) => key + 1);
  }, []);
  const handleSearch = useCallback(() => {
    setSearched(false);
    setSearching(true);
  }, []);
  const handleStop = useCallback(() => setSearching(false), []);
  // Clear the query and drop the grid back to its original, unshuffled order.
  const handleClearSearch = useCallback(() => {
    setSearched(false);
    setShuffleSeed(0);
  }, []);

  // A search shows the dot-matrix loader for 5s, then reveals a re-jumbled grid.
  useEffect(() => {
    if (!searching) return undefined;
    const timer = window.setTimeout(() => {
      setShuffleSeed((seed) => seed + 1);
      setSearching(false);
      setSearched(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [searching]);

  const { bind, panRef, markerRef, chromeRef, cells, centeredItem } =
    useInfiniteGrid(handleSelect, shuffleSeed);
  const handlePreviewSelect = useCallback(
    (pieceId: string, rect: DOMRect) => {
      handleSelect(
        centeredItem,
        {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        pieceId,
      );
    },
    [centeredItem, handleSelect],
  );
  const outfitTotal = outfitFor(centeredItem).total;

  useEffect(() => {
    const win = window as unknown as { __openDetail?: () => void };
    // TEMP(verify): drive the detail view without the touch gesture.
    win.__openDetail = () => handleSelect(items[20], { left: 120, top: 250, width: 130, height: 182 });
    return () => {
      delete win.__openDetail;
    };
  }, [handleSelect]);

  return (
    <div className={`app${searching ? ' app--searching' : ''}`} ref={chromeRef}>
      <Grid bind={bind as never} panRef={panRef} cells={cells} />
      {/* Swaps in over the grid only — header + dock stay layered above it. */}
      {searching && <SearchingOverlay />}
      <div className="app__center-marker" ref={markerRef} aria-hidden="true">
        <span className="app__center-marker-price">{formatPrice(outfitTotal)}</span>
      </div>
      <div className="header-backdrop" aria-hidden="true" />
      <Header bagCount={bagCount} bagPulseKey={bagPulseKey} />
      <div className="dock-backdrop" aria-hidden="true" />
      <div className="app__dock">
        {/* The Includes preview mirrors the centered grid item, so it hides with
            the grid; the query bar stays bottom-anchored and in place. */}
        {!searching && <OutfitStrip item={centeredItem} onSelectPiece={handlePreviewSelect} />}
        <QueryInput
          onSearch={handleSearch}
          loading={searching}
          onStop={handleStop}
          searched={searched}
          onClear={handleClearSearch}
        />
      </div>

      {selection && (
        <DetailView
          startItem={selection.item}
          initialPieceId={selection.pieceId}
          originRect={selection.rect}
          bagCount={bagCount}
          bagPulseKey={bagPulseKey}
          onAddToBag={handleAddToBag}
          onClose={() => setSelection(null)}
        />
      )}

      {showWalkthrough && <Walkthrough onDone={() => setShowWalkthrough(false)} />}
    </div>
  );
}

export default App;
