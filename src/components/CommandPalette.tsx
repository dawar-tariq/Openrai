import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MessageSquare, FolderKanban, Bot, Wrench, Globe,
  Settings, Plus, Moon, Sun, Keyboard
} from 'lucide-react';
import { useStore, type View } from '../lib/store';

interface Command {
  id: string;
  icon: typeof Search;
  label: string;
  description: string;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const {
    commandPaletteOpen, setCommandPaletteOpen, setView,
    createConversation, setActiveConversation, theme, setTheme
  } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(() => [
    { id: 'new-chat', icon: Plus, label: 'New Chat', description: 'Start a new conversation', action: () => { const id = createConversation(); setActiveConversation(id); setView('chat'); }, category: 'Actions' },
    { id: 'chat', icon: MessageSquare, label: 'Go to Chat', description: 'Open chat view', action: () => setView('chat'), category: 'Navigation' },
    { id: 'projects', icon: FolderKanban, label: 'Go to Projects', description: 'Manage projects', action: () => setView('projects'), category: 'Navigation' },
    { id: 'assistants', icon: Bot, label: 'Go to Assistants', description: 'Configure AI assistants', action: () => setView('assistants'), category: 'Navigation' },
    { id: 'tools', icon: Wrench, label: 'Go to Tools', description: 'AI tools and agents', action: () => setView('tools'), category: 'Navigation' },
    { id: 'websites', icon: Globe, label: 'Go to Websites', description: 'Create AI websites', action: () => setView('websites'), category: 'Navigation' },
    { id: 'settings', icon: Settings, label: 'Go to Settings', description: 'App settings', action: () => setView('settings'), category: 'Navigation' },
    { id: 'theme-light', icon: Sun, label: 'Light Theme', description: 'Switch to light mode', action: () => setTheme('light'), category: 'Theme' },
    { id: 'theme-dark', icon: Moon, label: 'Dark Theme', description: 'Switch to dark mode', action: () => setTheme('dark'), category: 'Theme' },
  ], [createConversation, setActiveConversation, setView, setTheme]);

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const handleSelect = (cmd: Command) => {
    cmd.action();
    setCommandPaletteOpen(false);
  };

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-surface-1 rounded-2xl border border-border-default shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
            <Search size={18} className="text-text-tertiary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-3 text-[10px] text-text-tertiary font-mono">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {Object.entries(grouped).map(([category, cmds]) => (
              <div key={category} className="mb-2 last:mb-0">
                <p className="px-3 py-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">{category}</p>
                {cmds.map(cmd => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-surface-2 transition-colors"
                    >
                      <Icon size={16} className="text-text-tertiary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cmd.label}</p>
                        <p className="text-xs text-text-tertiary">{cmd.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-text-tertiary py-8">No commands found</p>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-border-default text-[10px] text-text-tertiary">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Keyboard size={10} /> Navigate</span>
              <span>↵ Select</span>
            </div>
            <span>⌘K to toggle</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
