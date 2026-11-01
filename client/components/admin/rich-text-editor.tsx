"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  RiBold,
  RiItalic,
  RiStrikethrough,
  RiH1,
  RiH2,
  RiH3,
  RiParagraph,
  RiListUnordered,
  RiListOrdered,
  RiDoubleQuotesL,
  RiCodeBoxLine,
  RiSeparator,
  RiLink,
  RiLinkUnlink,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiCodeSSlashLine,
  RiEyeLine,
  RiFormatClear,
} from "react-icons/ri";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write policy content, sections, guidelines, FAQs...",
  className = "",
}: RichTextEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-black underline font-semibold hover:text-[#E53E3E]",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[260px] p-4 text-[#111111] leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-xs sm:prose-p:text-sm prose-p:my-2 prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:my-2 prose-code:bg-[#F3F4F6] prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-xs",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setRawHtml(html);
      onChange(html);
    },
  });

  // Sync external value changes if editor is out of sync
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      setRawHtml(value);
    }
  }, [value, editor]);

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawHtml(val);
    onChange(val);
    if (editor) {
      editor.commands.setContent(val);
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter Target URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="w-full h-48 border border-[#D1D5DB] bg-[#FAFAFA] flex items-center justify-center">
        <span className="text-xs font-mono text-[#9CA3AF] uppercase">
          Initializing Rich Text Engine...
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full border border-[#D1D5DB] bg-white font-sans ${className}`}>
      {/* 1. COMPREHENSIVE TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#FAFAFA] border-b border-[#E5E7EB] select-none">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 text-xs font-black uppercase transition-colors rounded-none ${
              editor.isActive("heading", { level: 1 })
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Heading 1"
          >
            <RiH1 className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 text-xs font-black uppercase transition-colors rounded-none ${
              editor.isActive("heading", { level: 2 })
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Heading 2"
          >
            <RiH2 className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 text-xs font-black uppercase transition-colors rounded-none ${
              editor.isActive("heading", { level: 3 })
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Heading 3"
          >
            <RiH3 className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-1.5 text-xs font-black uppercase transition-colors rounded-none ${
              editor.isActive("paragraph")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Regular Paragraph"
          >
            <RiParagraph className="text-sm" />
          </button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("bold")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Bold (Ctrl+B)"
          >
            <RiBold className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("italic")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Italic (Ctrl+I)"
          >
            <RiItalic className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("strike")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Strikethrough"
          >
            <RiStrikethrough className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-1.5 text-xs text-[#6B7280] hover:bg-[#E5E7EB] hover:text-black transition-colors rounded-none"
            title="Clear Formatting"
          >
            <RiFormatClear className="text-sm" />
          </button>
        </div>

        {/* Lists & Blocks */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("bulletList")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Bullet List"
          >
            <RiListUnordered className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("orderedList")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Numbered List"
          >
            <RiListOrdered className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("blockquote")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Callout Blockquote"
          >
            <RiDoubleQuotesL className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("codeBlock")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Code Block"
          >
            <RiCodeBoxLine className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 text-xs text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black transition-colors rounded-none"
            title="Horizontal Divider"
          >
            <RiSeparator className="text-sm" />
          </button>
        </div>

        {/* Links */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-[#E5E7EB]">
          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 text-xs font-black transition-colors rounded-none ${
              editor.isActive("link")
                ? "bg-[#111111] text-white"
                : "text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black"
            }`}
            title="Insert Link"
          >
            <RiLink className="text-sm" />
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 text-xs text-[#DC2626] hover:bg-[#FEE2E2] transition-colors rounded-none"
              title="Remove Link"
            >
              <RiLinkUnlink className="text-sm" />
            </button>
          )}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 px-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 text-xs text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black transition-colors rounded-none disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <RiArrowGoBackLine className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 text-xs text-[#4B5563] hover:bg-[#E5E7EB] hover:text-black transition-colors rounded-none disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <RiArrowGoForwardLine className="text-sm" />
          </button>
        </div>

        {/* Visual vs Raw HTML Switcher */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors border ${
              isHtmlMode
                ? "bg-[#111111] text-white border-black"
                : "bg-white text-[#374151] border-[#D1D5DB] hover:border-black"
            }`}
            title="Toggle between Visual WYSIWYG and Raw HTML"
          >
            {isHtmlMode ? (
              <>
                <RiEyeLine className="text-xs" />
                <span>Visual Mode</span>
              </>
            ) : (
              <>
                <RiCodeSSlashLine className="text-xs" />
                <span>HTML Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. EDITOR BODY */}
      {isHtmlMode ? (
        <div className="p-2">
          <textarea
            rows={12}
            value={rawHtml}
            onChange={handleRawHtmlChange}
            placeholder="Edit raw HTML markup directly..."
            className="w-full bg-[#1A1A1A] text-[#10B981] font-mono text-xs p-4 outline-none border border-black focus:border-[#10B981] rounded-none resize-y"
          />
        </div>
      ) : (
        <div className="min-h-[260px] cursor-text" onClick={() => editor.commands.focus()}>
          <EditorContent editor={editor} />
        </div>
      )}

      {/* 3. FOOTER STATUS BAR */}
      <div className="px-3 py-1.5 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-[10px] font-mono text-[#9CA3AF]">
        <span>
          {isHtmlMode ? "RAW HTML CODE MODE" : "VISUAL WYSIWYG EDITOR"}
        </span>
        <span>
          {editor.storage.characterCount
            ? `${editor.storage.characterCount.words()} words`
            : `${(rawHtml.match(/\b\w+\b/g) || []).length} words`}
        </span>
      </div>
    </div>
  );
}
