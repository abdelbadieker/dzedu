'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Link, Image, Undo, Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ToolbarButton = ({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded p-1.5 transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
    }`}
    aria-label={label}
  >
    {children}
  </button>
);

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Placeholder.configure({ placeholder: placeholder ?? 'Write lesson content here...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  if (!editor) return null;

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
    <div className="rounded-lg border">
      <div className="flex flex-wrap gap-1 border-b bg-muted/50 px-2 py-2">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 w-px bg-border" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Ordered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="Quote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 w-px bg-border" />

        <ToolbarButton onClick={addLink} active={editor.isActive('link')} label="Link">
          <Link className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} label="Image">
          <Image className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 w-px bg-border" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} label="Undo">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} label="Redo">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
