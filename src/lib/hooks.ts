import { useEffect, useCallback, useState } from 'react';
import { useStore } from './store';

export function useThemeInit() {
  const { theme, setTheme } = useStore();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) root.classList.add('dark');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, setTheme]);
}

export function useKeyboardShortcuts() {
  const { setCommandPaletteOpen, toggleSidebar, createConversation, setView, setActiveConversation } = useStore();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'k') { e.preventDefault(); setCommandPaletteOpen(true); }
      if (meta && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      if (meta && e.key === 'n') { e.preventDefault(); const id = createConversation(); setActiveConversation(id); setView('chat'); }
      if (e.key === 'Escape') { setCommandPaletteOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen, toggleSidebar, createConversation, setView, setActiveConversation]);
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>) {
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [ref]);
  return resize;
}
