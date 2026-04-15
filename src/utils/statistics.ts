/**
 * Statistics utilities for ebook content analysis
 */

export interface ContentStats {
  wordCount: number;
  charCount: number;
  paragraphs: number;
  headings: number;
  images: number;
  readingTimeMinutes: number;
  imageDensity: number;
  contentType: 'Fragment' | 'Article' | 'Novela' | 'Romance';
  warnings: string[];
}

/**
 * Extract text content from HTML
 */
export function extractTextFromHTML(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text: string): number {
  return text.length;
}

/**
 * Count paragraphs in HTML
 */
export function countParagraphs(html: string): number {
  const matches = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  return matches ? matches.length : 0;
}

/**
 * Count headings in HTML
 */
export function countHeadings(html: string): number {
  const matches = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi);
  return matches ? matches.length : 0;
}

/**
 * Count images in HTML
 */
export function countImages(html: string): number {
  const matches = html.match(/<img[^>]*>/gi);
  return matches ? matches.length : 0;
}

/**
 * Calculate reading time in minutes (200 words per minute)
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

/**
 * Calculate image density (images per 1000 words)
 */
export function calculateImageDensity(images: number, wordCount: number): number {
  return wordCount > 0 ? Math.round((images / wordCount) * 1000 * 100) / 100 : 0;
}

/**
 * Classify content type based on word count
 */
export function classifyContentType(wordCount: number): 'Fragment' | 'Article' | 'Novela' | 'Romance' {
  if (wordCount < 1000) return 'Fragment';
  if (wordCount < 5000) return 'Article';
  if (wordCount < 20000) return 'Novela';
  return 'Romance';
}

/**
 * Generate warnings based on content analysis
 */
export function generateWarnings(stats: ContentStats): string[] {
  const warnings: string[] = [];

  if (stats.images === 0 && stats.wordCount > 1000) {
    warnings.push('⚠️ Nenhuma imagem encontrada. Considere adicionar imagens para enriquecer o conteúdo.');
  }

  if (stats.headings === 0) {
    warnings.push('ℹ️ Nenhum título encontrado. Adicione títulos (H1, H2, H3) para melhorar a estrutura.');
  }

  if (stats.paragraphs === 0) {
    warnings.push('⚠️ Nenhum parágrafo encontrado. O conteúdo pode estar mal formatado.');
  }

  if (stats.wordCount < 100) {
    warnings.push('ℹ️ Conteúdo muito curto. Considere expandir para uma leitura mais completa.');
  }

  return warnings;
}

/**
 * Calculate comprehensive content statistics
 */
export function calculateContentStats(html: string): ContentStats {
  const text = extractTextFromHTML(html);

  const wordCount = countWords(text);
  const charCount = countCharacters(text);
  const paragraphs = countParagraphs(html);
  const headings = countHeadings(html);
  const images = countImages(html);
  const readingTimeMinutes = calculateReadingTime(wordCount);
  const imageDensity = calculateImageDensity(images, wordCount);
  const contentType = classifyContentType(wordCount);

  const stats: ContentStats = {
    wordCount,
    charCount,
    paragraphs,
    headings,
    images,
    readingTimeMinutes,
    imageDensity,
    contentType,
    warnings: []
  };

  stats.warnings = generateWarnings(stats);

  return stats;
}

/**
 * Format number with locale
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Format reading time
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return 'Menos de 1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

/**
 * Format image density
 */
export function formatImageDensity(density: number): string {
  return `${density} img/1000 palavras`;
}