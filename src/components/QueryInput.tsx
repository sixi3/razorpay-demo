import { useRef, useState } from 'react';
import { useTypingPlaceholder } from '../hooks/useTypingPlaceholder';

interface QueryInputProps {
  // Fired when a non-empty outfit query is submitted; kicks off the search
  // loading state in the grid experience.
  onSearch?: (query: string) => void;
  // While true the send button becomes a stop button (loader is running).
  loading?: boolean;
  // Fired when the stop button is pressed mid-search.
  onStop?: () => void;
}

// Conversational refinement ("make it more casual", "swap the shoes") will
// connect to the AI stylist in a later version. For now a submit triggers the
// search loading + grid reshuffle via onSearch.
export function QueryInput({ onSearch, loading = false, onStop }: QueryInputProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const showPlaceholder = value.length === 0;
  const placeholder = useTypingPlaceholder(showPlaceholder && !focused);

  return (
    <form
      className="query"
      onSubmit={(e) => {
        e.preventDefault();
        const query = value.trim();
        if (!query || loading) return;
        // Keep the query in the input so it persists through the search.
        onSearch?.(query);
        inputRef.current?.blur();
      }}
    >
      <div className="query__input-wrap">
        <input
          ref={inputRef}
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
      {loading ? (
        <button
          className="query__send query__send--active query__send--stop"
          type="button"
          aria-label="Stop search"
          onClick={() => onStop?.()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" />
          </svg>
        </button>
      ) : (
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
      )}
    </form>
  );
}
