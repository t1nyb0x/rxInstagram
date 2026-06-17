export type UrlType = 'post' | 'reel' | 'video' | 'account' | 'story' | 'unknown'

export interface InstagramData {
  type: UrlType
  url: string
  title: string
  description: string
  imageUrls: string[]
  authorName: string
  publishedAt: string | null
}
