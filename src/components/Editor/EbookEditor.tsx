import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Toolbar } from './Toolbar';

export const EbookEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true, // Let them paste images as base64 for now
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
      Placeholder.configure({
        placeholder: 'Comece a escrever seu Ebook premium aqui...',
      }),
    ],
    content: `
      <h1>Meu Novo Ebook</h1>
      <p>Escreva o <strong>conteúdo</strong> principal do seu ebook aqui. Você pode arrastar imagens, formatar títulos e criar estruturas complexas.</p>
      <blockquote><p>O sucesso do design depende da elegância da simplicidade.</p></blockquote>
    `,
    editorProps: {
      attributes: {
        class: 'focus:outline-none w-full h-full pb-32',
      },
    },
  });

  return (
    <div className="w-full h-full overflow-y-auto pt-6 px-4 md:px-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto flex flex-col h-full relative">
        <Toolbar editor={editor} />
        
        <div className="glass-panel flex-1 rounded-2xl bg-bg-color/40 shadow-xl overflow-hidden mt-2 relative">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    </div>
  );
};
