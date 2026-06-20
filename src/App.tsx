import { useCallback, useState } from 'react';
import { Grid } from './components/Grid';
import { Header } from './components/Header';
import { OutfitStrip } from './components/OutfitStrip';
import { QueryInput } from './components/QueryInput';
import { DetailView } from './components/DetailView';
import { formatPrice, items, outfitFor, type Item } from './data/items';
import { useInfiniteGrid, type TileRect } from './grid/useInfiniteGrid';
import './App.css';

interface Selection {
  item: Item;
  rect: TileRect;
}

function App() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const handleSelect = useCallback((item: Item, rect: TileRect) => {
    setSelection({ item, rect });
  }, []);

  const { bind, panRef, markerRef, chromeRef, cells, centeredItem } = useInfiniteGrid(handleSelect);
  const outfitTotal = outfitFor(centeredItem).total;

  // TEMP(verify): drive the detail view without the touch gesture.
  (window as unknown as { __openDetail: () => void }).__openDetail = () =>
    handleSelect(items[20], { left: 120, top: 250, width: 130, height: 182 });

  return (
    <div className="app" ref={chromeRef}>
      <Grid bind={bind as never} panRef={panRef} cells={cells} />
      <div className="app__center-marker" ref={markerRef} aria-hidden="true">
        <span className="app__center-marker-price">{formatPrice(outfitTotal)}</span>
      </div>
      <div className="header-backdrop" aria-hidden="true" />
      <Header />
      <div className="dock-backdrop" aria-hidden="true" />
      <div className="app__dock">
        <OutfitStrip item={centeredItem} />
        <QueryInput />
      </div>

      {selection && (
        <DetailView
          startItem={selection.item}
          originRect={selection.rect}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}

export default App;
