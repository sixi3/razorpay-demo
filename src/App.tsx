import { Grid } from './components/Grid';
import { Header } from './components/Header';
import { OutfitStrip } from './components/OutfitStrip';
import { QueryInput } from './components/QueryInput';
import { formatPrice, outfitFor } from './data/items';
import { useInfiniteGrid } from './grid/useInfiniteGrid';
import './App.css';

function App() {
  const { bind, panRef, markerRef, chromeRef, cells, centeredItem } = useInfiniteGrid();
  const outfitTotal = outfitFor(centeredItem).total;

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
    </div>
  );
}

export default App;
