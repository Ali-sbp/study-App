import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { UploadForm } from "@/components/admin/UploadForm"

export default async function AdminPage() {
  const { userId } = await auth()
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean)

  if (!userId || !adminIds.includes(userId)) {
    redirect("/dashboard")
  }

  return <UploadForm />
}
