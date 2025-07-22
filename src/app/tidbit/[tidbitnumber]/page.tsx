import { supabase } from '../../lib/supabaseClient'
import PostCard from '../../components/PostCard'

type Post = {
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
  description?: string
}

export default async function TidbitPage({ params }: { params: Promise<{ tidbitnumber: string }> }) {
  const { tidbitnumber } = await params  // ✅ Await params first
  const tidbit = Number(tidbitnumber)

  if (isNaN(tidbit)) {
    return <div>Invalid tidbit number in URL.</div>
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('tidbit', tidbit)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return <div>Error loading posts.</div>
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white">
      <h1 className="text-2xl font-bold mb-4">Creations from Tidbit #{tidbit}</h1>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={false}
              onLike={() => {}}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No posts yet for this Tidbit.</p>
      )}
    </div>
  )
}