function CaretLeftIcon() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className="header__icon">
      <path
        d="M160 208 80 128l80-80"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className="header__icon">
      <path
        d="M128 216S28 160 28 92a52 52 0 0 1 92-33.3h0L128 68l8-9.3h0A52 52 0 0 1 228 92c0 68-100 124-100 124Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    </svg>
  );
}

function HandbagIcon() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className="header__icon">
      <path
        d="M80 96V72a48 48 0 0 1 96 0v24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <path
        d="M44 96h168l-12 120H56L44 96Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    </svg>
  );
}

interface HeaderProps {
  onBack?: () => void;
  bagCount?: number;
  bagPulseKey?: number;
}

export function Header({ onBack, bagCount = 0, bagPulseKey = 0 }: HeaderProps) {
  const hasBagItems = bagCount > 0;
  const bagLabel = hasBagItems ? `Bag, ${bagCount} ${bagCount === 1 ? 'item' : 'items'}` : 'Bag';

  return (
    <header className="app__header">
      <div className="header__brand">
        <button className="header__back-pill" type="button" aria-label="Back" onClick={onBack}>
          <CaretLeftIcon />
          <img className="header__back-logo" src="/ajio-icon.png" alt="" draggable={false} />
        </button>
        <div className="header__title">Nova</div>
      </div>
      <div className="header__actions">
        <button className="header__button" type="button" aria-label="Favorites">
          <HeartIcon />
        </button>
        <button
          key={bagPulseKey}
          className={`header__button header__button--bag${bagPulseKey ? ' header__button--bag-bump' : ''}`}
          type="button"
          aria-label={bagLabel}
        >
          <HandbagIcon />
          {hasBagItems && <span className="header__bag-badge">{bagCount > 99 ? '99+' : bagCount}</span>}
        </button>
      </div>
    </header>
  );
}
