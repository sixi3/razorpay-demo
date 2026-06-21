import { useEffect, useState } from 'react';
import { compressedImage } from '../data/items';
import './Onboarding.css';

/* ---- Icons ---- */
function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 12h2v2.2h-2z" fill="currentColor" />
    </svg>
  );
}

function PersonAddIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M19 8v5M21.5 10.5h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12.6 3.6 20 11a2 2 0 0 1 0 2.8l-6.2 6.2a2 2 0 0 1-2.8 0L3.6 12.6A2 2 0 0 1 3 11.2V5a2 2 0 0 1 2-2h6.2a2 2 0 0 1 1.4.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FigureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 11.4c0-1.4 1.8-2.4 4-2.4s4 1 4 2.4c0 1-.7 1.8-1.3 2.7-.5.7-.7 1.5-.7 2.3V20h-4v-3.6c0-.8-.2-1.6-.7-2.3C8.7 13.2 8 12.4 8 11.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M12 20S3.5 14.5 3.5 8.8A4.3 4.3 0 0 1 12 6.5a4.3 4.3 0 0 1 8.5 2.3C20.5 14.5 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---- Data ---- */
const OCCUPATIONS = [
  'Accountant',
  'Architect',
  'Artist',
  'Banker',
  'Business Owner',
  'College Student',
  'Consultant',
  'Content Creator',
  'Data Analyst',
  'Doctor',
  'Entrepreneur',
  'Finance Manager',
  'Founder',
  'Graphic Designer',
  'High School Student',
  'Human Resources',
  'Software Engineer',
  'Lawyer',
  'Marketing Lead',
  'Media Professional',
  'Nurse',
  'Photographer',
  'Product Designer',
  'Product Manager',
  'Sales Manager',
  'Teacher',
  'UX Researcher',
];

const BRANDS = [
  'Adidas',
  'Allen Solly',
  'Andamen',
  'Bata',
  'Bewakoof',
  'Bombay Shirt Company',
  'Clarks',
  'Da Milano',
  'Fabindia',
  'Fastrack',
  'H&M',
  'Hidesign',
  'HRX',
  'John Jacobs',
  "Levi's",
  'Linen Club',
  'Louis Philippe',
  'Manyavar',
  'Metro',
  'Nike',
  'Peter England',
  'Puma',
  'Rare Rabbit',
  'Raymond',
  'Red Tape',
  'Ruosh',
  'Snitch',
  'The Souled Store',
  'Titan',
  'U.S. Polo Assn.',
  'Urban Monkey',
  'Van Heusen',
  'Westside',
  'Woodland',
];

const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, ' ');
const labelKey = (value: string) => normalizeLabel(value).toLowerCase();

type Wear = 'womenswear' | 'menswear';

interface ShapeOption {
  id: string;
  label: string;
  img: string;
}

// Body-shape options per wear. Labels mirror the image file names.
const SHAPES: Record<Wear, ShapeOption[]> = {
  womenswear: [
    { id: 'hourglass', label: 'Hourglass', img: compressedImage('/women-figures/hourglass.png') },
    { id: 'pear', label: 'Pear', img: compressedImage('/women-figures/pear.png') },
    { id: 'apple', label: 'Apple', img: compressedImage('/women-figures/apple.png') },
    { id: 'rectangle', label: 'Rectangle', img: compressedImage('/women-figures/rectangle.png') },
  ],
  menswear: [
    { id: 'triangle', label: 'Triangle', img: compressedImage('/men-figures/triangle.png') },
    { id: 'inverted-triangle', label: 'Inverted Triangle', img: compressedImage('/men-figures/inverted-triangle.png') },
    { id: 'rectangle', label: 'Rectangle', img: compressedImage('/men-figures/rectangle.png') },
    { id: 'round', label: 'Round', img: compressedImage('/men-figures/round.png') },
  ],
};

interface OnboardingProps {
  onDone: () => void;
}

const STEP_COUNT = 4;
const TRANSITION_MS = 280;

export function Onboarding({ onDone }: OnboardingProps) {
  // `step` is the target; `render` is the step currently mounted. They diverge
  // briefly during a transition so the outgoing content can blur/fade out before
  // the incoming content fades in.
  const [step, setStep] = useState(0);
  const [render, setRender] = useState(0);
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Selections
  const [wear, setWear] = useState<Set<Wear>>(new Set());
  const [bodyShape, setBodyShape] = useState('');
  const [occupation, setOccupation] = useState('');
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [brandQuery, setBrandQuery] = useState('');

  // The body-shape step (1) is skipped when the user picks both wears, since the
  // figures are wear-specific and there's no single set to show.
  const bothWears = wear.has('menswear') && wear.has('womenswear');

  // Initial entrance.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Drive the cross-fade whenever the target step changes.
  useEffect(() => {
    if (step === render) return;
    const hide = requestAnimationFrame(() => setShown(false)); // blur + fade the current screen out
    const t = setTimeout(() => {
      setRender(step); // swap content while hidden
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setShown(true)), // fade the new screen in
      );
    }, TRANSITION_MS);
    return () => {
      cancelAnimationFrame(hide);
      clearTimeout(t);
    };
  }, [step, render]);

  const goNext = () =>
    setStep((s) => {
      let next = Math.min(STEP_COUNT - 1, s + 1);
      if (next === 1 && bothWears) next = 2; // hop over the body-shape step
      return next;
    });
  const goBack = () =>
    setStep((s) => {
      let prev = Math.max(0, s - 1);
      if (prev === 1 && bothWears) prev = 0; // hop back over the body-shape step
      return prev;
    });

  const finish = () => {
    setShown(false);
    setLeaving(true);
    setTimeout(onDone, TRANSITION_MS + 40);
  };

  const toggleWear = (value: Wear) => {
    setWear((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const pickBodyShape = (id: string) => setBodyShape((prev) => (prev === id ? '' : id));

  const pickOccupation = (value: string) => {
    setOccupation(value);
    goNext();
  };

  const toggleBrand = (name: string) => {
    const label = normalizeLabel(name);
    if (!label) return;
    setBrands((prev) => {
      const next = new Set(prev);
      const existing = Array.from(next).find((brand) => labelKey(brand) === labelKey(label));
      if (existing) next.delete(existing);
      else next.add(label);
      return next;
    });
  };

  const filteredBrands = normalizeLabel(brandQuery)
    ? BRANDS.filter((b) => labelKey(b).includes(labelKey(brandQuery)))
    : BRANDS;

  return (
    <div className={`ob${leaving ? ' ob--leaving' : ''}`}>
      <div className={`ob__content${shown ? ' ob__content--in' : ' ob__content--out'}`}>
        {render === 0 && (
          <WearScreen
            selected={wear}
            onToggle={toggleWear}
            onContinue={goNext}
          />
        )}
        {render === 1 && (
          <BodyShapeScreen
            kind={wear.has('menswear') ? 'menswear' : 'womenswear'}
            selected={bodyShape}
            onPick={pickBodyShape}
            onContinue={goNext}
            onBack={goBack}
            onSkip={goNext}
          />
        )}
        {render === 2 && (
          <OccupationScreen
            value={occupation}
            onChange={setOccupation}
            onPick={pickOccupation}
            onBack={goBack}
            onSkip={goNext}
          />
        )}
        {render === 3 && (
          <BrandsScreen
            selected={brands}
            query={brandQuery}
            onQuery={setBrandQuery}
            brands={filteredBrands}
            onToggle={toggleBrand}
            onBack={goBack}
            onSkip={finish}
            onContinue={finish}
          />
        )}
      </div>
    </div>
  );
}

/* ---- Shared top bar ---- */
function TopBar({ onBack, onSkip }: { onBack?: () => void; onSkip?: () => void }) {
  if (!onBack && !onSkip) return <div className="ob__topbar" />;
  return (
    <div className="ob__topbar">
      {onBack ? (
        <button className="ob__back" type="button" aria-label="Back" onClick={onBack}>
          <ChevronLeftIcon />
        </button>
      ) : (
        <span />
      )}
      {onSkip && (
        <button className="ob__skip" type="button" onClick={onSkip}>
          Skip
        </button>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <div className="ob__badge">{children}</div>;
}

/* ---- Screen 1: Womenswear / Menswear ---- */
function WearScreen({
  selected,
  onToggle,
  onContinue,
}: {
  selected: Set<Wear>;
  onToggle: (v: Wear) => void;
  onContinue: () => void;
}) {
  const options: { id: Wear; label: string }[] = [
    { id: 'womenswear', label: 'Womenswear' },
    { id: 'menswear', label: 'Menswear' },
  ];
  return (
    <div className="ob__screen">
      <TopBar />
      <div className="ob__head">
        <Badge>
          <PersonAddIcon />
        </Badge>
        <h1 className="ob__title">
          What do you <em>wear</em>?
        </h1>
        <p className="ob__sub">You can choose both options if you're interested in both styles</p>
      </div>

      <div className="ob__cards">
        {options.map((opt) => {
          const isOn = selected.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`ob__card${isOn ? ' ob__card--on' : ''}`}
              onClick={() => onToggle(opt.id)}
              aria-pressed={isOn}
            >
              <span className={`ob__radio${isOn ? ' ob__radio--on' : ''}`}>
                {isOn && <CheckIcon />}
              </span>
              <span className="ob__card-label">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ob__footer">
        <button
          type="button"
          className="ob__cta"
          disabled={selected.size === 0}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ---- Screen 2: Body shape ---- */
function BodyShapeScreen({
  kind,
  selected,
  onPick,
  onContinue,
  onBack,
  onSkip,
}: {
  kind: Wear;
  selected: string;
  onPick: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const options = SHAPES[kind];
  return (
    <div className="ob__screen ob__screen--shape">
      <TopBar onBack={onBack} onSkip={onSkip} />
      <div className="ob__head">
        <Badge>
          <FigureIcon />
        </Badge>
        <h1 className="ob__title">
          Which shape feels <em>most like you</em>?
        </h1>
        <p className="ob__sub">Just so we can suggest fits that sit well — pick whatever feels closest</p>
      </div>

      <div className="ob__shape">
        <div className="ob__cards ob__cards--shape">
          {options.map((opt) => {
            const isOn = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`ob__card ob__card--shape${isOn ? ' ob__card--on' : ''}`}
                onClick={() => onPick(opt.id)}
                aria-pressed={isOn}
              >
                <span className={`ob__radio${isOn ? ' ob__radio--on' : ''}`}>
                  {isOn && <CheckIcon />}
                </span>
                <img className="ob__shape-img" src={opt.img} alt="" aria-hidden="true" />
                <span className="ob__card-label">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ob__footer ob__footer--floating">
        <button
          type="button"
          className="ob__cta"
          disabled={!selected}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ---- Screen 3: Occupation ---- */
function OccupationScreen({
  value,
  onChange,
  onPick,
  onBack,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (v: string) => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const query = normalizeLabel(value);
  const queryKey = labelKey(query);
  const visibleOccupations = query
    ? OCCUPATIONS.filter((label) => labelKey(label).includes(queryKey))
    : OCCUPATIONS;
  const exactMatch = query
    ? OCCUPATIONS.some((label) => labelKey(label) === queryKey)
    : false;
  const occupationOptions = query && !exactMatch ? [query, ...visibleOccupations] : visibleOccupations;

  return (
    <div className="ob__screen">
      <TopBar onBack={onBack} onSkip={onSkip} />
      <div className="ob__head">
        <Badge>
          <BriefcaseIcon />
        </Badge>
        <h1 className="ob__title">
          What <em>do you do</em> for work?
        </h1>
        <p className="ob__sub">We'll personalize recommendations for both weekdays and weekends</p>
      </div>

      <form
        className="ob__field-wrap"
        onSubmit={(e) => {
          e.preventDefault();
          if (query) onPick(query);
        }}
      >
        <input
          className="ob__field"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search or add occupation"
          enterKeyHint="done"
          aria-label="Occupation"
        />
      </form>

      <div className="ob__chips">
        {occupationOptions.map((label) => (
          <button
            key={label}
            type="button"
            className={`ob__chip${labelKey(value) === labelKey(label) ? ' ob__chip--on' : ''}`}
            onClick={() => onPick(label)}
          >
            {label}
          </button>
        ))}
        {occupationOptions.length === 0 && (
          <p className="ob__empty">No matching jobs yet. Type your role to add it.</p>
        )}
      </div>
    </div>
  );
}

/* ---- Screen 4: Brands ---- */
function BrandsScreen({
  selected,
  query,
  onQuery,
  brands,
  onToggle,
  onBack,
  onSkip,
  onContinue,
}: {
  selected: Set<string>;
  query: string;
  onQuery: (v: string) => void;
  brands: string[];
  onToggle: (name: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const count = selected.size;
  const ready = count >= 3;
  const customBrand = normalizeLabel(query);
  const customBrandKey = labelKey(customBrand);
  const hasCatalogMatch = customBrand
    ? BRANDS.some((brand) => labelKey(brand) === customBrandKey)
    : false;
  const hasSelectedCustom = customBrand
    ? Array.from(selected).some((brand) => labelKey(brand) === customBrandKey)
    : false;
  const selectedCustomBrands = Array.from(selected).filter(
    (brand) => !BRANDS.some((preset) => labelKey(preset) === labelKey(brand)),
  );
  const showCustomBrand = Boolean(customBrand && !hasCatalogMatch);
  const toggleCustomBrand = () => {
    if (!customBrand) return;
    onToggle(customBrand);
    onQuery('');
  };

  return (
    <div className="ob__screen">
      <TopBar onBack={onBack} onSkip={onSkip} />
      <div className="ob__head">
        <Badge>
          <TagIcon />
        </Badge>
        <h1 className="ob__title">
          Choose 3 or more <em>brands</em>
        </h1>
        <p className="ob__sub">Choose brands of clothes you currently own or want</p>
      </div>

      <div className="ob__brands">
        <form
          className="ob__search"
          onSubmit={(e) => {
            e.preventDefault();
            if (showCustomBrand) toggleCustomBrand();
          }}
        >
          <input
            className="ob__search-input"
            type="text"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search or add brands..."
            aria-label="Search brands"
          />
          <span className="ob__search-icon">
            <SearchIcon />
          </span>
        </form>

        <div className="ob__brand-list">
          {!customBrand &&
            selectedCustomBrands.map((name) => (
              <div key={name} className="ob__brand-row ob__brand-row--custom ob__brand-row--on">
                <span className="ob__brand-name">{name}</span>
                <button
                  type="button"
                  className="ob__heart ob__heart--on"
                  aria-label={`Remove ${name}`}
                  aria-pressed={true}
                  onClick={() => onToggle(name)}
                >
                  <HeartIcon filled />
                </button>
              </div>
            ))}

          {showCustomBrand && (
            <div className={`ob__brand-row ob__brand-row--custom${hasSelectedCustom ? ' ob__brand-row--on' : ''}`}>
              <span className="ob__brand-name">{customBrand}</span>
              <button
                type="button"
                className={`ob__heart${hasSelectedCustom ? ' ob__heart--on' : ''}`}
                aria-label={hasSelectedCustom ? `Remove ${customBrand}` : `Add ${customBrand}`}
                aria-pressed={hasSelectedCustom}
                onClick={toggleCustomBrand}
              >
                <HeartIcon filled={hasSelectedCustom} />
              </button>
            </div>
          )}

          {brands.map((name) => {
            const isOn = Array.from(selected).some((brand) => labelKey(brand) === labelKey(name));
            return (
              <div key={name} className={`ob__brand-row${isOn ? ' ob__brand-row--on' : ''}`}>
                <span className="ob__brand-name">{name}</span>
                <button
                  type="button"
                  className={`ob__heart${isOn ? ' ob__heart--on' : ''}`}
                  aria-label={isOn ? `Remove ${name}` : `Add ${name}`}
                  aria-pressed={isOn}
                  onClick={() => onToggle(name)}
                >
                  <HeartIcon filled={isOn} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ob__footer ob__footer--floating">
        <button
          type="button"
          className="ob__cta"
          disabled={!ready}
          onClick={onContinue}
        >
          {ready ? `Continue with ${count} brands` : 'Like at least 3 brands'}
        </button>
      </div>
    </div>
  );
}
