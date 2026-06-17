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

const formatCount = (n: number): string =>
  n >= 10000
    ? `${(n / 10000).toFixed(1)}万`
    : n.toLocaleString('ja-JP')

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(iso))

export const buildEmbed = (data: InstagramData): EmbedBuilder[] => {
  const label = TYPE_LABELS[data.type]
  const [firstImage, ...restImages] = data.imageUrls
  const remaining = data.imageUrls.length - MAX_EMBEDS

  const main = new EmbedBuilder()
    .setTitle(`Instagram ${label}`)
    .setURL(data.url)
    .setDescription(data.description || null)
    .setAuthor({ name: data.authorName })
    .setColor(BRAND_COLOR)

  if (firstImage) main.setImage(firstImage)

  const footerParts: string[] = []
  if (remaining > 0) footerParts.push(`他 ${remaining} 枚`)
  if (data.publishedAt) footerParts.push(formatDate(data.publishedAt))
  if (footerParts.length > 0) main.setFooter({ text: footerParts.join(' • ') })

  const fields = []
  if (data.likeCount !== null) fields.push({ name: 'いいね', value: formatCount(data.likeCount), inline: true })
  if (data.commentCount !== null) fields.push({ name: 'コメント', value: formatCount(data.commentCount), inline: true })
  if (fields.length > 0) main.addFields(fields)

  const additionalImages = restImages.slice(0, MAX_EMBEDS - 1)
  const additional = additionalImages.map((imageUrl) =>
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
