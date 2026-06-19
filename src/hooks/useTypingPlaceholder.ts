import { useEffect, useState } from 'react';

const PLACEHOLDERS = [
  'Candlelit dinner date outfit',
  'Casual weekend brunch look',
  'Summer wedding guest style',
  'Comfy long-haul flight fit',
  'Art gallery opening look',
];

const TYPE_MS = 55;
const PAUSE_MS = 1800;
const DELETE_MS = 35;
const GAP_MS = 400;

type Phase = 'typing' | 'deleting';

export function useTypingPlaceholder(active: boolean) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');

  useEffect(() => {
    if (!active) return;

    const phrase = PLACEHOLDERS[phraseIndex];
    let delay: number;
    let tick: () => void;

    switch (phase) {
      case 'typing':
        if (text.length < phrase.length) {
          delay = TYPE_MS;
          tick = () => setText(phrase.slice(0, text.length + 1));
        } else {
          delay = PAUSE_MS;
          tick = () => setPhase('deleting');
        }
        break;
      case 'deleting':
        if (text.length > 0) {
          delay = DELETE_MS;
          tick = () => setText(text.slice(0, -1));
        } else {
          delay = GAP_MS;
          tick = () => {
            setPhraseIndex((i) => (i + 1) % PLACEHOLDERS.length);
            setPhase('typing');
          };
        }
        break;
      default:
        return;
    }

    const timer = window.setTimeout(tick, delay);
    return () => window.clearTimeout(timer);
  }, [active, text, phraseIndex, phase]);

  return text;
}
