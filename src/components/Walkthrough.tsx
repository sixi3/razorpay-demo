import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import './Walkthrough.css';

interface WalkthroughProps {
  onDone: () => void;
}

const TRANSITION_MS = 300;
const STEP_COUNT = 2;

export function Walkthrough({ onDone }: WalkthroughProps) {
  // `step` is the target; `render` is what's mounted. They diverge briefly so
  // the outgoing copy can blur/fade out before the next one fades in.
  const [step, setStep] = useState(0);
  const [render, setRender] = useState(0);
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dockRect, setDockRect] = useState<DOMRect | null>(null);

  // Initial entrance.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Flag the app while the walkthrough runs so chrome can adapt to the overlay.
  useEffect(() => {
    document.body.classList.add('wt-active');
    return () => document.body.classList.remove('wt-active');
  }, []);

  // Step 2 lifts the query input above the full-screen dark overlay (see CSS).
  useEffect(() => {
    if (render !== 1) return;
    document.body.classList.add('wt-step2');
    return () => document.body.classList.remove('wt-step2');
  }, [render]);

  // Cross-fade between steps.
  useEffect(() => {
    if (step === render) return;
    const hide = requestAnimationFrame(() => setShown(false));
    const t = setTimeout(() => {
      setRender(step);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    }, TRANSITION_MS);
    return () => {
      cancelAnimationFrame(hide);
      clearTimeout(t);
    };
  }, [step, render]);

  // Measure the bottom query bar so step 2 can spotlight + point at it.
  useLayoutEffect(() => {
    if (render !== 1) return;
    const measure = () => {
      const el = document.querySelector('.query');
      if (el) setDockRect(el.getBoundingClientRect());
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [render]);

  const finish = () => {
    setShown(false);
    setLeaving(true);
    setTimeout(onDone, TRANSITION_MS + 40);
  };

  const advance = () => {
    if (step < STEP_COUNT - 1) setStep((s) => s + 1);
    else finish();
  };

  const clearH = dockRect ? Math.round(window.innerHeight - dockRect.top) : 150;

  return (
    <div
      className={`wt wt--step${render}${leaving ? ' wt--leaving' : ''}`}
      style={{ ['--wt-clear' as string]: `${clearH}px` } as CSSProperties}
      onClick={advance}
      role="button"
      tabIndex={0}
      aria-label="Continue walkthrough"
    >
      <div className="wt__scrim" />

      <div className={`wt__content${shown ? ' wt__content--in' : ' wt__content--out'}`}>
        {render === 0 ? (
          <PanStep />
        ) : (
          dockRect && <DrawerStep anchor={clearH + 16} />
        )}
      </div>
    </div>
  );
}

function Dots({ active }: { active: number }) {
  return (
    <div className="wt__dots">
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <i key={i} className={i === active ? 'is-on' : ''} />
      ))}
    </div>
  );
}

/* ---- Step 1: pan the grid ---- */
function PanStep() {
  return (
    <div className="wt__pan">
      <div className="wt__gesture" aria-hidden="true">
        <span className="wt__ripple" />
        <span className="wt__touch">
          <HandIcon />
        </span>
      </div>
      <div className="wt__copy wt__copy--center">
        <Dots active={0} />
        <h3 className="wt__title">Drag to explore</h3>
        <p className="wt__body">
          Pan around the grid to discover outfits put together just for you.
        </p>
        <span className="wt__hint">Tap anywhere to continue</span>
      </div>
    </div>
  );
}

/* ---- Step 2: ask the agent in the bottom drawer ---- */
function DrawerStep({ anchor }: { anchor: number }) {
  return (
    <div className="wt__drawer wt__copy wt__copy--center" style={{ bottom: anchor }}>
      <Dots active={1} />
      <h3 className="wt__title">Ask the stylist anything</h3>
      <p className="wt__body">
        Use the input below to describe any outfit you want — the agent will create it for you.
      </p>
      <span className="wt__hint">Tap anywhere to start</span>
      <span className="wt__point" aria-hidden="true">
        <ChevronDownIcon />
      </span>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
      <path
        d="M6 10l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0 0V4.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a5 5 0 0 1-5 5h-1.6a4 4 0 0 1-3-1.3L6 16.2c-.7-.8-.5-1.6.3-2.1.6-.4 1.4-.3 2 .2l.7.7V6.5a1.5 1.5 0 0 1 3 0V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
