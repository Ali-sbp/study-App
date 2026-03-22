import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { auth } from "@clerk/nextjs/server"

const INTERNAL_API = process.env.INTERNAL_API_URL || "http://fastapi:8000"

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com/v1",
})

export async function POST(
  req: Request,
  { params }: { params: { lecture_id: string } }
) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return new Response("Unauthorized", { status: 401 })

  const { messages } = await req.json()
  const { lecture_id } = params

  // Fetch lecture content for system prompt
  let lectureContent = ""
  try {
    const res = await fetch(`${INTERNAL_API}/lectures/${lecture_id}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      lectureContent = data.content || ""
    }
  } catch {}

  const systemPrompt = `Ты — терпеливый и дружелюбный преподаватель Haskell.
Студент изучает следующую лекцию. Отвечай на русском языке.
Используй простые аналогии и объяснения. Не давай готовых решений —
направляй студента к самостоятельному мышлению.

--- СОДЕРЖАНИЕ ЛЕКЦИИ ---
${lectureContent}
-------------------------`

  const result = await streamText({
    model: deepseek("deepseek-chat"),
    system: systemPrompt,
    messages,
    onFinish: async ({ text }) => {
      // The new user message is always the last element — useChat appends it
      // before calling the route, so messages[length-1] is the freshly sent turn.
      const newUserMsg = messages.length > 0 && messages[messages.length - 1].role === "user"
        ? messages[messages.length - 1]
        : null
      if (newUserMsg) {
        await fetch(`${INTERNAL_API}/chat/${lecture_id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "user", content: newUserMsg.content }),
        }).catch(() => {})
      }
      await fetch(`${INTERNAL_API}/chat/${lecture_id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "assistant", content: text }),
      }).catch(() => {})
    },
  })

  return result.toDataStreamResponse()
}
