import * as cheerio from 'cheerio'
import type { InstagramData, UrlType } from '@/instagram/types'

const FALLBACK = (url: string, type: UrlType): InstagramData => ({
  type,
  url,
  title: 'Instagram',
  description: '',
  imageUrls: [],
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

const extractImageUrls = (html: string, ogImage: string): string[] => {
  const matches = html.match(/"display_uri":"(https:[^"]+)"/g) ?? []
  const urls = [...new Set(
    matches.map((m) => m.replace(/"display_uri":"/, '').replace(/"$/, '').replace(/\\/g, ''))
  )]
  return urls.length > 0 ? urls : (ogImage ? [ogImage] : [])
}

export const fetchInstagramData = async (
  url: string,
  type: UrlType,
): Promise<InstagramData> => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      },
    })

    if (!response.ok) return FALLBACK(url, type)

    const html = await response.text()
    const $ = cheerio.load(html)

    const title = ogMeta($, 'og:title')
    const description = ogMeta($, 'og:description')
    const ogImage = ogMeta($, 'og:image')
    const publishedAt = ogMeta($, 'article:published_time') || null
    const imageUrls = extractImageUrls(html, ogImage)

    const authorName =
      title ? parseAuthorFromTitle(title) : parseAuthorFromUrl(url, type)

    return { type, url, title: title || 'Instagram', description, imageUrls, authorName, publishedAt }
  } catch {
    return FALLBACK(url, type)
  }
}
