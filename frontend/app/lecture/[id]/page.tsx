import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { api } from "@/lib/api"
import { LecturePage } from "@/components/lecture/LecturePage"

export default async function LectureRoute({ params, searchParams }: { params: { id: string }, searchParams: { tab?: string } }) {
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) {
    redirect("/sign-in")
  }

  const [lectureContent, history, files, allLectures, allPractice, personalCopy] = await Promise.all([
    api.getLectureContent(token!, params.id),
    api.getChatHistory(token!, params.id),
    api.listUserFiles(token!, params.id),
    api.listLectures(token!, "lecture"),
    api.listLectures(token!, "practice"),
    api.forkLecture(token!, params.id),
  ])

  return (
    <LecturePage
      lecture={lectureContent}
      initialHistory={history}
      initialFiles={files}
      allLectures={allLectures}
      allPractice={allPractice}
      personalCopy={personalCopy}
      token={token!}
      lectureId={params.id}
      initialTab={searchParams.tab === "practice" ? "practice" : "lecture"}
    />
  )
}
