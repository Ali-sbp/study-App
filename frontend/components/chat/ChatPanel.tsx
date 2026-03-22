"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import type { useChat } from "ai/react"

type ChatInstance = ReturnType<typeof useChat>

interface Props {
  lectureId: string
  token: string
  chat: ChatInstance
}

export function ChatPanel({ lectureId, token, chat }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = chat
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleClear = async () => {
    await api.clearChatHistory(token, lectureId)
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#313244]">
        <span className="text-sm text-[#cdd6f4] font-medium">● AI Ассистент</span>
        <button
          onClick={handleClear}
          className="text-xs text-[#6c7086] hover:text-[#f38ba8] transition-colors"
        >
          Очистить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <p className="text-[#6c7086] text-sm text-center mt-8">
            Задайте вопрос или используйте кнопки выше
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm rounded-lg px-3 py-2 ${
              m.role === "user"
                ? "bg-[#313244] text-[#cdd6f4] ml-4"
                : "bg-[#181825] text-[#cdd6f4] mr-4"
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
          </div>
        ))}
        {isLoading && (
          <div className="bg-[#181825] text-[#6c7086] text-sm rounded-lg px-3 py-2 mr-4">
            Думаю...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[#313244]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Задайте вопрос..."
            className="flex-1 bg-[#313244] text-[#cdd6f4] rounded px-3 py-2 text-sm outline-none placeholder:text-[#6c7086] focus:ring-1 focus:ring-[#cba6f7]"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="bg-[#cba6f7] text-[#11111b] hover:bg-[#b4a0f5]"
          >
            →
          </Button>
        </div>
      </form>
    </div>
  )
}
