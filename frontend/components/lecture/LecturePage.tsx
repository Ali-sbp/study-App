"use client"

import { useChat } from "ai/react"
import { useRef } from "react"
import { ResizablePanels } from "@/components/layout/ResizablePanels"
import { EditorPanel } from "@/components/editor/EditorPanel"
import { ChatPanel } from "@/components/chat/ChatPanel"
import { PresetsToolbar } from "@/components/chat/PresetsToolbar"
import type { LectureContent } from "@/lib/types"

interface Props {
  lecture: LectureContent
  initialHistory: { role: string; content: string }[]
  token: string
  lectureId: string
}

export function LecturePage({ lecture, initialHistory, token, lectureId }: Props) {
  const getSelectedTextRef = useRef<() => string>(() => "")
  const getEditorContentRef = useRef<() => string>(() => "")

  const chat = useChat({
    api: `/api/chat/${lectureId}`,
    initialMessages: initialHistory.map((m, i) => ({
      id: String(i),
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  })

  const handlePresetSend = (message: string) => {
    chat.append({ role: "user", content: message })
  }

  return (
    <div className="flex flex-col h-screen bg-[#11111b] text-[#cdd6f4]">
      <div className="bg-[#1e1e2e] border-b border-[#313244] px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <span className="text-[#cba6f7] font-bold">λ HaskellStudy</span>
        <span className="text-[#6c7086]">·</span>
        <span className="text-sm text-[#cdd6f4]">{lecture.title}</span>
      </div>

      <PresetsToolbar
        lectureId={lectureId}
        getSelectedText={() => getSelectedTextRef.current()}
        getEditorContent={() => getEditorContentRef.current()}
        onSendMessage={handlePresetSend}
      />

      <div className="flex-1 min-h-0">
        <ResizablePanels
          left={
            <EditorPanel
              lecture={lecture}
              token={token}
              lectureId={lectureId}
              onGetSelectedText={(fn) => { getSelectedTextRef.current = fn }}
              onGetEditorContent={(fn) => { getEditorContentRef.current = fn }}
            />
          }
          right={<ChatPanel lectureId={lectureId} token={token} chat={chat} />}
        />
      </div>
    </div>
  )
}
