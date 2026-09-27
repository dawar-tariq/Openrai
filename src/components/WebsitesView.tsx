import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Plus, Trash2, X, Code, Eye, Menu,
  Maximize2, Minimize2, RefreshCw, FileText, FileCode,
  FolderOpen, MessageSquare, Send, ChevronRight, Smartphone, Monitor, Tablet
} from 'lucide-react';
import { useStore } from '../lib/store';
import { useMediaQuery } from '../lib/hooks';

type EditorTab = 'html' | 'css' | 'js';
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export function WebsitesView() {
  const {
    websites, activeWebsiteId, setActiveWebsite, createWebsite,
    updateWebsite, deleteWebsite, toggleSidebar, sidebarOpen
  } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editTab, setEditTab] = useState<EditorTab>('html');
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'ai'; text: string}[]>([]);
  const [showFileTree, setShowFileTree] = useState(false);
  const [showMobileAi, setShowMobileAi] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  const activeSite = websites.find(w => w.id === activeWebsiteId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWebsite(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const updatePreview = () => {
    if (!activeSite || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>${activeSite.css}</style></head><body>${
      activeSite.html.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*<\/head>|<body[^>]*>|<\/body>|<!DOCTYPE[^>]*>/gis, '')
    }<script>${activeSite.js}<\/script></body></html>`);
    doc.close();
  };

  useEffect(() => { updatePreview(); }, [activeSite?.html, activeSite?.css, activeSite?.js, showPreview]);

  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  const { connectedProviders, selectedModel, selectedProvider } = useStore();

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiInput('');

    const provider = connectedProviders.find(p => p.id === selectedProvider && p.status === 'connected');
    if (!provider || !selectedModel) {
      setAiMessages(prev => [...prev, { role: 'ai', text: '⚠️ No AI provider connected. Go to Settings → Providers to connect one, then select a model.' }]);
      return;
    }

    setAiMessages(prev => [...prev, { role: 'ai', text: '⏳ Thinking...' }]);

    try {
      const { getAdapter } = await import('../lib/providers');
      const adapter = getAdapter(provider.templateId);
      const siteContext = `Current website HTML:\n\`\`\`html\n${activeSite?.html || ''}\n\`\`\`\n\nCurrent CSS:\n\`\`\`css\n${activeSite?.css || ''}\n\`\`\`\n\nCurrent JS:\n\`\`\`js\n${activeSite?.js || ''}\n\`\`\``;
      const response = await adapter.chat(
        [
          { role: 'system', content: 'You are a web development assistant. The user is building a website. Help them modify the HTML, CSS, or JavaScript. Provide code changes clearly.' },
          { role: 'user', content: `${siteContext}\n\nUser request: ${userMsg}` }
        ],
        selectedModel,
        provider.apiKey,
        provider.baseUrl
      );
      // Replace the "Thinking..." message
      setAiMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: response.content || 'No response received.' }]);
    } catch (err: any) {
      setAiMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: `⚠️ Error: ${err?.message || 'Failed to get response'}` }]);
    }
  };

  // List view
  if (!activeSite) {
    return (
      <div className="flex-1 flex flex-col h-full bg-surface-0">
        <header className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-border-default bg-surface-1/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {(!sidebarOpen || isMobile) && (
              <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary touch-target">
                <Menu size={20} />
              </button>
            )}
            <Globe size={18} className="text-accent" />
            <h1 className="font-semibold text-sm">AI Website Builder</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-accent text-accent-text text-sm font-medium hover:bg-accent-hover active:scale-[0.97] transition-all">
            <Plus size={14} /> New Site
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {showCreate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                <div className="p-4 rounded-xl bg-surface-1 border border-border-default">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Create Website</h3>
                    <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-surface-2"><X size={14} /></button>
                  </div>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Website name"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-sm mb-2 focus:outline-none focus:border-accent/50" autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-sm mb-3 focus:outline-none focus:border-accent/50" rows={2} />
                  <button onClick={handleCreate} disabled={!newName.trim()}
                    className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-accent text-accent-text text-sm font-medium hover:bg-accent-hover active:scale-[0.97] transition-all disabled:opacity-50">
                    Create
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {websites.map((site, i) => (
              <motion.div key={site.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setActiveWebsite(site.id)}
                className="group p-4 rounded-xl bg-surface-1 border border-border-subtle hover:border-border-default hover:bg-surface-2 active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Globe size={20} /></div>
                  <button onClick={e => { e.stopPropagation(); deleteWebsite(site.id); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-danger/20 text-text-tertiary hover:text-danger transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="font-semibold text-sm mb-1">{site.name}</h3>
                <p className="text-xs text-text-tertiary line-clamp-2">{site.description || 'No description'}</p>
              </motion.div>
            ))}
          </div>

          {websites.length === 0 && !showCreate && (
            <div className="text-center py-16">
              <Globe size={40} className="mx-auto mb-3 text-text-tertiary" />
              <p className="text-text-secondary font-medium mb-1">No websites yet</p>
              <p className="text-text-tertiary text-sm mb-4">Create AI-powered websites with live preview</p>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.97] transition-all">
                <Plus size={16} /> Create Your First Site
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Editor view
  const previewWidth = previewDevice === 'mobile' ? 'max-w-[375px]' : previewDevice === 'tablet' ? 'max-w-[768px]' : 'w-full';

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-0">
      {/* Editor header */}
      <header className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border-default bg-surface-1/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {(!sidebarOpen || isMobile) && (
            <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary touch-target">
              <Menu size={18} />
            </button>
          )}
          <button onClick={() => setActiveWebsite(null)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-secondary text-xs">← Back</button>
          <span className="text-sm font-medium truncate max-w-[120px] md:max-w-none">{activeSite.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {isMobile ? (
            <div className="flex items-center gap-1">
              <button onClick={() => setShowMobileAi(true)}
                className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary">
                <MessageSquare size={16} />
              </button>
              <div className="flex items-center bg-surface-2 rounded-lg p-0.5">
                <button onClick={() => setMobileView('editor')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mobileView === 'editor' ? 'bg-surface-3 text-text-primary' : 'text-text-tertiary'}`}>
                  Code
                </button>
                <button onClick={() => setMobileView('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mobileView === 'preview' ? 'bg-surface-3 text-text-primary' : 'text-text-tertiary'}`}>
                  Preview
                </button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => setShowAiChat(!showAiChat)}
                className={`p-2 rounded-lg transition-colors ${showAiChat ? 'bg-accent-muted text-accent' : 'hover:bg-surface-2 text-text-secondary'}`} title="AI Assistant">
                <MessageSquare size={16} />
              </button>
              <button onClick={() => setShowPreview(!showPreview)}
                className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-accent-muted text-accent' : 'hover:bg-surface-2 text-text-secondary'}`} title="Preview">
                <Eye size={16} />
              </button>
              {showPreview && (
                <div className="flex items-center gap-0.5 ml-1 bg-surface-2 rounded-lg p-0.5">
                  {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([dev, Icon]) => (
                    <button key={dev} onClick={() => setPreviewDevice(dev)}
                      className={`p-1 rounded ${previewDevice === dev ? 'bg-surface-3 text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>
                      <Icon size={13} />
                    </button>
                  ))}
                </div>
              )}
              <button onClick={updatePreview} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary" title="Refresh">
                <RefreshCw size={16} />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* File tree (desktop only) */}
        {!isMobile && showFileTree && (
          <div className="w-48 border-r border-border-default bg-surface-1 flex flex-col">
            <div className="px-3 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen size={12} /> Files
            </div>
            {(['html', 'css', 'js'] as const).map(tab => {
              const Icon = tab === 'html' ? FileText : FileCode;
              return (
                <button key={tab} onClick={() => setEditTab(tab)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${editTab === tab ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:bg-surface-2'}`}>
                  <Icon size={13} />
                  <span>index.{tab}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Editor */}
        {(!isMobile || mobileView === 'editor') && (
          <div className={`flex-1 flex flex-col ${!isMobile && showPreview ? 'w-1/2' : ''} border-r border-border-default min-w-0`}>
            <div className="flex border-b border-border-default">
              {!isMobile && (
                <button onClick={() => setShowFileTree(!showFileTree)}
                  className="px-3 py-2 text-text-tertiary hover:text-text-secondary hover:bg-surface-2 border-r border-border-default">
                  <FolderOpen size={14} />
                </button>
              )}
              {(['html', 'css', 'js'] as const).map(tab => (
                <button key={tab} onClick={() => setEditTab(tab)}
                  className={`px-4 py-2.5 md:py-2 text-xs font-medium uppercase transition-colors ${
                    editTab === tab ? 'text-accent border-b-2 border-accent' : 'text-text-tertiary hover:text-text-secondary'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
            <textarea
              value={activeSite[editTab]}
              onChange={e => updateWebsite(activeSite.id, { [editTab]: e.target.value })}
              className="flex-1 p-3 md:p-4 bg-surface-0 font-mono text-sm text-text-primary focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {((!isMobile && showPreview) || (isMobile && mobileView === 'preview')) && (
          <div className={`${isMobile ? 'flex-1' : 'w-1/2'} flex flex-col bg-white`}>
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-2 border-b border-border-default">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              </div>
              <span className="text-[10px] text-text-tertiary font-mono">preview · {previewDevice}</span>
              {isMobile && (
                <button onClick={updatePreview} className="p-1 rounded hover:bg-surface-3 text-text-tertiary">
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
            <div className={`flex-1 flex justify-center bg-[#1a1a2e] overflow-auto`}>
              <iframe ref={iframeRef} className={`h-full bg-white ${previewWidth} transition-all`} sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" title="Preview" />
            </div>
          </div>
        )}

        {/* AI Chat sidebar (desktop) */}
        {!isMobile && showAiChat && (
          <AiChatPanel messages={aiMessages} input={aiInput} setInput={setAiInput} onSend={handleAiSend} onClose={() => setShowAiChat(false)} />
        )}
      </div>

      {/* Mobile AI chat bottom sheet */}
      {isMobile && (
        <MobileAiSheet open={showMobileAi} onClose={() => setShowMobileAi(false)} messages={aiMessages} input={aiInput} setInput={setAiInput} onSend={handleAiSend} />
      )}
    </div>
  );
}

function AiChatPanel({ messages, input, setInput, onSend, onClose }: {
  messages: {role: string; text: string}[]; input: string; setInput: (v: string) => void; onSend: () => void; onClose: () => void;
}) {
  return (
    <div className="w-80 border-l border-border-default bg-surface-1 flex flex-col">
      <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-accent" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-2 text-text-tertiary"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} className="mx-auto mb-2 text-text-tertiary" />
            <p className="text-xs text-text-tertiary">Ask AI to help build your website</p>
            <p className="text-[10px] text-text-tertiary mt-1">"Add a hero section" · "Make it responsive" · "Change colors"</p>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block max-w-[90%] px-3 py-2 rounded-xl ${m.role === 'user' ? 'bg-accent text-accent-text' : 'bg-surface-2 text-text-secondary'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border-default">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSend()}
            placeholder="Ask AI to modify your site..."
            className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:outline-none focus:border-accent/50" />
          <button onClick={onSend} disabled={!input.trim()} className="p-2 rounded-lg bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50"><Send size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function MobileAiSheet({ open, onClose, messages, input, setInput, onSend }: {
  open: boolean; onClose: () => void; messages: {role: string; text: string}[]; input: string; setInput: (v: string) => void; onSend: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 350 }}
        className="fixed bottom-0 left-0 right-0 z-[81] bg-surface-1 rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: '75vh' }}
      >
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-surface-4" /></div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-default">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-accent" />
            <span className="text-sm font-semibold">AI Website Assistant</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-text-tertiary">Ask AI to help build your website</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {['Add a hero section', 'Make it responsive', 'Dark theme'].map(s => (
                  <button key={s} onClick={() => { setInput(s); }} className="text-[11px] px-3 py-1.5 rounded-full bg-surface-2 text-text-secondary hover:bg-surface-3">{s}</button>
                ))}
              </div>
            </div>
          ) : messages.map((m, i) => (
            <div key={i} className={`text-sm leading-relaxed ${m.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block max-w-[85%] px-3 py-2 rounded-xl ${m.role === 'user' ? 'bg-accent text-accent-text' : 'bg-surface-2 text-text-secondary'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border-default pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSend()}
              placeholder="Describe what to build..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 border border-border-subtle text-sm focus:outline-none focus:border-accent/50" />
            <button onClick={onSend} disabled={!input.trim()} className="p-2.5 rounded-xl bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
