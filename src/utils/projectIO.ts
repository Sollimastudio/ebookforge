import type { EbookProject } from '../context/EbookContext';
import { convertDocumentToHtml, isValidProjectJson, extractFileTitle } from '../services/documentConverter';
import { resolveOpenRouterApiKey } from '../config/env';

/**
 * Exporta um projeto como arquivo JSON
 */
export const exportProjectToFile = (project: EbookProject): void => {
  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/\s+/g, '_')}_${Date.now()}.ebookforge`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Exporta múltiplos projetos como arquivo ZIP
 */
export const exportProjectsToFile = (projects: EbookProject[]): void => {
  const allProjects = { projects, exportedAt: new Date().toISOString() };
  const jsonString = JSON.stringify(allProjects, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ebookforge_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Importa um projeto a partir de um arquivo (JSON, TXT, MD, PDF)
 * Se for JSON válido, carrega direto. Se não, tenta conversão via IA (VITE_OPENROUTER_API_KEY ou chave manual).
 */
export const importProjectFromFile = async (
  file: File,
  apiKey?: string,
  onProgress?: (message: string) => void
): Promise<EbookProject> => {
  // Primeiro, tentar ler como texto
  const fileContent = await file.text();

  // Se é JSON válido, processar como antes
  if (isValidProjectJson(fileContent)) {
    try {
      onProgress?.('📂 Carregando JSON...');
      const data = JSON.parse(fileContent);
      const project: EbookProject = {
        id: `imported_${Date.now()}`,
        title: data.title,
        content: data.content,
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      onProgress?.('✅ JSON carregado!');
      return project;
    } catch (err) {
      throw new Error('Erro ao processar arquivo JSON: ' + (err instanceof Error ? err.message : 'desconhecido'));
    }
  }

  // Não é JSON válido. Tentar conversão via IA (VITE_OPENROUTER_API_KEY ou chave manual)
  const openRouterKey = resolveOpenRouterApiKey(apiKey);
  if (!openRouterKey) {
    throw new Error(
      'Arquivo não é JSON válido. Defina VITE_OPENROUTER_API_KEY no .env ou configure a chave OpenRouter nas configurações para converter automaticamente Markdown, TXT ou PDF.'
    );
  }

  try {
    // Converter usando IA
    const htmlContent = await convertDocumentToHtml(file, openRouterKey, onProgress);

    if (htmlContent === 'JSON_VALID') {
      // Nunca vai chegar aqui porque já validamos JSON acima
      throw new Error('JSON inválido detectado');
    }

    const title = extractFileTitle(file.name);
    const project: EbookProject = {
      id: `imported_${Date.now()}`,
      title,
      content: htmlContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onProgress?.('✅ Documento convertido!');
    return project;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Desconhecido';
    throw new Error(`Erro ao converter documento: ${message}`);
  }
};

/**
 * Importa múltiplos projetos a partir de um arquivo de backup
 */
export const importBackupFile = async (file: File): Promise<EbookProject[]> => {
  const fileContent = await file.text();

  try {
    const data = JSON.parse(fileContent);

    if (Array.isArray(data.projects)) {
      const importedProjects = data.projects.map((p: any) => ({
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: p.title,
        content: p.content,
        createdAt: p.createdAt || Date.now(),
        updatedAt: Date.now(),
      }));
      return importedProjects;
    } else {
      throw new Error('Arquivo de backup inválido.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'desconhecido';
    throw new Error(`Erro ao ler o backup: ${message}`);
  }
};
