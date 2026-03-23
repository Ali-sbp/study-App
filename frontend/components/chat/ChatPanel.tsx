"use client"

import { useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { PresetsToolbar } from "@/components/chat/PresetsToolbar"
import { api } from "@/lib/api"
import type { useChat } from "ai/react"

type ChatInstance = ReturnType<typeof useChat>

interface Props {
  lectureId: string
  token: string
  chat: ChatInstance
  contextLabel: string
  getSelectedText: () => string
  getEditorContent: () => string
  onSendMessage: (msg: string) => void
}

export function ChatPanel({ lectureId, token, chat, contextLabel, getSelectedText, getEditorContent, onSendMessage }: Props) {
  const { messages, input, handleInputChange, isLoading, setMessages, append, setInput } = chat
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea whenever input value changes
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading) return
      setInput("")
      append(
        { role: "user", content: text },
        { body: { context: getEditorContent(), contextLabel } } as any
      )
    }
  }, [input, isLoading, setInput, append, getEditorContent, contextLabel])

  const handleClear = async () => {
    await api.clearChatHistory(token, lectureId)
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--base)" }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--surface)" }}>
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>● AI Ассистент</span>
        <button
          onClick={handleClear}
          className="text-xs transition-colors"
          style={{ color: "var(--subtext)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--subtext)")}
        >
          Очистить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-8" style={{ color: "var(--subtext)" }}>
            Задайте вопрос или используйте кнопки выше
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm rounded-lg px-3 py-2 ${m.role === "user" ? "ml-4" : "mr-4"}`}
            style={{
              background: m.role === "user" ? "var(--surface)" : "var(--mantle)",
              color: "var(--text)",
            }}
          >
            {m.role === "user" ? (
              <p className="whitespace-pre-wrap">{m.content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  pre: ({ children }) => (
                    <pre className="rounded p-2 my-2 overflow-x-auto" style={{ background: "var(--crust)", border: "1px solid var(--surface)" }}>{children}</pre>
                  ),
                  code: ({ inline, children }: any) =>
                    inline ? (
                      <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: "var(--surface)", color: "var(--accent)" }}>{children}</code>
                    ) : (
                      <code className="text-xs font-mono" style={{ color: "var(--green)" }}>{children}</code>
                    ),
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold" style={{ color: "var(--accent)" }}>{children}</strong>,
                  h1: ({ children }) => <h1 className="text-base font-bold mb-2" style={{ color: "var(--accent)" }}>{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mb-1" style={{ color: "var(--accent)" }}>{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--blue)" }}>{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 pl-2 italic" style={{ borderColor: "var(--accent)", color: "var(--subtext)" }}>{children}</blockquote>,
                }}
              >
                {m.content}
              </ReactMarkdown>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="text-sm rounded-lg px-3 py-2 mr-4" style={{ background: "var(--mantle)", color: "var(--subtext)" }}>
            Думаю...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <PresetsToolbar
        lectureId={lectureId}
        getSelectedText={getSelectedText}
        getEditorContent={getEditorContent}
        onSendMessage={onSendMessage}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const text = input.trim()
          if (!text || isLoading) return
          setInput("")
          append(
            { role: "user", content: text },
            { body: { context: getEditorContent(), contextLabel } } as any
          )
        }}
        className="p-3 border-t"
        style={{ borderColor: "var(--surface)" }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос..."
            rows={1}
            className="flex-1 rounded px-3 py-2 text-sm outline-none focus:ring-1 resize-none overflow-hidden leading-relaxed max-h-48 overflow-y-auto"
            style={{
              background: "var(--surface)",
              color: "var(--text)",
              // @ts-ignore
              "--tw-ring-color": "var(--accent)",
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="flex-shrink-0"
            style={{ background: "var(--accent)", color: "var(--crust)" }}
          >
            →
          </Button>
        </div>
        <p className="mt-1.5 text-xs" style={{ color: "var(--overlay)" }}>🔍 ИИ видит: {contextLabel}</p>
      </form>
    </div>
  )
}
