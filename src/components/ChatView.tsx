import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip, FileText, Code, Sparkles, Image,
  ArrowUp, StopCircle, Menu, PanelRight, RotateCcw, Copy, ThumbsUp, ThumbsDown,
  Camera, Plus, Cloud, Server
} from 'lucide-react';
import { useStore } from '../lib/store';
import { sanitizeInput, chatRateLimiter } from '../lib/security';
import { ModelSelector } from './ModelSelector';
import { BottomSheet } from './BottomSheet';
import { ConnectionWizard } from './ConnectionWizard';
import { renderMarkdown } from '../lib/markdown';
import { useMediaQuery, useAutoResize } from '../lib/hooks';

const SUGGESTIONS = [
  { icon: Code, text: 'Write a React component', color: '#17c964' },
  { icon: FileText, text: 'Analyze this document', color: '#f5a623' },
  { icon: Image, text: 'Create a website design', color: '#7828c8' },
  { icon: Sparkles, text: 'Help me brainstorm ideas', color: '#3b9eff' },
];

export function ChatView() {
  const {
    conversations, activeConversationId, createConversation,
    addMessage, setActiveConversation, isGenerating,
    sendMessage, selectedModel, toggleSidebar, sidebarOpen,
    toggleRightPanel, setView
  } = useStore();
  const [input, setInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const autoResize = useAutoResize(textareaRef);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const messages = activeConv?.messages || [];
  const connectedProviders = useStore(s => s.connectedProviders);
  const hasProviders = connectedProviders.some(p => p.status === 'connected');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isGenerating]);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  // Keep composer visible above Android keyboard
  useEffect(() => {
    if (!isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      if (composerRef.current) {
        const keyboardHeight = window.innerHeight - vv.height;
        composerRef.current.style.paddingBottom = keyboardHeight > 0 ? `${keyboardHeight}px` : '';
      }
    };
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, [isMobile]);

  const handleSend = useCallback(() => {
    const sanitized = sanitizeInput(input.trim());
    if (!sanitized || isGenerating) return;
    if (!chatRateLimiter.canProceed()) return; // Rate limit
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation(sanitized.slice(0, 50));
      setActiveConversation(convId);
    }
    addMessage(convId, { role: 'user', content: sanitized });
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendMessage(convId!);
  }, [input, isGenerating, activeConversationId, createConversation, setActiveConversation, addMessage, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-surface-0 relative"
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); }}
    >
      {/* Drop overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-accent/10 border-2 border-dashed border-accent rounded-xl m-4 flex items-center justify-center backdrop-blur-sm"
          >
            <div className="text-center">
              <Paperclip size={32} className="mx-auto mb-2 text-accent" />
              <p className="font-medium text-accent">Drop files here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - compact on mobile */}
      <header className="flex items-center justify-between px-2 md:px-4 py-2 md:py-2.5 border-b border-border-default bg-surface-1/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
          {(!sidebarOpen || isMobile) && (
            <button onClick={toggleSidebar} className="p-2.5 md:p-2 rounded-lg hover:bg-surface-2 text-text-secondary shrink-0">
              <Menu size={20} />
            </button>
          )}
          <ModelSelector />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isMobile && (
            <button onClick={toggleRightPanel} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary transition-colors" title="Toggle panel">
              <PanelRight size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSuggestionClick} hasProviders={hasProviders} onConnect={() => setShowWizard(true)} isMobile={isMobile} />
        ) : (
          <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6 space-y-1">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLast={i === messages.length - 1} isMobile={isMobile} />
            ))}
            {isGenerating && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div ref={composerRef} className="border-t border-border-default bg-surface-1/80 backdrop-blur-md px-2 md:px-4 py-2 md:py-3 transition-[padding]">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end bg-surface-2 rounded-2xl border border-border-default focus-within:border-accent/50 transition-colors">
            <button className="p-2.5 text-text-tertiary hover:text-text-secondary transition-colors shrink-0 self-end">
              <Paperclip size={18} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message OpenRAI..."
              rows={1}
              enterKeyHint="send"
              className="flex-1 py-3 bg-transparent text-[15px] md:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none leading-relaxed max-h-[120px] md:max-h-[200px] min-w-0"
              disabled={isGenerating}
            />
            <div className="flex items-center self-end p-1">
              {isMobile && !isGenerating && (
                <button className="p-2 text-text-tertiary hover:text-text-secondary transition-colors">
                  <Camera size={18} />
                </button>
              )}
              {isGenerating ? (
                <button className="p-2.5 rounded-xl bg-danger text-white hover:bg-danger/90 transition-colors">
                  <StopCircle size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`p-2.5 rounded-xl transition-all ${
                    input.trim()
                      ? 'bg-accent text-accent-text hover:bg-accent-hover active:scale-90'
                      : 'bg-surface-3 text-text-tertiary'
                  }`}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
          {!isMobile && (
            <p className="text-[11px] text-text-tertiary text-center mt-2">
              OpenRAI can make mistakes. Verify important information.
            </p>
          )}
        </div>
      </div>

      {/* Connection Wizard */}
      {isMobile ? (
        <BottomSheet open={showWizard} onClose={() => setShowWizard(false)} maxHeight="90vh">
          <ConnectionWizard onClose={() => setShowWizard(false)} />
        </BottomSheet>
      ) : (
        <AnimatePresence>
          {showWizard && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" onClick={() => setShowWizard(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[80vh] bg-surface-1 rounded-2xl border border-border-default shadow-2xl z-[61] overflow-hidden flex flex-col">
                <ConnectionWizard onClose={() => setShowWizard(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function EmptyState({ onSuggestionClick, hasProviders, onConnect, isMobile }: {
  onSuggestionClick: (text: string) => void; hasProviders: boolean; onConnect: () => void; isMobile: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-full">
      <div className="text-center px-5 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className={`${isMobile ? 'w-14 h-14 mb-4' : 'w-16 h-16 mb-6'} mx-auto rounded-2xl bg-gradient-to-br from-accent/20 to-info/20 flex items-center justify-center`}>
            <img src="/logo.png" alt="" className={isMobile ? 'w-8 h-8' : 'w-10 h-10'} />
          </div>
          {hasProviders ? (
            <>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2`}>What can I help with?</h1>
              <p className="text-text-secondary text-sm mb-6 md:mb-8">Start a conversation or pick a suggestion</p>
            </>
          ) : (
            <>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2`}>Welcome to OpenRAI</h1>
              <p className="text-text-secondary text-sm mb-1">Your Open AI Workspace</p>
              <p className="text-text-tertiary text-xs mb-5">Connect a provider to start chatting with AI</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-6">
                <button onClick={onConnect}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.97] transition-all">
                  <Cloud size={16} /> Connect Cloud AI
                </button>
                <button onClick={onConnect}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-2 text-text-secondary text-sm font-medium border border-border-subtle hover:bg-surface-3 active:scale-[0.97] transition-all">
                  <Server size={16} /> Connect Local AI
                </button>
              </div>
            </>
          )}
        </motion.div>
        {hasProviders && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 gap-2 md:gap-3">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.button key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                  onClick={() => onSuggestionClick(s.text)}
                  className="flex items-center gap-3 p-3.5 md:p-4 rounded-xl bg-surface-1 border border-border-subtle hover:border-border-default hover:bg-surface-2 active:scale-[0.98] transition-all text-left group">
                  <div className="p-2 rounded-lg bg-surface-2 group-hover:bg-surface-3 transition-colors shrink-0" style={{ color: s.color }}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{s.text}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, isLast, isMobile }: { message: import('../lib/store').Message; isLast: boolean; isMobile: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={isLast ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 md:gap-3 py-3 md:py-4 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/20 to-info/20 flex items-center justify-center shrink-0 mt-0.5">
          <img src="/logo.png" alt="" className="w-4 h-4" />
        </div>
      )}
      <div className={`${isMobile ? 'max-w-[90%]' : 'max-w-[85%]'} min-w-0 ${
        isUser ? 'bg-accent text-accent-text rounded-2xl rounded-br-md px-3.5 md:px-4 py-2.5' : ''
      }`}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm">
            {renderMarkdown(message.content)}
            <div className="flex items-center gap-0.5 md:gap-1 mt-3 -ml-1 flex-wrap">
              <button onClick={handleCopy} className="p-2 md:p-1.5 rounded-md hover:bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors touch-target" title="Copy">
                {copied ? <CheckIcon size={14} /> : <Copy size={14} />}
              </button>
              <button className="p-2 md:p-1.5 rounded-md hover:bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors touch-target" title="Good">
                <ThumbsUp size={14} />
              </button>
              <button className="p-2 md:p-1.5 rounded-md hover:bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors touch-target" title="Bad">
                <ThumbsDown size={14} />
              </button>
              <button className="p-2 md:p-1.5 rounded-md hover:bg-surface-2 text-text-tertiary hover:text-text-secondary transition-colors touch-target" title="Retry">
                <RotateCcw size={14} />
              </button>
              {message.model && (
                <span className="text-[10px] text-text-tertiary ml-1">{message.model}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 py-4">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/20 to-info/20 flex items-center justify-center shrink-0">
        <img src="/logo.png" alt="" className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <div className="w-2 h-2 rounded-full bg-text-tertiary typing-dot" />
        <div className="w-2 h-2 rounded-full bg-text-tertiary typing-dot" />
        <div className="w-2 h-2 rounded-full bg-text-tertiary typing-dot" />
      </div>
    </div>
  );
}
