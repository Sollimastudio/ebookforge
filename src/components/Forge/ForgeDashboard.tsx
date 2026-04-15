import React, { useState, useCallback } from 'react';
import { Upload, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { useEbook } from '../../context/EbookContext';

export const ForgeDashboard = () => {
  const { forgeEbook, forgeStatus, forgeError, resetForge, apiKey } = useEbook();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
       alert('Por favor, envie um arquivo PDF.');
       return;
    }
    forgeEbook(file);
  }, [forgeEbook]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="forge-dashboard">
      <div className="forge-hero">
        <div className="forge-badge">
          <Sparkles size={14} />
          <span>AI PREMIUM ENGINE</span>
        </div>
        <h1>Bem-vinda ao <span className="text-gradient">EbookForge</span></h1>
        <p className="forge-subtitle">
          Transforme manuscritos brutos e PDFs em ebooks de luxo com inteligência artificial.
        </p>
      </div>

      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${forgeStatus !== 'idle' ? 'processing' : ''} ${!apiKey ? 'warning-glow' : ''}`}
        onDragOver={(e) => { 
          e.preventDefault(); 
          if (forgeStatus === 'idle') setIsDragging(true); 
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="drop-zone-content">
          {!apiKey ? (
            <>
              <div className="drop-icon warning">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-amber-400">Configuração Necessária</h3>
              <p>Por favor, insira sua <strong>OpenRouter API Key</strong> na barra lateral antes de começar.</p>
            </>
          ) : (
            <>
              <div className="drop-icon">
                {isDragging ? <Sparkles size={40} className="animate-bounce" /> : <Upload size={40} />}
              </div>
              <h3>{isDragging ? 'Pode soltar agora!' : 'Anexe seu PDF ou Manuscrito'}</h3>
              <p>{isDragging ? 'Processando os dados...' : 'Arraste o arquivo aqui ou clique para buscar no seu MacBook'}</p>
            </>
          )}
          
          <input 
            type="file" 
            id="file-upload" 
            className="hidden-input" 
            accept=".pdf" 
            onChange={onFileSelect}
            disabled={forgeStatus !== 'idle' || !apiKey}
          />
          <label 
            htmlFor="file-upload" 
            className={`btn-primary ${!apiKey ? 'disabled opacity-50 cursor-not-allowed' : ''}`}
          >
            {apiKey ? 'Selecionar Arquivo' : 'API Key Pendente'}
          </label>
        </div>
      </div>

      {forgeError && (
        <div className="forge-error-card">
          <AlertCircle className="text-red-500" />
          <div className="error-info">
            <h4>Ops! Ocorreu um problema</h4>
            <p>{forgeError}</p>
            <button onClick={resetForge} className="btn-retry">Tentar Novamente</button>
          </div>
        </div>
      )}

      <div className="forge-features">
        <div className="feature-card">
          <BookOpen className="feature-icon" />
          <h4>Estrutura Inteligente</h4>
          <p>Nossa IA identifica capítulos e subseções automaticamente.</p>
        </div>
        <div className="feature-card">
          <Sparkles className="feature-icon" />
          <h4>Ghostwriting de Elite</h4>
          <p>Reescrita total com foco em autoridade e fluidez premium.</p>
        </div>
      </div>
    </div>
  );
};
