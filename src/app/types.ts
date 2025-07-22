export type Post = {
  id: string
  created_at: string
  user_id: string
  type: string
  content: string
  before_text: string | null
  after_text: string | null
  media_url: string | null
  tidbit: number
  likes_count?: number
}
