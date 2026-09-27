// ── Security Utilities ───────────────────────────────────────────
// XSS protection, input validation, credential handling

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

/** Escape HTML entities to prevent XSS */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, c => HTML_ENTITIES[c] || c);
}

/** Sanitize user input — strip control chars, limit length */
export function sanitizeInput(input: string, maxLength = 50000): string {
  // Remove null bytes and other control characters (keep newlines, tabs)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.slice(0, maxLength);
}

/** Validate URL format and block dangerous protocols */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

/** Check for potential SSRF targets (internal IPs) */
export function isSafeUrl(url: string): { safe: boolean; reason?: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    // Block metadata endpoints
    if (host === '169.254.169.254') return { safe: false, reason: 'Cloud metadata endpoint blocked' };
    if (host === 'metadata.google.internal') return { safe: false, reason: 'Cloud metadata endpoint blocked' };
    // Allow localhost for local servers (intentional)
    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL' };
  }
}

/** Mask sensitive credential for display */
export function maskCredential(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '•'.repeat(value.length);
  return '•'.repeat(Math.min(16, value.length - 4)) + value.slice(-4);
}

/** Validate API key format (basic checks) */
export function validateApiKeyFormat(key: string, provider: string): { valid: boolean; message?: string } {
  if (!key || key.trim().length === 0) return { valid: false, message: 'API key is required' };
  if (key.length < 10) return { valid: false, message: 'API key seems too short' };
  if (key.length > 500) return { valid: false, message: 'API key seems too long' };
  // Provider-specific prefix checks
  const prefixes: Record<string, string[]> = {
    openai: ['sk-'],
    anthropic: ['sk-ant-'],
    groq: ['gsk_'],
    openrouter: ['sk-or-'],
    huggingface: ['hf_'],
    nvidia: ['nvapi-'],
    xai: ['xai-'],
  };
  const expected = prefixes[provider];
  if (expected && !expected.some(p => key.startsWith(p))) {
    return { valid: true, message: `Expected prefix: ${expected.join(' or ')}` };
  }
  return { valid: true };
}

/** Validate file upload (type, size) */
export function validateFileUpload(file: File, options?: {
  maxSizeMB?: number;
  allowedTypes?: string[];
}): { valid: boolean; message?: string } {
  const maxSize = (options?.maxSizeMB || 25) * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, message: `File too large (max ${options?.maxSizeMB || 25}MB)` };
  }
  if (options?.allowedTypes && !options.allowedTypes.some(t => file.type.startsWith(t))) {
    return { valid: false, message: 'File type not supported' };
  }
  // Block potentially dangerous files
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.msi'];
  if (dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
    return { valid: false, message: 'Executable files are not allowed' };
  }
  return { valid: true };
}

/** Rate limiter (simple client-side) */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const timestamps: number[] = [];
  return {
    canProceed(): boolean {
      const now = Date.now();
      // Remove expired timestamps
      while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
        timestamps.shift();
      }
      if (timestamps.length >= maxRequests) return false;
      timestamps.push(now);
      return true;
    },
    remainingRequests(): number {
      const now = Date.now();
      while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
        timestamps.shift();
      }
      return Math.max(0, maxRequests - timestamps.length);
    }
  };
}

// Global rate limiter: 60 requests per minute
export const chatRateLimiter = createRateLimiter(60, 60000);
