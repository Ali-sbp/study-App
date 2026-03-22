import { auth } from "@clerk/nextjs/server"
import { api } from "@/lib/api"
import { LectureCard } from "@/components/lecture/LectureCard"

export default async function DashboardPage() {
  const { getToken } = await auth()
  const token = await getToken()

  const [lectures] = await Promise.all([
    api.listLectures(token!),
    api.upsertUser(token!).catch(() => {}),  // sync user record; failure doesn't block lecture rendering
  ])

  return (
    <div className="min-h-screen bg-[#11111b] text-[#cdd6f4]">
      <div className="bg-[#1e1e2e] border-b border-[#313244] px-6 py-3 flex items-center justify-between">
        <span className="text-[#cba6f7] font-bold text-lg">λ HaskellStudy</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">Лекции</h1>
        <p className="text-[#6c7086] mb-8">Выберите лекцию для изучения</p>

        {lectures.length === 0 ? (
          <p className="text-[#6c7086]">Лекции не найдены. Загрузите первую лекцию.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lectures.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
