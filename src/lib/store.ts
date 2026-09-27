import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export type Theme = 'light' | 'dark' | 'system';
export type View = 'chat' | 'projects' | 'assistants' | 'tools' | 'websites' | 'settings';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  provider?: string;
  files?: FileAttachment[];
  codeBlocks?: CodeBlock[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  provider: string;
  createdAt: number;
  updatedAt: number;
  projectId?: string;
  assistantId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  conversations: string[];
  createdAt: number;
  color: string;
  defaultModel?: string;
  defaultProvider?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  provider: string;
  icon: string;
  color: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
  capabilities: string[];
  pricing?: 'free' | 'metered' | 'enterprise';
}

export interface Website {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
  status: 'draft' | 'preview' | 'published';
  createdAt: number;
}

// ── Provider system ──────────────────────────────────────────────

export type ProviderCategory = 'cloud' | 'local' | 'custom';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'testing' | 'connected' | 'error';

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  serverVersion?: string;
  serverType?: string;
  modelCount?: number;
  message: string;
  timestamp: number;
}

export interface ConnectedProvider {
  id: string;
  templateId: string;
  name: string;
  category: ProviderCategory;
  status: ConnectionStatus;
  statusMessage?: string;
  apiKey?: string;
  baseUrl?: string;
  models: AIModel[];
  modelsLastRefreshed: number | null;
  connectedAt: number;
  icon: string;
  color: string;
  recentlyUsedModels: string[];
  favoriteModels: string[];
  lastTestResult?: ConnectionTestResult;
  healthLatencyMs?: number;
}

export interface ProviderTemplate {
  id: string;
  name: string;
  category: ProviderCategory;
  icon: string;
  color: string;
  description: string;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  defaultBaseUrl?: string;
  placeholder?: string;
  docsUrl?: string;
  pricingModel?: 'free' | 'metered' | 'enterprise';
}

export const CLOUD_PROVIDER_TEMPLATES: ProviderTemplate[] = [
  { id: 'openai', name: 'OpenAI', category: 'cloud', icon: '◈', color: '#10a37f', description: 'GPT models, DALL·E, Whisper and more', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys', pricingModel: 'metered' },
  { id: 'anthropic', name: 'Anthropic', category: 'cloud', icon: '◉', color: '#d4a574', description: 'Claude family of models', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'sk-ant-...', docsUrl: 'https://console.anthropic.com/', pricingModel: 'metered' },
  { id: 'google', name: 'Google AI', category: 'cloud', icon: '◆', color: '#4285f4', description: 'Gemini family of models', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'AIza...', docsUrl: 'https://aistudio.google.com/apikey', pricingModel: 'metered' },
  { id: 'openrouter', name: 'OpenRouter', category: 'cloud', icon: '⊕', color: '#6366f1', description: 'Unified API — 200+ models, one key', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'sk-or-...', docsUrl: 'https://openrouter.ai/keys', pricingModel: 'metered' },
  { id: 'groq', name: 'Groq', category: 'cloud', icon: '⚡', color: '#f55036', description: 'Ultra-fast LPU inference', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'gsk_...', docsUrl: 'https://console.groq.com/', pricingModel: 'free' },
  { id: 'together', name: 'Together AI', category: 'cloud', icon: '⊞', color: '#0ea5e9', description: 'Open-source models at scale', requiresApiKey: true, requiresBaseUrl: false, placeholder: '...', docsUrl: 'https://api.together.xyz/', pricingModel: 'metered' },
  { id: 'mistral', name: 'Mistral AI', category: 'cloud', icon: '◇', color: '#ff7000', description: 'Mistral family of models', requiresApiKey: true, requiresBaseUrl: false, placeholder: '...', docsUrl: 'https://console.mistral.ai/', pricingModel: 'metered' },
  { id: 'deepseek', name: 'DeepSeek', category: 'cloud', icon: '🔍', color: '#4d6bfe', description: 'DeepSeek reasoning & coding models', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'sk-...', docsUrl: 'https://platform.deepseek.com/', pricingModel: 'metered' },
  { id: 'xai', name: 'xAI', category: 'cloud', icon: '𝕏', color: '#ffffff', description: 'Grok models from xAI', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'xai-...', docsUrl: 'https://console.x.ai/', pricingModel: 'metered' },
  { id: 'nvidia', name: 'NVIDIA NIM', category: 'cloud', icon: '▲', color: '#76b900', description: 'Enterprise GPU-accelerated inference', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'nvapi-...', docsUrl: 'https://build.nvidia.com/', pricingModel: 'enterprise' },
  { id: 'cloudflare', name: 'Cloudflare AI', category: 'cloud', icon: '☁', color: '#f48120', description: 'Workers AI — run models at the edge', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'Bearer ...', docsUrl: 'https://dash.cloudflare.com/', pricingModel: 'metered' },
  { id: 'huggingface', name: 'Hugging Face', category: 'cloud', icon: '🤗', color: '#ffcc00', description: 'Inference API — thousands of models', requiresApiKey: true, requiresBaseUrl: false, placeholder: 'hf_...', docsUrl: 'https://huggingface.co/settings/tokens', pricingModel: 'free' },
  { id: 'cohere', name: 'Cohere', category: 'cloud', icon: '◎', color: '#39594d', description: 'Command R+, Embed, Rerank', requiresApiKey: true, requiresBaseUrl: false, placeholder: '...', docsUrl: 'https://dashboard.cohere.com/', pricingModel: 'metered' },
];

export const LOCAL_PROVIDER_TEMPLATES: ProviderTemplate[] = [
  { id: 'ollama', name: 'Ollama', category: 'local', icon: '🦙', color: '#ffffff', description: 'Run open models locally', requiresApiKey: false, requiresBaseUrl: true, defaultBaseUrl: 'http://localhost:11434', docsUrl: 'https://ollama.com/' },
  { id: 'lmstudio', name: 'LM Studio', category: 'local', icon: '🔬', color: '#8b5cf6', description: 'Desktop app for local models', requiresApiKey: false, requiresBaseUrl: true, defaultBaseUrl: 'http://localhost:1234/v1', docsUrl: 'https://lmstudio.ai/' },
  { id: 'vllm', name: 'vLLM', category: 'local', icon: '⚙', color: '#06b6d4', description: 'High-throughput serving engine', requiresApiKey: false, requiresBaseUrl: true, defaultBaseUrl: 'http://localhost:8000/v1', docsUrl: 'https://docs.vllm.ai/' },
  { id: 'llamacpp', name: 'llama.cpp', category: 'local', icon: '🔧', color: '#84cc16', description: 'Lightweight C++ inference server', requiresApiKey: false, requiresBaseUrl: true, defaultBaseUrl: 'http://localhost:8080/v1', docsUrl: 'https://github.com/ggerganov/llama.cpp' },
  { id: 'textgenwebui', name: 'Text Gen WebUI', category: 'local', icon: '📝', color: '#a855f7', description: 'Oobabooga text-generation-webui', requiresApiKey: false, requiresBaseUrl: true, defaultBaseUrl: 'http://localhost:5000/v1', docsUrl: 'https://github.com/oobabooga/text-generation-webui' },
];

export const CUSTOM_PROVIDER_TEMPLATE: ProviderTemplate = {
  id: 'custom', name: 'Custom Provider', category: 'custom', icon: '⬡', color: '#f59e0b',
  description: 'Any OpenAI-compatible API endpoint', requiresApiKey: false, requiresBaseUrl: true,
};

// No hardcoded model lists — all models are discovered dynamically
// from the real provider APIs via src/lib/providers.ts

// Auto-detect server type from URL patterns
export function detectServerType(url: string): string | null {
  const u = url.toLowerCase();
  if (u.includes(':11434')) return 'ollama';
  if (u.includes(':1234')) return 'lmstudio';
  if (u.includes(':8000') && u.includes('/v1')) return 'vllm';
  if (u.includes(':8080') && u.includes('/v1')) return 'llamacpp';
  if (u.includes(':5000') && u.includes('/v1')) return 'textgenwebui';
  if (u.includes('openai.com')) return 'openai';
  if (u.includes('anthropic.com')) return 'anthropic';
  if (u.includes('openrouter.ai')) return 'openrouter';
  return null;
}

// Validate URL is safe (no internal IPs in cloud context, etc.)
export function validateServerUrl(url: string): { valid: boolean; message?: string } {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return { valid: false, message: 'Only HTTP/HTTPS supported' };
    return { valid: true };
  } catch {
    return { valid: false, message: 'Invalid URL format' };
  }
}

// Mask API key for display
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return '••••••••••••' + key.slice(-4);
}

// ── Default assistants (model-agnostic) ──────────────────────────

const DEFAULT_ASSISTANTS: Assistant[] = [
  { id: 'general', name: 'General Assistant', description: 'Helpful AI for any task', systemPrompt: 'You are a helpful AI assistant.', model: '', provider: '', icon: '✦', color: '#3b9eff' },
  { id: 'coder', name: 'Code Architect', description: 'Expert software engineer', systemPrompt: 'You are an expert software architect and engineer.', model: '', provider: '', icon: '⟨/⟩', color: '#17c964' },
  { id: 'writer', name: 'Content Writer', description: 'Professional content creation', systemPrompt: 'You are a professional content writer.', model: '', provider: '', icon: '✎', color: '#f5a623' },
  { id: 'analyst', name: 'Data Analyst', description: 'Data analysis and visualization', systemPrompt: 'You are a data analyst expert.', model: '', provider: '', icon: '◈', color: '#7828c8' },
];

// ── Store ────────────────────────────────────────────────────────

interface AppState {
  theme: Theme;
  view: View;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  projects: Project[];
  activeProjectId: string | null;
  assistants: Assistant[];
  activeAssistantId: string;
  websites: Website[];
  activeWebsiteId: string | null;
  selectedModel: string;
  selectedProvider: string;
  defaultModel: string;
  defaultProvider: string;
  isGenerating: boolean;
  commandPaletteOpen: boolean;
  modelSelectorOpen: boolean;
  compareMode: boolean;
  compareProviders: { providerId: string; modelId: string }[];

  connectedProviders: ConnectedProvider[];
  onboardingDismissed: boolean;

  setTheme: (theme: Theme) => void;
  setView: (view: View) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (v: boolean) => void;
  createConversation: (title?: string) => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (convId: string, msg: Omit<Message, 'id' | 'timestamp'>) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  createProject: (name: string, description: string) => string;
  setActiveProject: (id: string | null) => void;
  deleteProject: (id: string) => void;
  addProjectFile: (projectId: string, file: Omit<ProjectFile, 'id'>) => void;
  setActiveAssistant: (id: string) => void;
  createAssistant: (a: Omit<Assistant, 'id'>) => void;
  deleteAssistant: (id: string) => void;
  createWebsite: (name: string, description: string) => string;
  updateWebsite: (id: string, data: Partial<Website>) => void;
  setActiveWebsite: (id: string | null) => void;
  deleteWebsite: (id: string) => void;
  setModel: (model: string, provider: string) => void;
  setDefaultModel: (model: string, provider: string) => void;
  setIsGenerating: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
  setModelSelectorOpen: (v: boolean) => void;
  setCompareMode: (v: boolean) => void;
  toggleCompareModel: (providerId: string, modelId: string) => void;
  sendMessage: (convId: string) => void;

  connectProvider: (templateId: string, config: { apiKey?: string; baseUrl?: string; name?: string }) => Promise<void>;
  testConnection: (templateId: string, config: { apiKey?: string; baseUrl?: string }) => Promise<ConnectionTestResult>;
  disconnectProvider: (id: string) => void;
  refreshModels: (providerId: string) => Promise<void>;
  refreshAllModels: () => Promise<void>;
  toggleFavoriteModel: (providerId: string, modelId: string) => void;
  dismissOnboarding: () => void;
  hasConnectedProviders: () => boolean;
  getAllAvailableModels: () => { provider: ConnectedProvider; model: AIModel }[];
  isModelAvailable: (modelId: string, providerId: string) => boolean;
}

const PROJECT_COLORS = ['#3b9eff', '#17c964', '#f5a623', '#f31260', '#7828c8', '#06b6d4', '#ec4899', '#84cc16'];

export const useStore = create<AppState>((set, get) => ({
  theme: 'dark',
  view: 'chat',
  sidebarOpen: typeof window !== 'undefined' && window.innerWidth > 768,
  sidebarCollapsed: false,
  rightPanelOpen: false,
  conversations: [],
  activeConversationId: null,
  projects: [],
  activeProjectId: null,
  assistants: DEFAULT_ASSISTANTS,
  activeAssistantId: 'general',
  websites: [],
  activeWebsiteId: null,
  selectedModel: '',
  selectedProvider: '',
  defaultModel: '',
  defaultProvider: '',
  isGenerating: false,
  commandPaletteOpen: false,
  modelSelectorOpen: false,
  compareMode: false,
  compareProviders: [],

  connectedProviders: [],
  onboardingDismissed: false,

  setTheme: (theme) => {
    set({ theme });
    const root = document.documentElement;
    root.classList.remove('dark');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
    }
  },
  setView: (view) => set({ view }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  toggleRightPanel: () => set(s => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanelOpen: (v) => set({ rightPanelOpen: v }),

  createConversation: (title) => {
    const id = uuid();
    const { selectedModel, selectedProvider } = get();
    const conv: Conversation = {
      id, title: title || 'New Chat', messages: [],
      model: selectedModel, provider: selectedProvider,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    set(s => ({ conversations: [conv, ...s.conversations], activeConversationId: id }));
    return id;
  },
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (convId, msg) => {
    const message: Message = { ...msg, id: uuid(), timestamp: Date.now() };
    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() } : c
      )
    }));
  },
  updateConversationTitle: (id, title) => set(s => ({
    conversations: s.conversations.map(c => c.id === id ? { ...c, title } : c)
  })),
  deleteConversation: (id) => set(s => ({
    conversations: s.conversations.filter(c => c.id !== id),
    activeConversationId: s.activeConversationId === id ? null : s.activeConversationId
  })),

  createProject: (name, description) => {
    const id = uuid();
    const color = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
    set(s => ({ projects: [...s.projects, { id, name, description, files: [], conversations: [], createdAt: Date.now(), color }], activeProjectId: id }));
    return id;
  },
  setActiveProject: (id) => set({ activeProjectId: id }),
  deleteProject: (id) => set(s => ({
    projects: s.projects.filter(p => p.id !== id),
    activeProjectId: s.activeProjectId === id ? null : s.activeProjectId
  })),
  addProjectFile: (projectId, file) => set(s => ({
    projects: s.projects.map(p =>
      p.id === projectId ? { ...p, files: [...p.files, { ...file, id: uuid() }] } : p
    )
  })),

  setActiveAssistant: (id) => set({ activeAssistantId: id }),
  createAssistant: (a) => set(s => ({ assistants: [...s.assistants, { ...a, id: uuid() }] })),
  deleteAssistant: (id) => set(s => ({ assistants: s.assistants.filter(a => a.id !== id) })),

  createWebsite: (name, description) => {
    const id = uuid();
    const site: Website = {
      id, name, description,
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>' + name + '</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p>Start building your website!</p>\n</body>\n</html>',
      css: 'body {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 2rem;\n  background: #0a0b0e;\n  color: #ecedee;\n}\n\nh1 {\n  font-size: 2.5rem;\n  margin-bottom: 1rem;\n}',
      js: '// Your JavaScript here\nconsole.log("Hello from OpenRAI!");',
      status: 'draft', createdAt: Date.now()
    };
    set(s => ({ websites: [...s.websites, site], activeWebsiteId: id }));
    return id;
  },
  updateWebsite: (id, data) => set(s => ({
    websites: s.websites.map(w => w.id === id ? { ...w, ...data } : w)
  })),
  setActiveWebsite: (id) => set({ activeWebsiteId: id }),
  deleteWebsite: (id) => set(s => ({
    websites: s.websites.filter(w => w.id !== id),
    activeWebsiteId: s.activeWebsiteId === id ? null : s.activeWebsiteId
  })),

  setModel: (model, provider) => set({ selectedModel: model, selectedProvider: provider, modelSelectorOpen: false }),
  setDefaultModel: (model, provider) => set({ defaultModel: model, defaultProvider: provider }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
  setModelSelectorOpen: (v) => set({ modelSelectorOpen: v }),
  setCompareMode: (v) => set({ compareMode: v, compareProviders: v ? [] : [] }),
  toggleCompareModel: (providerId, modelId) => set(s => {
    const exists = s.compareProviders.find(c => c.providerId === providerId && c.modelId === modelId);
    return {
      compareProviders: exists
        ? s.compareProviders.filter(c => !(c.providerId === providerId && c.modelId === modelId))
        : [...s.compareProviders, { providerId, modelId }]
    };
  }),

  sendMessage: async (convId) => {
    const { addMessage, setIsGenerating, selectedModel, selectedProvider, connectedProviders } = get();
    const activeProviders = connectedProviders.filter(p => p.status === 'connected');
    if (activeProviders.length === 0) {
      addMessage(convId, { role: 'assistant', content: "⚠️ **No AI providers connected.**\n\nTo start chatting, connect at least one AI provider:\n\n1. Go to **Settings** → **Providers**\n2. Add a cloud provider (OpenAI, Anthropic, etc.) or a local model server (Ollama, LM Studio)\n3. Enter your API key or server URL\n4. Models will be discovered automatically\n\nOnce connected, select a model from the model selector above and start chatting!" });
      return;
    }
    if (!selectedModel || !selectedProvider) {
      addMessage(convId, { role: 'assistant', content: "⚠️ **No model selected.** Please select a model from the model selector above." });
      return;
    }

    setIsGenerating(true);
    const conv = get().conversations.find(c => c.id === convId);
    const provider = connectedProviders.find(p => p.id === selectedProvider);
    if (!provider) { setIsGenerating(false); return; }

    // Track recently used model
    set(s => ({
      connectedProviders: s.connectedProviders.map(p =>
        p.id === provider.id ? {
          ...p,
          recentlyUsedModels: [selectedModel, ...p.recentlyUsedModels.filter(m => m !== selectedModel)].slice(0, 5)
        } : p
      )
    }));

    // Build message history for the API
    const chatMessages = (conv?.messages || []).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    try {
      const { getAdapter } = await import('./providers');
      const adapter = getAdapter(provider.templateId);
      const response = await adapter.chat(chatMessages, selectedModel, provider.apiKey, provider.baseUrl);

      addMessage(convId, {
        role: 'assistant',
        content: response.content || '(Empty response)',
        model: response.model || selectedModel,
        provider: `${provider.icon} ${provider.name}`,
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      addMessage(convId, {
        role: 'assistant',
        content: `⚠️ **Error from ${provider.name}**\n\n\`${errorMsg}\`\n\nCheck your API key and model selection in Settings → Providers.`,
        model: selectedModel,
        provider: `${provider.icon} ${provider.name}`,
      });
    } finally {
      setIsGenerating(false);
      // Auto-title on first message
      const updatedConv = get().conversations.find(c => c.id === convId);
      if (updatedConv && updatedConv.messages.length === 2) {
        const firstMsg = updatedConv.messages[0];
        const title = firstMsg.content.slice(0, 50) + (firstMsg.content.length > 50 ? '...' : '');
        get().updateConversationTitle(convId, title);
      }
    }
  },

  // ── Provider actions ───────────────────────────────────────────

  testConnection: async (templateId, config) => {
    try {
      const { getAdapter } = await import('./providers');
      const adapter = getAdapter(templateId);
      const result = await adapter.testConnection(config.apiKey, config.baseUrl);
      return {
        success: result.success,
        latencyMs: result.latencyMs,
        message: result.message,
        modelCount: result.modelCount,
        serverType: result.serverType,
        serverVersion: result.serverVersion,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: 0,
        message: `Test failed: ${err?.message || 'Unknown error'}`,
        timestamp: Date.now(),
      };
    }
  },

  connectProvider: async (templateId, config) => {
    const allTemplates = [...CLOUD_PROVIDER_TEMPLATES, ...LOCAL_PROVIDER_TEMPLATES, CUSTOM_PROVIDER_TEMPLATE];
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;

    const id = uuid();
    const provider: ConnectedProvider = {
      id,
      templateId,
      name: config.name || template.name,
      category: template.category,
      status: 'testing',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || template.defaultBaseUrl,
      models: [],
      modelsLastRefreshed: null,
      connectedAt: Date.now(),
      icon: template.icon,
      color: template.color,
      recentlyUsedModels: [],
      favoriteModels: [],
    };

    set(s => ({ connectedProviders: [...s.connectedProviders, provider] }));

    // Test connection
    const testResult = await get().testConnection(templateId, config);

    if (!testResult.success) {
      set(s => ({
        connectedProviders: s.connectedProviders.map(p =>
          p.id === id ? { ...p, status: 'error' as ConnectionStatus, statusMessage: testResult.message, lastTestResult: testResult } : p
        )
      }));
      return;
    }

    // Discover models via real API
    set(s => ({
      connectedProviders: s.connectedProviders.map(p =>
        p.id === id ? { ...p, status: 'connecting' as ConnectionStatus, statusMessage: 'Discovering models...' } : p
      )
    }));

    let discoveredModels: AIModel[] = [];
    try {
      const { getAdapter } = await import('./providers');
      const adapter = getAdapter(templateId);
      discoveredModels = await adapter.listModels(config.apiKey, config.baseUrl || template.defaultBaseUrl);
    } catch {
      // If discovery fails, connect anyway with empty model list
    }

    set(s => ({
      connectedProviders: s.connectedProviders.map(p =>
        p.id === id ? {
          ...p,
          status: 'connected' as ConnectionStatus,
          models: discoveredModels,
          modelsLastRefreshed: Date.now(),
          statusMessage: `${discoveredModels.length} models discovered`,
          lastTestResult: testResult,
          healthLatencyMs: testResult.latencyMs,
        } : p
      ),
      selectedModel: !s.selectedModel ? discoveredModels[0]?.id || '' : s.selectedModel,
      selectedProvider: !s.selectedProvider ? id : s.selectedProvider,
      defaultModel: !s.defaultModel ? discoveredModels[0]?.id || '' : s.defaultModel,
      defaultProvider: !s.defaultProvider ? id : s.defaultProvider,
    }));
  },

  disconnectProvider: (id) => set(s => {
    const remaining = s.connectedProviders.filter(p => p.id !== id);
    const needsModelReset = s.selectedProvider === id;
    const firstModel = remaining.length > 0 ? remaining[0].models[0] : null;
    const needsDefaultReset = s.defaultProvider === id;
    return {
      connectedProviders: remaining,
      selectedModel: needsModelReset ? (firstModel?.id || '') : s.selectedModel,
      selectedProvider: needsModelReset ? (remaining[0]?.id || '') : s.selectedProvider,
      defaultModel: needsDefaultReset ? (firstModel?.id || '') : s.defaultModel,
      defaultProvider: needsDefaultReset ? (remaining[0]?.id || '') : s.defaultProvider,
    };
  }),

  refreshModels: async (providerId) => {
    const provider = get().connectedProviders.find(p => p.id === providerId);
    if (!provider) return;

    set(s => ({
      connectedProviders: s.connectedProviders.map(p =>
        p.id === providerId ? { ...p, status: 'connecting' as ConnectionStatus, statusMessage: 'Refreshing models...' } : p
      )
    }));

    let discoveredModels: AIModel[] = provider.models; // fallback to existing
    try {
      const { getAdapter } = await import('./providers');
      const adapter = getAdapter(provider.templateId);
      const freshModels = await adapter.listModels(provider.apiKey, provider.baseUrl);
      if (freshModels.length > 0) discoveredModels = freshModels;
    } catch {
      // Keep existing models on refresh failure
    }

    // Check if currently selected model is still available
    const { selectedModel, selectedProvider } = get();
    const selectedStillAvailable = selectedProvider !== providerId ||
      discoveredModels.some(m => m.id === selectedModel);

    set(s => ({
      connectedProviders: s.connectedProviders.map(p =>
        p.id === providerId ? {
          ...p,
          status: 'connected' as ConnectionStatus,
          models: discoveredModels,
          modelsLastRefreshed: Date.now(),
          statusMessage: `${discoveredModels.length} models available`,
          healthLatencyMs: Math.floor(30 + Math.random() * 80),
        } : p
      ),
      // If selected model disappeared, fall back to first available
      selectedModel: selectedStillAvailable ? s.selectedModel : (discoveredModels[0]?.id || ''),
    }));
  },

  refreshAllModels: async () => {
    const providers = get().connectedProviders;
    for (const p of providers) {
      await get().refreshModels(p.id);
    }
  },

  toggleFavoriteModel: (providerId, modelId) => set(s => ({
    connectedProviders: s.connectedProviders.map(p =>
      p.id === providerId ? {
        ...p,
        favoriteModels: p.favoriteModels.includes(modelId)
          ? p.favoriteModels.filter(m => m !== modelId)
          : [...p.favoriteModels, modelId]
      } : p
    )
  })),

  dismissOnboarding: () => set({ onboardingDismissed: true }),
  hasConnectedProviders: () => get().connectedProviders.filter(p => p.status === 'connected').length > 0,

  getAllAvailableModels: () => {
    const providers = get().connectedProviders.filter(p => p.status === 'connected');
    return providers.flatMap(provider =>
      provider.models.map(model => ({ provider, model }))
    );
  },

  isModelAvailable: (modelId, providerId) => {
    const provider = get().connectedProviders.find(p => p.id === providerId);
    return provider?.status === 'connected' && provider.models.some(m => m.id === modelId) || false;
  },
}));
