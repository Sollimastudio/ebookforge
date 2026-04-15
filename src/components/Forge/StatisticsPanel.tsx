import { BookOpen, Clock, Type, Hash } from 'lucide-react';

interface StatisticsPanelProps {
  content: string;
}

export const StatisticsPanel = ({ content }: StatisticsPanelProps) => {
  // Remover tags HTML e extrair texto limpo
  const textContent = (() => {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div.textContent || '';
  })();

  // Contar palavras
  const wordCount = textContent
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;

  // Contar caracteres (com e sem espaços)
  const charCount = textContent.length;
  const charCountNoSpaces = textContent.replace(/\s/g, '').length;

  // Contar parágrafos
  const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
  const paragraphs = (content.match(paragraphRegex) || []).length;

  // Contar headings
  const headingRegex = /<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi;
  const headings = (content.match(headingRegex) || []).length;

  // Contar imagens
  const imageRegex = /<img[^>]*>/gi;
  const images = (content.match(imageRegex) || []).length;

  // Estimar tempo de leitura (média 200 palavras/minuto)
  const readingTimeMinutes = Math.ceil(wordCount / 200);
  const readingTimeDisplay =
    readingTimeMinutes < 1
      ? 'Menos de 1 min'
      : `${readingTimeMinutes} min`;

  // Densidade de imagens (por 1000 palavras)
  const imageDensity = wordCount > 0 ? ((images / wordCount) * 1000).toFixed(1) : '0';

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <BookOpen size={16} />
        <h3>Estatísticas</h3>
      </div>

      <div className="stats-grid">
        {/* Palavras */}
        <div className="stat-item">
          <div className="stat-label">
            <Type size={14} />
            <span>Palavras</span>
          </div>
          <div className="stat-value">{wordCount.toLocaleString()}</div>
          <div className="stat-sublabel">{charCountNoSpaces.toLocaleString()} caracteres</div>
        </div>

        {/* Caracteres */}
        <div className="stat-item">
          <div className="stat-label">
            <Hash size={14} />
            <span>Total</span>
          </div>
          <div className="stat-value">{charCount.toLocaleString()}</div>
          <div className="stat-sublabel">com espaços</div>
        </div>

        {/* Tempo de Leitura */}
        <div className="stat-item">
          <div className="stat-label">
            <Clock size={14} />
            <span>Leitura</span>
          </div>
          <div className="stat-value">{readingTimeDisplay}</div>
          <div className="stat-sublabel">@ 200 pal/min</div>
        </div>

        {/* Estrutura */}
        <div className="stat-item">
          <div className="stat-label">
            <span>🏗️ Estrutura</span>
          </div>
          <div className="stat-value">{headings}</div>
          <div className="stat-sublabel">títulos</div>
        </div>
      </div>

      {/* Detalhes Expandidos */}
      <div className="stats-details">
        <div className="detail-row">
          <span className="detail-label">Parágrafos</span>
          <span className="detail-value">{paragraphs}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Imagens</span>
          <span className="detail-value">{images}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Imagens/1K pal</span>
          <span className="detail-value">{imageDensity}</span>
        </div>
      </div>

      {/* Insights */}
      {wordCount > 0 && (
        <div className="stats-insights">
          <div className="insight-badge">
            {wordCount < 1000 ? '📝 Fragmento' : wordCount < 5000 ? '📖 Artigo' : wordCount < 20000 ? '📚 Novela' : '📕 Romance'}
          </div>
          {images === 0 && wordCount > 1000 && (
            <div className="insight-badge warning">
              ⚠️ Sem imagens
            </div>
          )}
        </div>
      )}
    </div>
  );
};
