# Teste Manual - EbookForge

## FASE 4: Testes e Validação (15/04/2026)

### ✅ Tarefa 4.1: Testar Fluxo Completo

#### 1. Criar novo ebook
**Passos:**
- [ ] Abrir a aplicação em http://localhost:5175
- [ ] Clicar em "Criar Novo Ebook" ou botão equivalente no dashboard
- [ ] Inserir título (ex: "Meu Primeiro Ebook")

**Resultado esperado:**
- Novo ebook aparece na sidebar com o título inserido
- Editor abre com placeholder "Comece a escrever seu Ebook premium aqui..."
- Badge "💾 Auto-salvo" aparece no topo

#### 2. Editar conteúdo
**Passos:**
- [ ] Digitar alguns parágrafos no editor (mínimo 50 palavras)
- [ ] Adicionar pelo menos 2 títulos (H1, H2)
- [ ] Observar o indicador "Salvando..." na toolbar

**Resultado esperado:**
- Indicador "Salvando..." aparece durante digitação (2 segundos)
- Conteúdo é salvo automaticamente sem necessidade de clique
- Alt+Cmd+S mostra feedback visual de salvamento

#### 3. Ver estatísticas
**Passos:**
- [ ] Observar o painel de estatísticas na direita
- [ ] Verificar métricas em tempo real:
  - Word count (deve aumentar conforme digita)
  - Character count
  - Reading time (minutos)
  - Paragraphs
  - Headings
  - Images (deve ser 0)

**Resultado esperado:**
- Todas as métricas atualizadas em tempo real
- Reading time > 0 minutos (cálculo: palavras ÷ 200/min)
- Insights mostram tipo de conteúdo (Fragment, Article, Novel, Romance)
- Aviso: "⚠️ Nenhuma imagem" quando content > 1000 palavras

#### 4. Gerar sumário
**Passos:**
- [ ] Clicar no botão "📑" (BookMarked) na toolbar
- [ ] Modal "Sumário do Documento" deve abrir
- [ ] Verificar se títulos aparecem listados com indentação hierárquica

**Resultado esperado:**
- Modal aparece com fade-in animation
- Todos os H1, H2, H3 headings aparecem listados
- Indentação mostra hierarquia (H2 mais recuado que H1)
- Botão "Inserir Sumário no Documento" funciona
- Sumário inserido como lista numerada no editor
- Modal fecha após inserção (ou com botão ✕)

#### 5. Exportar JSON (Backup Completo)
**Passos:**
- [ ] Sidebar → "Backup Completo" (ícone download)
- [ ] Arquivo `backup_*.json` deve ser baixado

**Resultado esperado:**
- Arquivo baixado com nome `backup_TIMESTAMP.json`
- Arquivo contém array de projetos com:
  - id
  - title (igual ao inserido)
  - content (HTML com edições)
  - createdAt (timestamp)

#### 6. Importar JSON (Restaurar Backup)
**Passos:**
- [ ] Sidebar → "Importar Backup" (ícone upload)
- [ ] Selecionar o arquivo JSON baixado anteriormente
- [ ] Verificar se projeto restaurado aparece na sidebar

**Resultado esperado:**
- Projeto importado aparece na sidebar
- Conteúdo idêntico ao original
- Pode ser selecionado e editado normalmente
- Múltiplos imports não geram duplicatas

#### 7. Exportar PDF
**Passos:**
- [ ] Sidebar → "Exportar PDF" (ícone download com formato PDF)
- [ ] Aguardar renderização (overlay "Renderizando Ebook de Alta Resolução...")
- [ ] Arquivo `[Titulo_do_Ebook].pdf` é baixado

**Resultado esperado:**
- Overlay mostra progresso ("Renderizando...")
- PDF gerado com canva scale 2.5x (alta resolução)
- PDF contém:
  - Metadados: title, author, subject, keywords
  - Conteúdo formatado em múltiplas páginas se necessário
  - Múltiplas páginas se ebook > 1 página A4
- Arquivo pode ser aberto em PDF reader
- Verificar propriedades PDF: title = ebook title

#### 8. Exportar HTML
**Passos:**
- [ ] Sidebar → "Exportar HTML" (ícone code)
- [ ] Arquivo `[Titulo_do_Ebook].html` é baixado

**Resultado esperado:**
- HTML bem-formado com DOCTYPE
- Estilos inline para tipografia, margin, padding
- Imagens embarcadas (base64)
- Callouts aparecem com estilos corretos
- Tabelas formatadas corretamente
- Pode ser aberto em qualquer navegador

---

### ✅ Tarefa 4.2: Verificar Responsividade

#### A. Desktop (1920px)
**Passos:**
- [ ] Abrir app em viewport 1920px (monitores widescreen)
- [ ] Verificar layout de 2 colunas (editor + stats)

**Resultado esperado:**
- Editor ocupa ~70% da tela
- Stats sidebar ocupam ~30% (220px fixo)
- Toolbar apareça corretamente
- Sem horizontal scrollbar
- Todos os componentes visíveis

#### B. Tablet (768px)
**Passos:**
- [ ] Redimensionar para 768px (iPad portrait)
- [ ] Verificar adaptação do layout

**Resultado esperado:**
- Layout se adapta (possível stack vertical)
- Stats sidebar continua acessível
- Toolbar responsiva
- Sem overflow de conteúdo
- Buttons clicáveis com tamanho adequado

#### C. Mobile (375px)
**Passos:**
- [ ] Redimensionar para 375px (iPhone 12/13)
- [ ] Verificar acessibilidade do editor

**Resultado esperado:**
- Sidebar pode ser colapsada/drawer
- Editor é o foco principal
- Stats em drawer/accordion (não interfere)
- Toolbar buttons acessíveis
- Sem text overflow
- Fonts legíveis (min 14px)
- Tap targets ≥ 44px²

---

## Checklist Final

- [ ] Todos os 8 passos de fluxo completo testados
- [ ] Aplicação responsiva em 3 breakpoints
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum erro no terminal (servidor)
- [ ] Auto-save funcionando
- [ ] Exportações geram arquivos corretos
- [ ] Importações restauram dados corretamente
- [ ] Atalhos de teclado funcionam (Ctrl/Cmd+S, Ctrl/Cmd+E)
- [ ] Animações suaves e visualmente agradáveis
- [ ] Performance aceitável (sem travamentos)

---

## Notas Adicionais

- Limpar localStorage se tiver testes antigos: `localStorage.clear()` no console
- Usar DevTools para verificar network requests durante operações
- Testar em navegadores diferentes (Chrome, Firefox, Safari)
- Verificar console para avisos de deprecated APIs
- Medir FCP (First Contentful Paint) e LCP (Largest Contentful Paint)
Passos:
1. Clicar em "Anexar Manuscrito".
2. Selecionar o TXT de teste.
3. Clicar em "Gerar Ebook Pronto".

Resultado esperado:
- Titulo vira capa.
- Capitulos sao detectados.
- Paginas sao renderizadas no painel direito.

### 3. Importacao de Markdown
Passos:
1. Importar arquivo .md.
2. Clicar em "Gerar Ebook Pronto".

Resultado esperado:
- Estrutura de titulos e paragrafos aparece corretamente.
- Sumario apresenta a lista de capitulos.

### 4. Insercao de imagem
Passos:
1. Clicar em "Inserir Imagem".
2. Selecionar um PNG/JPG.
3. Gerar ebook.

Resultado esperado:
- Imagem aparece no editor e no preview.
- Paginacao nao quebra o layout da pagina.

### 5. Exportacao de PDF
Passos:
1. Com paginas geradas, clicar em "Exportar PDF".
2. Abrir o PDF exportado.

Resultado esperado:
- PDF contem capa, sumario e paginas de conteudo.
- Numeracao de paginas aparece no corpo.
- Qualidade visual legivel em A4.

### 6. Robustez de clique repetido
Passos:
1. Clicar rapidamente 3 a 5 vezes em "Gerar Ebook Pronto".
2. Repetir para "Exportar PDF".

Resultado esperado:
- App nao trava.
- Status final nao fica inconsistente.
- Apenas um PDF final e gerado por acao do usuario.

### 7. Arquivo invalido
Passos:
1. Tentar importar arquivo nao suportado (ex.: .docx).

Resultado esperado:
- App informa falha de importacao sem quebrar a tela.

## Checklist rapido de aprovacao
- [ ] Build executa sem erro (`npm run build`).
- [ ] Lint executa sem erro (`npm run lint`).
- [ ] Fluxo TXT -> Gerar -> PDF funciona.
- [ ] Fluxo MD -> Gerar -> PDF funciona.
- [ ] Imagem renderiza no preview e no PDF.
- [ ] Sem erro critico no console durante os testes.

## Observacoes
- Se clicar em "Exportar PDF" sem paginas prontas, o app pede nova confirmacao no segundo clique.
- Em livros longos, a exportacao pode levar alguns segundos por pagina.
