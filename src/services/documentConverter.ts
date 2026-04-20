import { extractTextFromPdf } from '../utils/pdfProcessor';
import { callOpenRouter, DEFAULT_MODEL, type Message } from './openrouter';
import { resolveOpenRouterApiKey } from '../config/env';

/**
 * Extrai texto de um arquivo DOCX (Office Open XML)
 * Requer jszip como dependência
 */
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    // Importa JSZip dinamicamente
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const content = await file.arrayBuffer();
    const zipContent = await zip.loadAsync(content);
    
    // Lê o arquivo document.xml que contém o conteúdo do DOCX
    const xmlFile = zipContent.file('word/document.xml');
    if (!xmlFile) throw new Error('Arquivo DOCX inválido: document.xml não encontrado');
    
    const xmlText = await xmlFile.async('text');
    
    // Extrai apenas o texto, removendo tags XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Extrai todos os elementos de texto <w:t>
    const textElements = xmlDoc.querySelectorAll('w\\:t');
    const textParts: string[] = [];
    
    textElements.forEach(elem => {
      if (elem.textContent) {
        textParts.push(elem.textContent);
      }
    });
    
    return textParts.join(' ');
  } catch (error) {
    throw new Error(`Erro ao processar DOCX: ${error instanceof Error ? error.message : 'Desconhecido'}`);
  }
}

/**
 * Extrai texto de um arquivo EPUB
 */
async function extractTextFromEpub(file: File): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const content = await file.arrayBuffer();
    const zipContent = await zip.loadAsync(content);
    
    // Encontra todos os arquivos XHTML/HTML dentro do EPUB
    const textParts: string[] = [];
    const parser = new DOMParser();
    
    for (const [filename, fileEntry] of Object.entries(zipContent.files)) {
      if ((filename.endsWith('.xhtml') || filename.endsWith('.html')) && !fileEntry.dir) {
        try {
          const xmlText = await fileEntry.async('text');
          const xmlDoc = parser.parseFromString(xmlText, 'text/html');
          
          // Remove scripts e styles
          xmlDoc.querySelectorAll('script, style').forEach(el => el.remove());
          
          // Extrai o texto
          if (xmlDoc.body?.textContent) {
            textParts.push(xmlDoc.body.textContent);
          }
        } catch {}
      }
    }
    
    return textParts.join('\n\n');
  } catch (error) {
    throw new Error(`Erro ao processar EPUB: ${error instanceof Error ? error.message : 'Desconhecido'}`);
  }
}

/**
 * Extrai texto de um arquivo RTF
 */
async function extractTextFromRtf(file: File): Promise<string> {
  try {
    const text = await file.text();
    // Remove controles RTF básicos e retorna o texto limpo
    return text
      .replace(/\{\\\[^{}]*\}/g, '') // Remove comandos RTF
      .replace(/[{}]/g, '')
      .replace(/\\'/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    throw new Error(`Erro ao processar RTF: ${error instanceof Error ? error.message : 'Desconhecido'}`);
  }
}

/**
 * Extrai texto de um arquivo ODT (Open Document Text)
 */
async function extractTextFromOdt(file: File): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const content = await file.arrayBuffer();
    const zipContent = await zip.loadAsync(content);
    
    // Lê o arquivo content.xml que contém o conteúdo do ODT
    const xmlFile = zipContent.file('content.xml');
    if (!xmlFile) throw new Error('Arquivo ODT inválido: content.xml não encontrado');
    
    const xmlText = await xmlFile.async('text');
    
    // Extrai apenas o texto, removendo tags XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Extrai todos os elementos de texto <text:p> (parágrafos)
    const textElements = xmlDoc.querySelectorAll('text\\:p, text\\:span');
    const textParts: string[] = [];
    
    textElements.forEach(elem => {
      if (elem.textContent?.trim()) {
        textParts.push(elem.textContent.trim());
      }
    });
    
    return textParts.join('\n');
  } catch (error) {
    throw new Error(`Erro ao processar ODT: ${error instanceof Error ? error.message : 'Desconhecido'}`);
  }
}

/**
 * Converte um arquivo de qualquer formato (TXT, MD, PDF, DOCX, EPUB, RTF, ODT) para HTML estruturado
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
    } else if (filename.endsWith('.docx')) {
      onProgress?.('📘 Processando DOCX...');
      rawText = await extractTextFromDocx(file);
    } else if (filename.endsWith('.epub')) {
      onProgress?.('📗 Processando EPUB...');
      rawText = await extractTextFromEpub(file);
    } else if (filename.endsWith('.rtf')) {
      onProgress?.('📕 Processando RTF...');
      rawText = await extractTextFromRtf(file);
    } else if (filename.endsWith('.odt')) {
      onProgress?.('📙 Processando ODT...');
      rawText = await extractTextFromOdt(file);
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

    // 3. Enviar para OpenRouter para conversão em HTML estruturado com qualidade premium
    onProgress?.('🤖 Convertendo para HTML com IA (qualidade premium)...');
    
    const messages: Message[] = [
      {
        role: 'system',
        content: `Você é um Editor Sênior de Publicações Premium especializado em transformar manuscritos em HTML de qualidade best-seller para ebooks.

INSTRUÇÕES CRÍTICAS PARA QUALIDADE PREMIUM:
1. Organize o conteúdo em seções lógicas e bem hierarquizadas
2. Use <h1> para o título principal (se identificável)
3. Use <h2>, <h3>, <h4> para subtítulos e subsessões com hierarquia clara
4. Envolva parágrafos em <p> com espaçamento adequado
5. Use <ul> e <li> para listas com pontos (com boa formatação)
6. Use <ol> e <li> para listas numeradas
7. Use <blockquote> para citações e frases de impacto
8. Use <strong> e <em> para ênfase estratégica
9. Mantenha a estrutura e hierarquia original do manuscrito
10. Adicione <section> para agrupar conteúdo relacionado
11. Retorne APENAS HTML válido, sem markdown, sem explicações, sem código

QUALIDADE PREMIUM OBRIGATÓRIA:
- Sem resumos ou abreviações
- Conteúdo completo e detalhado
- Estrutura sofisticada e profissional
- Sem erros gramaticais ou ortográficos
- Diagramação clara e elegante
- Títulos e subtítulos bem marcados
- Estética de leitura super agradável

Se o documento é Markdown, converta:
- # para <h1>
- ## para <h2>
- ### para <h3>
- - para <li> (em <ul>)
- > para <blockquote>
- **texto** para <strong>texto</strong>
- *texto* para <em>texto</em>

Se o documento é texto puro, organize em parágrafos e seções significativas com hierarquia clara.`,
        
      },
      {
        role: 'user',
        content: `Converta este documento para HTML bem estruturado com qualidade premium (best-seller):

---
${rawText.substring(0, 50000)}${rawText.length > 50000 ? '\n\n[... documento continua ...]' : ''}
---

Responda com HTML válido pronto para ser usado em um editor WYSIWYG. Qualidade premium obrigatória: completo, sem resumos, estrutura sofisticada, sem erros.`
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

    onProgress?.('✅ Conversão concluída com qualidade premium!');
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
