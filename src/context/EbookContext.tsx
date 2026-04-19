import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { extractTextFromPdf } from '../utils/pdfProcessor';
import { callAI, DEFAULT_MODEL, ALL_MODELS as AVAILABLE_MODELS, type EngineType } from '../services/aiEngine';
import { GhostwriterPrompts, type Blueprint, type ContentFormat } from '../services/prompts';
import { generateImage, buildCoverPrompt } from '../services/imageGen';
import { resolveOpenRouterApiKey } from '../config/env';

export type Theme = 'obsidian-noir' | 'arctic-white' | 'royal-purple' | 'sunset-warm' | 'forest-green' | 'ocean-blue' | 'rose-pink' | 'midnight-blue' | 'crimson-red' | 'amber-gold' | 'slate-gray';

export type ForgeStatus = 'idle' | 'parsing' | 'thinking' | 'writing' | 'finished' | 'error';

export interface EbookProject {
  id: string;
  title: string;
  content: string;
  theme?: Theme;
  createdAt: number;
  updatedAt: number;
}

export interface ForgeProgressDetail {
  phase: string;
  current: number;
  total: number;
  label: string;
}

interface EbookContextType {
  projects: EbookProject[];
  activeProjectId: string | null;
  activeProject: EbookProject | null;
  activeTheme: Theme;
  apiKey: string;
  /** Chave usada nas chamadas OpenRouter: VITE_OPENROUTER_API_KEY (se definida) ou chave manual. */
  openRouterApiKeyEffective: string;
  openaiKey: string;
  replicateKey: string;
  anthropicKey: string;
  imageProvider: 'none' | 'openai' | 'replicate';
  imageModel: string;
  generateImages: boolean;
  selectedModel: string;
  selectedEngine: EngineType;
  forgeStatus: ForgeStatus;
  forgeProgress: number;
  forgeProgressDetail: ForgeProgressDetail | null;
  forgeError: string | null;
  setApiKey: (key: string) => void;
  setOpenaiKey: (key: string) => void;
  setReplicateKey: (key: string) => void;
  setAnthropicKey: (key: string) => void;
  setImageProvider: (p: 'none' | 'openai' | 'replicate') => void;
  setImageModel: (m: string) => void;
  setGenerateImages: (v: boolean) => void;
  setSelectedModel: (model: string) => void;
  setSelectedEngine: (engine: EngineType) => void;
  setActiveTheme: (theme: Theme) => void;
  createProject: (title: string) => EbookProject;
  deleteProject: (id: string) => void;
  renameProject: (id: string, title: string) => void;
  setActiveProjectId: (id: string) => void;
  updateProjectContent: (id: string, content: string) => void;
  forgeEbook: (file: File, theme?: Theme) => Promise<void>;
  forgeEbookFromText: (text: string, theme?: Theme) => Promise<void>;
  cancelForge: () => void;
  resetForge: () => void;
  importSingleProject: (project: EbookProject) => void;
  importMultipleProjects: (projects: EbookProject[]) => void;
}

const EbookContext = createContext<EbookContextType | undefined>(undefined);

const STORAGE_KEY = 'ebookforge_projects';
const THEME_KEY = 'ebookforge_theme';
const API_KEY_STORAGE = 'ebookforge_api_key';
const MODEL_KEY = 'ebookforge_model';
const ENGINE_KEY = 'ebookforge_engine';
const OPENAI_KEY_STORAGE = 'ebookforge_openai_key';
const REPLICATE_KEY_STORAGE = 'ebookforge_replicate_key';
const ANTHROPIC_KEY_STORAGE = 'ebookforge_anthropic_key';
const IMAGE_PROVIDER_KEY = 'ebookforge_image_provider';
const IMAGE_MODEL_KEY = 'ebookforge_image_model';
const GENERATE_IMAGES_KEY = 'ebookforge_generate_images';

const createDefaultProject = (): EbookProject => ({
  id: `ebook_${Date.now()}`,
  title: 'Meu Primeiro Ebook',
  content: `<h1>Meu Novo Ebook</h1><p>Escreva o <strong>conteúdo</strong> principal do seu ebook aqui. Você pode arrastar imagens, formatar títulos e criar estruturas complexas.</p><blockquote><p>O sucesso do design depende da elegância da simplicidade.</p></blockquote>`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

/**
 * Divide um texto longo em chunks com sobreposição para contexto.
 * Garante que cada capítulo receba material relevante do manuscrito.
 */
function chunkText(text: string, numChunks: number): string[] {
  if (numChunks <= 0) return [text];
  const totalLen = text.length;
  const baseSize = Math.floor(totalLen / numChunks);
  const overlap = Math.min(3000, Math.floor(baseSize * 0.2));
  const chunks: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = Math.max(0, i * baseSize - overlap);
    const end = Math.min(totalLen, (i + 1) * baseSize + overlap);
    chunks.push(text.substring(start, end));
  }
  return chunks;
}

/** Extrai texto puro de HTML */
function htmlToText(html: string): string {
  try {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? html;
  } catch {
    return html;
  }
}

/** Limpa e valida HTML retornado pela IA */
function sanitizeHtml(raw: string): string {
  // Remove possíveis blocos de código markdown que a IA pode incluir
  return raw
    .replace(/^```html?\n?/gim, '')
    .replace(/^```\n?/gim, '')
    .replace(/```$/gim, '')
    .trim();
}

export const EbookProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<EbookProject[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [createDefaultProject()];
  });

  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return null;
  });

  const [activeTheme, setActiveThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return (stored as Theme) || 'obsidian-noir';
  });

  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  });

  const openRouterApiKeyEffective = useMemo(() => resolveOpenRouterApiKey(apiKey), [apiKey]);

  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    const saved = localStorage.getItem(MODEL_KEY) || '';
    const validIds = AVAILABLE_MODELS.map(m => m.id);
    return validIds.includes(saved as any) ? saved : DEFAULT_MODEL;
  });

  const [selectedEngine, setSelectedEngineState] = useState<EngineType>(() => {
    const saved = localStorage.getItem(ENGINE_KEY);
    return (saved === 'ollama' || saved === 'openrouter') ? saved : 'openrouter';
  });

  const [openaiKey, setOpenaiKeyState] = useState<string>(() => localStorage.getItem(OPENAI_KEY_STORAGE) || '');
  const [replicateKey, setReplicateKeyState] = useState<string>(() => localStorage.getItem(REPLICATE_KEY_STORAGE) || '');
  const [anthropicKey, setAnthropicKeyState] = useState<string>(() => localStorage.getItem(ANTHROPIC_KEY_STORAGE) || '');
  const [imageProvider, setImageProviderState] = useState<'none' | 'openai' | 'replicate'>(() => {
    const saved = localStorage.getItem(IMAGE_PROVIDER_KEY);
    return (saved === 'openai' || saved === 'replicate' || saved === 'none') ? saved : 'none';
  });
  const [imageModel, setImageModelState] = useState<string>(() => localStorage.getItem(IMAGE_MODEL_KEY) || 'dall-e-3');
  const [generateImages, setGenerateImagesState] = useState<boolean>(() => localStorage.getItem(GENERATE_IMAGES_KEY) === 'true');

  const [forgeStatus, setForgeStatus] = useState<ForgeStatus>('idle');
  const [forgeProgress, setForgeProgress] = useState(0);
  const [forgeProgressDetail, setForgeProgressDetail] = useState<ForgeProgressDetail | null>(null);
  const [forgeError, setForgeError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  }, []);

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    localStorage.setItem(MODEL_KEY, model);
  }, []);

  const setSelectedEngine = useCallback((engine: EngineType) => {
    setSelectedEngineState(engine);
    localStorage.setItem(ENGINE_KEY, engine);
  }, []);

  const setOpenaiKey = useCallback((k: string) => { setOpenaiKeyState(k); localStorage.setItem(OPENAI_KEY_STORAGE, k); }, []);
  const setReplicateKey = useCallback((k: string) => { setReplicateKeyState(k); localStorage.setItem(REPLICATE_KEY_STORAGE, k); }, []);
  const setAnthropicKey = useCallback((k: string) => { setAnthropicKeyState(k); localStorage.setItem(ANTHROPIC_KEY_STORAGE, k); }, []);
  const setImageProvider = useCallback((p: 'none' | 'openai' | 'replicate') => { setImageProviderState(p); localStorage.setItem(IMAGE_PROVIDER_KEY, p); }, []);
  const setImageModel = useCallback((m: string) => { setImageModelState(m); localStorage.setItem(IMAGE_MODEL_KEY, m); }, []);
  const setGenerateImages = useCallback((v: boolean) => { setGenerateImagesState(v); localStorage.setItem(GENERATE_IMAGES_KEY, v ? 'true' : 'false'); }, []);

  const setActiveTheme = useCallback((theme: Theme) => {
    setActiveThemeState(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, []);

  /** Muda o projeto ativo e aplica o tema associado a ele, se houver. */
  const setActiveProjectId = useCallback((id: string) => {
    setActiveProjectIdState(id);
    setProjects(prev => {
      const project = prev.find(p => p.id === id);
      if (project?.theme) {
        setActiveThemeState(project.theme);
        localStorage.setItem(THEME_KEY, project.theme);
      }
      return prev;
    });
  }, []);

  const createProject = useCallback((title: string): EbookProject => {
    const newProject: EbookProject = {
      id: `ebook_${Date.now()}`,
      title,
      content: `<h1>${title}</h1><p>Comece a escrever seu ebook aqui...</p>`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectIdState(newProject.id);
    return newProject;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (updated.length === 0) {
        const def = createDefaultProject();
        setActiveProjectId(def.id);
        return [def];
      }
      return updated;
    });
  }, []);

  const renameProject = useCallback((id: string, title: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, title, updatedAt: Date.now() } : p));
  }, []);

  const updateProjectContent = useCallback((id: string, content: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, content, updatedAt: Date.now() } : p));
  }, []);

  const resetForge = useCallback(() => {
    abortController?.abort();
    setForgeStatus('idle');
    setForgeProgress(0);
    setForgeProgressDetail(null);
    setForgeError(null);
    setAbortController(null);
  }, [abortController]);

  const cancelForge = useCallback(() => {
    abortController?.abort();
    setForgeStatus('idle');
    setForgeProgress(0);
    setForgeProgressDetail(null);
    setForgeError('Operação cancelada.');
    setAbortController(null);
  }, [abortController]);

  /**
   * MOTOR PRINCIPAL DE GERAÇÃO
   * Pipeline completo: Blueprint → Introdução → Capítulos (paralelos em lotes) → Conclusão
   */
  const runForge = useCallback(async (fullText: string, targetTheme?: Theme) => {
    if (selectedEngine === 'openrouter' && !openRouterApiKeyEffective) {
      setForgeError('Configure VITE_OPENROUTER_API_KEY no .env ou a chave do OpenRouter nas configurações (ícone de chave na barra lateral), ou escolha o motor Ollama Local.');
      setForgeStatus('error');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // ─── FASE 1: BLUEPRINT ──────────────────────────────────────────────
      setForgeStatus('thinking');
      setForgeProgress(5);
      setForgeProgressDetail({ phase: 'Analisando manuscrito...', current: 0, total: 1, label: 'Criando estrutura do ebook' });

      // Envia até 80k chars — Claude suporta contexto grande
      const manuscriptForBlueprint = fullText.substring(0, 80000);

      const blueprintRaw = await callAI(
        [{ role: 'user', content: GhostwriterPrompts.CREATE_BLUEPRINT(manuscriptForBlueprint) }],
        { engine: selectedEngine, apiKey, model: selectedModel, timeout: 180000, maxTokens: 4000 },
        controller.signal
      );

      if (controller.signal.aborted) return;

      let blueprint: Blueprint;

      try {
        // Tenta extrair JSON da resposta (a IA às vezes envolve em ```json ... ```)
        let jsonStr = blueprintRaw;
        const fenceMatch = blueprintRaw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) jsonStr = fenceMatch[1];

        // Tenta encontrar o JSON mais externo (começa em { e fecha no último })
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
          throw new Error(`Resposta da IA não contém JSON válido. Resposta recebida: ${blueprintRaw.substring(0, 300)}`);
        }
        const jsonCandidate = jsonStr.substring(firstBrace, lastBrace + 1);

        try {
          blueprint = JSON.parse(jsonCandidate);
        } catch {
          // FALLBACK: tenta "consertar" JSON truncado fechando arrays/objetos abertos
          let repaired = jsonCandidate;
          const openBraces = (repaired.match(/\{/g) || []).length;
          const closeBraces = (repaired.match(/\}/g) || []).length;
          const openBrackets = (repaired.match(/\[/g) || []).length;
          const closeBrackets = (repaired.match(/\]/g) || []).length;
          // Remove última vírgula solta, se houver
          repaired = repaired.replace(/,\s*$/, '');
          // Fecha brackets/braces que faltam
          repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
          repaired += '}'.repeat(Math.max(0, openBraces - closeBraces));
          blueprint = JSON.parse(repaired);
        }

        // Normaliza: suporta tanto "entries" (novo) quanto "chapters" (legado)
        if (!blueprint.entries && (blueprint as any).chapters) {
          blueprint.entries = (blueprint as any).chapters;
          blueprint.content_format = blueprint.content_format || 'chapters';
        }
        if (!blueprint.entries || blueprint.entries.length === 0) {
          throw new Error(`Estrutura gerada sem entradas. JSON recebido: ${JSON.stringify(blueprint).substring(0, 300)}`);
        }
      } catch (parseErr: any) {
        throw new Error(`Erro ao processar resposta da IA: ${parseErr.message}`);
      }

      const format: ContentFormat = blueprint.content_format || 'chapters';
      const entries = blueprint.entries;
      const totalParts = entries.length + 2; // +intro +conclusão
      const chunks = chunkText(fullText, entries.length);

      // Label de progresso adaptado ao formato
      const entryLabel = {
        daily_entries: 'dias',
        chapters: 'capítulos',
        steps: 'etapas',
        lessons: 'lições',
        timeline: 'momentos',
        sections: 'seções',
      }[format] || 'entradas';

      setForgeProgress(15);

      // ─── FASE 2: INTRODUÇÃO ─────────────────────────────────────────────
      setForgeStatus('writing');
      setForgeProgressDetail({ phase: 'Escrevendo...', current: 0, total: totalParts, label: 'Introdução' });

      const introHtml = sanitizeHtml(await callAI(
        [{ role: 'user', content: GhostwriterPrompts.WRITE_INTRO(JSON.stringify(blueprint), fullText.substring(0, 8000)) }],
        { engine: selectedEngine, apiKey, model: selectedModel, timeout: 120000, maxTokens: 2000 },
        controller.signal
      ));

      if (controller.signal.aborted) return;
      setForgeProgress(20);

      // ─── FASE 3: ENTRADAS EM LOTES DE 2 ─────────────────────────────────
      // Seleciona o prompt correto baseado no formato detectado
      const getEntryPrompt = (entry: Blueprint['entries'][0], context: string): string => {
        switch (format) {
          case 'daily_entries':
            return GhostwriterPrompts.WRITE_DAILY_ENTRY(entry, context, blueprint.title);
          case 'steps':
            return GhostwriterPrompts.WRITE_STEP({ ...entry, step_number: entry.id }, context, blueprint.title);
          case 'lessons':
            return GhostwriterPrompts.WRITE_LESSON(entry, context, blueprint.title);
          default:
            return GhostwriterPrompts.WRITE_CHAPTER(entry, context, blueprint.title);
        }
      };

      const entryResults: string[] = new Array(entries.length).fill('');
      const BATCH_SIZE = 2;

      for (let batchStart = 0; batchStart < entries.length; batchStart += BATCH_SIZE) {
        if (controller.signal.aborted) return;

        const batchEnd = Math.min(batchStart + BATCH_SIZE, entries.length);
        const batch = entries.slice(batchStart, batchEnd);

        setForgeProgressDetail({
          phase: `Escrevendo ${entryLabel}...`,
          current: batchStart + 1,
          total: entries.length,
          label: batch.map(e => e.date_label || e.title).join(' + ')
        });

        const batchPromises = batch.map((entry, idx) =>
          callAI(
            [
              { role: 'system', content: 'Você é um Ghostwriter de elite. Responda APENAS com HTML semântico limpo.' },
              { role: 'user', content: getEntryPrompt(entry, chunks[batchStart + idx] || chunks[0]) }
            ],
            { engine: selectedEngine, apiKey, model: selectedModel, timeout: 150000, maxTokens: 4096 },
            controller.signal
          ).then(html => sanitizeHtml(html))
        );

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((html, idx) => {
          entryResults[batchStart + idx] = html;
        });

        const progressPct = 20 + ((batchEnd / entries.length) * 60);
        setForgeProgress(progressPct);
      }

      if (controller.signal.aborted) return;

      // ─── FASE 4: CONCLUSÃO ───────────────────────────────────────────────
      setForgeProgressDetail({ phase: 'Finalizando...', current: totalParts - 1, total: totalParts, label: 'Conclusão' });

      const conclusionHtml = sanitizeHtml(await callAI(
        [{ role: 'user', content: GhostwriterPrompts.WRITE_CONCLUSION(JSON.stringify(blueprint), fullText.substring(Math.max(0, fullText.length - 6000))) }],
        { engine: selectedEngine, apiKey, model: selectedModel, timeout: 120000, maxTokens: 2000 },
        controller.signal
      ));

      if (controller.signal.aborted) return;

      // ─── MONTAGEM FINAL ──────────────────────────────────────────────────
      setForgeProgress(95);
      setForgeProgressDetail({ phase: 'Montando ebook...', current: totalParts, total: totalParts, label: 'Pronto!' });

      // Badge visual indicando o formato detectado
      const formatEmoji: Record<ContentFormat, string> = {
        daily_entries: '📅 Jornada Diária',
        chapters: '📖 Livro por Capítulos',
        steps: '⚡ Guia Passo a Passo',
        timeline: '🕐 Linha do Tempo',
        lessons: '🎓 Curso em Lições',
        sections: '📌 Seções Temáticas',
      };

      // ─── GERAÇÃO DE IMAGEM DE CAPA (OPCIONAL) ───────────────────────────
      let coverImageUrl: string | null = null;
      if (generateImages && imageProvider !== 'none') {
        const imgKey = imageProvider === 'openai' ? openaiKey : replicateKey;
        if (imgKey) {
          try {
            setForgeProgressDetail({ phase: 'Gerando capa ilustrada...', current: totalParts, total: totalParts, label: blueprint.title });
            const img = await generateImage(
              buildCoverPrompt(blueprint.title, targetTheme),
              { provider: imageProvider, apiKey: imgKey, model: imageModel, size: '1024x1024' },
              controller.signal
            );
            coverImageUrl = img.url;
          } catch (imgErr) {
            console.warn('Falha na geração de imagem (seguindo sem capa):', imgErr);
          }
        }
      }

      const coverHtml = `
<div class="ebook-cover">
  ${coverImageUrl ? `<img class="cover-hero-image" src="${coverImageUrl}" alt="Capa" />` : ''}
  <span class="cover-format-badge">${formatEmoji[format] || '📖'}</span>
  <h1 class="cover-title">${blueprint.title}</h1>
  <p class="cover-subtitle">${blueprint.subtitle}</p>
  ${blueprint.author_note ? `<p class="cover-author-note">${blueprint.author_note}</p>` : ''}
  ${blueprint.format_hint ? `<p class="cover-format-hint">${blueprint.format_hint}</p>` : ''}
</div>
<div class="chapter-break"></div>`;

      // Para daily_entries, não envolve em chapter-section (o day-entry já é o card)
      const wrapEntry = (html: string) =>
        format === 'daily_entries' || format === 'steps' || format === 'lessons'
          ? html  // já vem com seu próprio card wrapper
          : `<div class="chapter-section">${html}</div>`;

      const entriesHtml = entryResults
        .map(html => `${wrapEntry(html)}<div class="chapter-break"></div>`)
        .join('\n');

      const finalContent = [
        coverHtml,
        `<div class="chapter-section">${introHtml}</div><div class="chapter-break"></div>`,
        entriesHtml,
        `<div class="chapter-section">${conclusionHtml}</div>`,
      ].join('\n');

      const newId = `ebook_forge_${Date.now()}`;
      const resolvedTheme = targetTheme || activeTheme;
      const newProject: EbookProject = {
        id: newId,
        title: blueprint.title,
        content: finalContent,
        theme: resolvedTheme,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setProjects(prev => [...prev, newProject]);
      setActiveProjectIdState(newId);

      // Aplica o tema escolhido ao estado global
      setActiveTheme(resolvedTheme);

      setForgeStatus('finished');
      setForgeProgress(100);
      setForgeProgressDetail({ phase: 'Concluído!', current: totalParts, total: totalParts, label: blueprint.title });

    } catch (err: any) {
      if (err.message === 'Operação cancelada.' || controller.signal.aborted) return;
      setForgeProgress(0);
      setForgeProgressDetail(null);
      setForgeStatus('error');
      setForgeError(err.message || 'Erro inesperado. Tente novamente.');
    } finally {
      setAbortController(null);
    }
  }, [openRouterApiKeyEffective, apiKey, selectedModel, selectedEngine, setActiveTheme, activeTheme, generateImages, imageProvider, imageModel, openaiKey, replicateKey]);

  const forgeEbook = useCallback(async (file: File, theme?: Theme) => {
    if (selectedEngine === 'openrouter' && !openRouterApiKeyEffective) {
      setForgeError('Configure VITE_OPENROUTER_API_KEY no .env ou a chave do OpenRouter nas configurações, ou escolha o motor Ollama Local.');
      setForgeStatus('error');
      return;
    }
    setForgeStatus('parsing');
    setForgeProgress(3);
    setForgeProgressDetail({ phase: 'Extraindo texto do PDF...', current: 0, total: 1, label: file.name });
    setForgeError(null);

    try {
      const { fullText } = await extractTextFromPdf(file);
      if (!fullText || fullText.trim().length < 100) {
        throw new Error('O PDF não contém texto suficiente. Verifique se o arquivo não é uma imagem escaneada.');
      }
      await runForge(fullText, theme);
    } catch (err: any) {
      setForgeStatus('error');
      setForgeError(err.message || 'Erro ao processar o PDF.');
    }
  }, [openRouterApiKeyEffective, selectedEngine, runForge]);

  const forgeEbookFromText = useCallback(async (text: string, theme?: Theme) => {
    if (selectedEngine === 'openrouter' && !openRouterApiKeyEffective) {
      setForgeError('Configure VITE_OPENROUTER_API_KEY no .env ou a chave do OpenRouter nas configurações, ou escolha o motor Ollama Local.');
      setForgeStatus('error');
      return;
    }
    const clean = htmlToText(text).trim();
    if (clean.length < 100) {
      setForgeError('O texto é muito curto. Cole pelo menos alguns parágrafos do seu manuscrito.');
      setForgeStatus('error');
      return;
    }
    setForgeStatus('parsing');
    setForgeProgress(3);
    setForgeError(null);
    setForgeProgressDetail({ phase: 'Preparando manuscrito...', current: 0, total: 1, label: `${clean.length.toLocaleString()} caracteres` });
    await runForge(clean, theme);
  }, [openRouterApiKeyEffective, selectedEngine, runForge]);

  const importSingleProject = useCallback((project: EbookProject) => {
    setProjects(prev => [...prev, project]);
    setActiveProjectIdState(project.id);
  }, []);

  const importMultipleProjects = useCallback((newProjects: EbookProject[]) => {
    setProjects(prev => [...prev, ...newProjects]);
    if (newProjects.length > 0) setActiveProjectIdState(newProjects[0].id);
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? projects[0] ?? null;

  return (
    <EbookContext.Provider value={{
      projects,
      activeProjectId: activeProject?.id ?? null,
      activeProject,
      activeTheme,
      apiKey,
      openRouterApiKeyEffective,
      openaiKey,
      replicateKey,
      anthropicKey,
      imageProvider,
      imageModel,
      generateImages,
      selectedModel,
      selectedEngine,
      forgeStatus,
      forgeProgress,
      forgeProgressDetail,
      forgeError,
      setApiKey,
      setOpenaiKey,
      setReplicateKey,
      setAnthropicKey,
      setImageProvider,
      setImageModel,
      setGenerateImages,
      setSelectedModel,
      setSelectedEngine,
      setActiveTheme,
      createProject,
      deleteProject,
      renameProject,
      setActiveProjectId,
      updateProjectContent,
      forgeEbook,
      forgeEbookFromText,
      cancelForge,
      resetForge,
      importSingleProject,
      importMultipleProjects,
    }}>
      {children}
    </EbookContext.Provider>
  );
};

export const useEbook = () => {
  const context = useContext(EbookContext);
  if (context === undefined) throw new Error('useEbook must be used within an EbookProvider');
  return context;
};
