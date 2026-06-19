import { Grid } from './components/Grid';
import { Header } from './components/Header';
import { QueryInput } from './components/QueryInput';
import { useInfiniteGrid } from './grid/useInfiniteGrid';
import './App.css';

function App() {
  const { bind, panRef, markerRef, chromeRef, cells } = useInfiniteGrid();

  return (
    <div className="app" ref={chromeRef}>
      <Grid bind={bind as never} panRef={panRef} cells={cells} />
      <div className="app__center-marker" ref={markerRef} aria-hidden="true" />
      <div className="header-backdrop" aria-hidden="true" />
      <Header />
      <div className="dock-backdrop" aria-hidden="true" />
      <div className="app__dock">
        <QueryInput />
      </div>
    </div>
  );
}

export default App;
