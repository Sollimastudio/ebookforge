export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
}

const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

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

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ebookforge.ai', // Opcional para OpenRouter
        'X-Title': 'EbookForge Premium',
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_MODEL,
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro na comunicação com OpenRouter');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenRouter Error:', error);
    throw error;
  }
}
