import { useState, useRef } from 'react';
import { useEbook, type Theme, type EbookProject } from '../../context/EbookContext';
import type { AppView } from '../../App';
import { exportProjectToFile, exportProjectsToFile, importProjectFromFile, importBackupFile } from '../../utils/projectIO';
import {
  BookOpen, Plus, Trash2, Pencil, Check, X,
  Palette, Sun, Moon, Sparkles, Sunset,
  Download, ChevronRight, Key, LayoutDashboard, Upload,
  TreePine, Waves, Heart, Star, Flame, Crown, Cloud, Megaphone, Loader2
} from 'lucide-react';

const THEMES: { id: Theme; label: string; icon: React.ReactNode; preview: string }[] = [
  { id: 'obsidian-noir', label: 'Obsidian Noir', icon: <Moon size={14} />, preview: '#0d0f12' },
  { id: 'arctic-white', label: 'Arctic White', icon: <Sun size={14} />, preview: '#f8f9fa' },
  { id: 'royal-purple', label: 'Royal Purple', icon: <Sparkles size={14} />, preview: '#1a0533' },
  { id: 'sunset-warm', label: 'Sunset Warm', icon: <Sunset size={14} />, preview: '#1c1209' },
  { id: 'forest-green', label: 'Forest Green', icon: <TreePine size={14} />, preview: '#0a1a0f' },
  { id: 'ocean-blue', label: 'Ocean Blue', icon: <Waves size={14} />, preview: '#0a1625' },
  { id: 'rose-pink', label: 'Rose Pink', icon: <Heart size={14} />, preview: '#250a1a' },
  { id: 'midnight-blue', label: 'Midnight Blue', icon: <Star size={14} />, preview: '#0a0f1c' },
  { id: 'crimson-red', label: 'Crimson Red', icon: <Flame size={14} />, preview: '#1a0a0a' },
  { id: 'amber-gold', label: 'Amber Gold', icon: <Crown size={14} />, preview: '#1a1500' },
  { id: 'slate-gray', label: 'Slate Gray', icon: <Cloud size={14} />, preview: '#0f172a' },
];

interface SidebarProps {
  onExportPDF: () => void;
  onExportHTML: () => void;
  currentView: AppView;
  onNavigate: (view: AppView, projectId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const {
    projects, activeProjectId, activeProject,
    createProject, deleteProject, renameProject,
    activeTheme, setActiveTheme,
    apiKey, openRouterApiKeyEffective, setApiKey, cancelForge,
    importSingleProject, importMultipleProjects,
    selectedEngine, setSelectedEngine,
    openaiKey, setOpenaiKey,
    replicateKey, setReplicateKey,
    anthropicKey, setAnthropicKey,
    generateImages, setGenerateImages,
  } = useEbook();
  const [showPremiumApis, setShowPremiumApis] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showThemes, setShowThemes] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const importBackupFileRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    const p = createProject(`Ebook ${projects.length + 1}`);
    onNavigate('editor', p.id);
  };

  const handleGoForge = () => {
    onNavigate('forge');
  };

  const handleGoMarketing = () => {
    onNavigate('marketing');
  };

  const handleImportProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      setImportProgress('📂 Lendo arquivo...');
      
      // Tentar importação com IA se API key disponível
      const project = await importProjectFromFile(file, apiKey, (message) => {
        setImportProgress(message);
      });
      
      setImportProgress('✅ Concluído!');
      importSingleProject(project);
      
      setTimeout(() => {
        const format = file.name.split('.').pop()?.toUpperCase() || 'arquivo';
        const isNative = file.name.endsWith('.json') || file.name.endsWith('.ebookforge');
        const conversionNote = isNative ? '' : '\n🤖 Convertido com IA (Qualidade Premium)';
        alert(`✅ Projeto "${project.title}" importado com sucesso!\n(Formato: ${format})${conversionNote}`);
        setIsImporting(false);
        onNavigate('editor', project.id);
      }, 500);
    } catch (err) {
      setIsImporting(false);
      const errorMsg = err instanceof Error ? err.message : 'Desconhecido';
      
      // Se erro mencionado chave API, oferecer setting
      if (errorMsg.includes('OpenRouter')) {
        const shouldConfigure = confirm(
          `❌ ${errorMsg}\n\nDeseja configurar a chave OpenRouter agora para suportar conversão automática de PDF, DOCX, EPUB, TXT e MD?`
        );
        if (shouldConfigure) {
          setShowApiInput(true);
        }
      } else {
        alert(`❌ Erro: ${errorMsg}`);
      }
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
    if (!activeProject) {
      alert('Nenhum projeto ativo para exportar.');
      return;
    }
    exportProjectToFile(activeProject);
  };

  const handleExportAllProjects = () => {
    if (projects.length === 0) {
      alert('Nenhum projeto para exportar.');
      return;
    }
    exportProjectsToFile(projects);
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
          className={`btn-sidebar-nav ${currentView === 'forge' ? 'active' : ''}`}
          onClick={handleGoForge}
          title="Colar texto ou arquivo do manuscrito; a IA gera o ebook completo"
        >
          <LayoutDashboard size={14} />
          <span className="btn-sidebar-nav-title">Criar com IA</span>
          <span className="btn-sidebar-nav-desc">Manuscrito (PDF, DOCX, EPUB...) → ebook novo</span>
        </button>
        <button
          className="btn-sidebar-nav"
          onClick={handleNew}
          title="Página em branco para escrever ou colar à mão, sem gerar capítulos por IA"
        >
          <Plus size={14} />
          <span className="btn-sidebar-nav-title">Projeto vazio</span>
          <span className="btn-sidebar-nav-desc">Editor manual — não é o passo da IA</span>
        </button>
        <button
          className={`btn-sidebar-nav ${currentView === 'marketing' ? 'active' : ''}`}
          onClick={handleGoMarketing}
          title="Gerar copy de vendas, carrosséis, emails e posts para o ebook ativo"
        >
          <Megaphone size={14} />
          <span className="btn-sidebar-nav-title">Kit de Marketing</span>
          <span className="btn-sidebar-nav-desc">Copy, carrossel, email e posts prontos</span>
        </button>
      </div>

      {/* Projects Section */}
      <div className="sidebar-section-label">
        📚 Meus Ebooks Salvos ({projects.length})
        <div className="section-hint">Clique para editar • Arquivos para IA: use «Criar com IA»</div>
      </div>

      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-projects">
            <div className="empty-icon">📚</div>
            <div className="empty-title">Nenhum ebook ainda</div>
            <div className="empty-desc">
              Clique em «Criar com IA» e envie o arquivo ou cole o texto do manuscrito.
            </div>
          </div>
        ) : (
          projects.map(p => (
            <div
              key={p.id}
              className={`project-item ${p.id === activeProjectId && currentView === 'editor' ? 'active' : ''}`}
              onClick={() => p.id !== renamingId && onNavigate('editor', p.id)}
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
                      className="icon-btn red"
                      title="Excluir"
                      onClick={() => confirm(`Excluir "${p.title}"?`) && deleteProject(p.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-grid">
          <button className="footer-btn" onClick={() => importFileRef.current?.click()} title="Importar .ebookforge ou converter PDF/DOCX/EPUB">
            <Upload size={14} />
            <span>Importar</span>
          </button>
          <button className="footer-btn" onClick={handleExportCurrent} title="Exportar projeto ativo como .ebookforge">
            <Download size={14} />
            <span>Exportar</span>
          </button>
          <button className="footer-btn" onClick={() => setShowThemes(!showThemes)}>
            <Palette size={14} />
            <span>Temas</span>
          </button>
          <button className="footer-btn" onClick={() => setShowApiInput(!showApiInput)}>
            <Key size={14} />
            <span>API Key</span>
          </button>
        </div>

        {/* Hidden Inputs */}
        <input
          type="file"
          ref={importFileRef}
          className="hidden"
          accept=".ebookforge,.json,.txt,.md,.markdown,.pdf,.docx,.epub,.rtf,.odt"
          onChange={handleImportProject}
        />
        <input
          type="file"
          ref={importBackupFileRef}
          className="hidden"
          accept=".json"
          onChange={handleImportBackup}
        />

        {/* Theme Selector Overlay */}
        {showThemes && (
          <div className="sidebar-overlay themes-overlay">
            <div className="overlay-header">
              <span>Temas do Editor</span>
              <button onClick={() => setShowThemes(false)}><X size={14} /></button>
            </div>
            <div className="themes-grid">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`theme-btn ${activeTheme === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTheme(t.id)}
                  title={t.label}
                >
                  <div className="theme-preview" style={{ background: t.preview }}>
                    {t.icon}
                  </div>
                  <span className="theme-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* API Key Overlay */}
        {showApiInput && (
          <div className="sidebar-overlay api-overlay">
            <div className="overlay-header">
              <span>Configurações de IA</span>
              <button onClick={() => setShowApiInput(false)}><X size={14} /></button>
            </div>
            <div className="api-form">
              <div className="api-field">
                <label>OpenRouter API Key</label>
                <div className="api-input-wrapper">
                  <input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                  />
                  {openRouterApiKeyEffective && <Check size={14} className="api-check" />}
                </div>
                <p className="api-hint">Usada para conversão de arquivos e Ghostwriting.</p>
              </div>

              <div className="api-field">
                <label>Motor de IA</label>
                <select 
                  value={selectedEngine} 
                  onChange={(e) => setSelectedEngine(e.target.value as any)}
                  className="api-select"
                >
                  <option value="openrouter">OpenRouter (Nuvem)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              <button className="premium-toggle" onClick={() => setShowPremiumApis(!showPremiumApis)}>
                {showPremiumApis ? 'Ocultar APIs Premium' : 'Mostrar APIs de Imagem/Anthropic'}
              </button>

              {showPremiumApis && (
                <div className="premium-apis">
                  <div className="api-field">
                    <label>OpenAI Key (DALL-E 3)</label>
                    <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." />
                  </div>
                  <div className="api-field">
                    <label>Replicate Key (Flux/SDXL)</label>
                    <input type="password" value={replicateKey} onChange={e => setReplicateKey(e.target.value)} placeholder="r8_..." />
                  </div>
                  <div className="api-field">
                    <label>Anthropic Key (Claude 3)</label>
                    <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." />
                  </div>
                  
                  <div className="api-field-row">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={generateImages} onChange={e => setGenerateImages(e.target.checked)} />
                      <span>Gerar capas com IA</span>
                    </label>
                  </div>
                </div>
              )}

              <button className="btn-backup" onClick={() => importBackupFileRef.current?.click()}>
                <Upload size={12} /> Importar Backup (.json)
              </button>
              <button className="btn-backup" onClick={handleExportAllProjects}>
                <Download size={12} /> Exportar Backup (.json)
              </button>
            </div>
          </div>
        )}

        {/* Import Progress Overlay */}
        {isImporting && (
          <div className="sidebar-overlay progress-overlay">
            <div className="progress-content">
              <Loader2 size={24} className="animate-spin" />
              <p>{importProgress}</p>
              <button className="btn-cancel-small" onClick={cancelForge}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
