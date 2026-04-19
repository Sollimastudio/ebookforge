import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Worker local via Vite ?url — sem dependência de CDN externo
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ExtractedText {
  fullText: string;
  pages: string[];
}

/**
 * Extrai todo o texto de um arquivo PDF.
 * Lança erros amigáveis para PDFs de imagem ou corrompidos.
 */
export async function extractTextFromPdf(file: File): Promise<ExtractedText> {
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (err) {
    console.error('[pdfProcessor] Falha ao ler o arquivo:', err);
    throw new Error('Não foi possível ler o arquivo PDF. Verifique se o ficheiro não está corrompido.');
  }

  let pdf: pdfjs.PDFDocumentProxy;
  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
  } catch (err) {
    console.error('[pdfProcessor] Falha ao carregar o documento PDF:', err);
    throw new Error('Falha ao abrir o PDF. Certifique-se de que é um arquivo PDF válido e não está protegido por senha.');
  }

  console.log(`[pdfProcessor] PDF aberto: ${pdf.numPages} página(s) — "${file.name}"`);

  let fullText = '';
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      pages.push(pageText);
      fullText += `\n--- PÁGINA ${i} ---\n${pageText}`;
    } catch (err) {
      console.error(`[pdfProcessor] Erro ao extrair texto da página ${i}:`, err);
      pages.push('');
      fullText += `\n--- PÁGINA ${i} --- [erro na extração]\n`;
    }
  }

  const extractedChars = fullText.replace(/\s/g, '').length;
  console.log(`[pdfProcessor] Extração concluída: ${extractedChars} caracteres de conteúdo real.`);

  if (extractedChars < 50) {
    throw new Error(
      'Este PDF parece ser uma imagem. Por favor, use um PDF com camada de texto ou cole o conteúdo manualmente.'
    );
  }

  return { fullText, pages };
}
