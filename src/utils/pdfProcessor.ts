import * as pdfjs from 'pdfjs-dist';

// Configuração do worker para o ambiente web do Vite
// Usamos a versão do CDN para garantir compatibilidade sem configuração complexa de build
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export interface ExtractedText {
  fullText: string;
  pages: string[];
}

/**
 * Extrai todo o texto de um arquivo PDF.
 */
export async function extractTextFromPdf(file: File): Promise<ExtractedText> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    pages.push(pageText);
    fullText += `\n--- PÁGINA ${i} ---\n${pageText}`;
  }

  return { fullText, pages };
}
