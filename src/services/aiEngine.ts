// ============================================================
// EbookForge — Adapter Unificado de IA (Jarvis Brain)
//
// Este é o "cérebro" que escolhe entre IA local (Ollama) e
// IA premium (OpenRouter). É a peça central do Jarvis.
// ============================================================

import {
  callOpenRouter,
  AVAILABLE_MODELS as OPENROUTER_MODELS,
  DEFAULT_MODEL as OPENROUTER_DEFAULT
} from './openrouter';
import { callOllama, OLLAMA_MODELS } from './ollama';
import type { Message } from './openrouter';

export type EngineType = 'openrouter' | 'ollama';

export interface EngineConfig {
  engine: EngineType;
  apiKey?: string;     // obrigatório se engine = 'openrouter'
  model: string;
  timeout?: number;
  maxTokens?: number;
}

/** Lista unificada de modelos, com ícone indicando origem */
export const ALL_MODELS = [
  ...OLLAMA_MODELS.map(m => ({
    id: m.id,
    label: m.label,
    speed: m.speed,
    engine: 'ollama' as const,
    displayLabel: `🏠 ${m.label}`
  })),
  ...OPENROUTER_MODELS.map(m => ({
    id: m.id,
    label: m.label,
    speed: m.speed,
    engine: 'openrouter' as const,
    displayLabel: `☁️ ${m.label}`
  })),
];

export const DEFAULT_MODEL = OPENROUTER_DEFAULT;

/**
 * Chamada unificada — o adapter decide qual motor usar.
 * Uso:
 *   await callAI(messages, { engine: 'ollama', model: 'gemma3:1b' });
 *   await callAI(messages, { engine: 'openrouter', apiKey: '...', model: 'anthropic/claude-3.5-sonnet-20241022' });
 */
export async function callAI(
  messages: Message[],
  config: EngineConfig,
  signal?: AbortSignal
): Promise<string> {
  if (config.engine === 'ollama') {
    return callOllama(messages, {
      model: config.model,
      timeout: config.timeout,
      maxTokens: config.maxTokens,
    }, signal);
  }

  // engine === 'openrouter'
  if (!config.apiKey) {
    throw new Error('Chave de API do OpenRouter não configurada.');
  }

  return callOpenRouter(messages, {
    apiKey: config.apiKey,
    model: config.model,
    timeout: config.timeout,
    maxTokens: config.maxTokens,
  }, signal);
}

/**
 * Detecta automaticamente o engine a partir do id do modelo.
 * Modelos Ollama: formato "nome:tag" (ex: gemma3:1b)
 * Modelos OpenRouter: formato "provider/modelo" (ex: anthropic/claude-3.5-sonnet-20241022)
 */
export function detectEngineFromModel(modelId: string): EngineType {
  const isOllama = OLLAMA_MODELS.some(m => m.id === modelId);
  return isOllama ? 'ollama' : 'openrouter';
}

// Re-exporta o tipo pra conveniência
export type { Message } from './openrouter';
