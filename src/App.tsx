import { useCallback } from 'react';
import { EbookProvider, useEbook } from './context/EbookContext';
import { EbookEditor } from './components/Editor/EbookEditor';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ForgeDashboard } from './components/Forge/ForgeDashboard';
import { ProcessingOverlay } from './components/Forge/ProcessingOverlay';
import './index.css';

function AppInner() {
  const { activeProject, activeTheme } = useEbook();

  const handleExportHTML = useCallback(() => {
    if (!activeProject) return;
    const blob = new Blob([`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${activeProject.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 60px auto; color: #1a1a1a; line-height: 1.8; font-size: 1.1rem; }
    h1,h2,h3 { font-family: Georgia, serif; }
    blockquote { border-left: 4px solid #58a6ff; padding: 1rem 1.5rem; background: #f0f7ff; margin: 2em 0; border-radius: 0 8px 8px 0; }
    img { max-width: 100%; border-radius: 8px; margin: 2rem 0; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    table { border-collapse: collapse; width: 100%; margin: 2em 0; }
    td, th { border: 1px solid #ddd; padding: 0.8rem; }
    th { background: #f5f5f5; }
    [data-callout="info"] { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.5rem; border-radius: 0 8px 8px 0; margin: 1.5em 0; }
    [data-callout="tip"] { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 1rem 1.5rem; border-radius: 0 8px 8px 0; margin: 1.5em 0; }
    [data-callout="warning"] { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 1rem 1.5rem; border-radius: 0 8px 8px 0; margin: 1.5em 0; }
    [data-callout="danger"] { background: #fff1f2; border-left: 4px solid #ef4444; padding: 1rem 1.5rem; border-radius: 0 8px 8px 0; margin: 1.5em 0; }
    mark { border-radius: 3px; padding: 0.1em 0.2em; }
    code { background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
${activeProject.content}
</body>
</html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeProject]);

  const handleExportPDF = useCallback(async () => {
    if (!activeProject) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const editorEl = document.getElementById('ebook-content-area');
      if (!editorEl) { alert('Conteúdo não encontrado.'); return; }

      // Overlay de progresso
      const notice = document.createElement('div');
      notice.className = 'export-notice-overlay';
      notice.innerHTML = `
        <div class="export-notice-box">
          <div class="spinner"></div>
          <p>Renderizando Ebook de Alta Resolução...</p>
          <small>Isso pode levar alguns segundos dependendo do tamanho.</small>
        </div>
      `;
      document.body.appendChild(notice);

      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(editorEl, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 850,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.90);
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4',
        compress: true
      });
      
      // Adicionar metadados
      pdf.setProperties({
        title: activeProject.title,
        subject: 'Ebook criado com EbookForge',
        author: 'EbookForge',
        keywords: 'ebook, premium, ai',
        creator: 'EbookForge Studio'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`${activeProject.title.replace(/\s+/g, '_')}.pdf`);
      document.body.removeChild(notice);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF. O conteúdo pode ser muito grande para o navegador.');
    }
  }, [activeProject]);

  return (
    <div className={`app-root theme-${activeTheme}`}>
      <Sidebar onExportPDF={handleExportPDF} onExportHTML={handleExportHTML} />
      <main className="main-area">
        {activeProject ? (
          <>
            <div className="project-header">
              <h1 className="project-title-display">{activeProject.title}</h1>
              <span className="autosave-badge">💾 Auto-salvo</span>
            </div>
            <EbookEditor />
          </>
        ) : (
          <ForgeDashboard />
        )}
      </main>
      <ProcessingOverlay />
    </div>
  );
}

function App() {
  return (
    <EbookProvider>
      <AppInner />
    </EbookProvider>
  );
}

export default App;

