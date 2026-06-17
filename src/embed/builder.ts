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

export const buildEmbed = (data: InstagramData): EmbedBuilder => {
  const label = TYPE_LABELS[data.type]
  const embed = new EmbedBuilder()
    .setTitle(`Instagram ${label}`)
    .setURL(data.url)
    .setDescription(data.description || null)
    .setAuthor({ name: data.authorName })
    .setColor(BRAND_COLOR)

  if (data.imageUrl) embed.setImage(data.imageUrl)
  if (data.publishedAt) embed.setTimestamp(new Date(data.publishedAt))

  return embed
}

export const buildFallbackEmbed = (url: string): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle('Instagram')
    .setURL(url)
    .setDescription('情報を取得できませんでした')
    .setColor(BRAND_COLOR)
