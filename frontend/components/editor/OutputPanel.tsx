"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface OutputResult {
  stdout: string | null
  stderr: string | null
  compile_output?: string | null
  status: string
}

interface Props {
  output: OutputResult | null
  running: boolean
  onRun: () => void
  showRunButton: boolean
}

export function OutputPanel({ output, running, onRun, showRunButton }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const hasOutput = output !== null
  const displayText = output?.stdout || output?.compile_output || output?.stderr || ""
  const isError = !output?.stdout && (!!output?.stderr || !!output?.compile_output)

  return (
    <div className="flex-shrink-0" style={{ borderTop: "1px solid var(--surface)", background: "var(--mantle)" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs flex items-center gap-1"
          style={{ color: "var(--subtext)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--subtext)")}
        >
          <span>{collapsed ? "▶" : "▼"}</span>
          <span>Вывод</span>
          {hasOutput && (
            <span className="ml-1" style={{ color: isError ? "var(--red)" : "var(--green)" }}>
              ● {output?.status}
            </span>
          )}
        </button>
        {showRunButton && (
          <Button
            size="sm"
            onClick={onRun}
            disabled={running}
            className="h-6 text-xs"
            style={{ background: "var(--green)", color: "var(--crust)" }}
          >
            {running ? "Запуск..." : "▶ Запустить"}
          </Button>
        )}
      </div>

      {/* Output content */}
      {!collapsed && (
        <div className="px-3 pb-2 max-h-32 overflow-y-auto">
          {!hasOutput ? (
            <p className="text-xs font-mono" style={{ color: "var(--subtext)" }}>Нажмите ▶ Запустить для выполнения кода</p>
          ) : (
            <pre
              className="text-xs font-mono whitespace-pre-wrap"
              style={{ color: isError ? "var(--red)" : "var(--green)" }}
            >
              {displayText || "(нет вывода)"}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
