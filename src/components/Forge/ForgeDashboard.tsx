import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, Sparkles, AlertCircle, FileText,
  ChevronDown, Zap, Crown, Loader2, X, CheckCircle2
} from 'lucide-react';
import { useEbook, type Theme } from '../../context/EbookContext';
import { AVAILABLE_MODELS } from '../../services/openrouter';

// 4 temas premium para seleção na forja
const FORGE_THEMES: { id: Theme; label: string; desc: string; preview: string; accent: string }[] = [
  {
    id: 'obsidian-noir',
    label: 'Obsidian Noir',
    desc: 'Escuro, elegante, poderoso — para conteúdo de autoridade máxima',
    preview: '#0d0f12',
    accent: '#58a6ff',
  },
  {
    id: 'arctic-white',
    label: 'Arctic White',
    desc: 'Limpo, editorial, sofisticado — para conteúdo premium e didático',
    preview: '#f8f9fa',
    accent: '#2563eb',
  },
  {
    id: 'royal-purple',
    label: 'Royal Purple',
    desc: 'Místico, transformador, exclusivo — para conteúdo de alto impacto',
    preview: '#1a0533',
    accent: '#a855f7',
  },
  {
    id: 'sunset-warm',
    label: 'Sunset Warm',
    desc: 'Acolhedor, humano, magnético — para conteúdo emocional e motivacional',
    preview: '#1c1209',
    accent: '#f59e0b',
  },
];

type InputMode = 'paste' | 'pdf';

export const ForgeDashboard = () => {
  const {
    forgeEbook, forgeEbookFromText,
    forgeStatus, forgeError, forgeProgress, forgeProgressDetail,
    resetForge, cancelForge,
    apiKey, selectedModel, setSelectedModel,
  } = useEbook();

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
      </div>

      {/* ── AVISO DE API KEY ─────────────────────────────────────────────── */}
      {!apiKey && (
        <div className="forge-api-warning">
          <AlertCircle size={18} />
          <div>
            <strong>API Key necessária</strong>
            <p>Configure sua chave OpenRouter na barra lateral (ícone de chave 🔑) para ativar a IA.</p>
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
              <div className="theme-forge-preview" />
              <div className="theme-forge-info">
                <strong>{t.label}</strong>
                <span>{t.desc}</span>
              </div>
              {selectedTheme === t.id && <CheckCircle2 size={14} className="theme-check" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── SELEÇÃO DE MODO DE INPUT ─────────────────────────────────────── */}
      <div className="forge-section">
        <div className="input-mode-tabs">
          <button
            className={`input-tab ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
          >
            <FileText size={14} /> Colar Texto
          </button>
          <button
            className={`input-tab ${inputMode === 'pdf' ? 'active' : ''}`}
            onClick={() => setInputMode('pdf')}
          >
            <Upload size={14} /> Enviar PDF
          </button>
        </div>

        {/* MODO: COLAR TEXTO */}
        {inputMode === 'paste' && (
          <div className="paste-area">
            <textarea
              className="manuscript-textarea"
              placeholder="Cole aqui o texto completo do seu manuscrito...&#10;&#10;Pode ser o livro inteiro, notas brutas, transcrições — quanto mais conteúdo, melhor o resultado. A IA vai ler tudo, estruturar e reescrever com qualidade editorial."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              rows={14}
              disabled={!apiKey}
            />
            {pastedText.length > 0 && (
              <div className="paste-stats">
                <span>📝 {wordCount.toLocaleString()} palavras</span>
                <span>·</span>
                <span>{charCount.toLocaleString()} caracteres</span>
                {wordCount > 500 && <span className="paste-ok">✓ Conteúdo suficiente</span>}
                {wordCount > 0 && wordCount < 500 && <span className="paste-warn">⚠ Cole mais conteúdo para melhor resultado</span>}
              </div>
            )}
          </div>
        )}

        {/* MODO: PDF */}
        {inputMode === 'pdf' && (
          <div
            className={`drop-zone-compact ${isDragging ? 'dragging' : ''} ${!apiKey ? 'disabled' : ''}`}
            onDragOver={e => { e.preventDefault(); if (apiKey) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <Upload size={28} />
            <p>{isDragging ? 'Solte o arquivo!' : 'Arraste seu PDF aqui'}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden-input"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              disabled={!apiKey}
            />
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={!apiKey}
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
          className="btn-forge-main"
          onClick={handleForge}
          disabled={!apiKey || pastedText.trim().length < 50}
        >
          <Sparkles size={18} />
          {!apiKey ? 'Configure a API Key primeiro' : pastedText.trim().length < 50 ? 'Cole seu manuscrito acima' : 'Forjar Ebook Agora'}
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
