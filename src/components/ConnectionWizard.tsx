import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, Server, Wrench, ChevronRight, Check, Loader2,
  ExternalLink, AlertCircle, Wifi, ArrowLeft, Sparkles, X
} from 'lucide-react';
import {
  useStore,
  CLOUD_PROVIDER_TEMPLATES, LOCAL_PROVIDER_TEMPLATES, CUSTOM_PROVIDER_TEMPLATE,
  type ProviderTemplate, detectServerType, validateServerUrl
} from '../lib/store';

type WizardStep = 'choose' | 'provider' | 'configure' | 'testing' | 'success';

export function ConnectionWizard({ onClose }: { onClose: () => void }) {
  const { connectProvider, testConnection } = useStore();
  const [step, setStep] = useState<WizardStep>('choose');
  const [category, setCategory] = useState<'cloud' | 'local' | 'custom' | null>(null);
  const [template, setTemplate] = useState<ProviderTemplate | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number; modelCount?: number } | null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);

  const handleChooseCategory = (cat: 'cloud' | 'local' | 'custom') => {
    setCategory(cat);
    if (cat === 'custom') {
      setTemplate(CUSTOM_PROVIDER_TEMPLATE);
      setStep('configure');
    } else {
      setStep('provider');
    }
  };

  const handleChooseProvider = (t: ProviderTemplate) => {
    setTemplate(t);
    setBaseUrl(t.defaultBaseUrl || '');
    setStep('configure');
  };

  const handleTest = async () => {
    if (!template) return;
    setStep('testing');
    setError('');
    try {
      const result = await testConnection(template.id, {
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      setTestResult(result);
      if (result.success) {
        // Auto-connect
        await connectProvider(template.id, {
          apiKey: apiKey.trim() || undefined,
          baseUrl: baseUrl.trim() || undefined,
          name: customName.trim() || undefined,
        });
        setDiscoveredCount(result.modelCount || 0);
        setStep('success');
      } else {
        setError(result.message);
        setStep('configure');
      }
    } catch {
      setError('Connection failed. Please check your credentials.');
      setStep('configure');
    }
  };

  const canProceed = template ? (
    template.id === 'custom' ? baseUrl.trim().length > 0 :
    template.requiresApiKey ? apiKey.trim().length > 0 :
    baseUrl.trim().length > 0
  ) : false;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-default">
        {step !== 'choose' && step !== 'success' && (
          <button
            onClick={() => {
              if (step === 'configure') { if (category === 'custom') setStep('choose'); else setStep('provider'); }
              else if (step === 'provider') { setStep('choose'); setCategory(null); }
              else if (step === 'testing') setStep('configure');
            }}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-text-secondary"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-base">
            {step === 'choose' && 'Connect AI Provider'}
            {step === 'provider' && `Choose ${category === 'cloud' ? 'Cloud' : 'Local'} Provider`}
            {step === 'configure' && `Setup ${template?.name || 'Provider'}`}
            {step === 'testing' && 'Connecting...'}
            {step === 'success' && 'Connected!'}
          </h2>
          <p className="text-xs text-text-tertiary">
            {step === 'choose' && 'Choose how you want to connect'}
            {step === 'provider' && 'Select a provider to configure'}
            {step === 'configure' && 'Enter your credentials'}
            {step === 'testing' && 'Testing connection and discovering models...'}
            {step === 'success' && `${template?.name} is ready to use`}
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary">
          <X size={18} />
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-1 px-5 py-3">
        {['Choose', 'Configure', 'Connect'].map((label, i) => {
          const stepIndex = step === 'choose' || step === 'provider' ? 0 : step === 'configure' ? 1 : 2;
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                done ? 'bg-success text-white' : active ? 'bg-accent text-white' : 'bg-surface-3 text-text-tertiary'
              }`}>
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[11px] font-medium hidden sm:inline ${active ? 'text-text-primary' : 'text-text-tertiary'}`}>{label}</span>
              {i < 2 && <div className={`flex-1 h-px mx-1 ${done ? 'bg-success' : 'bg-border-subtle'}`} />}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose category */}
          {step === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3 pt-2">
              {[
                { cat: 'cloud' as const, icon: Cloud, title: 'Cloud AI', desc: 'OpenAI, Anthropic, Google, and 10+ more', color: '#3b9eff' },
                { cat: 'local' as const, icon: Server, title: 'Local AI', desc: 'Ollama, LM Studio, vLLM, llama.cpp', color: '#17c964' },
                { cat: 'custom' as const, icon: Wrench, title: 'Private Server', desc: 'Any OpenAI-compatible API endpoint', color: '#f59e0b' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.cat}
                    onClick={() => handleChooseCategory(item.cat)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border-subtle active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color + '18', color: item.color }}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-text-tertiary">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-text-tertiary shrink-0" />
                  </button>
                );
              })}
            </motion.div>
          )}

          {/* Step 2: Choose provider */}
          {step === 'provider' && (
            <motion.div key="provider" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2 pt-2">
              {(category === 'cloud' ? CLOUD_PROVIDER_TEMPLATES : LOCAL_PROVIDER_TEMPLATES).map(t => (
                <button
                  key={t.id}
                  onClick={() => handleChooseProvider(t)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border-subtle active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: t.color + '18', color: t.color }}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-text-tertiary truncate">{t.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-text-tertiary shrink-0" />
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Configure */}
          {step === 'configure' && template && (
            <motion.div key="configure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: template.color + '18', color: template.color }}>
                  {template.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-text-tertiary">{template.description}</p>
                </div>
              </div>

              {template.id === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Provider Name</label>
                  <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                    placeholder="My Server" className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-subtle text-sm focus:outline-none focus:border-accent/50" />
                </div>
              )}

              {template.requiresApiKey && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">API Key</label>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder={template.placeholder || 'Enter API key'}
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-subtle text-sm font-mono focus:outline-none focus:border-accent/50" autoFocus />
                  {template.docsUrl && (
                    <a href={template.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-2">
                      Get your API key <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}

              {(template.requiresBaseUrl || template.id === 'custom') && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Server URL</label>
                  <input type="url" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                    placeholder={template.defaultBaseUrl || 'http://localhost:8080/v1'}
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-subtle text-sm font-mono focus:outline-none focus:border-accent/50"
                    autoFocus={!template.requiresApiKey} />
                </div>
              )}

              {!template.requiresApiKey && template.id !== 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">API Key (optional)</label>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="Only if your server requires auth"
                    className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border-subtle text-sm font-mono focus:outline-none focus:border-accent/50" />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button
                onClick={handleTest}
                disabled={!canProceed}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Wifi size={16} />
                Test Connection & Connect
              </button>
            </motion.div>
          )}

          {/* Testing */}
          {step === 'testing' && (
            <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
              <Loader2 size={40} className="text-accent animate-spin mb-4" />
              <p className="font-medium text-sm">Connecting to {template?.name}...</p>
              <p className="text-xs text-text-tertiary mt-1">Testing connection and discovering models</p>
            </motion.div>
          )}

          {/* Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/15 flex items-center justify-center mb-4">
                <Check size={32} className="text-success" />
              </div>
              <h3 className="font-bold text-lg mb-1">{template?.name} Connected!</h3>
              <p className="text-sm text-text-tertiary mb-2">{discoveredCount} models discovered and ready to use</p>
              {testResult && (
                <p className="text-xs text-text-tertiary">Latency: {testResult.latencyMs}ms</p>
              )}
              <button
                onClick={onClose}
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all"
              >
                <Sparkles size={16} />
                Start Chatting
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
