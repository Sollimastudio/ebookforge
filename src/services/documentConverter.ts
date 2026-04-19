import { extractTextFromPdf } from '../utils/pdfProcessor';
import { callOpenRouter, DEFAULT_MODEL, type Message } from './openrouter';
import { resolveOpenRouterApiKey } from '../config/env';

/**
 * Converte um arquivo de qualquer formato (TXT, MD, PDF) para HTML estruturado
 * usando OpenRouter com Claude 3.5 Sonnet
 */

export async function convertDocumentToHtml(
  file: File,
  apiKey: string,
  onProgress?: (message: string) => void
): Promise<string> {
  try {
    const effectiveKey = resolveOpenRouterApiKey(apiKey);
    if (!effectiveKey) {
      throw new Error('Chave OpenRouter não configurada (VITE_OPENROUTER_API_KEY ou chave nas configurações).');
    }

    onProgress?.('📂 Lendo arquivo...');
    
    let rawText = '';
    const filename = file.name.toLowerCase();

    // 1. Extrair texto bruto baseado no tipo de arquivo
    if (filename.endsWith('.pdf')) {
      onProgress?.('📄 Processando PDF...');
      const { fullText } = await extractTextFromPdf(file);
      rawText = fullText;
    } else if (filename.endsWith('.md') || filename.endsWith('.markdown') || filename.endsWith('.txt')) {
      onProgress?.('📝 Lendo texto...');
      rawText = await file.text();
    } else {
      // Tenta ler como texto para outros formatos
      onProgress?.('🔍 Detectando formato...');
      const content = await file.text();
      
      // Tenta JSON primeiro
      try {
        const parsed = JSON.parse(content);
        if (parsed.id && parsed.title && content !== undefined) {
          // É um projeto válido
          return 'JSON_VALID';
        }
      } catch {
        // Não é JSON, trata como texto
        rawText = content;
      }
    }

    // 2. Limpar e validar o texto extraído
    if (!rawText.trim()) {
      throw new Error('Arquivo vazio ou sem conteúdo legível');
    }

    // 3. Enviar para OpenRouter para conversão em HTML estruturado
    onProgress?.('🤖 Convertendo para HTML com IA...');
    
    const messages: Message[] = [
      {
        role: 'system',
        content: `Você é um conversor de documentos especializado em transformar texto em HTML bem estruturado para ebooks.
        
Suas regras:
1. Organize o conteúdo em seções lógicas (use <section> para cada seção)
2. Use <h1> para o título principal (se identificável)
3. Use <h2>, <h3>, etc para subtítulos e subsessões
4. Envolva parágrafos em <p>
5. Use <ul> e <li> para listas com pontos
6. Use <ol> e <li> para listas numeradas
7. Use <blockquote> para citações
8. Use <strong> e <em> para ênfase
9. Mantenha a estrutura e hierarquia original
10. Retorne APENAS HTML válido, sem markdown, sem explicações

Se o documento é Markdown, converta:
- # para <h1>
- ## para <h2>
- - para <li> (em <ul>)
- > para <blockquote>
- **texto** para <strong>texto</strong>
- *texto* para <em>texto</em>

Se o documento é texto puro, organize em parágrafos e seções significativas.`,
        
      },
      {
        role: 'user',
        content: `Converta este documento para HTML bem estruturado:

---
${rawText.substring(0, 50000)}${rawText.length > 50000 ? '\n\n[... documento continua ...]' : ''}
---

Responda com HTML válido pronto para ser usado em um editor WYSIWYG.`
      }
    ];

    const htmlContent = await callOpenRouter(messages, {
      apiKey: effectiveKey,
      model: DEFAULT_MODEL,
      timeout: 180000,
      maxTokens: 16384,
    });

    // 4. Sanitizar e validar o HTML retornado
    if (!htmlContent.trim()) {
      throw new Error('Conversão resultou em conteúdo vazio');
    }

    // Remove possíveis blocos de código markdown que a IA pode ter incluído
    const cleanHtml = htmlContent
      .replace(/^```html?\n?/gim, '')
      .replace(/^```\n?/gim, '')
      .replace(/```$/gim, '')
      .trim();

    onProgress?.('✅ Conversão concluída!');
    return cleanHtml;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao converter documento: ${message}`);
  }
}

/**
 * Detecta se um arquivo é JSON válido
 */
export function isValidProjectJson(content: string): boolean {
  try {
    const data = JSON.parse(content);
    return !!(data.id && data.title && data.content !== undefined);
  } catch {
    return false;
  }
}

/**
 * Extrai o tipo de arquivo e retorna um título sugestivo
 */
export function extractFileTitle(filename: string): string {
  // Remove extensão e caracteres especiais
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  // Converte para título case
  return nameWithoutExt
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, 100); // Limita a 100 caracteres
}
