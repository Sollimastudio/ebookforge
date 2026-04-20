/**
 * Prompts especializados — Motor de Ghostwriting de Elite
 * Detecta o formato do conteúdo e aplica o template visual correto.
 */

export type ContentFormat =
  | 'daily_entries'   // diário, desafio de dias, devocional
  | 'chapters'        // livro por capítulos
  | 'steps'           // processo, método, passo a passo
  | 'timeline'        // cronologia, história, evolução
  | 'lessons'         // curso, módulos, aprendizados
  | 'sections';       // seções temáticas genéricas

export interface BlueprintEntry {
  id: number;
  title: string;
  summary: string;
  key_topics: string[];
  tone: string;
  // Para daily_entries:
  day_number?: number;
  date_label?: string;
  // Para steps:
  step_number?: number;
  // Enriquecimento premium:
  has_insight?: boolean;
  insight_prompt?: string;
  has_exercise?: boolean;
  exercise_type?: string;
}

export interface Blueprint {
  title: string;
  subtitle: string;
  author_note?: string;
  content_format: ContentFormat;
  format_hint: string; // dica do que o leitor pode esperar visualmente
  entries: BlueprintEntry[];
}

export const GhostwriterPrompts = {

  /**
   * FASE 1 — Análise do manuscrito + detecção de formato + blueprint
   */
  CREATE_BLUEPRINT: (text: string) => `
Você é um Editor Sênior de Publicações Premium especializado em transformar manuscritos em ebooks de qualidade best-seller.
Analise o manuscrito abaixo com atenção total. Sua primeira tarefa é IDENTIFICAR O FORMATO DO CONTEÚDO e preparar uma estrutura de QUALIDADE PREMIUM.

CRITÉRIOS DE QUALIDADE PREMIUM OBRIGATÓRIA:
- Conteúdo completo, sem resumos ou abreviações
- Estrutura sofisticada e profissional
- Sem erros gramaticais ou ortográficos
- Diagramação clara e elegante
- Títulos e subtítulos bem marcados
- Estética de leitura super agradável
- Potencial de best-seller

FORMATOS POSSÍVEIS:
- "daily_entries": O conteúdo é organizado por dias (Dia 1, Dia 2, Segunda-feira...), diário, devocional, desafio de X dias
- "chapters": Capítulos tradicionais com narrativa contínua
- "steps": Processo, método, tutorial, passo a passo numerado
- "timeline": Cronologia, história, fases de evolução
- "lessons": Aulas, módulos, lições numeradas
- "sections": Seções temáticas sem ordem específica

INSTRUÇÃO CRÍTICA: Leia TODO o manuscrito. Identifique o padrão estrutural real do conteúdo.
Se o autor organiza por dias ou datas, use "daily_entries". Se há "Dia X", "Day X", datas explícitas, ou qualquer estrutura diária, OBRIGATORIAMENTE use "daily_entries".

MANUSCRITO COMPLETO:
---
${text}
---

Responda EXCLUSIVAMENTE com JSON válido. Zero texto fora do JSON:
{
  "title": "Título magnético e curto (max 8 palavras)",
  "subtitle": "Subtítulo que promete transformação específica",
  "author_note": "Frase sobre a perspectiva/voz do autor",
  "content_format": "daily_entries | chapters | steps | timeline | lessons | sections",
  "format_hint": "Uma frase descrevendo a experiência visual do leitor (ex: 'Uma jornada de 30 dias com reflexões diárias')",
  "entries": [
    {
      "id": 1,
      "title": "Título da entrada",
      "summary": "O que acontece/é aprendido nesta entrada (2-3 frases)",
      "key_topics": ["tema 1", "tema 2"],
      "tone": "inspirador | reflexivo | pragmático | revelador | desafiador",
      "day_number": 1,
      "date_label": "Dia 1 / Segunda-feira / 01 de Janeiro (use o que aparece no manuscrito)",
      "has_insight": true,
      "insight_prompt": "Uma frase que captura o insight pessoal do autor nesta entrada (max 20 palavras)",
      "has_exercise": false,
      "exercise_type": "reflexão | lista | ação | nenhum"
    }
  ]
}

INSTRUÇÕES ADICIONAIS:
- "has_insight": true se o autor compartilha uma perspectiva pessoal, revelação ou aprendizado profundo
- "insight_prompt": escreva a essência desse insight em uma frase (será usada para gerar o bloco 'Insight do Autor')
- "has_exercise": true se o conteúdo permite um exercício prático ou reflexão guiada para o leitor
- "exercise_type": que tipo de exercício/atividade faz mais sentido para esta entrada
`,

  // ── TEMPLATES POR FORMATO ──────────────────────────────────────────────

  /**
   * Template: ENTRADA DIÁRIA — para diários, desafios, devocionais
   */
  WRITE_DAILY_ENTRY: (
    entry: BlueprintEntry,
    context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite. Escreva a entrada "${entry.date_label || `Dia ${entry.day_number}`}" do ebook "${bookTitle}".

BRIEFING DA ENTRADA:
- Tema do dia: ${entry.summary}
- Tópicos: ${entry.key_topics.join(', ')}
- Tom: ${entry.tone}

CONTEÚDO DO MANUSCRITO PARA ESTE DIA:
---
${context}
---

ESTRUTURA HTML OBRIGATÓRIA para entradas diárias:

<div class="day-entry">
  <div class="day-header">
    <span class="day-badge">${entry.date_label || `Dia ${entry.day_number}`}</span>
    <h2 class="day-title">${entry.title}</h2>
    <p class="day-theme">💭 [Uma frase que captura o espírito deste dia — máx 15 palavras]</p>
  </div>

  <div class="day-body">
    <p>Narrativa principal do dia — preserve a VOZ do autor. Seja específico, humano, presente. NÃO RESUMA.</p>

    <div class="day-highlight">
      <span class="highlight-icon">✨</span>
      <div>
        <strong>Momento do Dia</strong>
        <p>O momento, insight ou virada mais importante que aconteceu neste dia.</p>
      </div>
    </div>

    <p>Continue a narrativa com mais detalhes, emoções, aprendizados concretos do manuscrito...</p>

    <!-- Use quando há lista de ações ou observações -->
    <ul class="day-list">
      <li>Item específico do dia</li>
    </ul>

    <!-- Use para citação ou frase forte do autor -->
    <blockquote>
      <p>Frase de impacto do autor ou insight central do dia.</p>
    </blockquote>
  </div>

  <div class="day-footer">
    <div class="day-reflection">
      <strong>🪞 Reflexão</strong>
      <p>Uma pergunta ou afirmação para o leitor internalizar o aprendizado deste dia.</p>
    </div>
  </div>
</div>

REGRAS:
1. Preserve fielmente o conteúdo e voz do autor. Não invente fatos.
2. NÃO RESUMA. Mantenha a profundidade original.
3. Se o dia tem data específica, use-a no badge.
4. Se não houver "momento do dia" claro, use um insight relevante.
5. Saída: APENAS o HTML. Zero texto fora do HTML.
`,

  /**
   * Template: CAPÍTULO TRADICIONAL
   */
  WRITE_CHAPTER: (
    entry: BlueprintEntry,
    context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite especializado em publicações de qualidade best-seller. Escreva o capítulo "${entry.title}" do ebook "${bookTitle}" com QUALIDADE PREMIUM.

CRITÉRIOS DE QUALIDADE PREMIUM OBRIGATÓRIA:
- Conteúdo COMPLETO e DETALHADO (mínimo 800 palavras se o manuscrito permitir)
- Sem resumos ou abreviações
- Estrutura sofisticada com múltiplos níveis de subtítulos
- Sem erros gramaticais ou ortográficos
- Diagramação clara e elegante
- Voz do autor preservada e amplificada
- Potencial de best-seller

BRIEFING:
- Objetivo: ${entry.summary}
- Tópicos obrigatórios: ${entry.key_topics.join(', ')}
- Tom: ${entry.tone}
${entry.has_insight ? `- Insight do autor a destacar: "${entry.insight_prompt}"` : ''}
${entry.has_exercise ? `- Incluir exercício de fixação do tipo: ${entry.exercise_type}` : ''}

MATERIAL-BASE DO MANUSCRITO:
---
${context}
---

ESTRUTURA HTML OBRIGATÓRIA (use exatamente estas classes CSS):

<h2>${entry.title}</h2>

<p>Parágrafo de abertura forte que captura imediatamente a atenção do leitor com profundidade e elegância.</p>

<h3>Subtítulo Interno</h3>
<p>Desenvolvimento com substância. Use exemplos concretos, estudos de caso e insights do manuscrito. Mantenha a voz do autor e adicione sofisticação profissional. NÃO RESUMA.</p>

<div class="premium-callout callout-insight">
  <strong>💡 Insight-Chave</strong>
  <p>Um insight transformador extraído do manuscrito que muda a perspectiva do leitor.</p>
</div>

<p>Mais conteúdo detalhado aqui...</p>

<ul>
  <li><strong>Conceito:</strong> explicação clara e específica</li>
</ul>

<blockquote>
  <p>Frase de alto impacto que sintetiza o capítulo — preserve a voz do autor.</p>
</blockquote>

${entry.has_insight ? `
<div class="author-insight-box">
  <strong>✍️ Insight do Autor</strong>
  <p>Perspectiva pessoal do autor sobre este tema — sua visão única, experiência vivida ou descoberta que ninguém mais poderia compartilhar.</p>
</div>
` : ''}

<div class="action-step">
  <strong>⚡ Coloque em Prática</strong>
  <p>A ação mais concreta e específica que o leitor pode executar hoje para aplicar este capítulo.</p>
</div>

${entry.has_exercise ? `
<div class="fixation-exercise">
  <strong>✏️ Exercício de Fixação</strong>
  <p>Uma atividade prática (${entry.exercise_type}) que solidifica o aprendizado deste capítulo.</p>
</div>
` : ''}

SAÍDA: Apenas HTML. Zero texto fora do HTML. Use as classes CSS exatamente como especificadas acima.
`,

  /**
   * Template: PASSO/ETAPA — para métodos e processos
   */
  WRITE_STEP: (
    entry: BlueprintEntry,
    context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite. Escreva a Etapa ${entry.step_number || entry.id} de "${bookTitle}": "${entry.title}".

BRIEFING:
- O que o leitor aprende/faz: ${entry.summary}
- Componentes: ${entry.key_topics.join(', ')}
- Tom: ${entry.tone}

CONTEÚDO DO MANUSCRITO:
---
${context}
---

ESTRUTURA HTML para etapas:

<div class="step-entry">
  <div class="step-header">
    <span class="step-number">ETAPA ${entry.step_number || entry.id}</span>
    <h2 class="step-title">${entry.title}</h2>
    <p class="step-goal">🎯 [Resultado que o leitor terá ao concluir esta etapa]</p>
  </div>

  <div class="step-body">
    <p>Introdução detalhada explicando o "porquê" desta etapa ser essencial. NÃO RESUMA.</p>

    <h3>Como Fazer</h3>
    <ol class="step-list">
      <li><strong>Ação 1:</strong> instrução específica e clara</li>
      <li><strong>Ação 2:</strong> instrução específica e clara</li>
    </ol>

    <div class="callout callout-insight">
      <strong>⚠️ Ponto de Atenção</strong>
      <p>O erro mais comum nesta etapa e como evitá-lo.</p>
    </div>

    <blockquote>
      <p>Frase do autor sobre o impacto desta etapa.</p>
    </blockquote>
  </div>

  <div class="step-check">
    <strong>✅ Checklist da Etapa</strong>
    <ul>
      <li>☐ Item verificável 1</li>
      <li>☐ Item verificável 2</li>
    </ul>
  </div>
</div>

SAÍDA: Apenas HTML.
`,

  /**
   * Template: LIÇÃO — para cursos e aprendizados
   */
  WRITE_LESSON: (
    entry: BlueprintEntry,
    context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite. Escreva a Lição ${entry.id}: "${entry.title}" para o ebook "${bookTitle}".

BRIEFING:
- Objetivo: ${entry.summary}
- Tópicos: ${entry.key_topics.join(', ')}
- Tom: ${entry.tone}

CONTEÚDO DO MANUSCRITO:
---
${context}
---

ESTRUTURA HTML para lições:

<div class="lesson-entry">
  <div class="lesson-header">
    <span class="lesson-label">LIÇÃO ${entry.id}</span>
    <h2 class="lesson-title">${entry.title}</h2>
  </div>

  <div class="lesson-body">
    <p>Conceito fundamental da lição. Explique com profundidade, sem resumos.</p>

    <div class="lesson-takeaway">
      <strong>💡 O que você vai aprender</strong>
      <p>O principal ganho desta lição.</p>
    </div>

    <p>Desenvolvimento completo do conteúdo...</p>

    <div class="lesson-example">
      <strong>📖 Exemplo Prático</strong>
      <p>Um caso real ou exemplo do manuscrito que ilustra a lição.</p>
    </div>

    <blockquote>
      <p>Frase de impacto da lição.</p>
    </blockquote>
  </div>

  <div class="lesson-summary">
    <strong>📌 Resumo da Lição</strong>
    <ul>
      <li>Ponto chave 1</li>
      <li>Ponto chave 2</li>
    </ul>
  </div>
</div>

SAÍDA: Apenas HTML.
`,

  /**
   * Template: TIMELINE/FASE — para evolução e história
   */
  WRITE_TIMELINE: (
    entry: BlueprintEntry,
    _context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite. Escreva a Fase/Evento: "${entry.title}" para o ebook "${bookTitle}".

ESTRUTURA HTML para timeline:

<div class="timeline-entry">
  <div class="timeline-marker"></div>
  <div class="timeline-content">
    <span class="timeline-date">${entry.date_label || `Fase ${entry.id}`}</span>
    <h2 class="timeline-title">${entry.title}</h2>
    <p class="timeline-desc">${entry.summary}</p>
    
    <div class="timeline-body">
      <p>Narrativa detalhada do que aconteceu nesta fase. NÃO RESUMA.</p>
      
      <div class="timeline-impact">
        <strong>💥 O Impacto</strong>
        <p>Como este evento mudou o curso da história/projeto.</p>
      </div>
      
      <blockquote>
        <p>Frase do autor sobre este momento.</p>
      </blockquote>
    </div>
  </div>
</div>

SAÍDA: Apenas HTML.
`,

  /**
   * Template: SEÇÃO TEMÁTICA — genérico
   */
  WRITE_SECTION: (
    entry: BlueprintEntry,
    _context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite. Escreva a seção "${entry.title}" do ebook "${bookTitle}".

ESTRUTURA HTML para seções:

<section class="theme-section">
  <h2 class="section-title">${entry.title}</h2>
  <p class="section-intro">${entry.summary}</p>
  
  <div class="section-body">
    <p>Conteúdo completo e detalhado da seção. Use múltiplos parágrafos, subtítulos H3 e H4. NÃO RESUMA.</p>
    
    <div class="premium-callout">
      <strong>⭐ Destaque</strong>
      <p>Um ponto de extrema importância nesta seção.</p>
    </div>
    
    <p>Mais detalhes do manuscrito...</p>
    
    <blockquote>
      <p>Frase de impacto da seção.</p>
    </blockquote>
  </div>
</section>

SAÍDA: Apenas HTML.
`,

  WRITE_INTRO: (blueprint: string, context: string) => `
Você é um Ghostwriter de elite. Escreva a INTRODUÇÃO do ebook descrito abaixo.
ESTRUTURA DO LIVRO (JSON):
${blueprint}
CONTEXTO INICIAL DO MANUSCRITO:
${context}
HTML DA INTRODUÇÃO:
<h1>Introdução</h1>
<p>Abertura impactante que estabelece a promessa do livro.</p>
<div class="callout callout-welcome">
  <strong>👋 Bem-vindo à Jornada</strong>
  <p>Uma mensagem acolhedora do autor.</p>
</div>
SAÍDA: Apenas HTML. Zero texto fora do HTML.
`,

  WRITE_CONCLUSION: (blueprint: string, context: string) => `
Você é um Ghostwriter de elite. Escreva a CONCLUSÃO do ebook descrito abaixo.
ESTRUTURA DO LIVRO (JSON):
${blueprint}
CONTEXTO FINAL DO MANUSCRITO:
${context}
HTML DA CONCLUSÃO:
<h2>Conclusão: O Que Vem Depois</h2>
<p>Síntese poderosa da jornada que o leitor percorreu.</p>
<blockquote><p>Frase de encerramento de alto impacto do autor.</p></blockquote>
<div class="callout callout-action">
  <strong>🚀 Seu Próximo Passo</strong>
  <p>A ação mais importante que o leitor deve tomar agora.</p>
</div>
SAÍDA: Apenas HTML. Zero texto fora do HTML.
`,

  MARKETING_COPY: (title: string, text: string) => `
Você é um Copywriter de Elite especializado em Páginas de Vendas de alta conversão.
Crie uma Sales Page magnética para o ebook abaixo.
TÍTULO: ${title}
CONTEÚDO: ${text}
... (restante do prompt de marketing)
`,

  MARKETING_CAROUSEL: (title: string, content: string) => `
Você é um Especialista em Conteúdo para Redes Sociais.
Crie um carrossel de 7 slides para o ebook: ${title}.
CONTEÚDO: ${content}
... (restante do prompt de carrossel)
`,

  MARKETING_EMAIL: (title: string, content: string) => `
Você é um Expert em Email Marketing.
Crie um email de lançamento para o ebook: ${title}.
CONTEÚDO: ${content}
... (restante do prompt de email)
`,

  MARKETING_POSTS: (title: string, content: string) => `
Você é um Especialista em Copywriting para Redes Sociais.
Crie 3 posts (Instagram, LinkedIn, X) para o ebook: ${title}.
CONTEÚDO: ${content}
... (restante do prompt de posts)
`
};
