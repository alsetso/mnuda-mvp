'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentTextIcon,
  EyeIcon,
  CodeBracketIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import DOMPurify from 'dompurify';
import { useState } from 'react';

interface ArticleContentEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function ArticleContentEditor({
  content = '',
  onChange,
  placeholder = 'Start writing your article...',
}: ArticleContentEditorProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-gray-100 rounded p-2 font-mono text-sm',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gold-500 pl-4 italic text-gray-700',
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table',
          'thead', 'tbody', 'tr', 'th', 'td',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'width', 'height'],
      });
      onChange(sanitized);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return (
      <div className="border-2 border-gray-200 rounded-lg bg-white p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const characterCount = editor.getText().length;
  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length;
  const estimatedReadingTime = Math.ceil(wordCount / 200); // Average reading speed

  const handleAddLink = () => {
    if (linkUrl) {
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  const handleAddImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: 'Article image' }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const getPreviewContent = () => {
    const html = editor.getHTML();
    return DOMPurify.sanitize(html);
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 mr-2 border-r border-gray-300 pr-2">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'edit'
                  ? 'bg-gold-200 text-gold-900'
                  : 'hover:bg-gray-200'
              }`}
              title="Edit Mode"
            >
              <DocumentTextIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'preview'
                  ? 'bg-gold-200 text-gold-900'
                  : 'hover:bg-gray-200'
              }`}
              title="Preview Mode"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-gold-200 text-gold-900'
                  : 'hover:bg-gray-200'
              }`}
              title="Split View"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-2 h-4 border-r border-gray-400"></div>
                <div className="w-2 h-4"></div>
              </div>
            </button>
          </div>

          {/* Formatting Buttons */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('bold')
                ? 'bg-gold-200 text-gold-900'
                : 'hover:bg-gray-200'
            } disabled:opacity-50`}
            title="Bold (Ctrl+B)"
          >
            <BoldIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('italic')
                ? 'bg-gold-200 text-gold-900'
                : 'hover:bg-gray-200'
            } disabled:opacity-50`}
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon className="w-5 h-5" />
          </button>

          {/* Headings */}
          <div className="border-l border-gray-300 pl-2 ml-1">
            <select
              onChange={(e) => {
                const level = parseInt(e.target.value);
                if (level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run();
                }
              }}
              value={
                editor.isActive('heading', { level: 1 })
                  ? '1'
                  : editor.isActive('heading', { level: 2 })
                  ? '2'
                  : editor.isActive('heading', { level: 3 })
                  ? '3'
                  : editor.isActive('heading', { level: 4 })
                  ? '4'
                  : '0'
              }
              className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
            >
              <option value="0">Paragraph</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
              <option value="4">Heading 4</option>
            </select>
          </div>

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-gold-200 text-gold-900'
                : 'hover:bg-gray-200'
            }`}
            title="Bullet List"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-gold-200 text-gold-900'
                : 'hover:bg-gray-200'
            }`}
            title="Numbered List"
          >
            <NumberedListIcon className="w-5 h-5" />
          </button>

          {/* Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('codeBlock')
                ? 'bg-gold-200 text-gold-900'
                : 'hover:bg-gray-200'
            }`}
            title="Code Block"
          >
            <CodeBracketIcon className="w-5 h-5" />
          </button>

          {/* Table */}
          <button
            type="button"
            onClick={insertTable}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Insert Table"
          >
            <TableCellsIcon className="w-5 h-5" />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkDialog(true);
              }
            }}
            className={`p-2 rounded transition-colors ${
              editor.isActive('link')
                ? 'bg-gold-200 text-gold-900'
                : 'hover:bg-gray-200'
            }`}
            title="Add Link"
          >
            <LinkIcon className="w-5 h-5" />
          </button>

          {/* Image */}
          <button
            type="button"
            onClick={handleAddImage}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Add Image"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Undo (Ctrl+Z)"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Redo (Ctrl+Y)"
          >
            <ArrowUturnRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="border-b border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Link URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
                if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                }
              }}
              autoFocus
            />
            <input
              type="text"
              placeholder="Link text (optional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl('');
                setLinkText('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className="flex" style={{ minHeight: '500px' }}>
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'w-full'}>
            <div className="min-h-[500px] max-h-[800px] overflow-y-auto">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={viewMode === 'split' ? 'w-1/2' : 'w-full'}>
            <div
              className="prose prose-lg max-w-none p-6 min-h-[500px] max-h-[800px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
            />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>{characterCount.toLocaleString()} characters</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>~{estimatedReadingTime} min read</span>
        </div>
        <div className="text-xs text-gray-500">
          Tip: Use toolbar buttons or Markdown syntax to format
        </div>
      </div>
    </div>
  );
}

