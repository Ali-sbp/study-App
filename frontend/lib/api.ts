// Server components run inside Docker — use internal service name
// Browser clients use the public URL
const API_URL = typeof window === "undefined"
  ? (process.env.INTERNAL_API_URL || "http://fastapi:8000")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost/api")

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

  listLectures: (token: string, fileType?: "lecture" | "practice") =>
    apiFetch<import("./types").Lecture[]>(
      fileType ? `/lectures?file_type=${fileType}` : "/lectures",
      token
    ),

  getLectureContent: (token: string, id: string) =>
    apiFetch<import("./types").LectureContent>(`/lectures/${id}/content`, token),

  deleteLecture: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/lectures/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
  },

  uploadLecture: async (token: string, title: string, file: File, isDefault = false, fileType: "lecture" | "practice" = "lecture") => {
    const form = new FormData()
    form.append("title", title)
    form.append("file", file)
    form.append("file_type", fileType)
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

  saveLectureContent: (token: string, id: string, content: string) =>
    apiFetch<{ is_user_copy: boolean }>(`/lectures/${id}/content`, token, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  getChatHistory: (token: string, lectureId: string) =>
    apiFetch<{ role: string; content: string }[]>(`/chat/${lectureId}/history`, token),

  clearChatHistory: (token: string, lectureId: string) =>
    apiFetch<{ ok: boolean }>(`/chat/${lectureId}/history`, token, { method: "DELETE" }),

  execute: (token: string, code: string, languageId = 12) =>
    apiFetch<{ stdout: string | null; stderr: string | null; compile_output: string | null; status: string }>
      ("/execute", token, {
        method: "POST",
        body: JSON.stringify({ code, language_id: languageId }),
      }),

  ghci: (token: string, code: string, expr: string) =>
    apiFetch<{ output: string; stderr: string; exit_code: number }>
      ("/ghci", token, {
        method: "POST",
        body: JSON.stringify({ code, expr }),
      }),

  savePracticeContent: (token: string, lectureId: string, content: string) =>
    apiFetch<{ ok: boolean }>(`/lectures/${lectureId}/practice`, token, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  listUserFiles: (token: string, lectureId: string) =>
    apiFetch<import("./types").UserFileData[]>(`/lectures/${lectureId}/files`, token),

  createUserFile: (token: string, lectureId: string, name: string) =>
    apiFetch<import("./types").UserFileData>(`/lectures/${lectureId}/files`, token, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  saveUserFile: (token: string, lectureId: string, fileId: string, content: string) =>
    apiFetch<import("./types").UserFileData>(`/lectures/${lectureId}/files/${fileId}`, token, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),

  deleteUserFile: (token: string, lectureId: string, fileId: string) =>
    apiFetch<{ ok: boolean }>(`/lectures/${lectureId}/files/${fileId}`, token, {
      method: "DELETE",
    }),

  // Create-or-return a personal fork of an admin lecture/practice file
  forkLecture: (token: string, sourceId: string) =>
    apiFetch<import("./types").UserFileData>(`/lectures/${sourceId}/fork`, token, {
      method: "POST",
    }),

  // All personal forks this user has made, sorted by last edit
  getPersonalCopies: (token: string) =>
    apiFetch<import("./types").UserFileData[]>("/lectures/my-copies", token),

  // All custom files (+ button) this user has created, sorted by last edit
  getMyFiles: (token: string) =>
    apiFetch<import("./types").UserFileData[]>("/lectures/my-files", token),

  // Delete any user file by ID directly (no lecture_id needed)
  deleteMyFile: (token: string, fileId: string) =>
    apiFetch<{ ok: boolean }>(`/lectures/my-files/${fileId}`, token, { method: "DELETE" }),
}
