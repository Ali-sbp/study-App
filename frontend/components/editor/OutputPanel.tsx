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
    <div className="border-t border-[#313244] bg-[#181825] flex-shrink-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-[#6c7086] hover:text-[#cdd6f4] flex items-center gap-1"
        >
          <span>{collapsed ? "▶" : "▼"}</span>
          <span>Вывод</span>
          {hasOutput && (
            <span className={`ml-1 ${isError ? "text-[#f38ba8]" : "text-[#a6e3a1]"}`}>
              ● {output?.status}
            </span>
          )}
        </button>
        {showRunButton && (
          <Button
            size="sm"
            onClick={onRun}
            disabled={running}
            className="h-6 text-xs bg-[#a6e3a1] text-[#11111b] hover:bg-[#94d8a0]"
          >
            {running ? "Запуск..." : "▶ Запустить"}
          </Button>
        )}
      </div>

      {/* Output content */}
      {!collapsed && (
        <div className="px-3 pb-2 max-h-32 overflow-y-auto">
          {!hasOutput ? (
            <p className="text-[#6c7086] text-xs font-mono">Нажмите ▶ Запустить для выполнения кода</p>
          ) : (
            <pre className={`text-xs font-mono whitespace-pre-wrap ${isError ? "text-[#f38ba8]" : "text-[#a6e3a1]"}`}>
              {displayText || "(нет вывода)"}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
