import { EmbedBuilder } from 'discord.js'
import type { InstagramData, UrlType } from '@/instagram/types'

const TYPE_LABELS: Record<UrlType, string> = {
  post: 'Post',
  reel: 'Reel',
  video: 'Video',
  account: 'Account',
  story: 'Story',
  unknown: 'Instagram',
}

const BRAND_COLOR = 0xe1306c
const MAX_EMBEDS = 4

export const buildEmbed = (data: InstagramData): EmbedBuilder[] => {
  const label = TYPE_LABELS[data.type]
  const [firstImage, ...restImages] = data.imageUrls

  const main = new EmbedBuilder()
    .setTitle(`Instagram ${label}`)
    .setURL(data.url)
    .setDescription(data.description || null)
    .setAuthor({ name: data.authorName })
    .setColor(BRAND_COLOR)

  if (firstImage) main.setImage(firstImage)
  if (data.publishedAt) main.setTimestamp(new Date(data.publishedAt))

  const additional = restImages
    .slice(0, MAX_EMBEDS - 1)
    .map((imageUrl) =>
      new EmbedBuilder()
        .setURL(data.url)
        .setImage(imageUrl)
        .setColor(BRAND_COLOR),
    )

  return [main, ...additional]
}

export const buildFallbackEmbed = (url: string): EmbedBuilder[] => [
  new EmbedBuilder()
    .setTitle('Instagram')
    .setURL(url)
    .setDescription('情報を取得できませんでした')
    .setColor(BRAND_COLOR),
]
