import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Sun, Moon, Monitor, Bell, Shield, Palette, Menu,
  Plus, Trash2, RefreshCw, ExternalLink, ChevronRight, X,
  Check, AlertCircle, Loader2, Cloud, Server, Wrench, Wifi, WifiOff, Star, Zap
} from 'lucide-react';
import {
  useStore, type Theme,
  CLOUD_PROVIDER_TEMPLATES, LOCAL_PROVIDER_TEMPLATES, CUSTOM_PROVIDER_TEMPLATE,
  type ProviderTemplate, type ConnectedProvider,
  detectServerType
} from '../lib/store';
import { validateApiKeyFormat, maskCredential, isSafeUrl } from '../lib/security';
import { useMediaQuery } from '../lib/hooks';

type SettingsTab = 'providers' | 'appearance' | 'notifications' | 'privacy';

export function SettingsView() {
  const { theme, setTheme, toggleSidebar, sidebarOpen, connectedProviders } = useStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
    { id: 'providers', label: 'Providers', icon: Cloud },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-0">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border-default bg-surface-1/80 backdrop-blur-md">
        {(!sidebarOpen || isMobile) && (
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary">
            <Menu size={20} />
          </button>
        )}
        <Settings size={18} className="text-accent" />
        <h1 className="font-semibold text-sm">Settings</h1>
      </header>

      {/* Tab bar */}
      <div className="border-b border-border-default bg-surface-1/50">
        <div className="max-w-3xl mx-auto flex gap-0.5 md:gap-1 overflow-x-auto no-scrollbar px-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.id === 'providers' && connectedProviders.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                    {connectedProviders.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          {activeTab === 'providers' && <ProvidersTab />}
          {activeTab === 'appearance' && <AppearanceTab theme={theme} setTheme={setTheme} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'privacy' && <PrivacyTab />}
        </div>
      </div>
    </div>
  );
}

// ── Providers Tab ────────────────────────────────────────────────

function ProvidersTab() {
  const { connectedProviders, disconnectProvider, refreshModels, refreshAllModels } = useStore();
  const [showAddFlow, setShowAddFlow] = useState(false);
  const [addCategory, setAddCategory] = useState<'cloud' | 'local' | 'custom' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const connected = connectedProviders;
  const cloudConnected = connected.filter(p => p.category === 'cloud');
  const localConnected = connected.filter(p => p.category === 'local');
  const customConnected = connected.filter(p => p.category === 'custom');

  // Find latest refresh time
  const lastRefreshed = connected.reduce<number | null>((latest, p) => {
    if (!p.modelsLastRefreshed) return latest;
    if (!latest) return p.modelsLastRefreshed;
    return Math.max(latest, p.modelsLastRefreshed);
  }, null);

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    await refreshAllModels();
    setIsRefreshingAll(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base">AI Providers</h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            {connected.length === 0
              ? 'No providers connected — add one to get started'
              : `${connected.length} provider${connected.length !== 1 ? 's' : ''} connected · ${connected.reduce((s, p) => s + p.models.length, 0)} models available`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected.length > 0 && (
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-xs font-medium text-text-secondary transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshingAll ? 'animate-spin' : ''} />
              Refresh Models
            </button>
          )}
          <button
            onClick={() => { setShowAddFlow(true); setAddCategory(null); setSelectedTemplate(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-text text-xs font-medium hover:bg-accent-hover transition-colors"
          >
            <Plus size={12} />
            Add Provider
          </button>
        </div>
      </div>

      {/* Refresh timestamp */}
      {lastRefreshed && (
        <div className="text-[10px] text-text-tertiary -mt-4">
          Last refreshed: {new Date(lastRefreshed).toLocaleString()}
        </div>
      )}

      {/* Add Provider Flow */}
      <AnimatePresence>
        {showAddFlow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-surface-1 border border-border-default overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border-default">
                <div className="flex items-center gap-2">
                  {selectedTemplate && (
                    <button onClick={() => { setSelectedTemplate(null); if (!addCategory) setShowAddFlow(false); }} className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary">
                      ←
                    </button>
                  )}
                  {addCategory && !selectedTemplate && (
                    <button onClick={() => setAddCategory(null)} className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary">
                      ←
                    </button>
                  )}
                  <h3 className="font-semibold text-sm">
                    {selectedTemplate ? `Connect ${selectedTemplate.name}` : addCategory ? `Choose ${addCategory === 'cloud' ? 'Cloud' : addCategory === 'local' ? 'Local' : 'Custom'} Provider` : 'Add Provider'}
                  </h3>
                </div>
                <button onClick={() => { setShowAddFlow(false); setAddCategory(null); setSelectedTemplate(null); }} className="p-1 rounded hover:bg-surface-2 text-text-tertiary">
                  <X size={14} />
                </button>
              </div>

              <div className="p-4">
                {/* Step 1: Choose category */}
                {!addCategory && !selectedTemplate && (
                  <div className="flex flex-col gap-3">
                    <CategoryCard
                      icon={Cloud}
                      title="Cloud Provider"
                      description="OpenAI, Anthropic, Google, and more"
                      onClick={() => setAddCategory('cloud')}
                      color="#3b9eff"
                    />
                    <CategoryCard
                      icon={Server}
                      title="Local Model"
                      description="Ollama, LM Studio, vLLM, llama.cpp"
                      onClick={() => setAddCategory('local')}
                      color="#17c964"
                    />
                    <CategoryCard
                      icon={Wrench}
                      title="Custom Server"
                      description="Any OpenAI-compatible API"
                      onClick={() => { setAddCategory('custom'); setSelectedTemplate(CUSTOM_PROVIDER_TEMPLATE); }}
                      color="#f59e0b"
                    />
                  </div>
                )}

                {/* Step 2: Choose template */}
                {addCategory && !selectedTemplate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(addCategory === 'cloud' ? CLOUD_PROVIDER_TEMPLATES : LOCAL_PROVIDER_TEMPLATES).map(t => {
                      const alreadyConnected = connected.some(c => c.templateId === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border-subtle text-left transition-all group"
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: t.color + '18', color: t.color }}>
                            {t.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{t.name}</span>
                              {alreadyConnected && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium">Connected</span>
                              )}
                            </div>
                            <p className="text-xs text-text-tertiary truncate">{t.description}</p>
                          </div>
                          <ChevronRight size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Configure */}
                {selectedTemplate && (
                  <ProviderConfigForm
                    template={selectedTemplate}
                    onDone={() => { setShowAddFlow(false); setAddCategory(null); setSelectedTemplate(null); }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {connected.length === 0 && !showAddFlow && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-surface-1 border border-border-default p-8 text-center"
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/15 to-info/15 flex items-center justify-center">
            <Cloud size={28} className="text-accent" />
          </div>
          <h3 className="font-semibold text-base mb-1">Welcome to OpenRAI</h3>
          <p className="text-sm text-text-tertiary mb-5 max-w-sm mx-auto">
            No AI providers connected yet. Connect a cloud provider, local model server, or custom API to start using AI.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 max-w-sm mx-auto">
            <button
              onClick={() => { setShowAddFlow(true); setAddCategory('cloud'); }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.97] transition-all"
            >
              <Cloud size={16} />
              Connect Cloud Provider
            </button>
            <button
              onClick={() => { setShowAddFlow(true); setAddCategory('local'); }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 text-text-secondary text-sm font-medium hover:bg-surface-3 border border-border-subtle active:scale-[0.97] transition-all"
            >
              <Server size={16} />
              Connect Local Model
            </button>
            <button
              onClick={() => { setShowAddFlow(true); setAddCategory('custom'); setSelectedTemplate(CUSTOM_PROVIDER_TEMPLATE); }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 text-text-secondary text-sm font-medium hover:bg-surface-3 border border-border-subtle active:scale-[0.97] transition-all"
            >
              <Wrench size={16} />
              Custom Server
            </button>
          </div>
        </motion.div>
      )}

      {/* Connected Providers */}
      {cloudConnected.length > 0 && (
        <ProviderSection title="Cloud Providers" providers={cloudConnected} onRefresh={refreshModels} onDisconnect={disconnectProvider} />
      )}
      {localConnected.length > 0 && (
        <ProviderSection title="Local / Private Servers" providers={localConnected} onRefresh={refreshModels} onDisconnect={disconnectProvider} />
      )}
      {customConnected.length > 0 && (
        <ProviderSection title="Custom Providers" providers={customConnected} onRefresh={refreshModels} onDisconnect={disconnectProvider} />
      )}

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-xl bg-surface-1 border border-border-subtle text-center"
      >
        <img src="/logo.png" alt="OpenRAI" className="w-10 h-10 mx-auto mb-2" />
        <h3 className="font-bold text-sm">OpenRAI</h3>
        <p className="text-xs text-text-tertiary">Your Open AI Workspace · v1.0.0</p>
      </motion.div>
    </div>
  );
}

function CategoryCard({ icon: Icon, title, description, onClick, color }: {
  icon: typeof Cloud; title: string; description: string; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border-subtle text-left active:scale-[0.98] transition-all group"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18', color }}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
      </div>
      <ChevronRight size={16} className="text-text-tertiary shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function ProviderConfigForm({ template, onDone }: { template: ProviderTemplate; onDone: () => void }) {
  const { connectProvider, testConnection } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(template.defaultBaseUrl || '');
  const [customName, setCustomName] = useState(template.id === 'custom' ? '' : '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<import('../lib/store').ConnectionTestResult | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);

  const canSubmit = template.id === 'custom'
    ? baseUrl.trim().length > 0
    : template.requiresApiKey
      ? apiKey.trim().length > 0
      : baseUrl.trim().length > 0;

  // Auto-detect server type when URL changes
  const handleUrlChange = (url: string) => {
    setBaseUrl(url);
    setTestResult(null);
    if (url.trim()) {
      const detected = detectServerType(url);
      setDetectedType(detected);
    } else {
      setDetectedType(null);
    }
  };

  const handleTest = async () => {
    setError('');
    // Validate API key format
    if (apiKey.trim() && template.requiresApiKey) {
      const keyValidation = validateApiKeyFormat(apiKey.trim(), template.id);
      if (!keyValidation.valid) { setError(keyValidation.message || 'Invalid API key'); return; }
    }
    // Validate URL safety
    if (baseUrl.trim()) {
      const urlCheck = isSafeUrl(baseUrl.trim());
      if (!urlCheck.safe) { setError(urlCheck.reason || 'Unsafe URL'); return; }
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(template.id, {
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      setTestResult(result);
      if (!result.success) setError(result.message);
    } catch {
      setError('Test failed unexpectedly.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async () => {
    setError('');
    setIsConnecting(true);
    try {
      await connectProvider(template.id, {
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        name: customName.trim() || undefined,
      });
      onDone();
    } catch {
      setError('Connection failed. Check your credentials and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: template.color + '18', color: template.color }}>
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{template.name}</p>
          <p className="text-xs text-text-tertiary">{template.description}</p>
        </div>
        {template.docsUrl && (
          <a href={template.docsUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-surface-3 text-text-tertiary hover:text-accent transition-colors shrink-0">
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
        <span className="flex items-center gap-1 font-semibold text-accent">
          <span className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-[9px]">1</span>
          Configure
        </span>
        <span className="flex-1 h-px bg-border-subtle" />
        <span className={`flex items-center gap-1 ${testResult?.success ? 'font-semibold text-success' : ''}`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${testResult?.success ? 'bg-success text-white' : 'bg-surface-3 text-text-tertiary'}`}>2</span>
          Test
        </span>
        <span className="flex-1 h-px bg-border-subtle" />
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-surface-3 text-text-tertiary flex items-center justify-center text-[9px]">3</span>
          Connect
        </span>
      </div>

      {template.id === 'custom' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Provider Name</label>
          <input
            type="text"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="My Custom Provider"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      )}

      {template.requiresApiKey && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setTestResult(null); }}
            placeholder={template.placeholder || 'Enter API key'}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-sm font-mono focus:outline-none focus:border-accent/50 transition-colors"
            autoFocus
          />
          {template.docsUrl && (
            <a href={template.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-1.5">
              Get your API key <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      {(template.requiresBaseUrl || template.id === 'custom') && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            {template.category === 'local' ? 'Server URL' : 'Base URL'}
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder={template.defaultBaseUrl || 'https://api.example.com/v1'}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-sm font-mono focus:outline-none focus:border-accent/50 transition-colors"
            autoFocus={!template.requiresApiKey}
          />
          {detectedType && detectedType !== template.id && (
            <p className="text-[11px] text-info mt-1.5 flex items-center gap-1">
              <Zap size={10} />
              Auto-detected: looks like a <strong>{detectedType}</strong> server
            </p>
          )}
        </div>
      )}

      {!template.requiresApiKey && template.id !== 'custom' && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">API Key (optional)</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setTestResult(null); }}
            placeholder="Optional — only if your server requires auth"
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border-subtle text-sm font-mono focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`p-3 rounded-lg text-xs space-y-1 ${testResult.success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          <div className="flex items-center gap-2 font-medium">
            {testResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
            {testResult.success ? 'Connection Successful' : 'Connection Failed'}
          </div>
          <p className="text-text-secondary">{testResult.message}</p>
          {testResult.success && (
            <div className="flex items-center gap-4 pt-1 text-text-tertiary">
              <span>Latency: <strong className="text-text-secondary">{testResult.latencyMs}ms</strong></span>
              {testResult.modelCount && <span>Models: <strong className="text-text-secondary">{testResult.modelCount}</strong></span>}
              {testResult.serverType && <span>Type: <strong className="text-text-secondary">{testResult.serverType}</strong></span>}
              {testResult.serverVersion && <span>Version: <strong className="text-text-secondary">{testResult.serverVersion}</strong></span>}
            </div>
          )}
        </div>
      )}

      {error && !testResult && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 text-danger text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
        <button
          onClick={handleTest}
          disabled={!canSubmit || isTesting}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg bg-surface-3 text-text-primary text-sm font-medium hover:bg-surface-4 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleConnect}
          disabled={!canSubmit || isConnecting}
          className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl sm:rounded-lg bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {isConnecting ? 'Connecting...' : 'Connect & Discover Models'}
        </button>
        <button
          onClick={onDone}
          className="px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-sm text-text-secondary hover:bg-surface-2 active:scale-[0.98] transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProviderSection({ title, providers, onRefresh, onDisconnect }: {
  title: string;
  providers: ConnectedProvider[];
  onRefresh: (id: string) => Promise<void>;
  onDisconnect: (id: string) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-3">
        {providers.map(provider => (
          <ProviderCard key={provider.id} provider={provider} onRefresh={onRefresh} onDisconnect={onDisconnect} />
        ))}
      </div>
    </motion.section>
  );
}

function ProviderCard({ provider, onRefresh, onDisconnect }: {
  provider: ConnectedProvider;
  onRefresh: (id: string) => Promise<void>;
  onDisconnect: (id: string) => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await onRefresh(provider.id);
    setIsRefreshing(false);
  };

  const statusColor = provider.status === 'connected' ? '#17c964' : provider.status === 'connecting' ? '#f5a623' : provider.status === 'error' ? '#f31260' : '#687076';
  const StatusIcon = provider.status === 'connected' ? Wifi : provider.status === 'connecting' ? Loader2 : WifiOff;

  return (
    <div className="rounded-xl bg-surface-1 border border-border-subtle overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-2/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: provider.color + '18', color: provider.color }}>
          {provider.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{provider.name}</span>
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: statusColor + '18', color: statusColor }}>
              <StatusIcon size={9} className={provider.status === 'connecting' ? 'animate-spin' : ''} />
              {provider.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-text-tertiary">{provider.models.length} models</span>
            {provider.favoriteModels.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-text-tertiary">
                <Star size={9} fill="currentColor" /> {provider.favoriteModels.length} favorites
              </span>
            )}
            {provider.modelsLastRefreshed && (
              <span className="text-[10px] text-text-tertiary">
                Refreshed {new Date(provider.modelsLastRefreshed).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50"
            title="Refresh models"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDisconnect(provider.id); }}
            className="p-1.5 rounded-lg hover:bg-danger/15 text-text-tertiary hover:text-danger transition-colors"
            title="Disconnect"
          >
            <Trash2 size={13} />
          </button>
          <ChevronRight size={14} className={`text-text-tertiary transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border-subtle pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">Discovered Models</span>
                <span className="text-[10px] text-text-tertiary">{provider.models.length} available</span>
              </div>
              <div className="space-y-1.5">
                {provider.models.map(model => (
                  <div key={model.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 text-xs">
                    <span className="font-medium text-text-primary flex-1">{model.name}</span>
                    {model.contextWindow && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-tertiary">{model.contextWindow}</span>
                    )}
                    <span className="text-text-tertiary">{model.capabilities.join(', ')}</span>
                  </div>
                ))}
              </div>
              {/* Connection details */}
              <div className="mt-3 space-y-1.5">
                {provider.baseUrl && (
                  <div className="px-3 py-2 rounded-lg bg-surface-2 text-xs">
                    <span className="text-text-tertiary">Endpoint: </span>
                    <span className="font-mono text-text-secondary">{provider.baseUrl}</span>
                  </div>
                )}
                {provider.apiKey && (
                  <div className="px-3 py-2 rounded-lg bg-surface-2 text-xs">
                    <span className="text-text-tertiary">API Key: </span>
                    <span className="font-mono text-text-secondary">{maskCredential(provider.apiKey)}</span>
                  </div>
                )}
                <div className="px-3 py-2 rounded-lg bg-surface-2 text-xs flex items-center gap-4">
                  <span className="text-text-tertiary">Category: <strong className="text-text-secondary capitalize">{provider.category}</strong></span>
                  {provider.healthLatencyMs && (
                    <span className="text-text-tertiary">Latency: <strong className="text-success">{provider.healthLatencyMs}ms</strong></span>
                  )}
                  {provider.lastTestResult && (
                    <span className="text-text-tertiary">Last test: <strong className="text-text-secondary">{provider.lastTestResult.success ? '✓ Passed' : '✗ Failed'}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Other tabs (preserved from original) ─────────────────────────

function AppearanceTab({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const themes: { id: Theme; icon: typeof Sun; label: string }[] = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle">
        <p className="text-sm text-text-secondary mb-3">Theme</p>
        <div className="flex gap-2">
          {themes.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  theme === t.id
                    ? 'bg-accent text-accent-text'
                    : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function NotificationsTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle space-y-4">
        <ToggleSetting label="Email notifications" description="Receive updates about your conversations" />
        <ToggleSetting label="Desktop notifications" description="Show browser notifications for responses" />
        <ToggleSetting label="Sound effects" description="Play sounds for message events" />
      </div>
    </motion.div>
  );
}

function PrivacyTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="p-4 rounded-xl bg-surface-1 border border-border-subtle space-y-4">
        <ToggleSetting label="Chat history" description="Save conversation history locally" defaultOn />
        <ToggleSetting label="Analytics" description="Help improve OpenRAI with anonymous usage data" />
        <ToggleSetting label="Data encryption" description="Encrypt stored data at rest" defaultOn />
      </div>
    </motion.div>
  );
}

function ToggleSetting({ label, description, defaultOn }: { label: string; description: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
        <div className="w-9 h-5 bg-surface-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
      </label>
    </div>
  );
}
