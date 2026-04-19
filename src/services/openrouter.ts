import { resolveOpenRouterApiKey } from '../config/env';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
  maxTokens?: number;
  onProgress?: (chunk: string) => void;
}

// Modelos disponíveis no OpenRouter — IDs exatos e verificados
export const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-3-haiku-20240307',        label: 'Claude 3 Haiku (Mais Rápido / Econômico)', speed: 'fast' },
  { id: 'anthropic/claude-3.5-haiku-20241022',      label: 'Claude 3.5 Haiku (Rápido e Inteligente)',  speed: 'fast' },
  { id: 'anthropic/claude-3.5-sonnet-20241022',     label: 'Claude 3.5 Sonnet (Recomendado)',           speed: 'balanced' },
  { id: 'anthropic/claude-3.7-sonnet-20250219',     label: 'Claude 3.7 Sonnet (Mais Recente)',          speed: 'balanced' },
  { id: 'openai/gpt-4o-mini',                       label: 'GPT-4o Mini (Alternativa Rápida)',          speed: 'fast' },
  { id: 'google/gemini-flash-1.5',                  label: 'Gemini Flash 1.5 (Alternativa Econômica)',  speed: 'fast' },
  { id: 'local/llama3.2:1b',                        label: 'Llama 3.2 1B (Local / Gratuito)',           speed: 'fast' },
] as const;

const LOCAL_MODEL_PREFIX = 'local/';
const LOCAL_API_BASE = 'http://localhost:4000/v1';
const LOCAL_API_KEY = '123456';

export const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet-20241022';
const DEFAULT_TIMEOUT = 180000; // 3 minutos
const DEFAULT_MAX_TOKENS = 8192; // Máximo para capítulos ricos

/**
 * Chama a API OpenRouter com suporte a timeout e configuração flexível.
 */
export async function callOpenRouter(
  messages: Message[],
  config: OpenRouterConfig,
  signal?: AbortSignal
): Promise<string> {
  const isLocal = config.model?.startsWith(LOCAL_MODEL_PREFIX);

  const resolvedKey = resolveOpenRouterApiKey(config.apiKey);

  if (!isLocal && !resolvedKey) {
    throw new Error('Chave de API do OpenRouter não configurada.');
  }

  const timeout = config.timeout || DEFAULT_TIMEOUT;
  const maxTokens = config.maxTokens || DEFAULT_MAX_TOKENS;

  const controller = new AbortController();
  const combinedSignal = signal
    ? combineSignals(controller.signal, signal)
    : controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const apiBase = isLocal ? LOCAL_API_BASE : 'https://openrouter.ai/api/v1';
  const apiKey = isLocal ? LOCAL_API_KEY : resolvedKey;
  const modelId = isLocal ? config.model!.replace(LOCAL_MODEL_PREFIX, 'ollama/') : (config.model || DEFAULT_MODEL);

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(isLocal ? {} : { 'HTTP-Referer': 'https://ebookforge.app', 'X-Title': 'EbookForge Premium' }),
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature: 0.72,
        max_tokens: maxTokens,
        top_p: 0.95,
      }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errObj = (errorData as any).error;
      const status = response.status;
      if (status === 401) throw new Error('API Key inválida ou sem permissão. Verifique sua chave em openrouter.ai/keys');
      if (status === 402) throw new Error('Saldo insuficiente no OpenRouter. Adicione créditos em openrouter.ai/credits');
      if (status === 404) throw new Error(`Modelo não encontrado: "${config.model}". Escolha outro modelo na lista.`);
      if (status === 429) throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.');
      const msg = errObj?.message || errObj?.code || `Erro HTTP ${status}`;
      throw new Error(msg);
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('Resposta vazia da API. Tente novamente.');

    return content;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Operação cancelada.');
    }
    throw error;
  }
}

/** Combina dois AbortSignals — aborta se qualquer um disparar */
function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();
  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}
