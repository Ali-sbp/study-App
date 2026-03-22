"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export function UploadForm() {
  const { getToken } = useAuth()
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return

    setUploading(true)
    setStatus(null)
    try {
      const token = await getToken()
      if (!token) {
        setStatus("Ошибка: сессия истекла, обновите страницу")
        return
      }
      await api.uploadLecture(token, title, file, isDefault)
      setStatus("✓ Лекция загружена")
      setTitle("")
      setFile(null)
      setIsDefault(false)
    } catch (err: any) {
      setStatus(`Ошибка: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#11111b] text-[#cdd6f4] p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#cba6f7]">Управление лекциями</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#1e1e2e] rounded-lg p-6 border border-[#313244]">
          <div>
            <label className="block text-sm text-[#6c7086] mb-1">Название лекции</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Лекция 1 — Введение"
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
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="accent-[#cba6f7]"
            />
            <label htmlFor="isDefault" className="text-sm text-[#6c7086]">
              Сделать лекцией по умолчанию (видна всем пользователям)
            </label>
          </div>

          <Button
            type="submit"
            disabled={uploading || !file || !title}
            className="w-full bg-[#cba6f7] text-[#11111b] hover:bg-[#b4a0f5]"
          >
            {uploading ? "Загрузка..." : "Загрузить лекцию"}
          </Button>

          {status && (
            <p className={`text-sm ${status.startsWith("✓") ? "text-[#a6e3a1]" : "text-[#f38ba8]"}`}>
              {status}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
