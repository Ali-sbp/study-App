"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/lib/api"

interface HistoryEntry {
  input: string
  output: string
  isError: boolean
}

interface Props {
  getEditorContent: () => string
  token: string
}

export function GhciPanel({ getEditorContent, token }: Props) {
  const { getToken } = useAuth()
  const [open, setOpen] = useState(true)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [cmdIndex, setCmdIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [history, loading])

  const submit = useCallback(async () => {
    const expr = input.trim()
    if (!expr || loading) return

    setInput("")
    setCmdIndex(-1)
    setCmdHistory(prev => [expr, ...prev])
    setLoading(true)

    try {
      const t = (await getToken()) || token
      const code = getEditorContent()
      const result = await api.ghci(t, code, expr)
      const raw = result.output || result.stderr || ""
      setHistory(prev => [...prev, { input: expr, output: raw, isError: !!result.stderr && !result.output }])
    } catch (e: any) {
      setHistory(prev => [...prev, { input: expr, output: e.message, isError: true }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [input, loading, getToken, token, getEditorContent])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setCmdIndex(i => {
        const next = Math.min(i + 1, cmdHistory.length - 1)
        setInput(cmdHistory[next] ?? "")
        return next
      })
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setCmdIndex(i => {
        const next = Math.max(i - 1, -1)
        setInput(next === -1 ? "" : cmdHistory[next])
        return next
      })
    }
  }

  return (
    <div
      className="flex-shrink-0 transition-all"
      style={{ height: open ? "220px" : "34px", borderTop: "1px solid var(--surface)", background: "var(--crust)" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 h-[34px] text-xs transition-colors select-none"
        style={{ color: "var(--subtext)" }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "var(--text)"
          e.currentTarget.style.background = "var(--mantle)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "var(--subtext)"
          e.currentTarget.style.background = ""
        }}
      >
        <span className="font-mono font-bold" style={{ color: "var(--accent)" }}>λ</span>
        <span className="font-mono" style={{ color: "var(--text)" }}>GHCi</span>
        <span style={{ color: "var(--overlay)" }}>— интерактивный интерпретатор</span>
        <span className="ml-auto" style={{ color: "var(--overlay)" }}>{open ? "▼" : "▶"}</span>
      </button>

      {/* Body */}
      {open && (
        <div
          className="flex flex-col"
          style={{ height: "186px" }}
        >
          {/* Scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1 space-y-1 font-mono text-xs select-text cursor-text">
            {history.length === 0 && !loading && (
              <p style={{ color: "var(--overlay)" }}>
                Введите выражение, например{" "}
                <span style={{ color: "var(--green)" }}>map (*2) [1..5]</span>
                {" "}или{" "}
                <span style={{ color: "var(--green)" }}>:t foldr</span>
              </p>
            )}
            {history.map((entry, i) => (
              <div key={i} className="space-y-0.5">
                <div>
                  <span style={{ color: "var(--subtext)" }}>λ&gt; </span>
                  <span style={{ color: "var(--accent)" }}>{entry.input}</span>
                </div>
                {entry.output && (
                  <div
                    className="pl-4 whitespace-pre-wrap"
                    style={{ color: entry.isError ? "var(--red)" : "var(--green)" }}
                  >
                    {entry.output}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div>
                <span style={{ color: "var(--subtext)" }}>λ&gt; </span>
                <span className="animate-pulse" style={{ color: "var(--overlay)" }}>…</span>
              </div>
            )}
          </div>

          {/* Input row */}
          <div
            className="flex items-center gap-2 px-3 h-8 flex-shrink-0 cursor-text"
            style={{ borderTop: "1px solid var(--surface)" }}
            onClick={() => inputRef.current?.focus()}
          >
            <span className="font-mono text-xs select-none" style={{ color: "var(--subtext)" }}>λ&gt;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="1 + 1"
              disabled={loading}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 bg-transparent font-mono text-xs outline-none"
              style={{ color: "var(--text)", caretColor: "var(--text)" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
