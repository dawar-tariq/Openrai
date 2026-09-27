import { MessageSquare, FolderKanban, Bot, Globe, Settings } from 'lucide-react';
import { useStore, type View } from '../lib/store';

const NAV_ITEMS: { id: View; icon: typeof MessageSquare; label: string }[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'projects', icon: FolderKanban, label: 'Projects' },
  { id: 'assistants', icon: Bot, label: 'Assistants' },
  { id: 'websites', icon: Globe, label: 'Sites' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const { view, setView, connectedProviders } = useStore();
  const hasProviders = connectedProviders.some(p => p.status === 'connected');

  return (
    <nav className="flex items-center justify-around border-t border-border-default bg-surface-1/95 backdrop-blur-md safe-bottom">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const active = view === item.id;
        const showDot = item.id === 'settings' && !hasProviders;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`relative flex flex-col items-center gap-0.5 min-w-[3.5rem] py-2 rounded-lg transition-colors active:scale-95 ${
              active ? 'text-accent' : 'text-text-tertiary'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
            {showDot && (
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-warning" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
