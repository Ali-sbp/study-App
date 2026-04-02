"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

type FileType = "lecture" | "practice"

function UploadSection({ fileType, label, onUploaded }: { fileType: FileType; label: string; onUploaded: () => void }) {
  const { getToken } = useAuth()
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDefault, setIsDefault] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return
    setUploading(true)
    setStatus(null)
    try {
      const token = await getToken()
      if (!token) { setStatus("Ошибка: сессия истекла, обновите страницу"); return }
      await api.uploadLecture(token, title, file, isDefault, fileType)
      setStatus(`✓ ${label} загружена`)
      setTitle("")
      setFile(null)
      onUploaded()
    } catch (err: any) {
      setStatus(`Ошибка: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#1e1e2e] rounded-lg p-6 border border-[#313244]">
      <h2 className="text-lg font-semibold text-[#cba6f7]">
        {fileType === "lecture" ? "📄" : "✏️"} {label}
      </h2>

      <div>
        <label className="block text-sm text-[#6c7086] mb-1">Название</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={fileType === "lecture" ? "Лекция 1 — Введение" : "Задание 1 — Парсеры"}
          className="w-full bg-[#313244] text-[#cdd6f4] rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#cba6f7]"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-[#6c7086] mb-1">Файл (.hs)</label>
        <input
          type="file"
          accept=".hs"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-[#6c7086] file:mr-3 file:py-1 file:px-3 file:rounded file:bg-[#313244] file:text-[#cdd6f4] file:border-0"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`isDefault-${fileType}`}
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="accent-[#cba6f7]"
        />
        <label htmlFor={`isDefault-${fileType}`} className="text-sm text-[#6c7086]">
          Видна всем студентам
        </label>
      </div>

      <Button
        type="submit"
        disabled={uploading || !file || !title}
        className="w-full bg-[#cba6f7] text-[#11111b] hover:bg-[#b4a0f5]"
      >
        {uploading ? "Загрузка..." : `Загрузить ${fileType === "lecture" ? "лекцию" : "задание"}`}
      </Button>

      {status && (
        <p className={`text-sm ${status.startsWith("✓") ? "text-[#a6e3a1]" : "text-[#f38ba8]"}`}>
          {status}
        </p>
      )}
    </form>
  )
}

type LectureItem = { id: string; title: string; filename: string; file_type: string; is_default: boolean }

function LectureList({ refreshKey }: { refreshKey: number }) {
  const { getToken } = useAuth()
  const [lectures, setLectures] = useState<LectureItem[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    const [lecs, pracs] = await Promise.all([
      api.listLectures(token, "lecture"),
      api.listLectures(token, "practice"),
    ])
    setLectures([...lecs, ...pracs])
  }, [getToken])

  useEffect(() => { load() }, [load, refreshKey])

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот файл?")) return
    setDeleting(id)
    try {
      const token = await getToken()
      if (!token) return
      await api.deleteLecture(token, id)
      setLectures(prev => prev.filter(l => l.id !== id))
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`)
    } finally {
      setDeleting(null)
    }
  }

  if (!lectures.length) return <p className="text-sm text-[#6c7086]">Нет загруженных файлов.</p>

  return (
    <ul className="space-y-2">
      {lectures.map(l => (
        <li key={l.id} className="flex items-center justify-between bg-[#1e1e2e] rounded px-4 py-2 border border-[#313244]">
          <div>
            <span className="text-sm text-[#cdd6f4]">{l.title}</span>
            <span className="ml-2 text-xs text-[#6c7086]">({l.file_type} · {l.filename})</span>
          </div>
          <button
            onClick={() => handleDelete(l.id)}
            disabled={deleting === l.id}
            className="text-xs text-[#f38ba8] hover:text-red-400 disabled:opacity-40 ml-4"
          >
            {deleting === l.id ? "..." : "Удалить"}
          </button>
        </li>
      ))}
    </ul>
  )
}

export function UploadForm() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-screen bg-[#11111b] text-[#cdd6f4] p-8">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-bold mb-6 text-[#cba6f7]">Управление материалами</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UploadSection fileType="lecture" label="Лекция" onUploaded={() => setRefreshKey(k => k + 1)} />
            <UploadSection fileType="practice" label="Задание / Практика" onUploaded={() => setRefreshKey(k => k + 1)} />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#cba6f7] mb-4">Загруженные файлы</h2>
          <LectureList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  )
}
