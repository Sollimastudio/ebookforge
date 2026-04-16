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
Você é um Editor Sênior especializado em transformar manuscritos em ebooks de alto impacto.
Analise o manuscrito abaixo com atenção total. Sua primeira tarefa é IDENTIFICAR O FORMATO DO CONTEÚDO.

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
      "date_label": "Dia 1 / Segunda-feira / 01 de Janeiro (use o que aparece no manuscrito)"
    }
  ]
}
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
    <p>Narrativa principal do dia — preserve a VOZ do autor. Seja específico, humano, presente.</p>

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
2. Se o dia tem data específica, use-a no badge.
3. Se não houver "momento do dia" claro, use um insight relevante.
4. Saída: APENAS o HTML. Zero texto fora do HTML.
`,

  /**
   * Template: CAPÍTULO TRADICIONAL
   */
  WRITE_CHAPTER: (
    entry: BlueprintEntry,
    context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite. Escreva o capítulo "${entry.title}" do ebook "${bookTitle}".

BRIEFING:
- Objetivo: ${entry.summary}
- Tópicos obrigatórios: ${entry.key_topics.join(', ')}
- Tom: ${entry.tone}

MATERIAL-BASE DO MANUSCRITO:
---
${context}
---

ESTRUTURA HTML:

<h2>${entry.title}</h2>

<p>Parágrafo de abertura forte que captura imediatamente a atenção.</p>

<h3>Subtítulo Interno</h3>
<p>Desenvolvimento com substância — mínimo 500 palavras totais. Use exemplos concretos do manuscrito.</p>

<div class="callout callout-insight">
  <strong>💡 Insight-Chave</strong>
  <p>Um insight transformador que muda a perspectiva do leitor.</p>
</div>

<ul>
  <li><strong>Conceito:</strong> explicação</li>
</ul>

<blockquote>
  <p>Frase de alto impacto que sintetiza o capítulo.</p>
</blockquote>

<div class="callout callout-action">
  <strong>⚡ Coloque em Prática</strong>
  <p>Ação concreta que o leitor pode tomar hoje.</p>
</div>

SAÍDA: Apenas HTML. Zero texto fora do HTML.
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
    <p>Introdução explicando o "porquê" desta etapa ser essencial.</p>

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

SAÍDA: Apenas HTML. Zero texto fora do HTML.
`,

  /**
   * Template: LIÇÃO — para cursos e módulos
   */
  WRITE_LESSON: (
    entry: BlueprintEntry,
    context: string,
    bookTitle: string
  ) => `
Você é um Ghostwriter de elite. Escreva a Lição ${entry.id} de "${bookTitle}": "${entry.title}".

BRIEFING:
- O que o aluno aprende: ${entry.summary}
- Conceitos: ${entry.key_topics.join(', ')}
- Tom: ${entry.tone}

CONTEÚDO DO MANUSCRITO:
---
${context}
---

ESTRUTURA HTML para lições:

<div class="lesson-entry">
  <div class="lesson-header">
    <span class="lesson-number">LIÇÃO ${entry.id}</span>
    <h2 class="lesson-title">${entry.title}</h2>
    <div class="lesson-objectives">
      <strong>📚 O que você vai aprender:</strong>
      <ul>
        <li>Objetivo de aprendizagem 1</li>
        <li>Objetivo de aprendizagem 2</li>
      </ul>
    </div>
  </div>

  <div class="lesson-body">
    <p>Introdução ao conceito principal da lição.</p>
    <h3>O Conceito</h3>
    <p>Explicação aprofundada com exemplos concretos do manuscrito.</p>

    <div class="callout callout-insight">
      <strong>💡 Conceito-Chave</strong>
      <p>A definição ou ideia central que o aluno deve memorizar.</p>
    </div>

    <h3>Na Prática</h3>
    <p>Como aplicar este conceito no dia a dia.</p>
  </div>

  <div class="lesson-exercise">
    <strong>✏️ Exercício</strong>
    <p>Uma atividade prática para fixar o aprendizado desta lição.</p>
  </div>
</div>

SAÍDA: Apenas HTML. Zero texto fora do HTML.
`,

  /**
   * Introdução adaptada ao formato
   */
  WRITE_INTRO: (blueprint: string, context: string) => `
Você é um Ghostwriter de elite. Escreva a INTRODUÇÃO do ebook descrito abaixo.
Adapte o tom e a promessa ao formato do conteúdo identificado no blueprint.

ESTRUTURA DO LIVRO (JSON):
${blueprint}

CONTEXTO DO MANUSCRITO:
${context}

HTML DA INTRODUÇÃO:
<h2>Introdução</h2>
<p>Abertura que faz o leitor se sentir visto e compreendido pela situação que o trouxe até aqui.</p>
<p>O que este livro é, como foi criado, e o que o leitor vai viver ao longo das páginas.</p>
<div class="callout callout-insight">
  <strong>📖 Como usar este livro</strong>
  <p>Instrução específica sobre como ler/usar o conteúdo — adaptada ao formato (ex: 'Leia um dia de cada vez', 'Siga as etapas na ordem', etc.)</p>
</div>
<p>Encerramento convidando o leitor a começar agora.</p>

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
`
};
