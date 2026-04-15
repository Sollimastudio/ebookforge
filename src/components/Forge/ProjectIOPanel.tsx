import React, { useRef } from 'react';
import { Upload, FileText, Archive } from 'lucide-react';
import { useEbook } from '../../context/EbookContext';
import { exportProjectToFile, exportProjectsToFile } from '../../utils/projectIO';

interface ProjectIOPanelProps {
  onClose?: () => void;
}

export const ProjectIOPanel: React.FC<ProjectIOPanelProps> = ({ onClose }) => {
  const { activeProject, projects, importSingleProject, importMultipleProjects } = useEbook();

  const importProjectRef = useRef<HTMLInputElement>(null);
  const importBackupRef = useRef<HTMLInputElement>(null);

  const handleExportCurrent = () => {
    if (!activeProject) {
      alert('Nenhum projeto ativo para exportar.');
      return;
    }
    exportProjectToFile(activeProject);
  };

  const handleExportAll = () => {
    if (projects.length === 0) {
      alert('Nenhum projeto para exportar.');
      return;
    }
    exportProjectsToFile(projects);
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        importSingleProject(projectData);
        alert('Projeto importado com sucesso!');
        onClose?.();
      } catch (error) {
        console.error('Erro ao importar projeto:', error);
        alert('Erro ao importar projeto. Verifique se o arquivo é válido.');
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        if (!Array.isArray(backupData)) {
          throw new Error('Formato de backup inválido');
        }
        importMultipleProjects(backupData);
        alert(`${backupData.length} projeto(s) importado(s) com sucesso!`);
        onClose?.();
      } catch (error) {
        console.error('Erro ao importar backup:', error);
        alert('Erro ao importar backup. Verifique se o arquivo é válido.');
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="project-io-panel">
      <div className="io-header">
        <h3 className="io-title">Importar & Sincronizar</h3>
        <p className="io-subtitle">Gerencie seus projetos de ebook</p>
      </div>

      <div className="io-section">
        <h4 className="io-section-title">Exportar</h4>
        <div className="io-actions">
          <button
            onClick={handleExportCurrent}
            className="io-btn export-btn"
            disabled={!activeProject}
            title="Exportar apenas o projeto atual"
          >
            <FileText size={16} />
            <span>Exportar Este</span>
            <small>.ebookforge</small>
          </button>

          <button
            onClick={handleExportAll}
            className="io-btn export-btn"
            title="Exportar todos os projetos como backup"
          >
            <Archive size={16} />
            <span>Backup Completo</span>
            <small>.json</small>
          </button>
        </div>
      </div>

      <div className="io-section">
        <h4 className="io-section-title">Importar</h4>
        <div className="io-actions">
          <button
            onClick={() => importProjectRef.current?.click()}
            className="io-btn import-btn"
            title="Importar um projeto individual"
          >
            <Upload size={16} />
            <span>Importar Projeto</span>
            <small>.ebookforge</small>
          </button>

          <button
            onClick={() => importBackupRef.current?.click()}
            className="io-btn import-btn"
            title="Importar backup com múltiplos projetos"
          >
            <Upload size={16} />
            <span>Importar Backup</span>
            <small>.json</small>
          </button>
        </div>
      </div>

      <div className="io-info">
        <div className="info-item">
          <strong>Projeto Individual (.ebookforge)</strong>
          <p>Arquivo JSON contendo um único ebook com título e conteúdo.</p>
        </div>
        <div className="info-item">
          <strong>Backup Completo (.json)</strong>
          <p>Arquivo JSON contendo array de todos os seus ebooks salvos.</p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={importProjectRef}
        type="file"
        accept=".ebookforge"
        onChange={handleImportProject}
        style={{ display: 'none' }}
      />
      <input
        ref={importBackupRef}
        type="file"
        accept=".json"
        onChange={handleImportBackup}
        style={{ display: 'none' }}
      />
    </div>
  );
};