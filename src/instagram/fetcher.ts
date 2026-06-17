import * as cheerio from 'cheerio'
import type { InstagramData, UrlType } from '@/instagram/types'

const FALLBACK = (url: string, type: UrlType): InstagramData => ({
  type,
  url,
  title: 'Instagram',
  description: '',
  imageUrl: null,
  authorName: parseAuthorFromUrl(url, type),
  publishedAt: null,
})

const parseAuthorFromUrl = (url: string, type: UrlType): string => {
  const { pathname } = new URL(url)
  if (type === 'account') {
    return pathname.replace(/\//g, '')
  }
  if (type === 'story') {
    return pathname.split('/')[2] ?? ''
  }
  return ''
}

const parseAuthorFromTitle = (title: string): string => {
  const match = title.match(/^([^(@\s]+)/)
  return match?.[1]?.trim() ?? ''
}

const ogMeta = ($: ReturnType<typeof cheerio.load>, property: string): string =>
  $(`meta[property="${property}"]`).attr('content') ?? ''

export const fetchInstagramData = async (
  url: string,
  type: UrlType,
): Promise<InstagramData> => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
    })

    if (!response.ok) return FALLBACK(url, type)

    const html = await response.text()
    const $ = cheerio.load(html)

    const title = ogMeta($, 'og:title')
    const description = ogMeta($, 'og:description')
    const imageUrl = ogMeta($, 'og:image') || null
    const publishedAt = ogMeta($, 'article:published_time') || null

    const authorName =
      title ? parseAuthorFromTitle(title) : parseAuthorFromUrl(url, type)

    return { type, url, title: title || 'Instagram', description, imageUrl, authorName, publishedAt }
  } catch {
    return FALLBACK(url, type)
  }
}
