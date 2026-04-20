import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, Sparkles, AlertCircle, FileText,
  ChevronDown, Zap, Crown, Loader2, X, CheckCircle2
} from 'lucide-react';
import { useEbook, type Theme } from '../../context/EbookContext';
import { ALL_MODELS as AVAILABLE_MODELS } from '../../services/aiEngine';

// 4 temas premium para seleção na forja
const FORGE_THEMES: {
  id: Theme; label: string; desc: string; preview: string; accent: string;
  icon: string; tags: string[];
}[] = [
  {
    id: 'obsidian-noir',
    label: 'Obsidian Noir',
    desc: 'Escuro, elegante, poderoso — para conteúdo de autoridade máxima',
    preview: '#0d0f12',
    accent: '#58a6ff',
    icon: '◈',
    tags: ['Tech', 'Dark', 'Autoridade'],
  },
  {
    id: 'arctic-white',
    label: 'Arctic White',
    desc: 'Limpo, editorial, sofisticado — para conteúdo premium e didático',
    preview: '#f8f9fa',
    accent: '#2563eb',
    icon: '◻',
    tags: ['Editorial', 'Clean', 'Didático'],
  },
  {
    id: 'royal-purple',
    label: 'Royal Purple',
    desc: 'Místico, transformador, exclusivo — para conteúdo de alto impacto',
    preview: '#1a0533',
    accent: '#a855f7',
    icon: '✦',
    tags: ['Místico', 'Premium', 'Exclusivo'],
  },
  {
    id: 'sunset-warm',
    label: 'Sunset Warm',
    desc: 'Acolhedor, humano, magnético — para conteúdo emocional e motivacional',
    preview: '#1c1209',
    accent: '#f59e0b',
    icon: '◉',
    tags: ['Humano', 'Emocional', 'Motivacional'],
  },
];

type InputMode = 'paste' | 'pdf';

export const ForgeDashboard = () => {
  const {
    forgeEbook, forgeEbookFromText,
    forgeStatus, forgeError, forgeProgress, forgeProgressDetail,
    resetForge, cancelForge,
    openRouterApiKeyEffective, selectedModel, setSelectedModel,
    selectedEngine,
  } = useEbook();

  const openRouterBlocked = selectedEngine === 'openrouter' && !openRouterApiKeyEffective;

  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [pastedText, setPastedText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('obsidian-noir');
  const [isDragging, setIsDragging] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRunning = forgeStatus !== 'idle' && forgeStatus !== 'finished' && forgeStatus !== 'error';

  // Sincroniza o input customizado com o modelo selecionado se ele não estiver na lista padrão
  useEffect(() => {
    const isStandard = AVAILABLE_MODELS.some(m => m.id === selectedModel);
    if (!isStandard && selectedModel) {
      setCustomModelInput(selectedModel);
    }
  }, [selectedModel]);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel)
    ?? { id: selectedModel, label: selectedModel, speed: 'balanced' as const };

  const handleForge = useCallback(() => {
    if (inputMode === 'paste') {
      if (!pastedText.trim()) {
        alert('Por favor, cole o texto do seu manuscrito antes de gerar.');
        return;
      }
      forgeEbookFromText(pastedText, selectedTheme);
    }
  }, [inputMode, pastedText, selectedTheme, forgeEbookFromText]);

  const handleFile = useCallback((file: File) => {
    // Aceita múltiplos formatos: PDF, DOCX, EPUB, RTF, ODT, TXT, MD
    const filename = file.name.toLowerCase();
    const acceptedExtensions = ['.pdf', '.docx', '.epub', '.rtf', '.txt', '.md', '.markdown', '.odt'];
    
    const hasValidExtension = acceptedExtensions.some(ext => filename.endsWith(ext));
    
    if (!hasValidExtension) {
      alert('Por favor, envie um arquivo em um dos formatos suportados: PDF, DOCX, EPUB, RTF, ODT, TXT ou MD.');
      return;
    }
    forgeEbook(file, selectedTheme);
  }, [forgeEbook, selectedTheme]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setInputMode('pdf');
      handleFile(file);
    }
  }, [handleFile]);

  const wordCount = pastedText.trim().split(/\s+/).filter(Boolean).length;

  // ── Estados visuais de progresso ─────────────────────────────────────────
  if (isRunning) {
    return <ForgeProgress
      status={forgeStatus}
      progress={forgeProgress}
      detail={forgeProgressDetail}
      onCancel={cancelForge}
    />;
  }

  if (forgeStatus === 'finished') {
    return <ForgeSuccess onNew={resetForge} />;
  }

  return (
    <div className="forge-dashboard">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="forge-hero">
        <div className="forge-badge">
          <Sparkles size={13} />
          <span>MOTOR DE GHOSTWRITING IA</span>
        </div>
        <h1>Cole seu manuscrito.<br /><span className="text-gradient">Receba um ebook pronto.</span></h1>
        <p className="forge-subtitle">
          Zero edição manual. A IA lê tudo, estrutura, reescreve e entrega com design premium.
        </p>
        <p className="forge-flow-hint">
          <strong>Passo 1:</strong> escolha modelo e tema abaixo. <strong>Passo 2:</strong> cole o texto <em>ou</em> envie o arquivo (PDF, DOCX, EPUB, etc).
          <strong> Passo 3:</strong> use o botão verde <strong>«Gerar ebook com IA»</strong>.
        </p>
      </div>

      {/* ── AVISO DE API KEY (só se motor = openrouter) ───────────────────── */}
      {openRouterBlocked && (
        <div className="forge-api-warning">
          <AlertCircle size={18} />
          <div>
            <strong>API Key necessária</strong>
            <p>Defina <code>VITE_OPENROUTER_API_KEY</code> no ficheiro <code>.env</code> na raiz do projeto, ou configure a chave na barra lateral (ícone de chave 🔑).</p>
          </div>
        </div>
      )}
      {selectedEngine === 'ollama' && (
        <div className="forge-api-warning" style={{ background: 'rgba(16,185,129,0.1)', borderColor: '#10b981' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <div>
            <strong>Motor Local Ativo</strong>
            <p>Usando Ollama local (grátis). Certifique-se que o Ollama está rodando no seu computador.</p>
          </div>
        </div>
      )}

      {/* ── SELEÇÃO DE MODELO ─────────────────────────────────────────────── */}
      <div className="forge-section">
        <label className="forge-label">
          <Zap size={14} /> Modelo de IA
        </label>
        <div className="model-selector" onClick={() => setShowModelMenu(v => !v)}>
          <div className="model-selected">
            <span className={`model-speed model-speed-${currentModel.speed}`}>
              {(currentModel.speed as string) === 'fast' ? '⚡' : '⚖️'}
            </span>
            <span>{currentModel.label}</span>
          </div>
          <ChevronDown size={14} className={showModelMenu ? 'rotate-180' : ''} />
        </div>
        {showModelMenu && (
          <div className="model-menu">
            {AVAILABLE_MODELS.map(m => (
              <button
                key={m.id}
                className={`model-option ${selectedModel === m.id ? 'active' : ''}`}
                onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }}
              >
                <span className={`model-speed model-speed-${m.speed}`}>
                  {(m.speed as string) === 'fast' ? '⚡' : '⚖️'}
                </span>
                <span className="model-option-label">
                  <span>{m.label}</span>
                  <code className="model-id">{m.id}</code>
                </span>
                {selectedModel === m.id && <CheckCircle2 size={13} className="ml-auto" />}
              </button>
            ))}
            <div className="model-custom-row" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                className="model-custom-input"
                placeholder="Ou cole outro ID do OpenRouter..."
                value={customModelInput}
                onChange={e => setCustomModelInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = customModelInput.trim();
                    if (v) { setSelectedModel(v); setShowModelMenu(false); }
                  }
                }}
              />
              <button 
                className="btn-apply-model"
                onClick={() => {
                  const v = customModelInput.trim();
                  if (v) { setSelectedModel(v); setShowModelMenu(false); }
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SELEÇÃO DE TEMA ──────────────────────────────────────────────── */}
      <div className="forge-section">
        <label className="forge-label">
          <Crown size={14} /> Tema Visual
        </label>
        <div className="theme-forge-grid">
          {FORGE_THEMES.map(t => (
            <button
              key={t.id}
              className={`theme-forge-card ${selectedTheme === t.id ? 'active' : ''}`}
              onClick={() => setSelectedTheme(t.id)}
              style={{ '--theme-preview': t.preview, '--theme-accent': t.accent } as React.CSSProperties}
            >
              <div className="theme-forge-preview">
                <span className="theme-forge-icon" style={{ color: t.accent }}>{t.icon}</span>
                <div className="theme-forge-lines">
                  <div style={{ background: t.accent }} />
                  <div style={{ background: `${t.accent}99` }} />
                  <div style={{ background: `${t.accent}55` }} />
                </div>
              </div>
              <div className="theme-forge-info">
                <strong>{t.label}</strong>
                <span>{t.desc}</span>
                <div className="theme-forge-tags">
                  {t.tags.map(tag => (
                    <span key={tag} className="theme-forge-tag" style={{ borderColor: `${t.accent}55`, color: t.accent }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {selectedTheme === t.id && <CheckCircle2 size={14} className="theme-check" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── SELEÇÃO DE MODO DE INPUT ─────────────────────────────────────── */}
      <div className="forge-section">
        <label className="forge-label">
          <FileText size={14} /> O seu manuscrito
        </label>
        <p className="forge-section-lead">
          Cada geração cria um <strong>ebook novo</strong> na lista à esquerda.
        </p>
        <div className="input-mode-tabs">
          <button
            className={`input-tab ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
          >
            <Sparkles size={14} />
            Colar Texto
          </button>
          <button
            className={`input-tab ${inputMode === 'pdf' ? 'active' : ''}`}
            onClick={() => setInputMode('pdf')}
          >
            <Upload size={14} />
            Enviar Arquivo (PDF, DOCX, EPUB...)
          </button>
        </div>

        {inputMode === 'paste' ? (
          <div className="paste-area">
            <textarea
              className="forge-textarea"
              placeholder="Cole aqui o conteúdo bruto do seu manuscrito (capítulos, notas, diários...)"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
            <div className="paste-stats">
              <span>{wordCount} palavras</span>
              <button
                className="btn-forge-action"
                disabled={!pastedText.trim() || openRouterBlocked}
                onClick={handleForge}
              >
                <Sparkles size={16} />
                Gerar ebook com IA
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.epub,.rtf,.txt,.md,.markdown,.odt"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="dropzone-content">
              <div className="dropzone-icon">
                <Upload size={32} />
              </div>
              <h3>Arraste o seu arquivo aqui</h3>
              <p>Suporta PDF, DOCX, EPUB, RTF, ODT, TXT e Markdown</p>
              <button className="btn-upload-trigger">Selecionar do computador</button>
            </div>
          </div>
        )}
      </div>

      {/* ── ERRO ─────────────────────────────────────────────────────────── */}
      {forgeError && (
        <div className="forge-error-box">
          <AlertCircle size={18} />
          <div className="forge-error-content">
            <strong>Erro na Forja</strong>
            <p>{forgeError}</p>
            <button onClick={resetForge} className="btn-retry">Tentar novamente</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

const ForgeProgress = ({ status, progress, detail, onCancel }: {
  status: string; progress: number; detail: any; onCancel: () => void;
}) => {
  const labels: Record<string, string> = {
    parsing: 'Lendo manuscrito...',
    thinking: 'IA analisando estrutura...',
    writing: 'Ghostwriter escrevendo capítulos...',
  };

  return (
    <div className="forge-processing">
      <div className="processing-card">
        <div className="processing-loader">
          <Loader2 size={40} className="animate-spin" />
        </div>
        <h2>Forjando seu Ebook Premium</h2>
        <p className="processing-status">{labels[status] || 'Processando...'}</p>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {detail && (
          <div className="progress-detail">
            <span className="detail-label">{detail.label}</span>
            <span className="detail-count">{detail.current} / {detail.total}</span>
          </div>
        )}

        <button className="btn-cancel-forge" onClick={onCancel}>
          <X size={14} /> Cancelar Geração
        </button>
      </div>
    </div>
  );
};

const ForgeSuccess = ({ onNew }: { onNew: () => void }) => (
  <div className="forge-success">
    <div className="success-card">
      <div className="success-icon">
        <CheckCircle2 size={48} />
      </div>
      <h2>Ebook Forjado com Sucesso!</h2>
      <p>O seu novo ebook já está disponível na lista de projetos à esquerda. Você pode editá-lo, exportar para PDF ou gerar materiais de marketing.</p>
      <div className="success-actions">
        <button className="btn-success-primary" onClick={onNew}>
          <Sparkles size={16} /> Forjar outro ebook
        </button>
      </div>
    </div>
  </div>
);
