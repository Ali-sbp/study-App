import { auth } from "@clerk/nextjs/server"
import { api } from "@/lib/api"
import { LectureCard } from "@/components/lecture/LectureCard"
import Link from "next/link"
import type { UserFileData } from "@/lib/types"

function PersonalCopyCard({ file }: { file: UserFileData }) {
  const updated = file.updated_at
    ? new Intl.RelativeTimeFormat("ru", { numeric: "auto" }).format(
        Math.round((new Date(file.updated_at).getTime() - Date.now()) / 1000 / 60),
        "minute"
      )
    : null

  return (
    <Link href={`/lecture/${file.source_id}`}>
      <div className="bg-[#1e1e2e] border border-[#313244] hover:border-[#585b70] transition-colors cursor-pointer rounded-lg p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[#cdd6f4] text-sm font-medium">{file.name}</p>
            {updated && (
              <p className="text-[#45475a] text-xs mt-1">Изменено {updated}</p>
            )}
          </div>
          <span className="text-xs bg-[#313244] text-[#cba6f7] px-2 py-0.5 rounded flex-shrink-0">
            Мой файл
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function DashboardPage() {
  const { getToken } = await auth()
  const token = await getToken()

  const [lectures, personalCopies] = await Promise.all([
    api.listLectures(token!, "lecture"),
    api.getPersonalCopies(token!).catch(() => [] as UserFileData[]),
    api.upsertUser(token!).catch(() => {}),
  ])

  return (
    <div className="min-h-screen bg-[#11111b] text-[#cdd6f4]">
      <div className="bg-[#1e1e2e] border-b border-[#313244] px-6 py-3 flex items-center justify-between">
        <span className="text-[#cba6f7] font-bold text-lg">λ HaskellStudy</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* Personal copies — continue where you left off */}
        {personalCopies.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-1">Продолжить</h2>
            <p className="text-[#6c7086] text-sm mb-4">Ваши личные копии файлов</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalCopies.map((file) => (
                <PersonalCopyCard key={file.id} file={file} />
              ))}
            </div>
          </section>
        )}

        {/* Admin lecture files */}
        <section>
          <h2 className="text-lg font-bold mb-1">Лекции</h2>
          <p className="text-[#6c7086] text-sm mb-4">
            {personalCopies.length > 0
              ? "Открыть новую лекцию"
              : "Выберите лекцию для изучения"}
          </p>
          {lectures.length === 0 ? (
            <p className="text-[#6c7086]">Лекции не найдены. Загрузите первую лекцию.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lectures.map((lecture) => (
                <LectureCard key={lecture.id} lecture={lecture} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
