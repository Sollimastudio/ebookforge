import React, { useState } from 'react';
import { Megaphone, Mail, Layers, MessageSquare, Loader2, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useEbook } from '../../context/EbookContext';
import { callAI } from '../../services/aiEngine';
import { GhostwriterPrompts } from '../../services/prompts';

type Tab = 'copy' | 'carousel' | 'email' | 'posts';

const TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'copy',     label: 'Copy de Vendas',       icon: <Megaphone size={14} />,     desc: 'Página de vendas completa — headline, benefícios, CTA, depoimentos' },
  { id: 'carousel', label: 'Carrossel',             icon: <Layers size={14} />,        desc: '7 slides prontos para LinkedIn e Instagram' },
  { id: 'email',    label: 'Email de Lançamento',  icon: <Mail size={14} />,          desc: '3 subject lines + corpo do email + P.S.' },
  { id: 'posts',    label: 'Posts Sociais',         icon: <MessageSquare size={14} />, desc: 'Instagram, LinkedIn e thread para X/Twitter' },
];

export const MarketingPanel: React.FC = () => {
  const { activeProject, selectedEngine, openRouterApiKeyEffective, apiKey, selectedModel } = useEbook();
  const [activeTab, setActiveTab] = useState<Tab>('copy');
  const [results, setResults] = useState<Partial<Record<Tab, string>>>({});
  const [loading, setLoading] = useState<Partial<Record<Tab, boolean>>>({});
  const [copied, setCopied] = useState<Partial<Record<Tab, boolean>>>({});
  const [error, setError] = useState<string | null>(null);

  const getProjectText = (): string => {
    if (!activeProject) return '';
    const div = document.createElement('div');
    div.innerHTML = activeProject.content;
    return (div.textContent || '').substring(0, 8000);
  };

  const generate = async (tab: Tab) => {
    if (!activeProject) return;
    const effectiveKey = openRouterApiKeyEffective || apiKey;
    if (selectedEngine === 'openrouter' && !effectiveKey) {
      setError('Configure sua chave OpenRouter nas Configurações para usar as ferramentas de marketing.');
      return;
    }

    setLoading(prev => ({ ...prev, [tab]: true }));
    setError(null);

    const text = getProjectText();
    const title = activeProject.title;

    const promptMap: Record<Tab, string> = {
      copy:     GhostwriterPrompts.MARKETING_COPY(title, text),
      carousel: GhostwriterPrompts.MARKETING_CAROUSEL(title, text),
      email:    GhostwriterPrompts.MARKETING_EMAIL(title, text),
      posts:    GhostwriterPrompts.MARKETING_POSTS(title, text),
    };

    try {
      const result = await callAI(
        [{ role: 'user', content: promptMap[tab] }],
        { engine: selectedEngine, apiKey: effectiveKey, model: selectedModel, timeout: 120000, maxTokens: 3000 }
      );
      setResults(prev => ({ ...prev, [tab]: result }));
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar. Tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  const copyToClipboard = async (tab: Tab) => {
    const text = results[tab];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [tab]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [tab]: false })), 2000);
  };

  if (!activeProject) {
    return (
      <div className="marketing-empty">
        <Megaphone size={52} className="marketing-empty-icon" />
        <h2>Selecione um Ebook</h2>
        <p>Clique em um ebook na barra lateral para gerar os materiais de marketing.</p>
      </div>
    );
  }

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="marketing-panel">

      {/* Header */}
      <div className="marketing-header">
        <div className="marketing-badge">
          <Megaphone size={13} />
          <span>KIT DE MARKETING IA</span>
        </div>
        <h1>Materiais para<br /><span className="text-gradient">"{activeProject.title}"</span></h1>
        <p className="marketing-subtitle">
          Gere copy de vendas, carrosséis, emails e posts prontos para publicar — tudo baseado no conteúdo real do seu ebook.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="marketing-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="marketing-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`marketing-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
            {results[t.id] && <span className="tab-done">✓</span>}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="marketing-content">

        {/* Action Bar */}
        <div className="marketing-action-bar">
          <div className="marketing-tab-info">
            <strong>{currentTab.label}</strong>
            <span>{currentTab.desc}</span>
          </div>
          <div className="marketing-actions">
            {results[activeTab] && (
              <button className="btn-mkt-copy" onClick={() => copyToClipboard(activeTab)}>
                {copied[activeTab]
                  ? <><Check size={13} /> Copiado!</>
                  : <><Copy size={13} /> Copiar Tudo</>}
              </button>
            )}
            <button
              className="btn-mkt-generate"
              onClick={() => generate(activeTab)}
              disabled={!!loading[activeTab]}
            >
              {loading[activeTab] ? (
                <><Loader2 size={14} className="animate-spin" /> Gerando...</>
              ) : results[activeTab] ? (
                <><RefreshCw size={14} /> Regenerar</>
              ) : (
                <><Megaphone size={14} /> Gerar Agora</>
              )}
            </button>
          </div>
        </div>

        {/* Result / Loading / Placeholder */}
        {loading[activeTab] ? (
          <div className="marketing-loading">
            <Loader2 size={36} className="animate-spin" />
            <p>A IA está criando seu kit de marketing...</p>
            <span>Isso pode levar 20–40 segundos.</span>
          </div>
        ) : results[activeTab] ? (
          <div className="marketing-result">
            <pre className="marketing-output">{results[activeTab]}</pre>
          </div>
        ) : (
          <div className="marketing-placeholder">
            <div className="placeholder-icon">{currentTab.icon}</div>
            <p>Clique em <strong>Gerar Agora</strong> para criar a {currentTab.label.toLowerCase()}.</p>
            <p className="placeholder-hint">
              A IA analisa o conteúdo real do ebook e gera material pronto para usar — sem precisar reescrever nada.
            </p>
          </div>
        )}
      </div>

      {/* All tabs overview */}
      {Object.values(results).some(Boolean) && (
        <div className="marketing-overview">
          <p className="overview-label">Materiais gerados:</p>
          <div className="overview-chips">
            {TABS.map(t => results[t.id] ? (
              <button
                key={t.id}
                className={`overview-chip ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.id); copyToClipboard(t.id); }}
                title={`Copiar ${t.label}`}
              >
                <Copy size={11} /> {t.label}
              </button>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
};
