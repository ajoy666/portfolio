import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo2,
  Redo2,
  Link as LinkIcon,
} from 'lucide-react';

// ── Rich Text Editor (Tiptap) ───────────────────────────────
// Reusable across modules — pass `value`, `onChange`, and optionally
// `placeholder` / `error` / `minHeight`.
export default function RichTextEditor({
  value,
  onChange,
  error,
  placeholder = 'Write something...',
  minHeight = 180,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline underline-offset-2',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'px-4 py-3 text-sm text-white/70 outline-none prose-editor',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync when `value` changes externally
  // (e.g. switching between edit targets, resetting the form).
  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = value || '';

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, false);
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl || 'https://');

    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  const buttonBase =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/35 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white';

  const activeButton = 'border-white/20 bg-white/[0.08] text-white';

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white/[0.04] transition-all ${
        error
          ? 'border-red-500/40'
          : 'border-white/[0.08] focus-within:border-white/20 focus-within:bg-white/[0.06]'
      }`}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] bg-black/10 px-2 py-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${buttonBase} ${
            editor.isActive('heading', { level: 2 }) ? activeButton : ''
          }`}
          title="Heading"
        >
          <Heading2 size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonBase} ${editor.isActive('bold') ? activeButton : ''}`}
          title="Bold"
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonBase} ${editor.isActive('italic') ? activeButton : ''}`}
          title="Italic"
        >
          <Italic size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonBase} ${editor.isActive('bulletList') ? activeButton : ''}`}
          title="Bullet List"
        >
          <List size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonBase} ${editor.isActive('orderedList') ? activeButton : ''}`}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${buttonBase} ${editor.isActive('blockquote') ? activeButton : ''}`}
          title="Quote"
        >
          <Quote size={14} />
        </button>

        <button
          type="button"
          onClick={setLink}
          className={`${buttonBase} ${editor.isActive('link') ? activeButton : ''}`}
          title="Link"
        >
          <LinkIcon size={14} />
        </button>

        <div className="mx-1 h-5 w-px bg-white/[0.08]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${buttonBase} disabled:cursor-not-allowed disabled:opacity-30`}
          title="Undo"
        >
          <Undo2 size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${buttonBase} disabled:cursor-not-allowed disabled:opacity-30`}
          title="Redo"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .prose-editor p {
          margin: 0.55rem 0;
        }

        .prose-editor h2 {
          margin: 0.9rem 0 0.45rem;
          font-size: 1rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }

        .prose-editor ul,
        .prose-editor ol {
          margin: 0.55rem 0;
          padding-left: 1.25rem;
        }

        .prose-editor ul {
          list-style-type: disc;
        }

        .prose-editor ol {
          list-style-type: decimal;
        }

        .prose-editor li {
          margin: 0.25rem 0;
        }

        .prose-editor blockquote {
          margin: 0.75rem 0;
          border-left: 2px solid rgba(255, 255, 255, 0.18);
          padding-left: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
        }

        .prose-editor a {
          color: rgb(96, 165, 250);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .prose-editor .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
