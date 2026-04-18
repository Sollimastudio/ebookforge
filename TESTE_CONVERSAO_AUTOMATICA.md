# 🤖 Teste da Conversão Automática de Documentos

## ✨ Funcionalidade Implementada

O EbookForge agora aceita **qualquer formato de texto** para importar como projeto:
- ✅ **JSON** (.json, .ebookforge) - Carrega direto
- ✅ **Markdown** (.md, .markdown) - Converte com IA
- ✅ **Texto Simples** (.txt) - Converte com IA  
- ✅ **PDF** (.pdf) - Extrai texto e converte com IA

Quando um arquivo NÃO é JSON válido, o sistema:
1. Extrai o texto bruto
2. Envia para **Claude 3.5 Sonnet** (via OpenRouter)
3. Converte para **HTML estruturado** automaticamente
4. Carrega no editor em tempo real

---

## 🧪 Como Testar

### Pré-requisitos
1. **Chave OpenRouter**: Obtenha uma chave gratuita em https://openrouter.ai/keys
2. **Configurar no App**: 
   - Clique em "🔑 Configurar IA (OpenRouter)" na sidebar
   - Cole sua chave na entrada de texto
   - A chave fica salva localmente no seu Mac (100% segura)

### Teste 1: Importar Markdown (.md)
**Arquivo de teste**: Crie um arquivo `teste.md` com:
```markdown
# Capítulo 1: A Jornada Começa

Este é um parágrafo de introdução com **palavras em negrito** e *itálico*.

## Seção 1.1: Primeiros Passos

- Ponto 1 da lista
- Ponto 2 da lista
- Ponto 3 da lista

> "Esta é uma citação importante para o leitor."

### Subsseção: Detalhes Importantes

Outro parágrafo com mais conteúdo.
```

**Passos**:
1. Clique em "📂 Importar Ebook" na sidebar
2. Selecione `teste.md`
3. Aguarde o modal de conversão aparecer
4. O progresso será exibido: "📂 Lendo arquivo..." → "🤖 Convertendo para HTML..." → "✅ Concluído!"
5. O projeto será automaticamente carregado no editor

**Resultado esperado**: O Markdown será convertido em HTML estruturado com tags `<h1>`, `<h2>`, `<strong>`, `<em>`, `<li>`, etc.

---

### Teste 2: Importar Texto Simples (.txt)
**Arquivo de teste**: Crie um arquivo `manuscrito.txt`:
```
Meu Livro Incrível

Esta é a introdução do meu livro. Estou criando uma história interessante.

Capítulo 1: Começando

O primeiro capítulo conta como tudo começou. A história é emocionante.

Capítulo 2: Desenvolvimento

A trama evolui com novos personagens e reviravoltas.

Conclusão

O livro termina com uma mensagem inspiradora.
```

**Passos**:
1. Clique em "📂 Importar Ebook"
2. Selecione `manuscrito.txt`
3. Aguarde a conversão
4. Verifique se o texto foi estruturado em parágrafos e seções

**Resultado esperado**: Texto convertido em HTML com `<h2>` para títulos e `<p>` para parágrafos.

---

### Teste 3: Importar PDF (.pdf)
**Arquivo de teste**: Use um PDF qualquer (pode ser um livro, artigo, etc.)

**Passos**:
1. Clique em "📂 Importar Ebook"
2. Selecione um arquivo `.pdf`
3. O sistema vai:
   - Extrair o texto do PDF
   - Enviar para Claude 3.5 Sonnet
   - Converter em HTML estruturado
   - Carregar no editor

**Resultado esperado**: PDF convertido em HTML com estrutura preservada

---

### Teste 4: Importar JSON (sem IA)
**Arquivo de teste**: Crie um arquivo `projeto.ebookforge`:
```json
{
  "id": "test_001",
  "title": "Meu Projeto Original",
  "content": "<h1>Título</h1><p>Conteúdo original em HTML</p>",
  "createdAt": 1713430800000,
  "updatedAt": 1713430800000
}
```

**Passos**:
1. Clique em "📂 Importar Ebook"
2. Selecione o arquivo `.ebookforge` ou `.json`
3. O arquivo será carregado **sem usar IA** (instantâneo)

**Resultado esperado**: Projeto carregado imediatamente com o HTML original

---

## 📊 O que Observar

✅ **Modal de Progresso**
- Aparece com animação de loading
- Mostra mensagens: "📂 Lendo..." → "🤖 Convertendo..." → "✅ Concluído!"
- Desaparece ao terminar

✅ **Qual Formato Foi Usado**
- Alert final mostra: "Formato: MARKDOWN" ou "Formato: TXT" etc.
- Se convertido: adiciona "🤖 Convertido com IA"

✅ **Estrutura HTML**
- Abra o DevTools (F12)
- Inspecione o conteúdo no editor
- Verifique se há tags HTML adequadas (`<h1>`, `<p>`, `<strong>`, etc.)

✅ **Erro sem API**
- Se não configurar a chave OpenRouter e tentar importar TXT/MD/PDF
- Vai aparecer um aviso oferecendo configurar a chave

---

## 🔧 Troubleshooting

### ❌ "Arquivo vazio ou sem conteúdo legível"
- PDF pode estar em imagem apenas (sem texto)
- Tente um PDF com texto selecionável

### ❌ "Chave de API do OpenRouter não configurada"
- Você não configurou a chave nas settings
- JSON/EbookForge não precisa de chave
- TXT/MD/PDF precisam de chave OpenRouter

### ❌ "Limite de requisições atingido"
- Aguarde alguns minutos
- A conta gratuita do OpenRouter tem limite de requisições

### ❌ "Saldo insuficiente"
- Adicione créditos em https://openrouter.ai/credits
- Claude 3.5 Sonnet custa aproximadamente $0.003 por 1K tokens

---

## 📝 Fluxo Técnico

```
Arquivo Upload
    ↓
Ler conteúdo como texto
    ↓
É JSON válido? 
    ├─ SIM → Carregar como projeto (sem IA)
    └─ NÃO → Verificar API Key
           ↓
    Tem API Key?
        ├─ NÃO → Erro: "Configure a chave"
        └─ SIM → Extrair texto
               ├─ PDF? → pdfProcessor.extractTextFromPdf()
               ├─ MD/TXT → file.text()
               └─ Enviar para OpenRouter
                  ↓
                  Claude 3.5 Sonnet
                  ↓
                  "Converta para HTML estruturado"
                  ↓
                  HTML Retornado
                  ↓
                  Criar projeto e carregar no editor
```

---

## 🚀 Próximos Passos (Opcional)

Se tudo funcionar, você pode:
1. **Adicionar suporte para mais formatos** (DOCX, RTF, etc.)
2. **Customizar o prompt de conversão** em `documentConverter.ts`
3. **Adicionar validação de qualidade** do HTML gerado
4. **Cache de conversões** para não re-converter o mesmo arquivo

---

## 💡 Dicas Importantes

- ✅ Use UTF-8 encoding para TXT e MD (evita problemas com acentos)
- ✅ PDFs com tabelas podem ter estrutura complexa (a IA fará seu melhor)
- ✅ A chave OpenRouter é pessoal - nunca compartilhe!
- ✅ Para usar localmente sem internet, use Ollama + Local Model (em beta)

---

**Teste e envie feedback!** 🎉
Se encontrar bugs ou quiser sugerir melhorias, adicione à memória do projeto.
