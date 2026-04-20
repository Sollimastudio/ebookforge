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
Você é um Ghostwriter de elite especializado em publicações de qualidade best-seller. Escreva o capítulo "${entry.title}" do ebook "${bookTitle}" com QUALIDADE PREMIUM.

CRITÉRIOS DE QUALIDADE PREMIUM OBRIGATÓRIA:
- Conteúdo COMPLETO e DETALHADO (mínimo 800 palavras)
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
<p>Desenvolvimento com substância — mínimo 800 palavras totais. Use exemplos concretos, estudos de caso e insights do manuscrito. Mantenha a voz do autor e adicione sofisticação profissional.</p>

<div class="premium-callout callout-insight">
  <strong>💡 Insight-Chave</strong>
  <p>Um insight transformador extraído do manuscrito que muda a perspectiva do leitor.</p>
</div>

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
${entry.has_insight ? `- Insight do autor a destacar: "${entry.insight_prompt}"` : ''}
${entry.has_exercise ? `- Tipo de exercício de fixação: ${entry.exercise_type}` : ''}

CONTEÚDO DO MANUSCRITO:
---
${context}
---

ESTRUTURA HTML OBRIGATÓRIA para lições (use exatamente estas classes CSS):

<div class="lesson-entry">
  <div class="lesson-header">
    <span class="lesson-number">LIÇÃO ${entry.id}</span>
    <h2 class="lesson-title">${entry.title}</h2>
    <div class="lesson-objectives">
      <strong>📚 O que você vai aprender:</strong>
      <ul>
        <li>Objetivo de aprendizagem 1 — concreto e mensurável</li>
        <li>Objetivo de aprendizagem 2 — concreto e mensurável</li>
      </ul>
    </div>
  </div>

  <div class="lesson-body">
    <p>Introdução envolvente ao conceito principal — por que este tópico importa para o aluno.</p>

    <h3>O Conceito</h3>
    <p>Explicação aprofundada com exemplos concretos do manuscrito.</p>

    <div class="premium-callout callout-insight">
      <strong>💡 Conceito-Chave</strong>
      <p>A definição ou ideia central que o aluno deve internalizar — em uma frase memorável.</p>
    </div>

    <h3>Na Prática</h3>
    <p>Como aplicar este conceito no dia a dia — exemplos reais e situações concretas.</p>

    ${entry.has_insight ? `
    <div class="author-insight-box">
      <strong>✍️ Perspectiva do Autor</strong>
      <p>O ponto de vista único do autor sobre este conceito — sua experiência ou aprendizado que vai além da teoria.</p>
    </div>
    ` : ''}

    <div class="action-step">
      <strong>⚡ Passo de Ação</strong>
      <p>A aplicação imediata mais importante desta lição — o que o aluno deve fazer nas próximas 24 horas.</p>
    </div>
  </div>

  <div class="fixation-exercise">
    <strong>✏️ Exercício de Fixação</strong>
    <p>Atividade prática (${entry.exercise_type || 'reflexão'}) para consolidar o aprendizado desta lição. Seja específico e acionável.</p>
  </div>
</div>

SAÍDA: Apenas HTML. Zero texto fora do HTML. Use as classes CSS exatamente como especificadas acima.
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

  // ── PROMPTS DE MARKETING ─────────────────────────────────────────────────

  /**
   * Copy de Vendas — página de vendas completa para o ebook
   */
  MARKETING_COPY: (title: string, content: string) => `
Você é um Copywriter de Elite especializado em ebooks e infoprodutos digitais.
Crie uma página de vendas completa e persuasiva para o ebook abaixo.

TÍTULO DO EBOOK: ${title}

CONTEÚDO DO EBOOK (resumo):
---
${content}
---

ESTRUTURA OBRIGATÓRIA:

## HEADLINE PRINCIPAL
[Uma frase de impacto que captura atenção imediatamente — máx 12 palavras]

## SUBHEADLINE
[Expande a promessa principal — 1-2 frases]

## A DOR QUE ESTE EBOOK RESOLVE
Descreva 3 pontos de dor que o leitor-alvo sente antes de ler este livro.
• Dor 1
• Dor 2
• Dor 3

## PARA QUEM É ESTE EBOOK
[Descrição precisa do leitor ideal — 2-3 frases]

## O QUE VOCÊ VAI DESCOBRIR
5 benefícios/transformações concretas que o leitor terá:
• Benefício 1
• Benefício 2
• Benefício 3
• Benefício 4
• Benefício 5

## MODELOS DE DEPOIMENTO
[3 templates de depoimento realistas para personalizar]

Depoimento 1 — [Nome, Cargo]:
"..."

Depoimento 2 — [Nome, Cargo]:
"..."

Depoimento 3 — [Nome, Cargo]:
"..."

## CHAMADA PARA AÇÃO (CTA)
[Uma CTA irresistível, urgente, com benefício claro]

## P.S.
[P.S. com elemento de urgência, escassez ou bônus exclusivo]

Escreva em Português do Brasil. Tom: direto, persuasivo, humano — como um mentor que acredita no que recomenda. Evite clichês genéricos. Seja específico.
`,

  /**
   * Carrossel — 7 slides para LinkedIn / Instagram
   */
  MARKETING_CAROUSEL: (title: string, content: string) => `
Você é um Especialista em Conteúdo para Redes Sociais, criador de carrosséis virais.
Crie um carrossel de 7 slides (LinkedIn/Instagram) para promover o ebook abaixo.

TÍTULO DO EBOOK: ${title}

CONTEÚDO DO EBOOK:
---
${content}
---

FORMATO DE CADA SLIDE:
───────────────────────
SLIDE [N] — [TEMA]
TÍTULO: [máx 8 palavras impactantes — sem ponto final]
CORPO: [2-3 linhas de conteúdo: insight, dado, pergunta ou provocação]
VISUAL: [Sugestão de ícone, cor ou elemento gráfico]
───────────────────────

ESTRUTURA DOS 7 SLIDES:
- Slide 1: GANCHO — o problema/desafio que o leitor enfrenta
- Slide 2 a 5: INSIGHTS — 4 ensinamentos ou revelações poderosas do ebook (um por slide)
- Slide 6: TRANSFORMAÇÃO — como é a vida depois de aplicar o conteúdo
- Slide 7: CTA — chamada para ação + onde acessar

LEGENDA DO CARROSSEL (para usar na publicação):
[5-8 linhas de legenda com gancho inicial, teaser dos slides e CTA]
[Hashtags relevantes: 8-12]

Escreva em Português do Brasil. Linguagem ativa, envolvente, sem jargões. Cada slide deve poder existir sozinho.
`,

  /**
   * Email de Lançamento — email completo para lista
   */
  MARKETING_EMAIL: (title: string, content: string) => `
Você é um Expert em Email Marketing e lançamentos de infoprodutos.
Crie um email de lançamento completo e de alta conversão para o ebook abaixo.

TÍTULO DO EBOOK: ${title}

CONTEÚDO DO EBOOK:
---
${content}
---

ENTREGUE EXATAMENTE NESTA ESTRUTURA:

━━━ ASSUNTO DO EMAIL (3 variações A/B/C) ━━━
A: [Assunto com curiosidade — máx 50 caracteres]
B: [Assunto com benefício direto — máx 50 caracteres]
C: [Assunto com urgência/exclusividade — máx 50 caracteres]

━━━ TEXTO DE PREVIEW ━━━
[Máx 90 caracteres — completa o assunto]

━━━ CORPO DO EMAIL ━━━

Olá [Nome],

[Abertura pessoal — 2 frases que criam conexão imediata]

[Parágrafo de história — 3-4 frases que apresentam o problema/jornada]

[Parágrafo de revelação — apresenta o ebook como solução]

[Lista com 3-4 bullets dos principais benefícios]

[Parágrafo de CTA — botão/link com texto persuasivo]

[Encerramento pessoal + assinatura]

P.S.: [Elemento de urgência, escassez ou bônus — 1-2 frases]

Máximo 400 palavras no corpo. Tom: conversa de um amigo que descobriu algo poderoso. Português do Brasil.
`,

  /**
   * Posts para Redes Sociais — 3 versões (Instagram, LinkedIn, X/Twitter)
   */
  MARKETING_POSTS: (title: string, content: string) => `
Você é um Especialista em Conteúdo e Copywriting para Redes Sociais.
Crie 3 posts distintos e adaptados para cada plataforma, para promover o ebook abaixo.

TÍTULO DO EBOOK: ${title}

CONTEÚDO DO EBOOK:
---
${content}
---

ENTREGUE EXATAMENTE NESTA ESTRUTURA:

━━━ POST 1 — INSTAGRAM ━━━
[Abertura com gancho emocional ou pergunta provocadora — 1 frase]
[Linha em branco]
[Desenvolvimento: história curta ou insight revelador — 3-4 parágrafos curtos]
[Linha em branco]
[CTA claro — o que o leitor deve fazer agora]
[Linha em branco]
#hashtags #relevantes #8a12hashtags

━━━ POST 2 — LINKEDIN ━━━
[Abertura profissional com dado, insight ou afirmação controversa]
[Linha em branco]
[Contexto e valor profissional — 2-3 parágrafos]
[Lista de 3-5 aprendizados do ebook em formato LinkedIn]
[Linha em branco]
[CTA — convida reflexão ou ação]
[2-3 hashtags profissionais no máximo]

━━━ POST 3 — THREAD X/TWITTER ━━━
1/ [GANCHO — máx 260 caracteres. Afirmação forte ou pergunta]
2/ [Ponto 1 — máx 260 caracteres]
3/ [Ponto 2 — máx 260 caracteres]
4/ [Ponto 3 — máx 260 caracteres]
5/ [CTA — como acessar o ebook + link placeholder]

Português do Brasil. Cada post deve funcionar de forma independente. Adapte o tom ao DNA de cada plataforma.
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
