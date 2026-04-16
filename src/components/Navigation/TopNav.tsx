import React from 'react';
import { BookOpen, Plus, Settings, FileText, Eye } from 'lucide-react';
import { useEbook } from '../../context/EbookContext';

export type NavTab = 'home' | 'editor' | 'preview' | 'settings';

interface TopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onTabChange }) => {
  const { projects, activeProjectId, createProject } = useEbook();
  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleNewProject = () => {
    createProject(`Ebook ${projects.length + 1}`);
  };

  return (
    <nav className="top-nav">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <div className="logo-icon-small">
            <BookOpen size={18} />
          </div>
          <span className="logo-text">EbookForge</span>
        </div>

        {/* Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
            title="Página inicial e gerenciamento de projetos"
          >
            <BookOpen size={16} />
            <span>Início</span>
          </button>

          {activeProject && (
            <>
              <button
                className={`nav-tab ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => onTabChange('editor')}
                title="Editor de texto"
              >
                <FileText size={16} />
                <span>Editar</span>
              </button>

              <button
                className={`nav-tab ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => onTabChange('preview')}
                title="Visualizar ebook"
              >
                <Eye size={16} />
                <span>Visualizar</span>
              </button>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          <button
            className="btn-nav-action primary"
            onClick={handleNewProject}
            title="Criar novo ebook"
          >
            <Plus size={16} />
            <span>Novo</span>
          </button>

          <button
            className={`btn-nav-action ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
            title="Configurações"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};
