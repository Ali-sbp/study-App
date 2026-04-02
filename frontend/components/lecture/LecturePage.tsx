"use client"

import { useChat } from "ai/react"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ResizablePanels } from "@/components/layout/ResizablePanels"
import { EditorPanel } from "@/components/editor/EditorPanel"
import { ChatPanel } from "@/components/chat/ChatPanel"
import { GhciPanel } from "@/components/editor/GhciPanel"
import { THEMES, DEFAULT_THEME } from "@/lib/themes"
import type { LectureContent, UserFileData, Lecture } from "@/lib/types"

interface Props {
  lecture: LectureContent
  initialHistory: { role: string; content: string }[]
  initialFiles: UserFileData[]
  allLectures: Lecture[]
  allPractice: Lecture[]
  personalCopy: UserFileData
  token: string
  lectureId: string
  initialTab?: "lecture" | "practice"
}

export function LecturePage({ lecture, initialHistory, initialFiles, allLectures, allPractice, personalCopy, token, lectureId, initialTab = "lecture" }: Props) {
  const getSelectedTextRef = useRef<() => string>(() => "")
  const getEditorContentRef = useRef<() => string>(() => "")
  const [contextLabel, setContextLabel] = useState(`📄 ${lecture.title}`)

  // ── Theme ──────────────────────────────────────────────────────────
  const [themeIndex, setThemeIndex] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("hs-theme")
    if (saved) {
      const idx = THEMES.findIndex(t => t.id === saved)
      if (idx !== -1) setThemeIndex(idx)
    }
  }, [])

  const theme = THEMES[themeIndex]

  const cycleTheme = () => {
    const next = (themeIndex + 1) % THEMES.length
    setThemeIndex(next)
    localStorage.setItem("hs-theme", THEMES[next].id)
  }

  // ── Chat ───────────────────────────────────────────────────────────
  const chat = useChat({
    api: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/stream/chat/${lectureId}`,
    initialMessages: initialHistory.map((m, i) => ({
      id: String(i),
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  })

  const handlePresetSend = (message: string) => {
    chat.append(
      { role: "user", content: message },
      { body: { context: getEditorContentRef.current(), contextLabel } } as any
    )
  }

  const handleSendToChat = (selectedText: string) => {
    chat.setInput(`\`\`\`haskell\n${selectedText}\n\`\`\`\n`)
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={theme.vars as React.CSSProperties}
    >
      {/* Header */}
      <div
        className="border-b px-4 py-2 flex items-center gap-3 flex-shrink-0"
        style={{ background: "var(--base)", borderColor: "var(--surface)", color: "var(--text)" }}
      >
        <Link
          href="/dashboard"
          className="font-bold hover:opacity-80 transition-opacity"
          style={{ color: "var(--accent)" }}
        >
          λ HaskellStudy
        </Link>
        <span style={{ color: "var(--subtext)" }}>·</span>
        <span className="text-sm">{lecture.title}</span>

        {/* Theme button */}
        <button
          onClick={cycleTheme}
          title={`Тема: ${theme.label} → ${THEMES[(themeIndex + 1) % THEMES.length].label}`}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-opacity hover:opacity-70"
          style={{ color: "var(--subtext)", border: "1px solid var(--surface)" }}
        >
          <span>{theme.icon}</span>
          <span>{theme.label}</span>
        </button>

        <Link
          href="/dashboard"
          className="text-xs transition-opacity hover:opacity-70 flex items-center gap-1"
          style={{ color: "var(--subtext)" }}
        >
          ← Лекции
        </Link>
      </div>

      <div className="flex-1 min-h-0">
        <ResizablePanels
          theme={theme}
          left={
            <div className="flex flex-col h-full">
              <EditorPanel
                lecture={lecture}
                token={token}
                lectureId={lectureId}
                initialFiles={initialFiles}
                allLectures={allLectures}
                allPractice={allPractice}
                personalCopy={personalCopy}
                monacoTheme={theme.monaco}
                initialTab={initialTab}
                onGetSelectedText={(fn) => { getSelectedTextRef.current = fn }}
                onGetEditorContent={(fn) => { getEditorContentRef.current = fn }}
                onContextLabelChange={setContextLabel}
                onSendToChat={handleSendToChat}
              />
              <GhciPanel
                getEditorContent={() => getEditorContentRef.current()}
                token={token}
              />
            </div>
          }
          right={
            <ChatPanel
              lectureId={lectureId}
              token={token}
              chat={chat}
              contextLabel={contextLabel}
              getSelectedText={() => getSelectedTextRef.current()}
              getEditorContent={() => getEditorContentRef.current()}
              onSendMessage={handlePresetSend}
            />
          }
        />
      </div>
    </div>
  )
}
