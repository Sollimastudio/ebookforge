import React, { useState, useCallback, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRunning = forgeStatus !== 'idle' && forgeStatus !== 'finished' && forgeStatus !== 'error';

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel)
    ?? { id: selectedModel, label: selectedModel, speed: 'balanced' as const };

  const handleForge = useCallback(() => {
    if (inputMode === 'paste') {
      forgeEbookFromText(pastedText, selectedTheme);
    }
  }, [inputMode, pastedText, selectedTheme, forgeEbookFromText]);

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor, envie um arquivo PDF.');
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
  const charCount = pastedText.length;

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
          <strong>Passo 1:</strong> escolha modelo e tema abaixo. <strong>Passo 2:</strong> cole o texto <em>ou</em> envie o PDF.
          <strong> Passo 3:</strong> use o botão verde <strong>«Gerar ebook com IA»</strong> (logo abaixo do texto — pode precisar de descer a página).
        </p>
      </div>

      {/* ── AVISO DE API KEY (só se motor = openrouter) ───────────────────── */}
      {openRouterBlocked && (
        <div className="forge-api-warning">
          <AlertCircle size={18} />
          <div>
            <strong>API Key necessária</strong>
            <p>Defina <code>VITE_OPENROUTER_API_KEY</code> no ficheiro <code>.env</code> na raiz do projeto (reinicie o servidor de desenvolvimento), ou configure a chave na barra lateral (ícone de chave 🔑). Também pode usar o motor Ollama Local nas Configurações.</p>
          </div>
        </div>
      )}
      {selectedEngine === 'ollama' && (
        <div className="forge-api-warning" style={{ background: 'rgba(16,185,129,0.1)', borderColor: '#10b981' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <div>
            <strong>Motor Local Ativo</strong>
            <p>Usando Ollama local (grátis). Certifique-se que o Ollama está rodando no teu Mac.</p>
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
            <div className="model-custom-row">
              <input
                type="text"
                className="model-custom-input"
                placeholder="Ou cole outro ID do OpenRouter..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) { setSelectedModel(v); setShowModelMenu(false); }
                  }
                }}
              />
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
          Isto <strong>não</strong> é anexo ao projeto atual: cada geração cria um <strong>ebook novo</strong> na lista à esquerda.
        </p>
        <div className="input-mode-tabs">
          <button
            className={`input-tab ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
            type="button"
          >
            <FileText size={14} /> Colar texto do manuscrito
          </button>
          <button
            className={`input-tab ${inputMode === 'pdf' ? 'active' : ''}`}
            onClick={() => setInputMode('pdf')}
            type="button"
          >
            <Upload size={14} /> Enviar PDF do manuscrito
          </button>
        </div>

        {/* MODO: COLAR TEXTO */}
        {inputMode === 'paste' && (
          <div className="paste-area">
            <textarea
              className="manuscript-textarea"
              placeholder="Cole aqui o texto completo do manuscrito (livro, notas, transcrição). Depois prima o botão verde «Gerar ebook com IA» logo abaixo."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              rows={14}
            />
            {pastedText.length > 0 && (
              <div className="paste-stats">
                <span>📝 {wordCount.toLocaleString()} palavras</span>
                <span>·</span>
                <span>{charCount.toLocaleString()} caracteres</span>
                {wordCount > 500 && (
                  <span className="paste-ok">
                    <CheckCircle2 size={13} /> Pronto para Forjar
                  </span>
                )}
                {wordCount > 0 && wordCount < 500 && <span className="paste-warn">⚠ Cole mais conteúdo para melhor resultado</span>}
              </div>
            )}
            <div className="paste-cta-block">
              <button
                type="button"
                className="btn-forge-main"
                onClick={handleForge}
                disabled={openRouterBlocked || pastedText.trim().length < 50}
                title={openRouterBlocked ? 'Configure sua chave de API na barra lateral para liberar a geração' : undefined}
              >
                <Sparkles size={18} />
                {openRouterBlocked
                  ? 'Configure a chave de API na barra lateral (🔑)'
                  : pastedText.trim().length < 50
                    ? `Cole pelo menos 50 caracteres (faltam ${Math.max(0, 50 - pastedText.trim().length)})`
                    : 'Gerar ebook com IA — passo seguinte'}
              </button>
              {openRouterBlocked && (
                <p className="paste-cta-api-hint">
                  <AlertCircle size={13} /> Clique no ícone de chave 🔑 na barra lateral e cole sua chave OpenRouter — ou mude para o motor Ollama Local nas Configurações.
                </p>
              )}
              {!openRouterBlocked && (
                <p className="paste-cta-note">
                  O mesmo botão repete-se no fim da página. Use qualquer um.
                </p>
              )}
            </div>
          </div>
        )}

        {/* MODO: PDF */}
        {inputMode === 'pdf' && (
          <div
            className={`drop-zone-compact ${isDragging ? 'dragging' : ''} ${openRouterBlocked ? 'disabled' : ''}`}
            onDragOver={e => { e.preventDefault(); if (!openRouterBlocked) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <Upload size={28} />
            <p>{isDragging ? 'Solte o ficheiro!' : 'Arraste o PDF do manuscrito aqui'}</p>
            <p className="drop-zone-lead">A IA extrai o texto e cria um ebook novo (não é ficheiro anexado ao editor).</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden-input"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              disabled={openRouterBlocked}
            />
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={openRouterBlocked}
            >
              Selecionar PDF
            </button>
          </div>
        )}
      </div>

      {/* ── ERRO ─────────────────────────────────────────────────────────── */}
      {forgeError && forgeStatus === 'error' && (
        <div className="forge-error-card">
          <AlertCircle size={18} className="text-red-500" />
          <div className="error-info">
            <strong>Ops — algo deu errado</strong>
            <p>{forgeError}</p>
          </div>
          <button onClick={resetForge} className="btn-retry">
            <X size={14} /> Tentar Novamente
          </button>
        </div>
      )}

      {/* ── BOTÃO PRINCIPAL ──────────────────────────────────────────────── */}
      {inputMode === 'paste' && (
        <button
          type="button"
          className="btn-forge-main forge-footer-cta"
          onClick={handleForge}
          disabled={openRouterBlocked || pastedText.trim().length < 50}
          title={openRouterBlocked ? 'Configure sua chave de API na barra lateral para liberar a geração' : undefined}
        >
          <Sparkles size={18} />
          {openRouterBlocked
            ? 'Configure a chave de API na barra lateral (🔑)'
            : pastedText.trim().length < 50
              ? 'Cole o manuscrito acima (mín. 50 caracteres)'
              : 'Gerar ebook com IA (repetir ação)'}
        </button>
      )}
    </div>
  );
};

// ── Tela de Progresso ─────────────────────────────────────────────────────
interface ForgeProgressProps {
  status: string;
  progress: number;
  detail: { phase: string; current: number; total: number; label: string } | null;
  onCancel: () => void;
}

function ForgeProgress({ status, progress, detail, onCancel }: ForgeProgressProps) {
  const statusLabels: Record<string, string> = {
    parsing: 'Extraindo texto...',
    thinking: 'Analisando manuscrito e criando estrutura...',
    writing: 'Escrevendo com qualidade editorial...',
  };

  return (
    <div className="forge-progress-screen">
      <div className="forge-progress-inner">
        <div className="forge-spinner">
          <Loader2 size={40} className="animate-spin" />
          <Sparkles size={18} className="spinner-star" />
        </div>

        <h2>{statusLabels[status] || 'Processando...'}</h2>

        {detail && (
          <div className="progress-detail">
            <span className="progress-phase">{detail.phase}</span>
            <span className="progress-label">{detail.label}</span>
            {detail.total > 1 && (
              <span className="progress-count">{detail.current} de {detail.total}</span>
            )}
          </div>
        )}

        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-pct">{Math.round(progress)}%</span>

        <p className="progress-tip">
          {progress < 20 && 'A IA está lendo seu manuscrito completo...'}
          {progress >= 20 && progress < 30 && 'Estrutura criada. Iniciando a escrita...'}
          {progress >= 30 && progress < 85 && 'Escrevendo capítulos em paralelo...'}
          {progress >= 85 && 'Finalizando e montando o ebook...'}
        </p>

        <button className="btn-cancel" onClick={onCancel}>
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Tela de Sucesso ────────────────────────────────────────────────────────
function ForgeSuccess({ onNew }: { onNew: () => void }) {
  return (
    <div className="forge-success-screen">
      <CheckCircle2 size={52} className="success-icon" />
      <h2>Ebook Pronto!</h2>
      <p>Seu ebook foi gerado com sucesso. Clique no nome do projeto na barra lateral para visualizar, editar e exportar.</p>
      <button className="btn-forge-main" onClick={onNew}>
        <Sparkles size={16} /> Forjar Outro Ebook
      </button>
    </div>
  );
}
