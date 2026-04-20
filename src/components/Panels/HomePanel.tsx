import React, { useState, useRef } from 'react';
import { 
  Plus, Upload, FileText, Sparkles, 
  ChevronRight, Trash2, Pencil, Check, X,
  Download, BookOpen, LayoutDashboard, Megaphone,
  Loader2
} from 'lucide-react';
import { useEbook, type EbookProject } from '../../context/EbookContext';
import { importProjectFromFile, exportProjectToFile } from '../../utils/projectIO';

export const HomePanel: React.FC = () => {
  const { 
    projects, activeProjectId, createProject, deleteProject, renameProject,
    apiKey, importSingleProject, cancelForge, setActiveProjectId
  } = useEbook();
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    createProject(`Ebook ${projects.length + 1}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      setImportProgress('📂 Lendo arquivo...');
      
      const project = await importProjectFromFile(file, apiKey, (message) => {
        setImportProgress(message);
      });
      
      setImportProgress('✅ Concluído!');
      importSingleProject(project);
      
      setTimeout(() => {
        setIsImporting(false);
        setActiveProjectId(project.id);
      }, 500);
    } catch (err) {
      setIsImporting(false);
      alert(`❌ Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      e.target.value = '';
    }
  };

  const startRename = (p: EbookProject) => {
    setRenamingId(p.id);
    setRenameValue(p.title);
    setTimeout(() => renameInputRef.current?.focus(), 50);
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
    return new Date(ts).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: '2-digit'
    });
  };

  return (
    <div className="home-panel">
      <div className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>ESTÚDIO DE PUBLICAÇÃO PREMIUM</span>
          </div>
          <h1>Transforme seu manuscrito em um <span className="text-gradient">Ebook Best-Seller</span></h1>
          <p>
            A plataforma definitiva para autores que buscam qualidade editorial impecável, 
            diagramação automática e marketing estratégico em um só lugar.
          </p>
          
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => {}}>
              <LayoutDashboard size={18} />
              <span>Criar com IA</span>
            </button>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              <span>Importar Arquivo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.docx,.epub,.rtf,.txt,.md,.markdown,.odt,.ebookforge,.json"
              onChange={handleImport}
            />
          </div>
        </div>
        
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-icon"><FileText size={20} /></div>
            <div className="stat-info">
              <strong>Múltiplos Formatos</strong>
              <span>PDF, DOCX, EPUB, MD</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Sparkles size={20} /></div>
            <div className="stat-info">
              <strong>Ghostwriting IA</strong>
              <span>Qualidade Best-Seller</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Megaphone size={20} /></div>
            <div className="stat-info">
              <strong>Kit de Marketing</strong>
              <span>Copy e Redes Sociais</span>
            </div>
          </div>
        </div>
      </div>

      <div className="home-content-grid">
        <div className="projects-section">
          <div className="section-header">
            <h2><BookOpen size={20} /> Seus Projetos Recentes</h2>
            <button className="btn-text" onClick={handleNew}>
              <Plus size={16} /> Novo Projeto Vazio
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">📚</div>
              <h3>Nenhum ebook forjado ainda</h3>
              <p>Comece enviando seu manuscrito ou criando um projeto do zero.</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(p => (
                <div 
                  key={p.id} 
                  className={`project-card ${p.id === activeProjectId ? 'active' : ''}`}
                  onClick={() => setActiveProjectId(p.id)}
                >
                  <div className="project-card-header">
                    {renamingId === p.id ? (
                      <div className="rename-field" onClick={e => e.stopPropagation()}>
                        <input 
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <button onClick={confirmRename}><Check size={14} /></button>
                        <button onClick={() => setRenamingId(null)}><X size={14} /></button>
                      </div>
                    ) : (
                      <h3 title={p.title}>{p.title}</h3>
                    )}
                    <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                      <button onClick={() => startRename(p)} title="Renomear"><Pencil size={14} /></button>
                      <button onClick={() => exportProjectToFile(p)} title="Exportar"><Download size={14} /></button>
                      <button className="delete" onClick={() => confirm(`Excluir "${p.title}"?`) && deleteProject(p.id)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="project-card-footer">
                    <span className="date">{formatDate(p.updatedAt)}</span>
                    <ChevronRight size={16} className="arrow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isImporting && (
        <div className="import-overlay">
          <div className="import-modal">
            <Loader2 size={32} className="animate-spin" />
            <h3>Processando Documento</h3>
            <p>{importProgress}</p>
            <button className="btn-cancel" onClick={cancelForge}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};
