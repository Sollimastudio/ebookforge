import { useState, useRef } from 'react';
import { useEbook, type Theme, type EbookProject } from '../../context/EbookContext';
import {
  BookOpen, Plus, Trash2, Pencil, Check, X,
  Palette, Sun, Moon, Sparkles, Sunset,
  Download, FileText, ChevronRight, Key, LayoutDashboard, AlertCircle
} from 'lucide-react';

const THEMES: { id: Theme; label: string; icon: React.ReactNode; preview: string }[] = [
  { id: 'obsidian-noir', label: 'Obsidian Noir', icon: <Moon size={14} />, preview: '#0d0f12' },
  { id: 'arctic-white', label: 'Arctic White', icon: <Sun size={14} />, preview: '#f8f9fa' },
  { id: 'royal-purple', label: 'Royal Purple', icon: <Sparkles size={14} />, preview: '#1a0533' },
  { id: 'sunset-warm', label: 'Sunset Warm', icon: <Sunset size={14} />, preview: '#1c1209' },
];

interface SidebarProps {
  onExportPDF: () => void;
  onExportHTML: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onExportPDF, onExportHTML }) => {
  const { 
    projects, activeProjectId, activeProject, setActiveProjectId, 
    createProject, deleteProject, renameProject, 
    activeTheme, setActiveTheme,
    apiKey, setApiKey, forgeEbookFromText, forgeStatus, cancelForge 
  } = useEbook();
  
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const handleForge = () => {
    if (!activeProject) return;
    forgeEbookFromText(activeProject.content);
  };
  const [renameValue, setRenameValue] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    createProject(`Ebook ${projects.length + 1}`);
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
    return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <BookOpen size={20} />
        </div>
        <div>
          <div className="logo-title">Ebook<span className="logo-accent">Forge</span></div>
          <div className="logo-sub">Pro Editor Studio</div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="sidebar-main-actions">
        <button 
          className={`btn-sidebar-nav ${!activeProjectId ? 'active' : ''}`} 
          onClick={() => setActiveProjectId('')}
        >
          <LayoutDashboard size={14} />
          <span>Painel de Forja</span>
        </button>
        <button className="btn-sidebar-nav" onClick={handleNew}>
          <Plus size={14} />
          <span>Novo Ebook</span>
        </button>
      </div>

      {/* Projects Section */}
      <div className="sidebar-section-label">Meus Ebooks ({projects.length})</div>

      <div className="projects-list">
        {projects.map(p => (
          <div
            key={p.id}
            className={`project-item ${p.id === activeProjectId ? 'active' : ''}`}
            onClick={() => p.id !== renamingId && setActiveProjectId(p.id)}
          >
            {p.id === activeProjectId && <span className="project-active-bar" />}

            {renamingId === p.id ? (
              <div className="rename-row" onClick={e => e.stopPropagation()}>
                <input
                  ref={renameInputRef}
                  className="rename-input"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="icon-btn green" onClick={confirmRename}><Check size={13} /></button>
                <button className="icon-btn red" onClick={() => setRenamingId(null)}><X size={13} /></button>
              </div>
            ) : (
              <>
                <div className="project-info">
                  <div className="project-title">
                    {p.id === activeProjectId && <ChevronRight size={12} className="chevron" />}
                    {p.title}
                  </div>
                  <div className="project-date">{formatDate(p.updatedAt)}</div>
                </div>
                <div className="project-actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" title="Renomear" onClick={() => startRename(p)}>
                    <Pencil size={12} />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Excluir"
                    onClick={() => {
                      if (window.confirm(`Excluir "${p.title}"?`)) deleteProject(p.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Settings Section */}
      <div className="sidebar-divider" />
      
      <div className="sidebar-section-label">
        <Key size={12} /> Configurações
      </div>
      
      <div className="api-key-section">
        <button 
          className={`api-toggle ${apiKey ? 'has-key' : 'needs-key'}`} 
          onClick={() => setShowApiInput(!showApiInput)}
        >
          {apiKey ? (
            <><Check size={14} /> API Key Configurada</>
          ) : (
            <><AlertCircle size={14} className="animate-pulse" /> Configurar Chave OpenRouter</>
          )}
        </button>
        {showApiInput && (
          <div className="api-input-wrap">
            <input 
              type="password" 
              placeholder="Sua chave OpenRouter..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="api-input"
            />
            <p className="api-hint">A chave fica salva localmente no seu MacBook.</p>
          </div>
        )}
      </div>

      {/* Themes */}
      <div className="sidebar-section-label">
        <Palette size={12} /> Tema
        <button className="theme-toggle-btn" onClick={() => setShowThemes(!showThemes)}>
          {showThemes ? 'Fechar' : 'Trocar'}
        </button>
      </div>

      {showThemes && (
        <div className="themes-grid">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`theme-btn ${activeTheme === t.id ? 'active' : ''}`}
              onClick={() => setActiveTheme(t.id)}
              title={t.label}
            >
              <span className="theme-preview" style={{ background: t.preview }} />
              <span className="theme-icon">{t.icon}</span>
              <span className="theme-label">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Export */}
      <div className="sidebar-section-label"><Download size={12} /> Exportar</div>
      <div className="export-btns">
        <button className="btn-export" onClick={handleForge} disabled={!activeProjectId || !apiKey || forgeStatus !== 'idle'}>
          <Sparkles size={14} />
          <span>Forjar Ebook</span>
        </button>
        {forgeStatus !== 'idle' && (
          <button className="btn-export cancel" onClick={cancelForge}>
            <X size={14} />
            <span>Cancelar</span>
          </button>
        )}
        <button className="btn-export" onClick={onExportPDF} disabled={!activeProjectId}>
          <FileText size={14} />
          <span>PDF</span>
        </button>
        <button className="btn-export" onClick={onExportHTML} disabled={!activeProjectId}>
          <FileText size={14} />
          <span>HTML</span>
        </button>
      </div>
    </aside>
  );
};

