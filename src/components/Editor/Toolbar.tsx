import React from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Image as ImageIcon,
  Table as TableIcon
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar = ({ editor }: ToolbarProps) => {
  if (!editor) {
    return null;
  }

  const toggleHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <div className="glass-panel p-2 mb-6 rounded-xl flex flex-wrap gap-2 sticky top-4 z-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Nigrito"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Itálico"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Tachado"
      >
        <Strikethrough size={18} />
      </button>

      <div className="w-px h-6 bg-border-color my-auto mx-1" />

      <button
        onClick={() => toggleHeading(1)}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Título 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => toggleHeading(2)}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Título 2"
      >
        <Heading2 size={18} />
      </button>
      <button
        onClick={() => toggleHeading(3)}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Título 3"
      >
        <Heading3 size={18} />
      </button>

      <div className="w-px h-6 bg-border-color my-auto mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Lista de Marcadores"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Lista Numerada"
      >
        <ListOrdered size={18} />
      </button>

      <div className="w-px h-6 bg-border-color my-auto mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-accent/20 text-accent' : 'text-text-muted hover:bg-white/5'}`}
        title="Citação"
      >
        <Quote size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={`p-2 rounded-lg transition-colors text-text-muted hover:bg-white/5`}
        title="Linha Divisória"
      >
        <Minus size={18} />
      </button>

      <div className="flex-1" />
      
      {/* Right side actions */}
      <button
        onClick={() => {
          const url = window.prompt('URL da Imagem:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className={`p-2 rounded-lg transition-colors text-text-muted hover:bg-white/5`}
        title="Inserir Imagem (URL or Drag&Drop)"
      >
        <ImageIcon size={18} />
      </button>
      
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className={`p-2 rounded-lg transition-colors text-text-muted hover:bg-white/5`}
        title="Inserir Tabela"
      >
        <TableIcon size={18} />
      </button>
    </div>
  );
};
