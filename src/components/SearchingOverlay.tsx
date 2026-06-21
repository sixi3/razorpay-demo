import { useEffect, useState } from 'react';
import { CoreSpokesLoader } from './CoreSpokesLoader';

// Texts cycle while the stylist "searches" for a new outfit grid. Tuned so the
// four steps step through across the ~5s loading window, landing on the last
// message just before the reshuffled grid is revealed.
const SEARCH_STEPS = [
  'Reading your request',
  'Sketching fresh looks',
  'Matching pieces & palettes',
  'Styling your new grid',
];

const STEP_MS = 1250;

export function SearchingOverlay() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, SEARCH_STEPS.length - 1));
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="app__search-overlay">
      <CoreSpokesLoader label={SEARCH_STEPS[step]} animateLabel />
    </div>
  );
}
