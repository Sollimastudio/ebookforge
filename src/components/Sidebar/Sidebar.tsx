import { useState, useRef } from 'react';
import { useEbook, type Theme, type EbookProject } from '../../context/EbookContext';
import type { AppView } from '../../App';
import { exportProjectToFile, exportProjectsToFile, importProjectFromFile, importBackupFile } from '../../utils/projectIO';
import {
  BookOpen, Plus, Trash2, Pencil, Check, X,
  Palette, Sun, Moon, Sparkles, Sunset,
  Download, FileText, ChevronRight, Key, LayoutDashboard, AlertCircle, Upload,
  TreePine, Waves, Heart, Star, Flame, Crown, Cloud
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

export const Sidebar: React.FC<SidebarProps> = ({ onExportPDF, onExportHTML, currentView, onNavigate }) => {
  const {
    projects, activeProjectId, activeProject,
    createProject, deleteProject, renameProject,
    activeTheme, setActiveTheme,
    apiKey, openRouterApiKeyEffective, setApiKey, forgeStatus, cancelForge,
    importSingleProject, importMultipleProjects,
    selectedEngine, setSelectedEngine,
    openaiKey, setOpenaiKey,
    replicateKey, setReplicateKey,
    anthropicKey, setAnthropicKey,
    imageProvider, setImageProvider,
    setImageModel,
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
        const conversionNote = file.name.endsWith('.json') || file.name.endsWith('.ebookforge') ? '' : '\n🤖 Convertido com IA';
        alert(`✅ Projeto "${project.title}" importado com sucesso!\n(Formato: ${format})${conversionNote}`);
        setIsImporting(false);
      }, 500);
    } catch (err) {
      setIsImporting(false);
      const errorMsg = err instanceof Error ? err.message : 'Desconhecido';
      
      // Se erro mencionado chave API, oferecer setting
      if (errorMsg.includes('OpenRouter')) {
        const shouldConfigure = confirm(
          `❌ ${errorMsg}\n\nDeseja configurar a chave OpenRouter agora para suportar conversão automática de TXT, MD e PDF?`
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
          title="Colar texto ou PDF do manuscrito; a IA gera o ebook completo"
        >
          <LayoutDashboard size={14} />
          <span className="btn-sidebar-nav-title">Criar com IA</span>
          <span className="btn-sidebar-nav-desc">Manuscrito (texto ou PDF) → ebook novo</span>
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
      </div>

      {/* Projects Section */}
      <div className="sidebar-section-label">
        📚 Meus Ebooks Salvos ({projects.length})
        <div className="section-hint">Clique para editar • PDF ou texto longo para IA: use «Criar com IA»</div>
      </div>

      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-projects">
            <div className="empty-icon">📚</div>
            <div className="empty-title">Nenhum ebook ainda</div>
            <div className="empty-desc">
              Clique em «Criar com IA» e envie o PDF ou cole o texto do manuscrito.
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
          ))
        )}
      </div>

      {/* Settings Section */}
      <div className="sidebar-divider" />

      <div className="sidebar-section-label">
        <Key size={12} /> ⚙️ Configurações
      </div>

      {/* Engine Selector */}
      <div style={{ padding: '8px 12px 4px', fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Motor de IA
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 12px 10px' }}>
        <button
          onClick={() => setSelectedEngine('ollama')}
          style={{
            flex: 1,
            padding: '8px',
            fontSize: 12,
            borderRadius: 6,
            cursor: 'pointer',
            border: selectedEngine === 'ollama' ? '2px solid #10b981' : '1px solid #333',
            background: selectedEngine === 'ollama' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: 'inherit',
          }}
          title="Ollama local (grátis)"
        >
          💻 Ollama<br/><span style={{ fontSize: 10, opacity: 0.7 }}>Grátis</span>
        </button>
        <button
          onClick={() => setSelectedEngine('openrouter')}
          style={{
            flex: 1,
            padding: '8px',
            fontSize: 12,
            borderRadius: 6,
            cursor: 'pointer',
            border: selectedEngine === 'openrouter' ? '2px solid #6366f1' : '1px solid #333',
            background: selectedEngine === 'openrouter' ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: 'inherit',
          }}
          title="OpenRouter premium (pago)"
        >
          🌐 OpenRouter<br/><span style={{ fontSize: 10, opacity: 0.7 }}>Premium</span>
        </button>
      </div>

      <div className="api-key-section">
        <button
          className={`api-toggle ${openRouterApiKeyEffective ? 'has-key' : 'needs-key'}`}
          onClick={() => setShowApiInput(!showApiInput)}
        >
          {openRouterApiKeyEffective ? (
            <><Check size={14} /> ✅ API Configurada</>
          ) : (
            <><AlertCircle size={14} className="animate-pulse" /> 🔑 Configurar IA (OpenRouter)</>
          )}
        </button>
        {showApiInput && (
          <div className="api-input-wrap">
            <input
              type="password"
              placeholder="Cole sua chave OpenRouter aqui..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="api-input"
            />
            <p className="api-hint">🔒 A chave fica salva apenas no seu MacBook. <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">Obter chave gratuita →</a></p>
          </div>
        )}
      </div>

      {/* APIs Premium (imagens + alternativas) */}
      <div style={{ padding: '8px 12px 4px' }}>
        <button
          onClick={() => setShowPremiumApis(!showPremiumApis)}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: 12,
            borderRadius: 8,
            cursor: 'pointer',
            border: '1px dashed #555',
            background: 'rgba(139,92,246,0.08)',
            color: 'inherit',
            textAlign: 'left',
          }}
        >
          ✨ APIs Premium (imagens, Claude direto…) {showPremiumApis ? '▲' : '▼'}
        </button>
      </div>
      {showPremiumApis && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Toggle gerar imagens */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={generateImages}
              onChange={(e) => setGenerateImages(e.target.checked)}
            />
            <span>🎨 Gerar capa ilustrada por IA</span>
          </label>

          {/* Provider de imagem */}
          {generateImages && (
            <>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Provedor de imagem:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { setImageProvider('openai'); setImageModel('dall-e-3'); }}
                  style={{
                    flex: 1, padding: 6, fontSize: 11, borderRadius: 6, cursor: 'pointer',
                    border: imageProvider === 'openai' ? '2px solid #10a37f' : '1px solid #333',
                    background: imageProvider === 'openai' ? 'rgba(16,163,127,0.15)' : 'transparent',
                    color: 'inherit',
                  }}
                >DALL-E 3<br/><span style={{ fontSize: 9, opacity: 0.7 }}>~$0.04/img</span></button>
                <button
                  onClick={() => { setImageProvider('replicate'); setImageModel('black-forest-labs/flux-schnell'); }}
                  style={{
                    flex: 1, padding: 6, fontSize: 11, borderRadius: 6, cursor: 'pointer',
                    border: imageProvider === 'replicate' ? '2px solid #e11d48' : '1px solid #333',
                    background: imageProvider === 'replicate' ? 'rgba(225,29,72,0.15)' : 'transparent',
                    color: 'inherit',
                  }}
                >Flux<br/><span style={{ fontSize: 9, opacity: 0.7 }}>~$0.003/img</span></button>
              </div>

              {imageProvider === 'openai' && (
                <input
                  type="password"
                  placeholder="Chave OpenAI (sk-...)"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="api-input"
                />
              )}
              {imageProvider === 'replicate' && (
                <input
                  type="password"
                  placeholder="Token Replicate (r8_...)"
                  value={replicateKey}
                  onChange={(e) => setReplicateKey(e.target.value)}
                  className="api-input"
                />
              )}
              <p style={{ fontSize: 10, opacity: 0.6, margin: 0 }}>
                🔒 Chave salva só no teu Mac.{' '}
                {imageProvider === 'openai' && <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">Obter chave →</a>}
                {imageProvider === 'replicate' && <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener">Obter token →</a>}
              </p>
            </>
          )}

          {/* Claude direto (opcional) */}
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Claude direto (opcional):</div>
          <input
            type="password"
            placeholder="Chave Anthropic (sk-ant-...)"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            className="api-input"
          />
        </div>
      )}

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
      <div className="sidebar-section-label"><Download size={12} /> 📤 Exportar & Compartilhar</div>
      <div className="export-btns">
        <button 
          className="btn-export" 
          onClick={handleGoForge}
          disabled={forgeStatus !== 'idle' || (selectedEngine === 'openrouter' && !openRouterApiKeyEffective)}
          title="🤖 Usar IA para melhorar o texto atual"
        >
          <Sparkles size={14} />
          <span>✨ Melhorar com IA</span>
        </button>
        {forgeStatus !== 'idle' && (
          <button className="btn-export cancel" onClick={cancelForge}>
            <X size={14} />
            <span>⏹️ Cancelar</span>
          </button>
        )}
        <button 
          className="btn-export" 
          onClick={onExportPDF} 
          disabled={!activeProjectId}
          title="📄 Gerar PDF profissional"
        >
          <FileText size={14} />
          <span>📄 Exportar PDF</span>
        </button>
        <button 
          className="btn-export" 
          onClick={onExportHTML} 
          disabled={!activeProjectId}
          title="🌐 Gerar arquivo HTML"
        >
          <FileText size={14} />
          <span>🌐 Exportar HTML</span>
        </button>
      </div>

      {/* Import & Sync */}
      <div className="sidebar-divider" />
      <div className="sidebar-section-label"><Upload size={12} /> Ficheiros e backups</div>
      <p className="sidebar-io-explainer">
        Isto <strong>não</strong> substitui «Criar com IA»: serve para <strong>abrir um projeto guardado</strong>, converter TXT/MD/PDF em projeto, ou <strong>restaurar backup</strong>.
      </p>
      <div className="export-btns">
        <button 
          className="btn-export btn-export-multiline"
          onClick={() => importFileRef.current?.click()}
          title="Projeto .ebookforge ou JSON; ou manuscrito TXT, MD, PDF (conversão com IA se configurada)"
        >
          <Upload size={14} className="btn-export-icon" />
          <span className="btn-export-lines">
            <span className="btn-export-title">Abrir ou converter ficheiro</span>
            <span className="btn-export-sub">.ebookforge, .json, .txt, .md, .pdf</span>
          </span>
        </button>
        <button 
          className="btn-export btn-export-multiline"
          onClick={() => importBackupFileRef.current?.click()}
          title="Ficheiro de backup com vários ebooks (JSON de exportação completa)"
        >
          <Upload size={14} className="btn-export-icon" />
          <span className="btn-export-lines">
            <span className="btn-export-title">Restaurar backup completo</span>
            <span className="btn-export-sub">vários ebooks de uma vez</span>
          </span>
        </button>
        <button 
          className="btn-export" 
          onClick={handleExportCurrent}
          disabled={!activeProjectId}
          title="⬇️ Baixar ebook atual"
        >
          <Download size={14} />
          <span>⬇️ Salvar Este Ebook</span>
        </button>
        <button 
          className="btn-export" 
          onClick={handleExportAllProjects}
          disabled={projects.length === 0}
          title="📦 Fazer backup de todos os ebooks"
        >
          <Download size={14} />
          <span>📦 Backup Completo</span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input 
        ref={importFileRef}
        type="file" 
        accept=".ebookforge,.json,.txt,.md,.markdown,.pdf"
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

      {/* Loading Modal for Import/Conversion */}
      {isImporting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              fontSize: 32,
              marginBottom: 16,
              animation: 'spin 2s linear infinite',
            }}>
              🤖
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
              color: '#fff',
            }}>
              Convertendo Documento
            </div>
            <div style={{
              fontSize: 13,
              color: '#aaa',
              marginBottom: 16,
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {importProgress}
            </div>
            <div style={{
              width: '100%',
              height: 3,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                animation: 'progress 2s ease-in-out infinite',
                width: '100%',
              }} />
            </div>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes progress {
                0%, 100% { width: 0; }
                50% { width: 100%; }
              }
            `}</style>
          </div>
        </div>
      )}
    </aside>
  );
};