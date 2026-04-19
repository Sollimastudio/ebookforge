import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Image as ImageIcon,
  Table as TableIcon, Link as LinkIcon, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Code, Undo, Redo,
  Lightbulb, AlertTriangle, Info, AlertCircle,
  Type, ImagePlus, Wand2, Loader2
} from 'lucide-react';
import { useEbook } from '../../context/EbookContext';
import { generateImage } from '../../services/imageGen';
import { callAI } from '../../services/aiEngine';

interface ToolbarProps {
  editor: Editor | null;
}

const HIGHLIGHT_COLORS = [
  { color: '#fde68a', label: 'Amarelo' },
  { color: '#bbf7d0', label: 'Verde' },
  { color: '#bfdbfe', label: 'Azul' },
  { color: '#fecdd3', label: 'Rosa' },
  { color: '#e9d5ff', label: 'Roxo' },
];

const TEXT_COLORS = [
  { color: '#58a6ff', label: 'Azul Accent' },
  { color: '#f97316', label: 'Laranja' },
  { color: '#a3e635', label: 'Verde' },
  { color: '#fb7185', label: 'Rosa' },
  { color: '#a78bfa', label: 'Roxo' },
  { color: '#fbbf24', label: 'Âmbar' },
  { color: '#ffffff', label: 'Branco' },
  { color: '#94a3b8', label: 'Cinza' },
];

const CALLOUT_TYPES = [
  { type: 'info', icon: <Info size={14} />, label: 'Info', emoji: 'ℹ️' },
  { type: 'tip', icon: <Lightbulb size={14} />, label: 'Dica', emoji: '💡' },
  { type: 'warning', icon: <AlertTriangle size={14} />, label: 'Aviso', emoji: '⚠️' },
  { type: 'danger', icon: <AlertCircle size={14} />, label: 'Perigo', emoji: '❌' },
];

const ToolbarDivider = () => <div className="toolbar-divider" />;

const ToolbarBtn = ({
  onClick, active, title, children, disabled
}: {
  onClick: () => void; active?: boolean; title: string;
  children: React.ReactNode; disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`toolbar-btn ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
    title={title}
    disabled={disabled}
    type="button"
  >
    {children}
  </button>
);

export const Toolbar = ({ editor }: ToolbarProps) => {
  const [showHighlights, setShowHighlights] = React.useState(false);
  const [showTextColors, setShowTextColors] = React.useState(false);
  const [showCallouts, setShowCallouts] = React.useState(false);
  const [showAIImage, setShowAIImage] = React.useState(false);
  const [aiImagePrompt, setAiImagePrompt] = React.useState('');
  const [aiImageLoading, setAiImageLoading] = React.useState(false);
  const [aiImageError, setAiImageError] = React.useState<string | null>(null);
  const [aiRewriteLoading, setAiRewriteLoading] = React.useState(false);

  const {
    imageProvider, openaiKey, replicateKey, imageModel,
    selectedEngine, openRouterApiKeyEffective, apiKey, selectedModel,
  } = useEbook();

  if (!editor) return null;

  const handleAIImage = async () => {
    if (!aiImagePrompt.trim() || aiImageLoading) return;
    const imgKey = imageProvider === 'openai' ? openaiKey : replicateKey;
    if (imageProvider === 'none' || !imgKey) {
      setAiImageError('Configure DALL-E (OpenAI) ou Replicate nas Configurações para gerar imagens.');
      return;
    }
    setAiImageLoading(true);
    setAiImageError(null);
    try {
      const result = await generateImage(aiImagePrompt, {
        provider: imageProvider,
        apiKey: imgKey,
        model: imageModel,
        size: '1024x1024',
      });
      editor.chain().focus().setImage({ src: result.url, alt: aiImagePrompt }).run();
      setShowAIImage(false);
      setAiImagePrompt('');
    } catch (err: any) {
      setAiImageError(err.message || 'Erro ao gerar imagem. Tente novamente.');
    } finally {
      setAiImageLoading(false);
    }
  };

  const handleAIRewrite = async () => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Selecione um trecho de texto para reescrever.');
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText.trim() || selectedText.trim().length < 20) {
      alert('Selecione pelo menos 20 caracteres para reescrever.');
      return;
    }
    const effectiveKey = openRouterApiKeyEffective || apiKey;
    if (selectedEngine === 'openrouter' && !effectiveKey) {
      alert('Configure sua chave OpenRouter nas Configurações para usar a reescrita com IA.');
      return;
    }
    setAiRewriteLoading(true);
    try {
      const rewritten = await callAI(
        [{
          role: 'user',
          content: `Reescreva o seguinte trecho melhorando a clareza, fluidez e impacto. Preserve o significado original, o idioma e o tom do autor. Responda APENAS com o texto reescrito, sem aspas, sem explicações, sem prefixos.\n\nTEXTO ORIGINAL:\n${selectedText}`
        }],
        { engine: selectedEngine, apiKey: effectiveKey, model: selectedModel, timeout: 30000, maxTokens: 1500 }
      );
      editor.chain().focus().insertContentAt({ from, to }, rewritten.trim()).run();
    } catch (err: any) {
      alert('Erro ao reescrever: ' + (err.message || 'Tente novamente.'));
    } finally {
      setAiRewriteLoading(false);
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const insertLink = () => {
    const url = window.prompt('URL do link:');
    if (url) {
      editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
    }
  };

  const insertCallout = (type: string, emoji: string, label: string) => {
    editor.chain().focus()
      .insertContent(`<div data-callout="${type}"><p>${emoji} <strong>${label}</strong>: Escreva aqui...</p></div>`)
      .run();
    setShowCallouts(false);
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="toolbar">
      {/* Undo / Redo */}
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer" disabled={!editor.can().undo()}>
        <Undo size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer" disabled={!editor.can().redo()}>
        <Redo size={16} />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Text Style */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito">
        <Bold size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico">
        <Italic size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
        <Strikethrough size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Código Inline">
        <Code size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscrito">
        <Subscript size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Sobrescrito">
        <Superscript size={16} />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Título 1">
        <Heading1 size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título 2">
        <Heading2 size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título 3">
        <Heading3 size={16} />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinhar Esquerda">
        <AlignLeft size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centralizar">
        <AlignCenter size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinhar Direita">
        <AlignRight size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">
        <AlignJustify size={16} />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
        <List size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista Numerada">
        <ListOrdered size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação">
        <Quote size={16} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Bloco de Código">
        <Code size={16} />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Highlight */}
      <div className="toolbar-dropdown-wrap">
        <ToolbarBtn onClick={() => { setShowHighlights(!showHighlights); setShowTextColors(false); setShowCallouts(false); }} active={editor.isActive('highlight')} title="Marcador de Texto">
          <Highlighter size={16} />
        </ToolbarBtn>
        {showHighlights && (
          <div className="color-picker">
            <div className="color-picker-label">Marcador</div>
            <div className="color-swatches">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.color}
                  className="color-swatch"
                  style={{ background: c.color }}
                  title={c.label}
                  onClick={() => { editor.chain().focus().toggleHighlight({ color: c.color }).run(); setShowHighlights(false); }}
                />
              ))}
              <button className="color-swatch clear" title="Remover marcador"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlights(false); }}>
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Text Color */}
      <div className="toolbar-dropdown-wrap">
        <ToolbarBtn onClick={() => { setShowTextColors(!showTextColors); setShowHighlights(false); setShowCallouts(false); }} title="Cor do Texto">
          <Type size={16} />
        </ToolbarBtn>
        {showTextColors && (
          <div className="color-picker">
            <div className="color-picker-label">Cor do Texto</div>
            <div className="color-swatches">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.color}
                  className="color-swatch"
                  style={{ background: c.color, border: c.color === '#ffffff' ? '1px solid #444' : undefined }}
                  title={c.label}
                  onClick={() => { editor.chain().focus().setColor(c.color).run(); setShowTextColors(false); }}
                />
              ))}
              <button className="color-swatch clear" title="Remover cor"
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowTextColors(false); }}>
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Callout blocks */}
      <div className="toolbar-dropdown-wrap">
        <ToolbarBtn onClick={() => { setShowCallouts(!showCallouts); setShowHighlights(false); setShowTextColors(false); }} title="Bloco Destaque (Callout)">
          <Lightbulb size={16} />
        </ToolbarBtn>
        {showCallouts && (
          <div className="callout-picker">
            <div className="color-picker-label">Blocos Destaque</div>
            {CALLOUT_TYPES.map(c => (
              <button key={c.type} className={`callout-option callout-option--${c.type}`}
                onClick={() => insertCallout(c.type, c.emoji, c.label)}>
                {c.icon}
                <span>{c.emoji} {c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Insert Link */}
      <ToolbarBtn onClick={insertLink} active={editor.isActive('link')} title="Inserir Link">
        <LinkIcon size={16} />
      </ToolbarBtn>

      {/* Insert Image */}
      <ToolbarBtn onClick={insertImage} title="Inserir Imagem">
        <ImageIcon size={16} />
      </ToolbarBtn>

      {/* Insert Table */}
      <ToolbarBtn onClick={insertTable} title="Inserir Tabela">
        <TableIcon size={16} />
      </ToolbarBtn>

      {/* Horizontal Rule */}
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha Divisória">
        <Minus size={16} />
      </ToolbarBtn>

      <ToolbarDivider />

      {/* AI Rewrite */}
      <ToolbarBtn
        onClick={handleAIRewrite}
        title="Reescrever seleção com IA (selecione um trecho primeiro)"
        disabled={aiRewriteLoading}
      >
        {aiRewriteLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
      </ToolbarBtn>

      {/* AI Image Generator */}
      <div className="toolbar-dropdown-wrap">
        <ToolbarBtn
          onClick={() => { setShowAIImage(!showAIImage); setAiImageError(null); }}
          title="Gerar Ilustração com IA"
          active={showAIImage}
        >
          <ImagePlus size={16} />
        </ToolbarBtn>
        {showAIImage && (
          <div className="ai-image-panel">
            <div className="color-picker-label">Gerar Ilustração com IA</div>
            <textarea
              className="ai-image-prompt"
              placeholder="Ex: uma pessoa lendo em uma biblioteca com luz suave, estilo editorial, sem texto..."
              value={aiImagePrompt}
              onChange={e => setAiImagePrompt(e.target.value)}
              rows={3}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAIImage(); }}
            />
            {aiImageError && <p className="ai-image-error">{aiImageError}</p>}
            {imageProvider === 'none' && !aiImageError && (
              <p className="ai-image-hint">Configure DALL-E ou Replicate nas Configurações (⚙️) para usar.</p>
            )}
            <button
              className="ai-image-btn"
              onClick={handleAIImage}
              disabled={aiImageLoading || !aiImagePrompt.trim()}
            >
              {aiImageLoading ? <><Loader2 size={13} className="animate-spin" /> Gerando...</> : <><ImagePlus size={13} /> Gerar e Inserir</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
