"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import type { Theme } from "@/lib/themes"

interface ResizablePanelsProps {
  left: React.ReactNode
  right: React.ReactNode
  theme: Theme
}

export function ResizablePanels({ left, right, theme }: ResizablePanelsProps) {
  const [leftPct, setLeftPct] = useState(58)
  const [chatOpen, setChatOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!chatOpen) return
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [chatOpen])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(82, Math.max(30, pct)))
    }
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  const rightPct = chatOpen ? 100 - leftPct - 0.3 : 0

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left panel */}
      <div
        style={{ width: chatOpen ? `${leftPct}%` : "100%" }}
        className="flex flex-col min-w-0 transition-none"
      >
        {left}
      </div>

      {/* Divider with collapse toggle */}
      <div
        className={`relative w-1 flex-shrink-0 transition-colors group ${chatOpen ? "cursor-col-resize" : "cursor-default"}`}
        style={{ background: "var(--surface)" }}
        onMouseDown={onMouseDown}
      >
        <button
          onClick={() => setChatOpen(o => !o)}
          onMouseDown={e => e.stopPropagation()}
          title={chatOpen ? "Скрыть чат" : "Показать чат"}
          className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-5 h-8 z-20 rounded text-xs transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
          style={{ background: "var(--surface)", color: "var(--subtext)" }}
        >
          {chatOpen ? "›" : "‹"}
        </button>
      </div>

      {/* Right panel */}
      <div
        style={{ width: `${rightPct}%` }}
        className="flex flex-col min-w-0 overflow-hidden"
      >
        {right}
      </div>
    </div>
  )
}
