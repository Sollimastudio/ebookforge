import { useCallback, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { EbookProvider, useEbook } from './context/EbookContext';
import { EbookEditor } from './components/Editor/EbookEditor';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ForgeDashboard } from './components/Forge/ForgeDashboard';
import './index.css';

export type AppView = 'forge' | 'editor';

function AppInner() {
  const { activeProject, activeTheme, forgeStatus, setActiveProjectId } = useEbook();
  const [view, setView] = useState<AppView>('forge');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Quando a forja termina, vai automaticamente para o editor
  useEffect(() => {
    if (forgeStatus === 'finished' && activeProject) {
      setView('editor');
    }
  }, [forgeStatus, activeProject]);

  const navigateTo = useCallback((nextView: AppView, projectId?: string) => {
    if (projectId) setActiveProjectId(projectId);
    setView(nextView);
  }, [setActiveProjectId]);

  const handleExportHTML = useCallback(() => {
    if (!activeProject) return;
    const blob = new Blob([`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${activeProject.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Georgia, serif; max-width: 780px; margin: 60px auto; padding: 0 2rem 4rem; color: #1a1a1a; line-height: 1.8; font-size: 1.05rem; background: #fafafa; }
    h1,h2,h3 { font-family: 'Playfair Display', Georgia, serif; line-height: 1.25; }
    h1 { font-size: 2.8rem; margin-bottom: 1rem; color: #111; }
    h2 { font-size: 1.8rem; margin: 2.5rem 0 0.75rem; color: #1a1a1a; }
    h3 { font-size: 1.3rem; margin: 1.8rem 0 0.5rem; color: #2a2a2a; }
    p { color: #333; margin-bottom: 1rem; }
    blockquote { border-left: 4px solid #2563eb; padding: 1rem 1.5rem; background: #f0f7ff; margin: 2em 0; border-radius: 0 8px 8px 0; font-style: italic; color: #1e3a5f; }
    img { max-width: 100%; border-radius: 8px; margin: 2rem 0; box-shadow: 0 4px 16px rgba(0,0,0,0.12); display: block; }
    table { border-collapse: collapse; width: 100%; margin: 2em 0; }
    td, th { border: 1px solid #ddd; padding: 0.8rem; }
    th { background: #f5f5f5; font-weight: 600; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.4rem; color: #333; }
    .callout, [data-callout] { padding: 1rem 1.5rem; border-radius: 0 8px 8px 0; margin: 1.5em 0; border-left: 4px solid; }
    .callout-insight, [data-callout="tip"] { background: #f0fdf4; border-color: #22c55e; }
    .callout-action, [data-callout="info"] { background: #eff6ff; border-color: #3b82f6; }
    [data-callout="warning"] { background: #fffbeb; border-color: #f59e0b; }
    [data-callout="danger"] { background: #fff1f2; border-color: #ef4444; }
    .callout strong, [data-callout] strong { display: block; margin-bottom: 0.4rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .day-entry { border: 1px solid #e2e8f0; border-radius: 12px; margin: 2rem 0; overflow: hidden; }
    .day-header { padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .day-badge { display: inline-block; padding: 0.25rem 0.75rem; background: #2563eb; color: white; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; }
    .day-title { font-size: 1.6rem; color: #111; margin: 0 0 0.4rem; }
    .day-theme { font-size: 0.9rem; color: #666; font-style: italic; }
    .day-body { padding: 1.5rem 2rem; }
    .day-highlight { display: flex; gap: 1rem; padding: 1rem; background: #f0f7ff; border-left: 3px solid #2563eb; border-radius: 0 8px 8px 0; margin: 1rem 0; }
    .day-footer { padding: 1rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .day-reflection strong { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.06em; }
    .ebook-cover { text-align: center; padding: 5rem 2rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 2rem; }
    .cover-title { font-size: 3rem; font-weight: 700; color: #111; margin-bottom: 1rem; }
    .cover-subtitle { font-size: 1.2rem; color: #555; font-style: italic; }
    .chapter-break { height: 2px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 3rem 0; border: none; }
    .step-entry, .lesson-entry { border: 1px solid #e2e8f0; border-radius: 12px; margin: 2rem 0; overflow: hidden; }
    .step-header, .lesson-header { padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .step-number, .lesson-number { display: inline-block; padding: 0.25rem 0.75rem; background: #7c3aed; color: white; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; }
    .step-body, .lesson-body { padding: 1.5rem 2rem; }
    .step-check, .lesson-exercise { padding: 1rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    mark { background: #fef08a; border-radius: 3px; padding: 0.1em 0.2em; }
    code { background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; font-family: monospace; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 8px; overflow-x: auto; margin: 1.5rem 0; }
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

      const notice = document.createElement('div');
      notice.className = 'export-notice-overlay';
      notice.innerHTML = `<div class="export-notice-box"><div class="spinner"></div><p>Renderizando PDF...</p><small>Aguarde alguns segundos.</small></div>`;
      document.body.appendChild(notice);

      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(editorEl, {
        scale: 2.5, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: 850,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.90);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      pdf.setProperties({ title: activeProject.title, creator: 'EbookForge Studio' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`${activeProject.title.replace(/\s+/g, '_')}.pdf`);
      document.body.removeChild(notice);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    }
  }, [activeProject]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className={`app-root theme-${activeTheme}`}>
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Abrir menu"
        style={{ display: 'none' }}
      >
        <Menu size={20} />
      </button>
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />
      <div className={sidebarOpen ? 'sidebar-wrapper open' : 'sidebar-wrapper'}>
        <Sidebar
          onExportPDF={handleExportPDF}
          onExportHTML={handleExportHTML}
          currentView={view}
          onNavigate={(v, id) => { navigateTo(v, id); closeSidebar(); }}
        />
      </div>
      <main className="main-area">
        {view === 'forge' ? (
          <ForgeDashboard />
        ) : (
          activeProject ? (
            <>
              <div className="project-header">
                <h1 className="project-title-display">{activeProject.title}</h1>
                <span className="autosave-badge">💾 Auto-salvo</span>
              </div>
              <EbookEditor onGoToForge={() => navigateTo('forge')} />
            </>
          ) : (
            <ForgeDashboard />
          )
        )}
      </main>
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
