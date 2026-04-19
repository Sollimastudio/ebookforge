/**
 * Chave OpenRouter definida em build (Vite): VITE_OPENROUTER_API_KEY no .env
 * Tem precedência sobre a chave guardada manualmente na app.
 */
export function getOpenRouterApiKeyFromEnv(): string {
  const raw = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (raw == null || typeof raw !== 'string') return '';
  return raw.trim();
}

/** Chave efetiva para chamadas OpenRouter: .env primeiro, depois chave manual. */
export function resolveOpenRouterApiKey(manualKey: string | undefined): string {
  const fromEnv = getOpenRouterApiKeyFromEnv();
  if (fromEnv) return fromEnv;
  return (manualKey ?? '').trim();
}
