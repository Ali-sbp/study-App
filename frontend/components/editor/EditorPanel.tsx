"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { OutputPanel } from "@/components/editor/OutputPanel"
import { api } from "@/lib/api"
import type { LectureContent, UserFileData, Lecture } from "@/lib/types"
import { registerMonacoThemes } from "@/lib/themes"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

const DEFAULT_PRACTICE = "-- Практика\nmain :: IO ()\nmain = putStrLn \"Hello, Haskell!\""

interface Props {
  lecture: LectureContent
  token: string
  lectureId: string
  initialFiles: UserFileData[]
  allLectures: Lecture[]
  allPractice: Lecture[]
  personalCopy: UserFileData
  monacoTheme: string
  onGetSelectedText: (fn: () => string) => void
  onGetEditorContent: (fn: () => string) => void
  onContextLabelChange: (label: string) => void
  onSendToChat: (text: string) => void
}

// Small inline file-picker dropdown
function FilePicker({
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  items: Lecture[]
  selectedId: string | null
  onSelect: (id: string, title: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 rounded-lg shadow-xl min-w-48 max-h-64 overflow-y-auto"
      style={{ background: "var(--base)", border: "1px solid var(--surface)" }}
    >
      {items.length === 0 ? (
        <p className="px-3 py-2 text-xs" style={{ color: "var(--overlay)" }}>Нет доступных файлов</p>
      ) : (
        items.map((item) => (
          <button
            key={item.id}
            onClick={() => { onSelect(item.id, item.title); onClose() }}
            className="w-full text-left px-3 py-2 text-sm transition-colors"
            style={{ color: item.id === selectedId ? "var(--accent)" : "var(--text)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
            onMouseLeave={e => (e.currentTarget.style.background = "")}
          >
            {item.title}
            {item.id === selectedId && <span className="ml-2 text-xs" style={{ color: "var(--overlay)" }}>✓</span>}
          </button>
        ))
      )}
    </div>
  )
}

export function EditorPanel({
  lecture, token, lectureId, initialFiles, allLectures, allPractice, personalCopy, monacoTheme,
  onGetSelectedText, onGetEditorContent, onContextLabelChange, onSendToChat,
}: Props) {
  const { getToken } = useAuth()

  // Lecture tab state — backed by the user's personal fork
  const lectureCopyIdRef = useRef(personalCopy.id)          // always points to current fork's UserFile id
  const [selectedLectureId, setSelectedLectureId] = useState(lectureId)
  const [lectureCode, setLectureCode] = useState(personalCopy.content) // start from their copy
  const [lectureTitle, setLectureTitle] = useState(lecture.title)
  const [lecturePicker, setLecturePicker] = useState(false)

  // Practice tab state — forks on picker selection
  const [practiceCopyId, setPracticeCopyId] = useState<string | null>(null) // UserFile id after fork
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null)
  const [practiceCode, setPracticeCode] = useState(lecture.practice_content ?? DEFAULT_PRACTICE)
  const [practiceTitle, setPracticeTitle] = useState<string | null>(null)
  const [practicePicker, setPracticePicker] = useState(false)

  // Custom files tab state
  const [activeTab, setActiveTab] = useState<"lecture" | "practice" | string>("lecture")
  const [files, setFiles] = useState<UserFileData[]>(initialFiles)
  const [fileContents, setFileContents] = useState<Record<string, string>>(
    Object.fromEntries(initialFiles.map(f => [f.id, f.content]))
  )
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const newFileInputRef = useRef<HTMLInputElement>(null)

  // Output / run state
  const [output, setOutput] = useState<{ stdout: string | null; stderr: string | null; compile_output: string | null; status: string } | null>(null)
  const [running, setRunning] = useState(false)
  const editorRef = useRef<any>(null)
  const lectureDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const practiceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileDebounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const content =
      activeTab === "lecture" ? lectureCode
      : activeTab === "practice" ? practiceCode
      : fileContents[activeTab] ?? ""
    onGetEditorContent(() => content)

    // Tell parent what the AI should "see"
    if (activeTab === "lecture") {
      onContextLabelChange(`📄 ${lectureTitle}`)
    } else if (activeTab === "practice") {
      onContextLabelChange(`✏️ ${practiceTitle ?? "Практика"}`)
    } else {
      const f = files.find(f => f.id === activeTab)
      if (f) onContextLabelChange(`📝 ${f.name}`)
    }
  }, [activeTab, lectureCode, practiceCode, fileContents, lectureTitle, practiceTitle, files, onGetEditorContent, onContextLabelChange])

  useEffect(() => {
    onGetSelectedText(() => {
      if (editorRef.current) {
        const sel = editorRef.current.getSelection()
        return editorRef.current.getModel()?.getValueInRange(sel) || ""
      }
      return ""
    })
  }, [onGetSelectedText])

  useEffect(() => {
    if (isCreating) setTimeout(() => newFileInputRef.current?.focus(), 50)
  }, [isCreating])

  // Switch lecture file from picker — fork the new lecture for this user
  const handleSelectLecture = useCallback(async (id: string, title: string) => {
    setSelectedLectureId(id)
    setLectureTitle(title)
    try {
      const t = (await getToken()) || token
      const fork = await api.forkLecture(t, id)
      lectureCopyIdRef.current = fork.id   // point auto-save at the new fork
      setLectureCode(fork.content)
    } catch {}
  }, [getToken, token])

  // Auto-save lecture tab → always saves to the user's personal fork
  const handleLectureChange = useCallback((val: string) => {
    setLectureCode(val)
    if (lectureDebounceRef.current) clearTimeout(lectureDebounceRef.current)
    lectureDebounceRef.current = setTimeout(async () => {
      try {
        const t = (await getToken()) || token
        await api.saveUserFile(t, selectedLectureId, lectureCopyIdRef.current, val)
      } catch {}
    }, 1000)
  }, [getToken, token, selectedLectureId])

  // Switch practice file from picker — fork it
  const handleSelectPractice = useCallback(async (id: string, title: string) => {
    setSelectedPracticeId(id)
    setPracticeTitle(title)
    setActiveTab("practice")
    try {
      const t = (await getToken()) || token
      const fork = await api.forkLecture(t, id)
      setPracticeCode(fork.content)
      setPracticeCopyId(fork.id)
    } catch {}
  }, [getToken, token])

  // Auto-save practice → personal fork if selected, otherwise legacy practice_content
  const handlePracticeChange = useCallback((val: string) => {
    setPracticeCode(val)
    if (practiceDebounceRef.current) clearTimeout(practiceDebounceRef.current)
    practiceDebounceRef.current = setTimeout(async () => {
      try {
        const t = (await getToken()) || token
        if (practiceCopyId) {
          await api.saveUserFile(t, lectureId, practiceCopyId, val)
        } else {
          await api.savePracticeContent(t, lectureId, val)
        }
      } catch {}
    }, 1000)
  }, [getToken, token, practiceCopyId, lectureId])

  // Auto-save custom file
  const handleFileChange = useCallback((fileId: string, val: string) => {
    setFileContents(prev => ({ ...prev, [fileId]: val }))
    if (fileDebounceRefs.current[fileId]) clearTimeout(fileDebounceRefs.current[fileId])
    fileDebounceRefs.current[fileId] = setTimeout(async () => {
      try {
        const t = (await getToken()) || token
        await api.saveUserFile(t, lectureId, fileId, val)
      } catch {}
    }, 1000)
  }, [getToken, token, lectureId])

  const handleDownload = () => {
    const filename =
      activeTab === "lecture" ? `${lectureTitle}.hs`
      : activeTab === "practice" ? `${practiceTitle ?? "Практика"}.hs`
      : `${files.find(f => f.id === activeTab)?.name ?? "file"}.hs`
    const blob = new Blob([currentCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.endsWith(".hs") ? filename : `${filename}.hs`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const t = (await getToken()) || token
      await api.saveLectureContent(t, selectedLectureId, lectureCode)
    } finally { setSaving(false) }
  }

  const handleRun = async () => {
    const code =
      activeTab === "lecture" ? lectureCode
      : activeTab === "practice" ? practiceCode
      : fileContents[activeTab] ?? ""
    setRunning(true); setOutput(null)
    try {
      const t = (await getToken()) || token
      setOutput(await api.execute(t, code))
    } catch (e: any) {
      setOutput({ stdout: null, stderr: e.message, compile_output: null, status: "Error" })
    } finally { setRunning(false) }
  }

  const handleCreateFile = async () => {
    const name = newFileName.trim()
    if (!name) { setIsCreating(false); setNewFileName(""); return }
    try {
      const t = (await getToken()) || token
      const newFile = await api.createUserFile(t, lectureId, name)
      setFiles(prev => [...prev, newFile])
      setFileContents(prev => ({ ...prev, [newFile.id]: newFile.content }))
      setActiveTab(newFile.id)
    } catch {}
    setIsCreating(false); setNewFileName("")
  }

  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation()
    try {
      const t = (await getToken()) || token
      await api.deleteUserFile(t, lectureId, fileId)
      setFiles(prev => prev.filter(f => f.id !== fileId))
      setFileContents(prev => { const n = { ...prev }; delete n[fileId]; return n })
      if (activeTab === fileId) setActiveTab("practice")
    } catch {}
  }

  const handleEditorChange = (val: string | undefined) => {
    const v = val || ""
    if (activeTab === "lecture") handleLectureChange(v)
    else if (activeTab === "practice") handlePracticeChange(v)
    else handleFileChange(activeTab, v)
  }

  const currentCode =
    activeTab === "lecture" ? lectureCode
    : activeTab === "practice" ? practiceCode
    : fileContents[activeTab] ?? ""

  const tabActive  = { background: "var(--base)",   color: "var(--text)",    borderColor: "var(--surface)" }
  const tabInactive = { color: "var(--subtext)" }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex items-center gap-0.5 border-b px-2 pt-1 overflow-x-visible"
        style={{ background: "var(--mantle)", borderColor: "var(--surface)" }}
      >
        {/* Lecture tab with picker */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setActiveTab("lecture"); setLecturePicker(o => !o); setPracticePicker(false) }}
            className="px-3 py-1.5 text-sm rounded-t flex items-center gap-1 transition-colors"
            style={activeTab === "lecture" ? { ...tabActive, borderTop: "1px solid", borderLeft: "1px solid", borderRight: "1px solid" } : tabInactive}
          >
            <span>📄</span>
            <span className="max-w-28 truncate">{lectureTitle}</span>
            <span className="text-xs opacity-50">▼</span>
          </button>
          {lecturePicker && (
            <FilePicker
              items={allLectures}
              selectedId={selectedLectureId}
              onSelect={handleSelectLecture}
              onClose={() => setLecturePicker(false)}
            />
          )}
        </div>

        {/* Practice tab with picker */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setActiveTab("practice"); setPracticePicker(o => !o); setLecturePicker(false) }}
            className="px-3 py-1.5 text-sm rounded-t flex items-center gap-1 transition-colors"
            style={activeTab === "practice" ? { ...tabActive, borderTop: "1px solid", borderLeft: "1px solid", borderRight: "1px solid" } : tabInactive}
          >
            <span>✏️</span>
            <span className="max-w-28 truncate">{practiceTitle ?? "Практика"}</span>
            <span className="text-xs opacity-50">▼</span>
          </button>
          {practicePicker && (
            <FilePicker
              items={allPractice}
              selectedId={selectedPracticeId}
              onSelect={handleSelectPractice}
              onClose={() => setPracticePicker(false)}
            />
          )}
        </div>

        {/* Custom file tabs */}
        {files.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveTab(f.id)}
            className="group px-3 py-1.5 text-sm rounded-t whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-1.5"
            style={activeTab === f.id ? { ...tabActive, borderTop: "1px solid", borderLeft: "1px solid", borderRight: "1px solid" } : tabInactive}
          >
            <span>📝 {f.name}</span>
            <span
              onClick={(e) => handleDeleteFile(e, f.id)}
              className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
              style={{ color: "var(--red)" }}
            >✕</span>
          </button>
        ))}

        {/* New file input or + button */}
        {isCreating ? (
          <input
            ref={newFileInputRef}
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreateFile()
              if (e.key === "Escape") { setIsCreating(false); setNewFileName("") }
            }}
            onBlur={handleCreateFile}
            placeholder="имя файла"
            className="px-2 py-1 text-sm rounded outline-none w-28 flex-shrink-0"
            style={{ background: "var(--base)", color: "var(--text)", border: "1px solid var(--accent)" }}
          />
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="px-2 py-1.5 text-sm flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--subtext)" }}
            title="Новый файл"
          >+</button>
        )}

        {/* Toolbar right: download */}
        <div className="ml-auto pb-1 flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={handleDownload}
            className="text-xs h-7 hover:opacity-70"
            style={{ color: "var(--subtext)" }}
            title="Скачать как .hs">
            ↓ .hs
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="haskell"
          theme={monacoTheme}
          value={currentCode}
          onChange={handleEditorChange}
          beforeMount={registerMonacoThemes}
          onMount={(editor) => {
            editorRef.current = editor
            // ── Right-click: send selection to chat ───────────────────
            editor.addAction({
              id: "send-to-chat",
              label: "→ Отправить в чат",
              contextMenuGroupId: "1_modification",
              contextMenuOrder: 1,
              run: (ed: any) => {
                const sel = ed.getSelection()
                const text = ed.getModel()?.getValueInRange(sel) || ""
                if (text.trim()) onSendToChat(text)
              },
            })
          }}
          options={{ fontSize: 14, minimap: { enabled: false }, lineNumbers: "on", scrollBeyondLastLine: false, wordWrap: "on" }}
        />
      </div>

      <OutputPanel output={output} running={running} onRun={handleRun} showRunButton={activeTab !== "lecture"} />
    </div>
  )
}
