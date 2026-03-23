import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { auth } from "@clerk/nextjs/server"

const INTERNAL_API = process.env.INTERNAL_API_URL || "http://fastapi:8000"

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
})

export async function POST(
  req: Request,
  { params }: { params: { lecture_id: string } }
) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return new Response("Unauthorized", { status: 401 })

  const { messages, context, contextLabel } = await req.json()
  const { lecture_id } = params

  const systemPrompt = `Ты — терпеливый и дружелюбный преподаватель Haskell.
Студент работает с файлом: ${contextLabel || "лекция"}.
Отвечай на русском языке. Используй простые аналогии и объяснения.
Не давай готовых решений — направляй студента к самостоятельному мышлению.

--- ТЕКУЩИЙ ФАЙЛ (${contextLabel || "контекст"}) ---
${context || "(содержимое недоступно)"}
-----------------------------------------------------`

  const result = await streamText({
    model: groq("llama-3.3-70b-versatile"),
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
