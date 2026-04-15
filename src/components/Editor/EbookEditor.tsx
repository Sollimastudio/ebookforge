import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { BookMarked } from 'lucide-react';
import { Toolbar } from './Toolbar';
import { StatisticsPanel } from '../Forge/StatisticsPanel';
import { TableOfContentsPanel } from '../Forge/TableOfContentsPanel';
import { useEbook } from '../../context/EbookContext';

export const EbookEditor = () => {
  const { activeProject, updateProjectContent } = useEbook();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showTOC, setShowTOC] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
      Placeholder.configure({ placeholder: 'Comece a escrever seu Ebook premium aqui...' }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      TextStyle,
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
      Subscript,
      Superscript,
    ],
    content: activeProject?.content ?? '',
    onUpdate: ({ editor }) => {
      if (!activeProject) return;
      const html = editor.getHTML();
      
      // Show saving indicator for 2 seconds
      setIsSaving(true);
      
      // Clear previous timeout for saving indicator
      if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
      savingTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
      }, 2000);
      
      // Debounce save — 800ms after user stops typing
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateProjectContent(activeProject.id, html);
      }, 800);
    },
    editorProps: {
      attributes: { class: 'focus:outline-none w-full pb-32' },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          const { schema } = view.state;
          const node = schema.nodes.image.create({ src });
          const transaction = view.state.tr.replaceSelectionWith(node);
          view.dispatch(transaction);
        };
        reader.readAsDataURL(file);
        return true;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (ev) => {
              const src = ev.target?.result as string;
              editor?.chain().focus().setImage({ src }).run();
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // When active project changes, update editor content
  const activeProjectId = activeProject?.id;
  const activeProjectContent = activeProject?.content;

  useEffect(() => {
    if (!editor || !activeProject) return;
    const currentHTML = editor.getHTML();
    if (currentHTML !== activeProjectContent) {
      editor.commands.setContent(activeProjectContent ?? '');
    }
  }, [activeProjectId]); // Only re-run when project switches

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savingTimeoutRef.current) clearTimeout(savingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="editor-wrapper">
      <div className="toolbar">
        <Toolbar editor={editor} />
        <div className="toolbar-divider" />
        <button 
          onClick={() => setShowTOC(!showTOC)}
          title="Sumário"
          className="toolbar-btn"
        >
          <BookMarked size={18} />
        </button>
        <div className="toolbar-spacer" />
        {isSaving && (
          <div className="editor-saving-indicator">
            <span className="saving-dot"></span>
            <span>Salvando...</span>
          </div>
        )}
      </div>
      <div className="editor-main-layout">
        <div className="editor-paper" id="ebook-content-area">
          <EditorContent editor={editor} />
        </div>
        {activeProject && (
          <div className="editor-stats-sidebar">
            <StatisticsPanel content={activeProject.content} />
          </div>
        )}
      </div>

      {showTOC && activeProject && (
        <div className="toc-modal-overlay" onClick={() => setShowTOC(false)}>
          <div className="toc-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowTOC(false)}
            >
              ✕
            </button>
            <TableOfContentsPanel 
              content={activeProject.content}
              onInsertTOC={(html) => {
                editor?.commands.insertContent(html);
                setShowTOC(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
