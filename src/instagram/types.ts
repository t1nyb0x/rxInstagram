export type UrlType = 'post' | 'reel' | 'video' | 'account' | 'story' | 'unknown'

export interface InstagramData {
  type: UrlType
  url: string
  title: string
  description: string
  imageUrl: string | null
  authorName: string
  publishedAt: string | null
}
