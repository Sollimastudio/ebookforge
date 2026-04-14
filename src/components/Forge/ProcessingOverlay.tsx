import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useEbook, ForgeStatus } from '../../context/EbookContext';

const statusMessages: Record<ForgeStatus, string> = {
  idle: '',
  parsing: 'Lendo seu manuscrito...',
  thinking: 'IA está criando uma estrutura premium...',
  writing: 'Ghostwriting em andamento: Refinando capítulos...',
  finished: 'Forja Concluída! Abrindo seu ebook...',
  error: 'Erro na forja.'
};

export const ProcessingOverlay = () => {
  const { forgeStatus, forgeProgress } = useEbook();

  if (forgeStatus === 'idle' || forgeStatus === 'error') return null;

  return (
    <div className="processing-overlay">
      <div className="overlay-glass">
        <div className="overlay-content">
          <div className="ai-gem-container">
            <div className="ai-gem">
               <Sparkles size={40} className="glow-icon" />
            </div>
            <Loader2 size={80} className="spinner-icon" />
          </div>
          
          <h2>{statusMessages[forgeStatus]}</h2>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${forgeProgress}%` }}
            ></div>
          </div>
          <p className="progress-percentage">{Math.round(forgeProgress)}%</p>
          
          <div className="processing-tips">
            <p>Dica: Nossa IA de elite está reescrevendo seu texto para garantir o máximo valor de venda.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
