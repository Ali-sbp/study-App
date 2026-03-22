import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { api } from "@/lib/api"
import { LecturePage } from "@/components/lecture/LecturePage"

export default async function LectureRoute({ params }: { params: { id: string } }) {
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) {
    redirect("/sign-in")
  }

  const [lectureContent, history] = await Promise.all([
    api.getLectureContent(token!, params.id),
    api.getChatHistory(token!, params.id),
  ])

  return (
    <LecturePage
      lecture={lectureContent}
      initialHistory={history}
      token={token!}
      lectureId={params.id}
    />
  )
}
