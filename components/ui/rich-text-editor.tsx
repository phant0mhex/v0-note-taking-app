// components/ui/rich-text-editor.tsx
"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Barre d'outils de l'éditeur
const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 rounded-t-md border border-input border-b-0 bg-transparent p-2">
      <Button
        type="button"
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("taskList") ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquare className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Props pour l'éditeur
interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  className?: string
}

export const RichTextEditor = ({
  content,
  onChange,
  className,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Désactive les extensions que nous ne voulons pas
        heading: false,
        blockquote: false,
        codeBlock: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true, // Permet les listes de tâches imbriquées
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    // Styles de l'éditeur via les props de Tiptap
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base min-h-[120px] w-full max-w-none rounded-b-md border border-input bg-transparent px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      },
    },

// ▼▼▼ AJOUTEZ CETTE LIGNE ▼▼▼
    immediatelyRender: false,
    // ▲▲▲ FIN DE L'AJOUT ▲▲▲

  })

  return (
    <div className={className}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}