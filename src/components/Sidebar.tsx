import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FolderKanban, Bot, Wrench, Globe, Settings,
  Plus, Search, ChevronLeft, Trash2, MoreHorizontal, X
} from 'lucide-react';
import { useStore, type View } from '../lib/store';
import { useMediaQuery } from '../lib/hooks';

const NAV_ITEMS: { id: View; icon: typeof MessageSquare; label: string }[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'projects', icon: FolderKanban, label: 'Projects' },
  { id: 'assistants', icon: Bot, label: 'Assistants' },
  { id: 'tools', icon: Wrench, label: 'Tools' },
  { id: 'websites', icon: Globe, label: 'Websites' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const {
    view, setView, sidebarOpen, toggleSidebar, sidebarCollapsed,
    conversations, activeConversationId, setActiveConversation,
    createConversation, deleteConversation
  } = useStore();
  const [search, setSearch] = useState('');
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewChat = () => {
    const id = createConversation();
    setActiveConversation(id);
    setView('chat');
    if (isMobile) toggleSidebar();
  };

  const handleNavClick = (navId: View) => {
    setView(navId);
    if (isMobile) toggleSidebar();
  };

  const handleConvClick = (id: string) => {
    setActiveConversation(id);
    setView('chat');
    if (isMobile) toggleSidebar();
  };

  if (!sidebarOpen) return null;

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-surface-1 border-r border-border-default ${
      isMobile ? 'w-full' : sidebarCollapsed ? 'w-16' : 'w-72'
    } transition-[width] duration-200 overscroll-contain`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-default">
        {(!sidebarCollapsed || isMobile) && (
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="OpenRAI" className="w-7 h-7" />
            <span className="font-semibold text-sm tracking-tight">OpenRAI</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary transition-colors touch-target"
          aria-label="Close sidebar"
        >
          {isMobile ? <X size={20} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className={`p-3 ${sidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 md:py-2.5 rounded-xl bg-accent text-accent-text font-medium text-sm hover:bg-accent-hover transition-colors active:scale-[0.97]"
        >
          <Plus size={16} strokeWidth={2.5} />
          {(!sidebarCollapsed || isMobile) && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`px-2 space-y-0.5 ${sidebarCollapsed && !isMobile ? 'px-1.5' : ''}`}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm transition-colors active:scale-[0.98] ${
                active
                  ? 'bg-accent-muted text-accent font-medium'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              } ${sidebarCollapsed && !isMobile ? 'justify-center px-0' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Search & Conversations */}
      {(!sidebarCollapsed || isMobile) && view === 'chat' && (
        <div className="flex-1 flex flex-col mt-3 overflow-hidden">
          <div className="px-3 mb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
            {filteredConvs.length === 0 && (
              <p className="text-text-tertiary text-xs text-center py-8">No conversations yet</p>
            )}
            {filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleConvClick(conv.id)}
                onMouseEnter={() => setHoveredConv(conv.id)}
                onMouseLeave={() => setHoveredConv(null)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 md:py-2 rounded-lg text-sm text-left transition-colors active:scale-[0.98] group ${
                  activeConversationId === conv.id
                    ? 'bg-surface-3 text-text-primary'
                    : 'text-text-secondary hover:bg-surface-2'
                }`}
              >
                <MessageSquare size={14} className="shrink-0 opacity-50" />
                <span className="truncate flex-1">{conv.title}</span>
                {(isMobile || hoveredConv === conv.id) && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className={`p-1.5 rounded hover:bg-danger/20 text-text-tertiary hover:text-danger transition-colors touch-target ${isMobile ? 'opacity-50' : ''}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-3 border-t border-border-default">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-info flex items-center justify-center text-white text-xs font-bold">U</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-text-tertiary">Free Plan</p>
            </div>
            <button className="p-1 rounded hover:bg-surface-2 text-text-tertiary">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw]"
        >
          {sidebarContent}
        </motion.div>
      </>
    );
  }

  return sidebarContent;
}
