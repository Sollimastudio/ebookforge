import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { useEbook } from '../../context/EbookContext';

export const PreviewPanel: React.FC = () => {
  const { activeProject } = useEbook();
  const [copied, setCopied] = useState(false);

  if (!activeProject) {
    return <div className="preview-panel empty">Selecione um ebook para visualizar</div>;
  }

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const previewEl = document.getElementById('preview-content-area');
      if (!previewEl) {
        alert('Conteúdo não encontrado.');
        return;
      }

      const notice = document.createElement('div');
      notice.className = 'export-notice-overlay';
      notice.innerHTML = `
        <div class="export-notice-box">
          <div class="spinner"></div>
          <p>Renderizando PDF...</p>
        </div>
      `;
      document.body.appendChild(notice);

      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(previewEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.setProperties({
        title: activeProject.title,
        subject: 'Ebook criado com EbookForge',
        author: 'EbookForge',
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
      alert('Erro ao gerar PDF. O conteúdo pode ser muito grande.');
    }
  };

  const handleExportHTML = () => {
    const blob = new Blob(
      [
        `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeProject.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Georgia', 'Garamond', serif; 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 3rem 2rem;
      color: #1a1a1a; 
      line-height: 1.8; 
      font-size: 1.05rem;
      background: #fafafa;
    }
    h1, h2, h3, h4, h5, h6 { 
      font-family: 'Georgia', serif;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.3;
    }
    h1 { font-size: 2.2rem; margin-bottom: 0.3em; }
    h2 { font-size: 1.8rem; }
    h3 { font-size: 1.4rem; }
    p { margin-bottom: 1.2em; }
    blockquote { 
      border-left: 4px solid #3b82f6; 
      padding: 1.5rem 1.5rem; 
      background: #eff6ff; 
      margin: 2em 0;
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }
    img { 
      max-width: 100%; 
      height: auto;
      border-radius: 8px; 
      margin: 2rem 0; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    }
    table { 
      border-collapse: collapse; 
      width: 100%; 
      margin: 2em 0; 
    }
    td, th { 
      border: 1px solid #ddd; 
      padding: 0.8rem; 
      text-align: left;
    }
    th { background: #f5f5f5; font-weight: 600; }
    code { 
      background: #f3f4f6; 
      padding: 0.2em 0.4em; 
      border-radius: 4px; 
      font-size: 0.9em;
      font-family: 'JetBrains Mono', monospace;
    }
    pre { 
      background: #1e293b; 
      color: #e2e8f0; 
      padding: 1.5rem; 
      border-radius: 8px; 
      overflow-x: auto;
      margin: 2em 0;
    }
    pre code { background: none; padding: 0; color: inherit; }
    .chapter-break { page-break-before: always; margin: 3rem 0; }
    [data-callout="info"] { background: #eff6ff; border-left: 4px solid #3b82f6; }
    [data-callout="tip"] { background: #f0fdf4; border-left: 4px solid #22c55e; }
    [data-callout="warning"] { background: #fffbeb; border-left: 4px solid #f59e0b; }
    [data-callout="danger"] { background: #fff1f2; border-left: 4px solid #ef4444; }
    [data-callout] { padding: 1rem 1.5rem; margin: 1.5em 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
${activeProject.content}
</body>
</html>`,
      ],
      { type: 'text/html' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(activeProject.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h2>{activeProject.title}</h2>
        <div className="preview-actions">
          <button className="btn-preview-action" onClick={handleExportPDF} title="Baixar como PDF">
            <Download size={16} />
            <span>PDF</span>
          </button>
          <button className="btn-preview-action" onClick={handleExportHTML} title="Baixar como HTML">
            <Download size={16} />
            <span>HTML</span>
          </button>
          <button className="btn-preview-action" onClick={handleCopyHtml} title="Copiar HTML">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      <div className="preview-container">
        <div id="preview-content-area" className="preview-content">
          <div dangerouslySetInnerHTML={{ __html: activeProject.content }} />
        </div>
      </div>
    </div>
  );
};
