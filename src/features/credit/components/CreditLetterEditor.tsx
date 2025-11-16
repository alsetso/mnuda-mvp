'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';

interface CreditLetterEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function CreditLetterEditor({
  content = '',
  onChange,
  placeholder = 'Start writing your letter...',
}: CreditLetterEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitized = DOMPurify.sanitize(html);
      onChange(sanitized);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border-2 border-gold-200 rounded-lg bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gold-200 bg-gold-50">
        <div className="flex items-center gap-1 border-r border-gold-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gold-100 transition-colors ${
              editor.isActive('bold') ? 'bg-gold-200' : ''
            }`}
            title="Bold"
          >
            <BoldIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gold-100 transition-colors ${
              editor.isActive('italic') ? 'bg-gold-200' : ''
            }`}
            title="Italic"
          >
            <ItalicIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gold-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gold-100 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gold-200' : ''
            }`}
            title="Bullet List"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gold-100 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gold-200' : ''
            }`}
            title="Numbered List"
          >
            <NumberedListIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gold-300 pr-2">
          <button
            type="button"
            onClick={addLink}
            className="p-2 rounded hover:bg-gold-100 transition-colors"
            title="Add Link"
          >
            <LinkIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-2 rounded hover:bg-gold-100 transition-colors"
            title="Add Image"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gold-100 transition-colors disabled:opacity-50"
            title="Undo"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gold-100 transition-colors disabled:opacity-50"
            title="Redo"
          >
            <ArrowUturnRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-[400px] max-h-[600px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

