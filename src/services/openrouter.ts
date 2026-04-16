export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
  max_tokens?: number;
}

export const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku — rápido · barato ✓' },
  { id: 'anthropic/claude-3.5-haiku-20241022', label: 'Claude 3.5 Haiku — equilibrado ✓' },
  { id: 'anthropic/claude-3.5-sonnet-20241022', label: 'Claude 3.5 Sonnet — premium ✓' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini — barato · rápido ✓' },
  { id: 'openai/gpt-4o', label: 'GPT-4o — alta qualidade ✓' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5 — muito barato ✓' },
];

const DEFAULT_MODEL = 'anthropic/claude-3-haiku';
const DEFAULT_TIMEOUT = 120000; // 2 minutos

/**
 * Serviço para comunicação com OpenRouter
 */
export async function callOpenRouter(
  messages: Message[],
  config: OpenRouterConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Chave de API do OpenRouter não configurada.');
  }

  const timeout = config.timeout || DEFAULT_TIMEOUT;

  try {
    console.log('🔄 Chamando OpenRouter API...', { model: config.model || DEFAULT_MODEL, timeout });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Timeout atingido, cancelando requisição...');
      controller.abort();
    }, timeout);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ebookforge.ai',
        'X-Title': 'EbookForge Premium',
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: config.max_tokens ?? 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erro na resposta da API:', response.status, errorData);
      throw new Error(errorData.error?.message || `Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ Resposta inválida da API:', data);
      throw new Error('Resposta inválida da API');
    }

    console.log('✅ Resposta recebida com sucesso');
    return content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: A requisição demorou muito para responder. Tente novamente.');
    }
    console.error('❌ Erro no OpenRouter:', error);
    throw error;
  }
}
