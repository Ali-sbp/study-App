const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API error ${res.status}: ${error}`)
  }
  return res.json()
}

export const api = {
  upsertUser: (token: string) =>
    apiFetch<{ clerk_id: string; plan: string }>("/users/me", token, { method: "POST" }),

  listLectures: (token: string) =>
    apiFetch<import("./types").Lecture[]>("/lectures", token),

  getLectureContent: (token: string, id: string) =>
    apiFetch<import("./types").LectureContent>(`/lectures/${id}/content`, token),

  uploadLecture: async (token: string, title: string, file: File, isDefault = false) => {
    const form = new FormData()
    form.append("title", title)
    form.append("file", file)
    form.append("is_default", String(isDefault))
    const res = await fetch(`${API_URL}/lectures`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) {
      const error = await res.text()
      throw new Error(`API error ${res.status}: ${error}`)
    }
    return res.json()
  },
}
