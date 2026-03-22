export interface Lecture {
  id: string
  title: string
  filename: string
  is_default: boolean
  created_at: string
}

export interface LectureContent {
  id: string
  title: string
  filename: string
  content: string
  is_user_copy: boolean
}

export interface User {
  clerk_id: string
  plan: "free" | "pro"
}
