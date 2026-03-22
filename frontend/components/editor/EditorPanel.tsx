"use client"

import { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { OutputPanel } from "@/components/editor/OutputPanel"
import { api } from "@/lib/api"
import type { LectureContent } from "@/lib/types"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface Props {
  lecture: LectureContent
  token: string
  lectureId: string
  onGetSelectedText: (fn: () => string) => void
  onGetEditorContent: (fn: () => string) => void  // exposes practice tab content to parent
}

export function EditorPanel({ lecture, token, lectureId, onGetSelectedText, onGetEditorContent }: Props) {
  const [activeTab, setActiveTab] = useState<"lecture" | "practice">("lecture")
  const [lectureCode, setLectureCode] = useState(lecture.content)
  const [practiceCode, setPracticeCode] = useState("-- Практика\nmain :: IO ()\nmain = putStrLn \"Hello, Haskell!\"")
  const [output, setOutput] = useState<{ stdout: string | null; stderr: string | null; compile_output: string | null; status: string } | null>(null)
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<any>(null)

  // Expose getSelectedText and getEditorContent to parent via callbacks
  useEffect(() => {
    onGetSelectedText(() => {
      if (editorRef.current) {
        const selection = editorRef.current.getSelection()
        return editorRef.current.getModel()?.getValueInRange(selection) || ""
      }
      return ""
    })
    onGetEditorContent(() => practiceCode)
  }, [onGetSelectedText, onGetEditorContent, practiceCode])

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor
  }

  const currentCode = activeTab === "lecture" ? lectureCode : practiceCode
  const setCurrentCode = activeTab === "lecture" ? setLectureCode : setPracticeCode

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.saveLectureContent(token, lectureId, lectureCode)
    } finally {
      setSaving(false)
    }
  }

  const handleRun = async () => {
    setRunning(true)
    setOutput(null)
    try {
      const result = await api.execute(token, practiceCode)
      setOutput(result)
    } catch (e: any) {
      setOutput({ stdout: null, stderr: e.message, compile_output: null, status: "Error" })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#181825] border-b border-[#313244] px-2 pt-1">
        {(["lecture", "practice"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-sm rounded-t transition-colors ${
              activeTab === tab
                ? "bg-[#1e1e2e] text-[#cdd6f4] border-t border-x border-[#313244]"
                : "text-[#6c7086] hover:text-[#cdd6f4]"
            }`}
          >
            {tab === "lecture" ? "📄 Лекция" : "✏️ Практика"}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={saving}
            className="text-xs text-[#6c7086] hover:text-[#cdd6f4] h-7"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="haskell"
          theme="vs-dark"
          value={currentCode}
          onChange={(v) => setCurrentCode(v || "")}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Output panel */}
      <OutputPanel
        output={output}
        running={running}
        onRun={handleRun}
        showRunButton={activeTab === "practice"}
      />
    </div>
  )
}
