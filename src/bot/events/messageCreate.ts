import type { Message } from 'discord.js'
import { buildEmbed, buildFallbackEmbed } from '@/embed/builder'
import { classifyUrl, extractInstagramUrls } from '@/instagram/detector'
import { fetchInstagramData } from '@/instagram/fetcher'

export const onMessageCreate = async (message: Message): Promise<void> => {
  if (message.author.bot) return

  const urls = extractInstagramUrls(message.content)
  if (urls.length === 0) return

  if (!message.channel.isSendable()) return

  const embeds = await Promise.all(
    urls.map(async (url) => {
      const type = classifyUrl(url)
      if (type === 'unknown') return buildFallbackEmbed(url)

      const data = await fetchInstagramData(url, type)
      if (!data.title || data.title === 'Instagram') return buildFallbackEmbed(url)

      return buildEmbed(data)
    }),
  )

  await message.channel.send({ embeds })
}
