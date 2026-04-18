// ============================================================
// EbookForge — Motor de IA Local (Ollama)
// ============================================================

import type { Message } from './openrouter';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

export interface OllamaConfig {
  baseUrl?: string;
  model: string;
  timeout?: number;
  maxTokens?: number;
}

// Modelos locais disponíveis (ajuste conforme o que você tem instalado)
// Para ver seus modelos: rode `ollama list` no terminal
export const OLLAMA_MODELS = [
  { id: 'gemma3:1b',    label: 'Gemma 3 1B (Local — Mais Rápido)',      speed: 'fast' },
  { id: 'llama3.2:1b',  label: 'Llama 3.2 1B (Local — Equilibrado)',    speed: 'fast' },
  { id: 'llama3.2:3b',  label: 'Llama 3.2 3B (Local — Mais Preciso)',   speed: 'balanced' },
  { id: 'mistral:7b',   label: 'Mistral 7B (Local — Mais Inteligente)', speed: 'slow' },
] as const;

/**
 * Chama o Ollama local usando o endpoint compatível com OpenAI (/v1/chat/completions).
 * Antes de usar, rode no terminal:
 *   launchctl setenv OLLAMA_ORIGINS "*"
 * E reinicie o app Ollama.
 */
export async function callOllama(
  messages: Message[],
  config: OllamaConfig,
  signal?: AbortSignal
): Promise<string> {
  const baseUrl = config.baseUrl || DEFAULT_OLLAMA_URL;
  const timeout = config.timeout || 180000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const combinedSignal = signal
    ? combineSignals(controller.signal, signal)
    : controller.signal;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.72,
        max_tokens: config.maxTokens || 4096,
        top_p: 0.95,
      }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Modelo "${config.model}" não encontrado no Ollama. Rode no terminal: ollama pull ${config.model}`
        );
      }
      throw new Error(`Erro do Ollama (HTTP ${response.status}). Verifique se o Ollama está rodando.`);
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('Resposta vazia do Ollama. Tente outro modelo.');

    return content;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Operação cancelada.');
    }
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error(
        'Não consegui conectar ao Ollama. Verifique se ele está rodando em http://localhost:11434 ' +
        'e que você rodou: launchctl setenv OLLAMA_ORIGINS "*" (depois reiniciou o Ollama).'
      );
    }
    throw error;
  }
}

/** Testa se o Ollama está rodando e acessível */
export async function checkOllamaAvailable(baseUrl = DEFAULT_OLLAMA_URL): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/** Lista todos os modelos instalados no Ollama */
export async function listInstalledOllamaModels(baseUrl = DEFAULT_OLLAMA_URL): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    if (!response.ok) return [];
    const data = await response.json() as { models?: { name: string }[] };
    return data.models?.map(m => m.name) || [];
  } catch {
    return [];
  }
}

function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();
  a.addEventListener('abort', abort, { once: true });
  b.addEventListener('abort', abort, { once: true });
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}
