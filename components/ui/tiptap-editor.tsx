"use client";

import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  className,
  placeholder = "Start editing...",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false, // Fix SSR hydration mismatch warning
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[200px] p-4",
          className
        ),
      },
    },
  });

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const toggleHeading = useCallback(
    (level: 1 | 2 | 3) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border rounded-md p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={toggleBold}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </Button>

        <Button
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={toggleItalic}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </Button>

        <Button
          variant={editor.isActive("strike") ? "default" : "ghost"}
          size="sm"
          onClick={toggleStrike}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant={
            editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => toggleHeading(1)}
        >
          <Heading1 size={16} />
        </Button>

        <Button
          variant={
            editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => toggleHeading(2)}
        >
          <Heading2 size={16} />
        </Button>

        <Button
          variant={
            editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => toggleHeading(3)}
        >
          <Heading3 size={16} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={toggleBulletList}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </Button>

        <Button
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={toggleOrderedList}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </Button>

        <Button
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          onClick={toggleBlockquote}
          disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo size={16} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo size={16} />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="min-h-[200px] max-h-[400px] overflow-y-auto"
      />
    </div>
  );
}
