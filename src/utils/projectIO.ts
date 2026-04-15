import type { EbookProject } from '../context/EbookContext';

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
 * Importa um projeto a partir de um arquivo JSON
 */
export const importProjectFromFile = async (file: File): Promise<EbookProject> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validar se é um projeto único
        if (data.id && data.title && data.content !== undefined) {
          const project: EbookProject = {
            id: `imported_${Date.now()}`,
            title: data.title,
            content: data.content,
            createdAt: data.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
          resolve(project);
        }
        // Ou se é um backup com múltiplos projetos
        else if (Array.isArray(data.projects)) {
          reject(new Error('Arquivo contém múltiplos projetos. Use "Importar Backup" para carregar todos.'));
        } else {
          reject(new Error('Formato de arquivo inválido.'));
        }
      } catch (err) {
        reject(new Error('Erro ao ler o arquivo: ' + (err instanceof Error ? err.message : 'desconhecido')));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo.'));
    };

    reader.readAsText(file);
  });
};

/**
 * Importa múltiplos projetos a partir de um arquivo JSON
 */
export const importBackupFile = async (file: File): Promise<EbookProject[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (Array.isArray(data.projects)) {
          const importedProjects = data.projects.map((p: any) => ({
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: p.title,
            content: p.content,
            createdAt: p.createdAt || Date.now(),
            updatedAt: Date.now(),
          }));
          resolve(importedProjects);
        } else {
          reject(new Error('Arquivo de backup inválido.'));
        }
      } catch (err) {
        reject(new Error('Erro ao ler o backup: ' + (err instanceof Error ? err.message : 'desconhecido')));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo.'));
    };

    reader.readAsText(file);
  });
};
