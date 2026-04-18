/**
 * Serviço de geração de imagens premium.
 * Suporta OpenAI DALL-E 3, Replicate (Flux) e endpoint custom compatível OpenAI.
 */

export type ImageProvider = 'openai' | 'replicate' | 'custom' | 'none';

export interface ImageModel {
  id: string;
  label: string;
  provider: ImageProvider;
  estimatedCost: string;
}

export const IMAGE_MODELS: ImageModel[] = [
  { id: 'dall-e-3',                              label: 'DALL-E 3 (OpenAI) — Premium',   provider: 'openai',    estimatedCost: '~$0.04/img' },
  { id: 'dall-e-3-hd',                           label: 'DALL-E 3 HD (OpenAI) — Ultra',  provider: 'openai',    estimatedCost: '~$0.08/img' },
  { id: 'black-forest-labs/flux-schnell',        label: 'Flux Schnell (Replicate) — Rápido', provider: 'replicate', estimatedCost: '~$0.003/img' },
  { id: 'black-forest-labs/flux-pro',            label: 'Flux Pro (Replicate) — Premium',    provider: 'replicate', estimatedCost: '~$0.055/img' },
];

export interface ImageGenConfig {
  provider: ImageProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

/**
 * Gera uma imagem com o provedor escolhido.
 * Retorna URL da imagem (externa ou base64).
 */
export async function generateImage(
  prompt: string,
  config: ImageGenConfig,
  signal?: AbortSignal
): Promise<GeneratedImage> {
  if (config.provider === 'none' || !config.apiKey) {
    throw new Error('Provedor de imagens não configurado.');
  }

  if (config.provider === 'openai' || config.model.startsWith('dall-e')) {
    return generateOpenAI(prompt, config, signal);
  }

  if (config.provider === 'replicate' || config.model.includes('flux')) {
    return generateReplicate(prompt, config, signal);
  }

  if (config.provider === 'custom' && config.customEndpoint) {
    return generateCustom(prompt, config, signal);
  }

  throw new Error(`Provedor desconhecido: ${config.provider}`);
}

async function generateOpenAI(
  prompt: string,
  config: ImageGenConfig,
  signal?: AbortSignal
): Promise<GeneratedImage> {
  const isHd = config.model.includes('hd') || config.quality === 'hd';
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: config.size || '1024x1024',
      quality: isHd ? 'hd' : 'standard',
      response_format: 'url',
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI falhou: ${res.status} — ${err}`);
  }

  const json = await res.json();
  const url = json?.data?.[0]?.url;
  if (!url) throw new Error('Resposta OpenAI sem URL de imagem.');

  return { url, prompt };
}

async function generateReplicate(
  prompt: string,
  config: ImageGenConfig,
  signal?: AbortSignal
): Promise<GeneratedImage> {
  // Cria predição
  const createRes = await fetch('https://api.replicate.com/v1/models/' + config.model + '/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 90,
      },
    }),
    signal,
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate falhou: ${createRes.status} — ${err}`);
  }

  const pred = await createRes.json();
  let output = pred?.output;

  // Se ainda não terminou, faz polling curto
  let predId = pred?.id;
  let attempts = 0;
  while (!output && predId && attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    const check = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
      headers: { 'Authorization': `Token ${config.apiKey}` },
      signal,
    });
    const data = await check.json();
    if (data?.status === 'succeeded') { output = data.output; break; }
    if (data?.status === 'failed' || data?.status === 'canceled') {
      throw new Error(`Replicate ${data.status}: ${data.error || 'sem detalhe'}`);
    }
    attempts++;
  }

  const url = Array.isArray(output) ? output[0] : output;
  if (!url) throw new Error('Replicate não retornou imagem.');

  return { url, prompt };
}

async function generateCustom(
  prompt: string,
  config: ImageGenConfig,
  signal?: AbortSignal
): Promise<GeneratedImage> {
  const res = await fetch(config.customEndpoint!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      size: config.size || '1024x1024',
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Endpoint custom falhou: ${res.status} — ${err}`);
  }

  const json = await res.json();
  const url = json?.data?.[0]?.url || json?.url || json?.output?.[0];
  if (!url) throw new Error('Endpoint custom não retornou URL.');

  return { url, prompt };
}

/**
 * Monta um prompt visual rico a partir do título e tema do ebook.
 */
export function buildCoverPrompt(title: string, theme?: string): string {
  const style = theme === 'branco-artico' ? 'minimalist editorial, clean white background, elegant serif typography, premium book design'
              : theme === 'roxo-real'     ? 'royal purple and gold, luxurious, mystical, gradient lighting, premium'
              : theme === 'por-do-sol'    ? 'warm sunset tones, orange and magenta gradient, dreamy, sophisticated'
              : 'dark modern editorial, dramatic lighting, bold composition, premium';
  return `Professional ebook cover illustration for "${title}". ${style}. High quality, 4k, detailed, magazine-grade, no text on image.`;
}

export function buildSectionPrompt(sectionTitle: string, contextHint: string): string {
  return `Editorial illustration for "${sectionTitle}". ${contextHint}. Minimalist, premium, magazine style, soft colors, no text, no watermark.`;
}
