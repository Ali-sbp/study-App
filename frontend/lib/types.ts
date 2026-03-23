export interface Lecture {
  id: string
  title: string
  filename: string
  file_type: "lecture" | "practice"
  is_default: boolean
  created_at: string
}

export interface LectureContent {
  id: string
  title: string
  filename: string
  content: string
  practice_content: string | null
  is_user_copy: boolean
}

export interface UserFileData {
  id: string
  name: string
  content: string
  source_id?: string | null
  updated_at?: string | null
}

export interface User {
  clerk_id: string
  plan: "free" | "pro"
}
