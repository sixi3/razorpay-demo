import { useEffect, useRef, useState } from 'react';
import { useTypingPlaceholder } from '../hooks/useTypingPlaceholder';

// Floating natural-language editor for the detail view. Collapsed it's a small
// circle (a sparkle FAB); tapping expands it to a full-width input that floats
// over the carousel. Visually inert in this version — this is the hook where
// "swap the shoes" / "make it more casual" will reach the AI stylist later.
export function QueryFab() {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const showPlaceholder = value.length === 0;
  const placeholder = useTypingPlaceholder(expanded && showPlaceholder && !focused);

  // Focus the field as it opens so the keyboard comes straight up.
  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  // Ride above the on-screen keyboard. The visual viewport shrinks when the
  // keyboard shows; the leftover gap at the bottom is its height. A fixed FAB
  // would otherwise sit behind the keyboard, so we lift it by that amount.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setKbOffset(expanded ? Math.max(0, Math.round(gap)) : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [expanded]);

  const collapse = () => {
    if (value.length === 0) setExpanded(false);
  };

  return (
    <form
      className={`qfab${expanded ? ' qfab--expanded' : ''}`}
      style={{ transform: kbOffset ? `translateY(${-kbOffset}px)` : undefined }}
      onSubmit={(e) => {
        e.preventDefault();
        // intentionally inert in this version
      }}
    >
      <button
        className="qfab__lead"
        type="button"
        aria-label={expanded ? 'Stylist' : 'Ask the stylist'}
        onClick={() => !expanded && setExpanded(true)}
        tabIndex={expanded ? -1 : 0}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path
            d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4L12 3Z"
            fill="currentColor"
          />
          <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" fill="currentColor" />
        </svg>
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
          <span
            className={`qfab__placeholder${focused ? ' qfab__placeholder--hidden' : ''}`}
            aria-hidden="true"
          >
            {placeholder}
            <span className="qfab__caret" />
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
