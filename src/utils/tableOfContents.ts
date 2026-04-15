/**
 * Table of Contents utilities for ebook content
 */

export interface TOCEntry {
  id: string;
  level: number;
  title: string;
  anchor?: string;
}

/**
 * Extract headings from HTML content
 */
export function extractHeadings(html: string): TOCEntry[] {
  const entries: TOCEntry[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1]);
    const title = heading.textContent || `Heading ${index + 1}`;
    const anchor = heading.id || `heading-${index}`;

    entries.push({
      id: `toc-${index}`,
      level,
      title: title.trim(),
      anchor
    });
  });

  return entries;
}

/**
 * Generate HTML for table of contents
 */
export function generateTOCHTML(entries: TOCEntry[]): string {
  if (entries.length === 0) {
    return '<p><em>Nenhum título encontrado no documento.</em></p>';
  }

  let html = '<h2>Sumário</h2>\n<ol>\n';

  entries.forEach((entry) => {
    const indent = '  '.repeat(Math.max(0, entry.level - 1));
    const anchorLink = entry.anchor ? ` id="${entry.anchor}"` : '';
    html += `${indent}<li><a href="#${entry.anchor || entry.id}"${anchorLink}>${entry.title}</a></li>\n`;
  });

  html += '</ol>';
  return html;
}

/**
 * Generate plain text table of contents
 */
export function generateTOCPlainText(entries: TOCEntry[]): string {
  if (entries.length === 0) {
    return 'Nenhum título encontrado no documento.';
  }

  let text = 'SUMÁRIO\n\n';

  entries.forEach((entry, index) => {
    const indent = '  '.repeat(Math.max(0, entry.level - 1));
    text += `${indent}${index + 1}. ${entry.title}\n`;
  });

  return text;
}

/**
 * Generate Markdown table of contents
 */
export function generateTOCMarkdown(entries: TOCEntry[]): string {
  if (entries.length === 0) {
    return '*Nenhum título encontrado no documento.*';
  }

  let markdown = '# Sumário\n\n';

  entries.forEach((entry, index) => {
    const indent = '  '.repeat(Math.max(0, entry.level - 1));
    const link = `[${entry.title}](#${entry.anchor || entry.id})`;
    markdown += `${indent}${index + 1}. ${link}\n`;
  });

  return markdown;
}

/**
 * Add anchor IDs to headings in HTML
 */
export function addAnchorsToHeadings(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
  });

  return doc.body.innerHTML;
}

/**
 * Validate table of contents structure
 */
export function validateTOCStructure(entries: TOCEntry[]): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (entries.length === 0) {
    issues.push('Nenhum título encontrado');
  }

  // Check for missing H1
  const hasH1 = entries.some(entry => entry.level === 1);
  if (!hasH1 && entries.length > 0) {
    issues.push('Documento não possui título principal (H1)');
  }

  // Check for level skips
  for (let i = 1; i < entries.length; i++) {
    const currentLevel = entries[i].level;
    const previousLevel = entries[i - 1].level;

    if (currentLevel > previousLevel + 1) {
      issues.push(`Salto de nível em "${entries[i].title}" (H${previousLevel} → H${currentLevel})`);
    }
  }

  // Check for empty titles
  const emptyTitles = entries.filter(entry => !entry.title.trim());
  if (emptyTitles.length > 0) {
    issues.push(`${emptyTitles.length} título(s) vazio(s) encontrado(s)`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Get table of contents statistics
 */
export function getTOCStats(entries: TOCEntry[]): {
  totalHeadings: number;
  maxDepth: number;
  averageTitleLength: number;
  headingsByLevel: Record<number, number>;
} {
  const headingsByLevel: Record<number, number> = {};

  entries.forEach(entry => {
    headingsByLevel[entry.level] = (headingsByLevel[entry.level] || 0) + 1;
  });

  const totalHeadings = entries.length;
  const maxDepth = Math.max(...entries.map(e => e.level), 0);
  const averageTitleLength = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + e.title.length, 0) / entries.length)
    : 0;

  return {
    totalHeadings,
    maxDepth,
    averageTitleLength,
    headingsByLevel
  };
}