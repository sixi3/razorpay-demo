import { useEffect, useRef, useState } from 'react';
import { compressedImage } from '../data/items';

const PLACEHOLDER = 'Describe an outfit change you want';

interface QueryFabProps {
  onSubmit?: (message: string) => void;
  autoExpanded?: boolean;
}

// Floating natural-language editor for the detail view. Collapsed it's a small
// circle (a sparkle FAB); tapping expands it to a full-width input that floats
// over the carousel.
export function QueryFab({ onSubmit, autoExpanded = false }: QueryFabProps) {
  const [manualExpanded, setManualExpanded] = useState(false);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const expanded = manualExpanded || autoExpanded || value.length > 0 || focused;
  // Keep the hint up while the field is open and empty — it stays through focus
  // and only clears once the user actually types something.
  const showPlaceholder = value.length === 0 && expanded;

  // Focus the field as it opens so the keyboard comes straight up.
  useEffect(() => {
    if (manualExpanded) inputRef.current?.focus();
  }, [manualExpanded]);

  // Ride above the on-screen keyboard. The visual viewport shrinks when the
  // keyboard shows; the leftover gap at the bottom is its height. A fixed FAB
  // would otherwise sit behind the keyboard, so we lift it by that amount.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setKbOffset(focused ? Math.max(0, Math.round(gap)) : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [focused]);

  const collapse = () => {
    if (value.length === 0) setManualExpanded(false);
  };

  return (
    <form
      className={`qfab${expanded ? ' qfab--expanded' : ''}`}
      style={{ transform: kbOffset ? `translateY(${-kbOffset}px)` : undefined }}
      // Collapsed, the whole pill is the tap target: expand and focus the field
      // synchronously (inside the gesture) so the keyboard reliably opens.
      onClick={() => {
        if (expanded) return;
        setManualExpanded(true);
        inputRef.current?.focus();
      }}
	      onSubmit={(e) => {
	        e.preventDefault();
	        const message = value.trim();
	        if (!message) return;
	        onSubmit?.(message);
	        setValue('');
	        setManualExpanded(false);
	      }}
    >
      <button
        className="qfab__lead"
        type="button"
        aria-label={expanded ? 'Stylist' : 'Ask the stylist'}
        tabIndex={expanded ? -1 : 0}
      >
        <img
          className="qfab__lead-icon"
          src={compressedImage('/assistant-icon.png')}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </button>

      <div className="qfab__field">
        <input
          ref={inputRef}
          className="qfab__input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            collapse();
          }}
          aria-label="Ask the stylist to change this outfit"
          enterKeyHint="send"
          tabIndex={expanded ? 0 : -1}
        />
        {showPlaceholder && (
          <span className="qfab__placeholder" aria-hidden="true">
            {PLACEHOLDER}
          </span>
        )}
      </div>

      <button
        className={`qfab__send${value.length > 0 ? ' qfab__send--active' : ''}`}
        type="submit"
        aria-label="Send"
        tabIndex={-1}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
