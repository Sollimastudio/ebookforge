# EbookForge — Resumo consolidado dos reparos

Todas as mudanças aplicadas no projeto, em uma lista única.

## Bugs corrigidos

### 1. Chave de API desaparecia
- **Arquivo:** `src/components/Panels/SettingsPanel.tsx`
- **Causa:** dois campos de input disputavam o state (Sidebar salvava, Settings usava `tempApiKey` que nunca sincronizava)
- **Fix:** `useEffect` para sincronizar `tempApiKey` com `apiKey` sempre que mudar

### 2. JSON do blueprint truncado
- **Arquivo:** `src/context/EbookContext.tsx`
- **Causa:** `maxTokens: 2000` baixo demais para blueprints complexos
- **Fix:** `maxTokens: 4000` + parser robusto com fallback que fecha chaves/colchetes soltos

### 3. Interface quebrada em mobile
- **Arquivo:** `src/index.css`
- **Fix:** CSS responsivo com `@media (max-width: 768px)`, sidebar vira drawer com hambúrguer, backdrop, scale de textos

### 4. Layout desktop quebrado (sidebar invisível e sem scroll)
- **Arquivo:** `src/index.css`, `src/App.tsx`
- **Causa:** regra `.sidebar { display: none }` global + `.app-root` em column
- **Fix:** `.app-root` em row, `.sidebar-wrapper` com width 280px, `.main-area` com overflow-y auto

### 5. Editor sem rolagem após forja
- **Arquivo:** `src/index.css`
- **Fix:** `.editor-wrapper` mudou de `overflow: hidden` para `overflow: visible` e ganhou `min-height: 0`

### 6. Erro `removeChild` do React (Google Translate)
- **Arquivo:** `index.html`
- **Fix:** adicionado `translate="no"`, `lang="pt-BR"`, `meta name="google" content="notranslate"`

## Features novas

### A. Motor de IA configurável (Ollama local + OpenRouter)
- **Arquivos criados:** `src/services/ollama.ts`, `src/services/aiEngine.ts`
- **Arquivo modificado:** `src/context/EbookContext.tsx`
- Adaptador OpenAI-compatible que roteia entre Ollama (`localhost:11434/v1/chat/completions`) e OpenRouter (`openrouter.ai/api/v1/chat/completions`)
- State: `selectedEngine: 'ollama' | 'openrouter'` persistido em localStorage
- Reusável nos outros 30+ projetos de Sol Lima

### B. Seletor de motor na sidebar
- **Arquivo:** `src/components/Sidebar/Sidebar.tsx`
- Dois botões: 💻 Ollama (verde quando ativo) / 🌐 OpenRouter (azul quando ativo)

### C. APIs Premium expandidas (imagens + Claude direto)
- **Arquivo criado:** `src/services/imageGen.ts`
- **Arquivo modificado:** `src/context/EbookContext.tsx`, `src/components/Sidebar/Sidebar.tsx`, `src/index.css`
- Suporta:
  - **DALL-E 3 / DALL-E 3 HD** (OpenAI) — ~$0.04 a $0.08 por imagem
  - **Flux Schnell / Flux Pro** (Replicate) — ~$0.003 a $0.055 por imagem
  - **Endpoint custom** compatível com OpenAI
  - **Claude direto** (campo pra chave Anthropic, para usar sem OpenRouter)
- Nova seção retrátil "APIs Premium" na sidebar
- Toggle "Gerar capa ilustrada por IA" que injeta imagem na cover do ebook após forja

### D. CSS da capa ilustrada
- `.cover-hero-image` com sombra premium, border-radius, aspect-ratio 1:1
- Responsivo (largura total em mobile)

## Checklist pós-merge

- [ ] Rodar `npm install` no ambiente local
- [ ] Rodar `npm run build` e conferir que compila sem erros
- [ ] Testar em `localhost:5173`
- [ ] Testar motor Ollama (com `launchctl setenv OLLAMA_ORIGINS "*"`)
- [ ] Testar motor OpenRouter com Claude Sonnet
- [ ] Ativar "Gerar capa" e testar com DALL-E 3 e Flux
- [ ] Testar mobile via `npm run dev -- --host`

## Deploy

- GitHub: `git add -A && git commit -m "..." && git push origin main`
- Vercel: se já vinculado ao repo, deploy automático via webhook ao push
