import React, { useState } from 'react';
import { Key, Palette, Sun, Moon, Sparkles, Sunset, Check, AlertCircle } from 'lucide-react';
import { useEbook, type Theme } from '../../context/EbookContext';

const THEMES: { id: Theme; label: string; icon: React.ReactNode; preview: string; description: string }[] = [
  {
    id: 'obsidian-noir',
    label: 'Obsidian Noir',
    icon: <Moon size={16} />,
    preview: '#0d0f12',
    description: 'Tema escuro elegante com acentos azuis',
  },
  {
    id: 'arctic-white',
    label: 'Arctic White',
    icon: <Sun size={16} />,
    preview: '#f8f9fa',
    description: 'Tema claro minimalista e limpo',
  },
  {
    id: 'royal-purple',
    label: 'Royal Purple',
    icon: <Sparkles size={16} />,
    preview: '#1a0533',
    description: 'Tema escuro com tons roxos sofisticados',
  },
  {
    id: 'sunset-warm',
    label: 'Sunset Warm',
    icon: <Sunset size={16} />,
    preview: '#1c1209',
    description: 'Tema quente com tons laranja e dourado',
  },
];

export const SettingsPanel: React.FC = () => {
  const { apiKey, setApiKey, activeTheme, setActiveTheme } = useEbook();
  const [showApiInput, setShowApiInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const handleResetApiKey = () => {
    setTempApiKey('');
    setApiKey('');
  };

  return (
    <div className="settings-panel">
      <div className="settings-container">
        {/* API Key Section */}
        <div className="settings-section">
          <div className="section-header-settings">
            <Key size={20} />
            <h3>Chave OpenRouter</h3>
          </div>
          <p className="section-description">
            Configure sua chave de API para usar a IA na geração de ebooks. A chave fica salva localmente no seu navegador.
          </p>

          <div className="api-status">
            {apiKey ? (
              <div className="status-badge success">
                <Check size={16} />
                <span>API Key Configurada</span>
              </div>
            ) : (
              <div className="status-badge warning">
                <AlertCircle size={16} />
                <span>API Key Não Configurada</span>
              </div>
            )}
          </div>

          {!showApiInput ? (
            <button className="btn-settings-action" onClick={() => setShowApiInput(true)}>
              {apiKey ? 'Alterar Chave' : 'Configurar Chave'}
            </button>
          ) : (
            <div className="api-input-section">
              <input
                type="password"
                placeholder="Insira sua chave OpenRouter..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="api-input-field"
              />
              <div className="api-input-actions">
                <button className="btn-settings-save" onClick={handleSaveApiKey}>
                  {apiKeySaved ? <Check size={16} /> : 'Salvar'}
                </button>
                <button className="btn-settings-cancel" onClick={() => setShowApiInput(false)}>
                  Cancelar
                </button>
                {apiKey && (
                  <button className="btn-settings-danger" onClick={handleResetApiKey}>
                    Remover
                  </button>
                )}
              </div>
              <p className="api-hint">
                Obtenha sua chave em{' '}
                <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">
                  openrouter.ai
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Theme Section */}
        <div className="settings-section">
          <div className="section-header-settings">
            <Palette size={20} />
            <h3>Tema Visual</h3>
          </div>
          <p className="section-description">Escolha o tema que melhor se adequa ao seu estilo de trabalho.</p>

          <div className="themes-selector">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`theme-option ${activeTheme === theme.id ? 'active' : ''}`}
                onClick={() => setActiveTheme(theme.id)}
                title={theme.description}
              >
                <div className="theme-preview-box" style={{ background: theme.preview }} />
                <div className="theme-info">
                  <div className="theme-icon">{theme.icon}</div>
                  <div className="theme-details">
                    <h4>{theme.label}</h4>
                    <p>{theme.description}</p>
                  </div>
                </div>
                {activeTheme === theme.id && <div className="theme-checkmark">✓</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="settings-section info-section">
          <h3>Sobre o EbookForge</h3>
          <div className="info-content">
            <p>
              <strong>EbookForge</strong> é um editor de ebooks inteligente que usa IA para transformar seus manuscritos em
              publicações profissionais.
            </p>
            <ul>
              <li>Edite seus ebooks com um editor rico em recursos</li>
              <li>Use IA para reescrever e estruturar automaticamente</li>
              <li>Exporte para PDF, HTML e outros formatos</li>
              <li>Todos os seus dados ficam salvos localmente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
