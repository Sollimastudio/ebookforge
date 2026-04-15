import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { extractTextFromPdf } from '../utils/pdfProcessor';
import { callOpenRouter } from '../services/openrouter';
import { GhostwriterPrompts } from '../services/prompts';

export type Theme = 'obsidian-noir' | 'arctic-white' | 'royal-purple' | 'sunset-warm';

export type ForgeStatus = 'idle' | 'parsing' | 'thinking' | 'writing' | 'finished' | 'error';

export interface EbookProject {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface EbookContextType {
  projects: EbookProject[];
  activeProjectId: string | null;
  activeProject: EbookProject | null;
  activeTheme: Theme;
  apiKey: string;
  forgeStatus: ForgeStatus;
  forgeProgress: number;
  forgeError: string | null;
  setApiKey: (key: string) => void;
  setActiveTheme: (theme: Theme) => void;
  createProject: (title: string) => EbookProject;
  deleteProject: (id: string) => void;
  renameProject: (id: string, title: string) => void;
  setActiveProjectId: (id: string) => void;
  updateProjectContent: (id: string, content: string) => void;
  forgeEbook: (file: File) => Promise<void>;
  forgeEbookFromText: (text: string) => Promise<void>;
  cancelForge: () => void;
  resetForge: () => void;
}

const EbookContext = createContext<EbookContextType | undefined>(undefined);

const STORAGE_KEY = 'ebookforge_projects';
const THEME_KEY = 'ebookforge_theme';
const API_KEY_STORAGE = 'ebookforge_api_key';

const createDefaultProject = (): EbookProject => ({
  id: `ebook_${Date.now()}`,
  title: 'Meu Primeiro Ebook',
  content: `<h1>Meu Novo Ebook</h1><p>Escreva o <strong>conteúdo</strong> principal do seu ebook aqui. Você pode arrastar imagens, formatar títulos e criar estruturas complexas.</p><blockquote><p>O sucesso do design depende da elegância da simplicidade.</p></blockquote>`,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

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

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    try {
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

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  });

  const [forgeStatus, setForgeStatus] = useState<ForgeStatus>('idle');
  const [forgeProgress, setForgeProgress] = useState(0);
  const [forgeError, setForgeError] = useState<string | null>(null);
  const [forgeAbortController, setForgeAbortController] = useState<AbortController | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(API_KEY_STORAGE, apiKey);
  }, [apiKey]);

  const setActiveTheme = useCallback((theme: Theme) => {
    setActiveThemeState(theme);
    localStorage.setItem(THEME_KEY, theme);
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
    setActiveProjectId(newProject.id);
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
    setProjects(prev =>
      prev.map(p => p.id === id ? { ...p, title, updatedAt: Date.now() } : p)
    );
  }, []);

  const updateProjectContent = useCallback((id: string, content: string) => {
    setProjects(prev =>
      prev.map(p => p.id === id ? { ...p, content, updatedAt: Date.now() } : p)
    );
  }, []);

  const resetForge = useCallback(() => {
    if (forgeAbortController) {
      forgeAbortController.abort();
    }
    setForgeStatus('idle');
    setForgeProgress(0);
    setForgeError(null);
    setForgeAbortController(null);
  }, [forgeAbortController]);

  const cancelForge = useCallback(() => {
    if (forgeAbortController) {
      console.log('🛑 Cancelando operação de forja...');
      forgeAbortController.abort();
    }
    setForgeStatus('idle');
    setForgeProgress(0);
    setForgeError('Operação cancelada pelo usuário.');
    setForgeAbortController(null);
  }, [forgeAbortController]);

  const extractTextFromHtml = (html: string) => {
    try {
      return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? html;
    } catch {
      return html;
    }
  };

  const runForge = useCallback(async (fullText: string) => {
    if (!apiKey) {
      setForgeError('Por favor, configure sua chave do OpenRouter primeiro.');
      return;
    }

    const controller = new AbortController();
    setForgeAbortController(controller);

    try {
      console.log('🚀 Iniciando processo de forja...', { textLength: fullText.length });

      setForgeStatus('thinking');
      setForgeProgress(30);

      console.log('📝 Gerando blueprint...');
      const blueprintRaw = await callOpenRouter(
        [{ role: 'user', content: GhostwriterPrompts.CREATE_BLUEPRINT(fullText) }],
        { apiKey, timeout: 180000 } // 3 minutos para blueprint
      );

      if (controller.signal.aborted) {
        throw new Error('Operação cancelada');
      }

      let blueprint;
      try {
        const jsonMatch = blueprintRaw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Formato de resposta inválido');
        blueprint = JSON.parse(jsonMatch[0]);
        console.log('✅ Blueprint gerado:', blueprint.title);
      } catch (e) {
        console.error('❌ Erro no parsing do blueprint:', blueprintRaw);
        throw new Error('A IA não conseguiu gerar uma estrutura válida. Tente novamente.');
      }

      setForgeStatus('writing');
      let finalContent = `<h1>${blueprint.title}</h1><p class="subtitle">${blueprint.subtitle}</p>`;

      const chapters = blueprint.chapters;
      const totalSteps = chapters.length;
      console.log(`📚 Iniciando escrita de ${totalSteps} capítulos...`);

      for (let i = 0; i < totalSteps; i++) {
        if (controller.signal.aborted) {
          throw new Error('Operação cancelada');
        }

        const chapter = chapters[i];
        const stepProgress = 30 + ((i / totalSteps) * 60);
        setForgeProgress(stepProgress);

        console.log(`✍️ Escrevendo capítulo ${i + 1}/${totalSteps}: ${chapter.title}`);

        const totalChars = fullText.length;
        const chunkSize = Math.max(15000, Math.floor((totalChars / totalSteps) * 1.5));
        const startPos = Math.max(0, Math.floor((i / totalSteps) * totalChars) - 3000);
        const chunk = fullText.substring(startPos, startPos + chunkSize);

        const chapterContent = await callOpenRouter([
          { role: 'system', content: 'Você é um Ghostwriter de elite. Responda apenas com HTML limpo.' },
          { role: 'user', content: GhostwriterPrompts.REWRITE_CHAPTER(chapter.title, chunk, JSON.stringify(blueprint)) }
        ], { apiKey, timeout: 120000 }); // 2 minutos por capítulo

        finalContent += `<div class="chapter-break"></div>${chapterContent}`;
        console.log(`✅ Capítulo ${i + 1} concluído`);
      }

      const newId = `ebook_forge_${Date.now()}`;
      const newProject: EbookProject = {
        id: newId,
        title: blueprint.title,
        content: finalContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newId);
      setForgeStatus('finished');
      setForgeProgress(100);
      console.log('🎉 Ebook forjado com sucesso!');

    } catch (err: any) {
      if (err.message === 'Operação cancelada') {
        console.log('🛑 Operação cancelada pelo usuário');
        return;
      }

      console.error('❌ Erro na forja:', err);
      setForgeStatus('error');
      setForgeError(err.message || 'Ocorreu um erro inesperado na forja.');
    } finally {
      setForgeAbortController(null);
    }
  }, [apiKey]);

  const forgeEbookFromText = useCallback(async (text: string) => {
    if (!apiKey) {
      setForgeError('Por favor, configure sua chave do OpenRouter primeiro.');
      return;
    }

    setForgeStatus('parsing');
    setForgeProgress(10);

    const fullText = extractTextFromHtml(text);
    await runForge(fullText);
  }, [apiKey, runForge]);

  /**
   * O Motor de Forja: Orquestra o processo de IA
   */
  const forgeEbook = async (file: File) => {
    if (!apiKey) {
      setForgeError('Por favor, configure sua chave do OpenRouter primeiro.');
      return;
    }

    try {
      setForgeStatus('parsing');
      setForgeProgress(10);
      
      // 1. Extrair Texto do PDF
      const { fullText } = await extractTextFromPdf(file);
      
      setForgeStatus('thinking');
      setForgeProgress(30);

      // 2. Criar Blueprint (Estrutura) via IA
      const blueprintRaw = await callOpenRouter(
        [{ role: 'user', content: GhostwriterPrompts.CREATE_BLUEPRINT(fullText) }],
        { apiKey }
      );
      
      // Extrair JSON do retorno (limpar possíveis textos extras de forma robusta)
      let blueprint;
      try {
        const jsonMatch = blueprintRaw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Formato de resposta inválido');
        blueprint = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Erro no parsing do blueprint:', blueprintRaw);
        throw new Error('A IA não conseguiu gerar uma estrutura válida. Tente novamente.');
      }

      setForgeStatus('writing');
      let finalContent = `<h1>${blueprint.title}</h1><p class="subtitle">${blueprint.subtitle}</p>`;
      
      // 3. Gerar Capítulos um por um
      const chapters = blueprint.chapters;
      const totalSteps = chapters.length;
      
      for (let i = 0; i < totalSteps; i++) {
        const chapter = chapters[i];
        const stepProgress = 30 + ((i / totalSteps) * 60);
        setForgeProgress(stepProgress);

        // Busca de Contexto Inteligente: Janela deslizante proporcional ao progresso do livro
        const totalChars = fullText.length;
        const chunkSize = Math.max(15000, Math.floor(totalChars / totalSteps * 1.5));
        const startPos = Math.max(0, Math.floor((i / totalSteps) * totalChars) - 3000);
        const chunk = fullText.substring(startPos, startPos + chunkSize);

        const chapterContent = await callOpenRouter([
          { role: 'system', content: 'Você é um Ghostwriter de elite. Responda apenas com HTML limpo.' },
          { role: 'user', content: GhostwriterPrompts.REWRITE_CHAPTER(chapter.title, chunk, JSON.stringify(blueprint)) }
        ], { apiKey });

        finalContent += `<div class="chapter-break"></div>${chapterContent}`;
      }

      // 4. Salvar como Novo Projeto
      const newId = `ebook_forge_${Date.now()}`;
      const newProject: EbookProject = {
        id: newId,
        title: blueprint.title,
        content: finalContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newId);
      setForgeStatus('finished');
      setForgeProgress(100);

    } catch (err: any) {
      console.error(err);
      setForgeStatus('error');
      setForgeError(err.message || 'Ocorreu um erro inesperado na forja.');
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) ?? projects[0] ?? null;

  return (
    <EbookContext.Provider value={{
      projects,
      activeProjectId: activeProject?.id ?? null,
      activeProject,
      activeTheme,
      apiKey,
      forgeStatus,
      forgeProgress,
      forgeError,
      setApiKey,
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

