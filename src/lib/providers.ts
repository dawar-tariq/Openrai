/**
 * Real Provider Adapter Layer
 * Each adapter implements real API calls for connection testing,
 * model discovery, and chat completion.
 *
 * IMPORTANT: API keys are sent directly from the browser to provider APIs.
 * In production, you'd proxy through your own backend to avoid CORS and
 * keep keys server-side. This client-side approach works for:
 * - Local servers (Ollama, LM Studio, etc.)
 * - Providers with permissive CORS (some do, some don't)
 * - When a CORS proxy is configured
 *
 * For providers that block browser requests (most cloud APIs),
 * the adapter catches the CORS error and returns a clear message.
 */

import type { AIModel } from './store';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  finishReason?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface ProviderTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  modelCount?: number;
  serverType?: string;
  serverVersion?: string;
}

export interface ProviderAdapter {
  id: string;
  testConnection(apiKey?: string, baseUrl?: string): Promise<ProviderTestResult>;
  listModels(apiKey?: string, baseUrl?: string): Promise<AIModel[]>;
  chat(messages: ChatMessage[], model: string, apiKey?: string, baseUrl?: string): Promise<ChatResponse>;
  streamChat?(messages: ChatMessage[], model: string, apiKey?: string, baseUrl?: string, onToken?: (token: string) => void): Promise<ChatResponse>;
}

// ── Helpers ──────────────────────────────────────────────────────

function normalizeBaseUrl(url: string): string {
  // Remove trailing slashes only
  return url.replace(/\/+$/, '');
}


function getBaseUrl(templateId: string, customBaseUrl?: string): string {
  const defaults: Record<string, string> = {
    openai: 'https://openrai.dawartariq14.workers.dev/https://api.openai.com',
    anthropic: 'https://openrai.dawartariq14.workers.dev/https://api.anthropic.com',
    google: 'https://generativelanguage.googleapis.com',
    openrouter: 'https://openrai.dawartariq14.workers.dev/https://openrouter.ai/api',
    groq: 'https://openrai.dawartariq14.workers.dev/https://api.groq.com/openai',
    together: 'https://openrai.dawartariq14.workers.dev/https://api.together.xyz',
    mistral: 'https://openrai.dawartariq14.workers.dev/https://api.mistral.ai',
    deepseek: 'https://openrai.dawartariq14.workers.dev/https://api.deepseek.com',
    xai: 'https://openrai.dawartariq14.workers.dev/https://api.x.ai',
    nvidia: 'https://openrai.dawartariq14.workers.dev/https://integrate.api.nvidia.com',
    cloudflare: 'https://openrai.dawartariq14.workers.dev/https://api.cloudflare.com/client/v4',
    huggingface: 'https://openrai.dawartariq14.workers.dev/https://api-inference.huggingface.co',
    cohere: 'https://openrai.dawartariq14.workers.dev/https://api.cohere.com',
    ollama: 'http://localhost:11434',
    lmstudio: '/ttp://localhost:1234',
    vllm: 'http://localhost:8000',
    llamacpp: 'http://localhost:8080',
    textgenwebui: 'http://localhost:5000',
  };
  const raw = customBaseUrl || defaults[templateId] || '';
  return raw ? normalizeBaseUrl(raw) : '';
}

async function safeFetch(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function inferCapabilities(modelId: string): string[] {
  const id = modelId.toLowerCase();
  const caps: string[] = ['chat'];
  if (id.includes('code') || id.includes('coder') || id.includes('codestral') || id.includes('starcoder')) caps.push('code');
  if (id.includes('vision') || id.includes('4o') || id.includes('gemini') || id.includes('claude-3') || id.includes('claude-4')) caps.push('vision');
  if (id.includes('o1') || id.includes('o3') || id.includes('reason') || id.includes('r1') || id.includes('think')) caps.push('reasoning');
  return [...new Set(caps)];
}

function corsErrorMessage(provider: string): string {
  return `Cannot reach ${provider} API directly from the browser (CORS). To use ${provider}, you'll need a CORS proxy or backend relay. Local servers (Ollama, LM Studio) work directly.`;
}

// ── OpenAI-Compatible Adapter ────────────────────────────────────
// Works for: OpenAI, Groq, Together, Mistral, DeepSeek, xAI, NVIDIA,
// LM Studio, vLLM, llama.cpp, text-gen-webui, and any OpenAI-compatible API

function createOpenAICompatibleAdapter(providerId: string, providerName: string): ProviderAdapter {
  return {
    id: providerId,

    async testConnection(apiKey?: string, baseUrl?: string) {
      const base = getBaseUrl(providerId, baseUrl);
      const start = Date.now();
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const res = await safeFetch(`${base}/v1/models`, { method: 'GET', headers }, 10000);
        const latency = Date.now() - start;

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          if (res.status === 401) return { success: false, latencyMs: latency, message: 'Authentication failed — check your API key' };
          if (res.status === 403) return { success: false, latencyMs: latency, message: 'Access denied — insufficient permissions' };
          return { success: false, latencyMs: latency, message: `API returned ${res.status}: ${body.slice(0, 200)}` };
        }

        const data = await res.json();
        const models = data.data || data || [];
        const count = Array.isArray(models) ? models.length : 0;

        return {
          success: true, latencyMs: latency,
          modelCount: count,
          message: `Connected · ${count} model${count !== 1 ? 's' : ''} found · ${latency}ms`,
          serverType: providerId,
        };
      } catch (err: any) {
        const latency = Date.now() - start;
        if (err?.name === 'AbortError') return { success: false, latencyMs: latency, message: 'Connection timed out — is the server running?' };
        if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError'))
          return { success: false, latencyMs: latency, message: corsErrorMessage(providerName) };
        return { success: false, latencyMs: latency, message: `Connection failed: ${err?.message || 'Unknown error'}` };
      }
    },

    async listModels(apiKey?: string, baseUrl?: string) {
      const base = getBaseUrl(providerId, baseUrl);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      try {
        const res = await safeFetch(`${base}/v1/models`, { method: 'GET', headers }, 10000);
        if (!res.ok) return [];

        const data = await res.json();
        const rawModels = data.data || data || [];
        if (!Array.isArray(rawModels)) return [];

        return rawModels
          .filter((m: any) => m.id && typeof m.id === 'string')
          .map((m: any) => ({
            id: m.id,
            name: m.id.split('/').pop() || m.id,
            description: m.owned_by ? `by ${m.owned_by}` : providerName,
            contextWindow: m.context_length ? `${Math.round(m.context_length / 1024)}K` : '',
            capabilities: inferCapabilities(m.id),
            pricing: undefined,
          } as AIModel))
          .sort((a: AIModel, b: AIModel) => a.name.localeCompare(b.name));
      } catch {
        return [];
      }
    },

    async chat(messages, model, apiKey?, baseUrl?) {
      const base = getBaseUrl(providerId, baseUrl);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      if (providerId === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'OpenRAI';
      }

      const res = await safeFetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          max_tokens: 4096,
          stream: false,
        }),
      }, 60000);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${body.slice(0, 300)}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content || '',
        model: data.model || model,
        finishReason: choice?.finish_reason,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
      };
    },

    async streamChat(messages, model, apiKey?, baseUrl?, onToken?) {
      const base = getBaseUrl(providerId, baseUrl);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      if (providerId === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'OpenRAI';
      }

      const res = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${body.slice(0, 300)}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let fullContent = '';
      let modelName = model;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (parsed.model) modelName = parsed.model;
            if (delta) {
              fullContent += delta;
              onToken?.(delta);
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      return { content: fullContent, model: modelName, finishReason: 'stop' };
    }
  };
}

// ── Anthropic Adapter ────────────────────────────────────────────

const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',

  async testConnection(apiKey?: string) {
    const start = Date.now();
    try {
      if (!apiKey) return { success: false, latencyMs: 0, message: 'API key is required' };
      const res = await safeFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
      }, 10000);
      const latency = Date.now() - start;
      if (res.status === 401) return { success: false, latencyMs: latency, message: 'Invalid API key' };
      if (res.status === 403) return { success: false, latencyMs: latency, message: 'Access denied' };
      // Even a 400 for wrong model means the key works
      if (res.ok || res.status === 400 || res.status === 429) {
        return { success: true, latencyMs: latency, message: `Connected · ${latency}ms`, serverType: 'anthropic' };
      }
      return { success: false, latencyMs: latency, message: `API returned ${res.status}` };
    } catch (err: any) {
      const latency = Date.now() - start;
      if (err?.message?.includes('Failed to fetch')) return { success: false, latencyMs: latency, message: corsErrorMessage('Anthropic') };
      return { success: false, latencyMs: latency, message: `Connection failed: ${err?.message}` };
    }
  },

  async listModels(apiKey?: string) {
    // Anthropic doesn't have a /models endpoint — return known models
    // These are the current publicly available models
    if (!apiKey) return [];
    try {
      const res = await safeFetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      }, 10000);
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((m: any) => ({
            id: m.id,
            name: m.display_name || m.id,
            description: `Anthropic · ${m.id}`,
            contextWindow: m.context_window ? `${Math.round(m.context_window / 1024)}K` : '',
            capabilities: inferCapabilities(m.id),
          }));
        }
      }
    } catch { /* fall through to empty */ }
    return [];
  },

  async chat(messages, model, apiKey?) {
    if (!apiKey) throw new Error('API key required');
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs = messages.filter(m => m.role !== 'system');

    const body: any = {
      model,
      max_tokens: 4096,
      messages: chatMsgs.map(m => ({ role: m.role, content: m.content })),
    };
    if (systemMsg) body.system = systemMsg.content;

    const res = await safeFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    }, 60000);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Anthropic API error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.content?.map((c: any) => c.text).join('') || '';
    return {
      content: text,
      model: data.model || model,
      finishReason: data.stop_reason,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens || 0,
        completionTokens: data.usage.output_tokens || 0,
        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      } : undefined,
    };
  },

  async streamChat(messages, model, apiKey?, _baseUrl?, onToken?) {
    if (!apiKey) throw new Error('API key required');
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs = messages.filter(m => m.role !== 'system');

    const body: any = {
      model, max_tokens: 4096, stream: true,
      messages: chatMsgs.map(m => ({ role: m.role, content: m.content })),
    };
    if (systemMsg) body.system = systemMsg.content;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Anthropic API error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No stream');
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullContent += parsed.delta.text;
            onToken?.(parsed.delta.text);
          }
        } catch { /* skip */ }
      }
    }
    return { content: fullContent, model, finishReason: 'stop' };
  }
};

// ── Google Gemini Adapter ────────────────────────────────────────

const googleAdapter: ProviderAdapter = {
  id: 'google',

  async testConnection(apiKey?: string) {
    const start = Date.now();
    try {
      if (!apiKey) return { success: false, latencyMs: 0, message: 'API key is required' };
      const res = await safeFetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { method: 'GET' }, 10000
      );
      const latency = Date.now() - start;
      if (!res.ok) {
        if (res.status === 400 || res.status === 403) return { success: false, latencyMs: latency, message: 'Invalid API key' };
        return { success: false, latencyMs: latency, message: `Google API returned ${res.status}` };
      }
      const data = await res.json();
      const count = data.models?.length || 0;
      return { success: true, latencyMs: latency, modelCount: count, message: `Connected · ${count} models · ${latency}ms`, serverType: 'google' };
    } catch (err: any) {
      const latency = Date.now() - start;
      return { success: false, latencyMs: latency, message: `Connection failed: ${err?.message}` };
    }
  },

  async listModels(apiKey?: string) {
    if (!apiKey) return [];
    try {
      const res = await safeFetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { method: 'GET' }, 10000
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: m.name?.replace('models/', '') || m.name,
          name: m.displayName || m.name?.replace('models/', ''),
          description: m.description?.slice(0, 100) || 'Google AI',
          contextWindow: m.inputTokenLimit ? `${Math.round(m.inputTokenLimit / 1024)}K` : '',
          capabilities: inferCapabilities(m.name || ''),
        }));
    } catch { return []; }
  },

  async chat(messages, model, apiKey?) {
    if (!apiKey) throw new Error('API key required');
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs = messages.filter(m => m.role !== 'system');

    const contents = chatMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: any = { contents };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const res = await safeFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      60000
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
    return {
      content: text,
      model,
      finishReason: data.candidates?.[0]?.finishReason,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
    };
  }
};

// ── Ollama Adapter ───────────────────────────────────────────────

const ollamaAdapter: ProviderAdapter = {
  id: 'ollama',

  async testConnection(_apiKey?: string, baseUrl?: string) {
    const base = normalizeBaseUrl(baseUrl || 'http://localhost:11434');
    const start = Date.now();
    try {
      const res = await safeFetch(`${base}/api/tags`, { method: 'GET' }, 5000);
      const latency = Date.now() - start;
      if (!res.ok) return { success: false, latencyMs: latency, message: `Ollama returned ${res.status}` };
      const data = await res.json();
      const count = data.models?.length || 0;
      return { success: true, latencyMs: latency, modelCount: count, message: `Connected · ${count} models installed · ${latency}ms`, serverType: 'ollama' };
    } catch (err: any) {
      const latency = Date.now() - start;
      if (err?.name === 'AbortError') return { success: false, latencyMs: latency, message: 'Timeout — is Ollama running?' };
      return { success: false, latencyMs: latency, message: `Cannot reach Ollama at ${base} — is it running?` };
    }
  },

  async listModels(_apiKey?: string, baseUrl?: string) {
    const base = normalizeBaseUrl(baseUrl || 'http://localhost:11434');
    try {
      const res = await safeFetch(`${base}/api/tags`, { method: 'GET' }, 5000);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map((m: any) => ({
        id: m.name || m.model,
        name: m.name || m.model,
        description: `${m.details?.parameter_size || ''} ${m.details?.quantization_level || ''}`.trim() || 'Local model',
        contextWindow: '',
        capabilities: inferCapabilities(m.name || ''),
      }));
    } catch { return []; }
  },

  async chat(messages, model, _apiKey?, baseUrl?) {
    const base = normalizeBaseUrl(baseUrl || 'http://localhost:11434');
    const res = await safeFetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
      }),
    }, 120000);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    return {
      content: data.message?.content || '',
      model: data.model || model,
      finishReason: data.done ? 'stop' : undefined,
      usage: data.eval_count ? {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      } : undefined,
    };
  },

  async streamChat(messages, model, _apiKey?, baseUrl?, onToken?) {
    const base = normalizeBaseUrl(baseUrl || 'http://localhost:11434');
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${body.slice(0, 300)}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No stream');
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            fullContent += parsed.message.content;
            onToken?.(parsed.message.content);
          }
        } catch { /* skip */ }
      }
    }
    return { content: fullContent, model, finishReason: 'stop' };
  }
};

// ── Registry ─────────────────────────────────────────────────────

const adapters: Record<string, ProviderAdapter> = {
  openai: createOpenAICompatibleAdapter('openai', 'OpenAI'),
  anthropic: anthropicAdapter,
  google: googleAdapter,
  openrouter: createOpenAICompatibleAdapter('openrouter', 'OpenRouter'),
  groq: createOpenAICompatibleAdapter('groq', 'Groq'),
  together: createOpenAICompatibleAdapter('together', 'Together AI'),
  mistral: createOpenAICompatibleAdapter('mistral', 'Mistral AI'),
  deepseek: createOpenAICompatibleAdapter('deepseek', 'DeepSeek'),
  xai: createOpenAICompatibleAdapter('xai', 'xAI'),
  nvidia: createOpenAICompatibleAdapter('nvidia', 'NVIDIA NIM'),
  cloudflare: createOpenAICompatibleAdapter('cloudflare', 'Cloudflare AI'),
  huggingface: createOpenAICompatibleAdapter('huggingface', 'Hugging Face'),
  cohere: createOpenAICompatibleAdapter('cohere', 'Cohere'),
  ollama: ollamaAdapter,
  lmstudio: createOpenAICompatibleAdapter('lmstudio', 'LM Studio'),
  vllm: createOpenAICompatibleAdapter('vllm', 'vLLM'),
  llamacpp: createOpenAICompatibleAdapter('llamacpp', 'llama.cpp'),
  textgenwebui: createOpenAICompatibleAdapter('textgenwebui', 'Text Gen WebUI'),
  custom: createOpenAICompatibleAdapter('custom', 'Custom'),
};

export function getAdapter(templateId: string): ProviderAdapter {
  return adapters[templateId] || createOpenAICompatibleAdapter(templateId, templateId);
}
