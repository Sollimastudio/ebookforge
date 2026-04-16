import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Upload, Download, AlertCircle, BookOpen } from 'lucide-react';
import { useEbook, type EbookProject } from '../../context/EbookContext';
import { extractTextFromPdf } from '../../utils/pdfProcessor';
import { exportProjectToFile, exportProjectsToFile, importProjectFromFile, importBackupFile } from '../../utils/projectIO';

export const HomePanel: React.FC = () => {
  const {
    projects,
    activeProjectId,
    createProject,
    deleteProject,
    renameProject,
    setActiveProjectId,
    forgeEbookFromText,
    forgeStatus,
    cancelForge,
    apiKey,
    importSingleProject,
    importMultipleProjects,
  } = useEbook();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const importFileRef = React.useRef<HTMLInputElement>(null);
  const importBackupFileRef = React.useRef<HTMLInputElement>(null);
  const pdfUploadRef = React.useRef<HTMLInputElement>(null);

  const handleNewProject = () => {
    createProject(`Ebook ${projects.length + 1}`);
  };

  const startRename = (p: EbookProject) => {
    setRenamingId(p.id);
    setRenameValue(p.title);
  };

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      renameProject(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') setRenamingId(null);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const handlePdfUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor, envie um arquivo PDF válido.');
      return;
    }

    try {
      const { fullText } = await extractTextFromPdf(file);
      createProject(`Ebook de ${file.name.replace('.pdf', '')}`);
      // Forge the ebook from the PDF text
      forgeEbookFromText(fullText);
    } catch (err) {
      alert(`Erro ao processar PDF: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    }
  };

  const onPdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePdfUpload(file);
  };

  const onPdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfUpload(file);
  };

  const handleImportProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = await importProjectFromFile(file);
      importSingleProject(project);
      alert(`✅ Projeto "${project.title}" importado com sucesso!`);
    } catch (err) {
      alert(`❌ Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedProjects = await importBackupFile(file);
      importMultipleProjects(importedProjects);
      alert(`✅ ${importedProjects.length} projetos importados do backup!`);
    } catch (err) {
      alert(`❌ Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleExportCurrent = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
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

  return (
    <div className="home-panel">
      {/* PDF Upload Section */}
      <div className="home-section">
        <h2 className="section-title">Criar Ebook a partir de PDF</h2>
        <div
          className={`pdf-upload-zone ${isDraggingPdf ? 'dragging' : ''} ${forgeStatus !== 'idle' ? 'processing' : ''} ${!apiKey ? 'warning' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (forgeStatus === 'idle') setIsDraggingPdf(true);
          }}
          onDragLeave={() => setIsDraggingPdf(false)}
          onDrop={onPdfDrop}
        >
          <div className="upload-content">
            {!apiKey ? (
              <>
                <AlertCircle size={32} className="upload-icon warning" />
                <h3>Configuração Necessária</h3>
                <p>Vá para <strong>Configurações</strong> e insira sua chave OpenRouter para usar a IA.</p>
              </>
            ) : (
              <>
                <Upload size={32} className={`upload-icon ${isDraggingPdf ? 'active' : ''}`} />
                <h3>{isDraggingPdf ? 'Solte o PDF aqui!' : 'Arraste seu PDF aqui'}</h3>
                <p>Ou clique para selecionar um arquivo</p>
                <button className="btn-upload-select" onClick={() => pdfUploadRef.current?.click()}>
                  Selecionar PDF
                </button>
              </>
            )}
          </div>
          <input
            ref={pdfUploadRef}
            type="file"
            accept=".pdf"
            onChange={onPdfFileSelect}
            style={{ display: 'none' }}
            disabled={forgeStatus !== 'idle' || !apiKey}
          />
        </div>

        {forgeStatus !== 'idle' && (
          <div className="forge-status">
            <div className="status-spinner"></div>
            <span className="status-text">
              {forgeStatus === 'parsing' && 'Lendo seu PDF...'}
              {forgeStatus === 'thinking' && 'IA criando estrutura...'}
              {forgeStatus === 'writing' && 'Escrevendo capítulos...'}
              {forgeStatus === 'finished' && 'Concluído!'}
              {forgeStatus === 'error' && 'Erro na forja'}
            </span>
            {forgeStatus !== 'finished' && forgeStatus !== 'error' && (
              <button className="btn-cancel-forge" onClick={cancelForge}>
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div className="home-section">
        <div className="section-header">
          <h2 className="section-title">Meus Ebooks ({projects.length})</h2>
          <button className="btn-new-project" onClick={handleNewProject}>
            <Plus size={16} />
            Novo Ebook
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} className="empty-icon" />
            <p>Nenhum ebook ainda. Crie um novo ou importe um existente.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => (
              <div
                key={p.id}
                className={`project-card ${p.id === activeProjectId ? 'active' : ''}`}
                onClick={() => p.id !== renamingId && setActiveProjectId(p.id)}
              >
                {renamingId === p.id ? (
                  <div className="rename-form" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      className="rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <div className="rename-actions">
                      <button className="icon-btn green" onClick={confirmRename} title="Confirmar">
                        <Check size={14} />
                      </button>
                      <button className="icon-btn red" onClick={() => setRenamingId(null)} title="Cancelar">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="project-card-header">
                      <h3 className="project-card-title">{p.title}</h3>
                      <span className="project-card-date">{formatDate(p.updatedAt)}</span>
                    </div>
                    <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="icon-btn"
                        onClick={() => startRename(p)}
                        title="Renomear"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          if (window.confirm(`Excluir "${p.title}"?`)) deleteProject(p.id);
                        }}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import/Export Section */}
      <div className="home-section">
        <h2 className="section-title">Importar & Exportar</h2>
        <div className="io-buttons">
          <button
            className="btn-io"
            onClick={() => importFileRef.current?.click()}
            title="Importar um projeto"
          >
            <Upload size={16} />
            Importar Projeto
          </button>
          <button
            className="btn-io"
            onClick={() => importBackupFileRef.current?.click()}
            title="Importar backup"
          >
            <Upload size={16} />
            Importar Backup
          </button>
          <button
            className="btn-io"
            onClick={handleExportCurrent}
            disabled={!activeProjectId}
            title="Exportar projeto atual"
          >
            <Download size={16} />
            Exportar Este
          </button>
          <button
            className="btn-io"
            onClick={handleExportAll}
            disabled={projects.length === 0}
            title="Fazer backup de todos"
          >
            <Download size={16} />
            Backup Completo
          </button>
        </div>
      </div>

      {/* Hidden Inputs */}
      <input
        ref={importFileRef}
        type="file"
        accept=".ebookforge,.json"
        onChange={handleImportProject}
        style={{ display: 'none' }}
      />
      <input
        ref={importBackupFileRef}
        type="file"
        accept=".json"
        onChange={handleImportBackup}
        style={{ display: 'none' }}
      />
    </div>
  );
};
