"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Edit3, Save, X } from "lucide-react";

interface EditorDialogProps {
  content: string;
  onSave: (content: string) => void;
  title?: string;
  description?: string;
  triggerVariant?: "default" | "ghost" | "outline" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode; // Custom trigger
}

export function EditorDialog({
  content,
  onSave,
  title = "Edit Content",
  description = "Make changes to your content. Click save when you're done.",
  triggerVariant = "outline",
  triggerSize = "sm",
  children,
}: EditorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState(content);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset content when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEditedContent(content);
      setLastSavedContent(content);
      setHasChanges(false);
      setIsSaved(false);
      setJustSaved(false);
    }
  }, [isOpen, content]);

  // Track changes only
  useEffect(() => {
    const hasUnsavedChanges = editedContent !== lastSavedContent;
    setHasChanges(hasUnsavedChanges);
  }, [editedContent, lastSavedContent]);

  // Handle editor content changes to reset saved status (but only after a delay)
  const handleContentChange = (newContent: string) => {
    setEditedContent(newContent);

    // Only reset saved status if there was a meaningful change and some time has passed since saving
    if (isSaved && !justSaved) {
      setTimeout(() => {
        if (newContent !== lastSavedContent) {
          setIsSaved(false);
          if (savedTimeoutRef.current) {
            clearTimeout(savedTimeoutRef.current);
            savedTimeoutRef.current = null;
          }
        }
      }, 500); // Wait 500ms before potentially hiding saved status
    }
  };

  const handleSave = () => {
    onSave(editedContent);
    setLastSavedContent(editedContent); // Track what we just saved
    setJustSaved(true); // Flag that we just saved to prevent immediate reset
    setIsSaved(true);

    // Clear any existing timeout
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }

    // Auto-hide saved message after 10 seconds
    savedTimeoutRef.current = setTimeout(() => {
      setIsSaved(false);
      setJustSaved(false);
      savedTimeoutRef.current = null;
    }, 10000);
  };

  const handleCancel = () => {
    // Clear any pending timeouts
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }

    setEditedContent(content);
    setIsOpen(false);
    setHasChanges(false);
    setIsSaved(false);
  };

  const defaultTrigger = (
    <Button variant={triggerVariant} size={triggerSize}>
      <Edit3 size={16} className="mr-1" />
      Edit
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <TiptapEditor
            content={editedContent}
            onChange={handleContentChange}
            className="h-full"
          />
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            {isSaved && <span className="text-green-600">✓ Saved</span>}
            {hasChanges && !isSaved && (
              <span className="text-amber-600">● Unsaved changes</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X size={16} className="mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save size={16} className="mr-1" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
