import { useState } from 'react';
import { useTypingPlaceholder } from '../hooks/useTypingPlaceholder';

// V1: purely visual. Not wired to anything — this is the hook where
// conversational refinement ("make it more casual", "swap the shoes")
// will connect to the AI stylist in a later version.
export function QueryInput() {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const showPlaceholder = value.length === 0;
  const placeholder = useTypingPlaceholder(showPlaceholder && !focused);

  return (
    <form
      className="query"
      onSubmit={(e) => {
        e.preventDefault();
        // intentionally inert in V1
      }}
    >
      <div className="query__input-wrap">
        <input
          className="query__input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Ask the stylist"
          enterKeyHint="send"
        />
        {showPlaceholder && (
          <span
            className={`query__placeholder${focused ? ' query__placeholder--hidden' : ''}`}
            aria-hidden="true"
          >
            {placeholder}
            <span className="query__caret" />
          </span>
        )}
      </div>
      <button
        className={`query__send${value.length > 0 ? ' query__send--active' : ''}`}
        type="submit"
        aria-label="Send"
        tabIndex={-1}
      >
        <svg className="query__send-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
