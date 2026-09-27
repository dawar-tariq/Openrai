import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Check, Zap, Brain, Eye, Code, X, Settings,
  RefreshCw, Star, AlertCircle, Cloud, Server, Wrench,
  GitCompare, Pin
} from 'lucide-react';
import { useStore } from '../lib/store';
import { BottomSheet } from './BottomSheet';
import { useMediaQuery } from '../lib/hooks';

const CAPABILITY_ICONS: Record<string, typeof Zap> = {
  chat: Zap, reasoning: Brain, vision: Eye, code: Code, analysis: Brain
};

const CATEGORY_CONFIG: Record<string, { icon: typeof Cloud; label: string; color: string }> = {
  cloud: { icon: Cloud, label: 'Cloud', color: '#3b9eff' },
  local: { icon: Server, label: 'Local', color: '#17c964' },
  custom: { icon: Wrench, label: 'Custom', color: '#f59e0b' },
};

const PRICING_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: '#17c964' },
  metered: { label: 'Pay-per-use', color: '#f5a623' },
  enterprise: { label: 'Enterprise', color: '#7828c8' },
};

export function ModelSelector() {
  const {
    selectedModel, selectedProvider, modelSelectorOpen, setModelSelectorOpen,
    setModel, connectedProviders, setView, refreshAllModels, toggleFavoriteModel,
    defaultModel, defaultProvider, setDefaultModel,
    compareMode, setCompareMode, toggleCompareModel, compareProviders
  } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const activeProviders = connectedProviders.filter(p => p.status === 'connected');
  const hasProviders = activeProviders.length > 0;
  const currentProviderObj = connectedProviders.find(p => p.id === selectedProvider);
  const currentModel = currentProviderObj?.models.find(m => m.id === selectedModel);

  const lastRefreshed = connectedProviders.reduce<number | null>((latest, p) => {
    if (!p.modelsLastRefreshed) return latest;
    if (!latest) return p.modelsLastRefreshed;
    return Math.max(latest, p.modelsLastRefreshed);
  }, null);

  const formatRefreshTime = (ts: number | null) => {
    if (!ts) return 'Never';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(ts).toLocaleDateString();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllModels();
    setIsRefreshing(false);
  };

  const handleClose = () => { setModelSelectorOpen(false); setSearchQuery(''); };

  // Trigger button
  const triggerButton = (
    <button
      onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
      className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-sm transition-colors min-w-0 max-w-[55vw] md:max-w-none active:scale-[0.97]"
    >
      {hasProviders ? (
        <>
          <span style={{ color: currentProviderObj?.color }} className="text-xs font-bold shrink-0">{currentProviderObj?.icon}</span>
          <span className="font-medium text-text-primary truncate">{currentModel?.name || selectedModel || 'Select model'}</span>
        </>
      ) : (
        <>
          <AlertCircle size={14} className="text-warning shrink-0" />
          <span className="font-medium text-text-secondary truncate">No provider</span>
        </>
      )}
      <ChevronDown size={14} className={`text-text-tertiary transition-transform shrink-0 ${modelSelectorOpen ? 'rotate-180' : ''}`} />
    </button>
  );

  // No providers content
  const noProviderContent = (
    <div className="p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-warning/10 flex items-center justify-center">
        <AlertCircle size={24} className="text-warning" />
      </div>
      <h3 className="font-semibold text-sm mb-1">No AI providers connected</h3>
      <p className="text-xs text-text-tertiary mb-4">Connect a provider in Settings to start using AI.</p>
      <button
        onClick={() => { handleClose(); setView('settings'); }}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.97] transition-all"
      >
        <Settings size={15} />
        Add Provider
      </button>
    </div>
  );

  // Model list content (shared between desktop dropdown and mobile bottom sheet)
  const modelListContent = (
    <>
      {/* Search + info */}
      <div className="px-4 py-2.5 border-b border-border-subtle bg-surface-0/50 space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search models..."
          className="w-full px-3 py-2.5 md:py-2 rounded-xl md:rounded-lg bg-surface-2 border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-tertiary">
            {activeProviders.length} provider{activeProviders.length !== 1 ? 's' : ''} · {activeProviders.reduce((s, p) => s + p.models.length, 0)} models · {formatRefreshTime(lastRefreshed)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors ${
                compareMode ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <GitCompare size={10} /> Compare
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-text-tertiary hover:text-text-secondary text-[10px] disabled:opacity-50"
            >
              <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Compare mode banner */}
      {compareMode && (
        <div className="px-4 py-2 bg-accent/8 border-b border-accent/20 flex items-center justify-between">
          <span className="text-[11px] text-accent font-medium">{compareProviders.length} selected</span>
          {compareProviders.length >= 2 && (
            <button onClick={() => { handleClose(); setCompareMode(false); }} className="text-[10px] px-2 py-1 rounded bg-accent text-accent-text font-medium">
              Start Compare
            </button>
          )}
        </div>
      )}

      {/* Models */}
      <div className="overflow-y-auto p-2 md:max-h-[55vh]">
        {activeProviders.map(provider => {
          const catInfo = CATEGORY_CONFIG[provider.category];
          const ProvCatIcon = catInfo?.icon || Cloud;
          const filteredModels = searchQuery
            ? provider.models.filter(m =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : provider.models;
          if (filteredModels.length === 0 && searchQuery) return null;

          return (
            <div key={provider.id} className="mb-3 last:mb-0">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-text-tertiary">
                <span style={{ color: provider.color }}>{provider.icon}</span>
                <span className="flex-1 uppercase tracking-wider">{provider.name}</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-medium normal-case tracking-normal px-1.5 py-0.5 rounded-full" style={{ background: catInfo.color + '15', color: catInfo.color }}>
                  <ProvCatIcon size={8} />{catInfo.label}
                </span>
                {provider.healthLatencyMs && (
                  <span className="text-[9px] font-normal normal-case tracking-normal text-success">{provider.healthLatencyMs}ms</span>
                )}
              </div>
              {filteredModels.map(model => {
                const isActive = selectedModel === model.id && selectedProvider === provider.id;
                const isDefault = defaultModel === model.id && defaultProvider === provider.id;
                const isFav = provider.favoriteModels.includes(model.id);
                const isCompareSelected = compareProviders.some(c => c.providerId === provider.id && c.modelId === model.id);
                const pricingInfo = model.pricing ? PRICING_LABELS[model.pricing] : null;

                return (
                  <button
                    key={`${provider.id}-${model.id}`}
                    onClick={() => {
                      if (compareMode) { toggleCompareModel(provider.id, model.id); }
                      else { setModel(model.id, provider.id); setSearchQuery(''); }
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-3 md:py-2.5 rounded-xl md:rounded-lg text-left transition-colors active:scale-[0.99] ${
                      compareMode && isCompareSelected ? 'bg-accent/10 ring-1 ring-accent/30' :
                      isActive ? 'bg-accent-muted' : 'hover:bg-surface-2'
                    }`}
                  >
                    {compareMode && (
                      <div className={`w-5 h-5 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                        isCompareSelected ? 'bg-accent border-accent' : 'border-border-default'
                      }`}>
                        {isCompareSelected && <Check size={11} className="text-white" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm text-text-primary">{model.name}</span>
                        {isDefault && <span className="text-[9px] px-1 py-0.5 rounded bg-accent/15 text-accent font-medium">Default</span>}
                        {model.contextWindow && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-tertiary">{model.contextWindow}</span>}
                        {pricingInfo && <span className="text-[9px] px-1 py-0.5 rounded font-medium" style={{ background: pricingInfo.color + '15', color: pricingInfo.color }}>{pricingInfo.label}</span>}
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5">{model.description}</p>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {model.capabilities.map(cap => {
                          const Icon = CAPABILITY_ICONS[cap] || Zap;
                          return (
                            <span key={cap} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-tertiary">
                              <Icon size={10} />{cap}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    {!compareMode && (
                      <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); toggleFavoriteModel(provider.id, model.id); }}
                          className={`p-1.5 rounded transition-colors ${isFav ? 'text-warning' : 'text-text-tertiary/20 hover:text-text-tertiary'}`}>
                          <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                        {isActive && <Check size={14} className="text-accent" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border-default">
        <button
          onClick={() => { handleClose(); setView('settings'); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 md:py-2 rounded-xl md:rounded-lg text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-2 active:scale-[0.98] transition-all"
        >
          <Settings size={13} /> Manage providers
        </button>
      </div>
    </>
  );

  // Mobile: use BottomSheet
  if (isMobile) {
    return (
      <div className="relative min-w-0">
        {triggerButton}
        <BottomSheet
          open={modelSelectorOpen}
          onClose={handleClose}
          title={hasProviders ? 'Select Model' : undefined}
          maxHeight="85vh"
        >
          {hasProviders ? modelListContent : noProviderContent}
        </BottomSheet>
      </div>
    );
  }

  // Desktop: dropdown
  return (
    <div className="relative">
      {triggerButton}
      <AnimatePresence>
        {modelSelectorOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={handleClose} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] bg-surface-1 border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {hasProviders ? (
                <>
                  <div className="flex items-center justify-between p-3 border-b border-border-default">
                    <h3 className="font-semibold text-sm">Select Model</h3>
                    <button onClick={handleClose} className="p-1 rounded hover:bg-surface-2 text-text-tertiary"><X size={14} /></button>
                  </div>
                  {modelListContent}
                </>
              ) : noProviderContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
