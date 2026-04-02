"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import type { UserFileData } from "@/lib/types"
import { api } from "@/lib/api"

export function MyFilesSection({ files: initial }: { files: UserFileData[] }) {
  const { getToken } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (fileId: string) => {
    if (!confirm("Удалить этот файл?")) return
    setDeleting(fileId)
    try {
      const token = await getToken()
      if (!token) return
      await api.deleteMyFile(token, fileId)
      setFiles(prev => prev.filter(f => f.id !== fileId))
      router.refresh()
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`)
    } finally {
      setDeleting(null)
    }
  }

  if (files.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-bold mb-1">Мои файлы</h2>
      <p className="text-[#6c7086] text-sm mb-4">Файлы, которые вы создали сами</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-4 flex items-start justify-between gap-2"
          >
            <div>
              <p className="text-[#cdd6f4] text-sm font-medium">{file.name}</p>
              {file.updated_at && (
                <p className="text-[#45475a] text-xs mt-1">
                  {new Intl.RelativeTimeFormat("ru", { numeric: "auto" }).format(
                    Math.round((new Date(file.updated_at).getTime() - Date.now()) / 1000 / 60),
                    "minute"
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(file.id)}
              disabled={deleting === file.id}
              className="text-xs text-[#6c7086] hover:text-[#f38ba8] transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {deleting === file.id ? "..." : "Удалить"}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
