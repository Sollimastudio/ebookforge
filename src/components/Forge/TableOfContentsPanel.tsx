import React, { useMemo } from 'react';
import { Copy } from 'lucide-react';

interface TOCEntry {
  id: string;
  level: number;
  title: string;
}

interface TableOfContentsPanelProps {
  content: string;
  onInsertTOC: (html: string) => void;
}

export const TableOfContentsPanel: React.FC<TableOfContentsPanelProps> = ({
  content,
  onInsertTOC,
}) => {
  // Extract headings from HTML content
  const tocEntries = useMemo(() => {
    const entries: TOCEntry[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1]);
      const title = heading.textContent || `Heading ${index + 1}`;
      entries.push({
        id: `heading-${index}`,
        level,
        title: title.trim(),
      });
    });
    
    return entries;
  }, [content]);

  // Generate TOC HTML
  const generateTOCHTML = () => {
    if (tocEntries.length === 0) {
      return '<p><em>Nenhum título encontrado no documento.</em></p>';
    }

    let html = '<h2>Sumário</h2>\n<ol>\n';
    
    tocEntries.forEach((entry) => {
      const indent = '  '.repeat(Math.max(0, entry.level - 1));
      html += `${indent}<li>${entry.title}</li>\n`;
    });
    
    html += '</ol>';
    return html;
  };

  const handleInsertTOC = () => {
    const tocHTML = generateTOCHTML();
    onInsertTOC(tocHTML);
  };

  return (
    <div className="toc-panel">
      <div className="toc-header">
        <h2 className="toc-title">Sumário do Documento</h2>
        <p className="toc-subtitle">
          {tocEntries.length} {tocEntries.length === 1 ? 'título encontrado' : 'títulos encontrados'}
        </p>
      </div>

      {tocEntries.length > 0 ? (
        <>
          <div className="toc-preview">
            <h3 className="toc-preview-title">Pré-visualização</h3>
            <ul className="toc-list">
              {tocEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="toc-list-item"
                  style={{ paddingLeft: `${(entry.level - 1) * 1.5}rem` }}
                >
                  <span className="toc-bullet">•</span>
                  <span className="toc-text">{entry.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleInsertTOC}
            className="toc-insert-btn"
          >
            <Copy size={16} />
            Inserir Sumário no Documento
          </button>
        </>
      ) : (
        <div className="toc-empty">
          <p>Nenhum título encontrado.</p>
          <p className="toc-empty-hint">
            Adicione alguns títulos (H1, H2, H3...) ao seu documento para gerar um sumário.
          </p>
        </div>
      )}
    </div>
  );
};
