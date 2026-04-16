import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Usa o worker local do pacote via Vite ?url — sem dependência de CDN
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

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
