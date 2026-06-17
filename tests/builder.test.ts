import { describe, expect, it } from 'vitest'
import { buildEmbed, buildFallbackEmbed } from '../src/embed/builder.ts'
import type { InstagramData } from '../src/instagram/types.ts'

const baseData: InstagramData = {
  type: 'post',
  url: 'https://www.instagram.com/p/abc123/',
  title: 'testuser on Instagram',
  description: 'テストキャプション',
  imageUrl: 'https://example.com/image.jpg',
  authorName: 'testuser',
  publishedAt: '2024-01-15T12:00:00.000Z',
}

describe('buildEmbed', () => {
  it('description をキャプションとして含む', () => {
    const embed = buildEmbed(baseData)
    expect(embed.data.description).toBe('テストキャプション')
  })

  it('imageUrl を画像として含む', () => {
    const embed = buildEmbed(baseData)
    expect(embed.data.image?.url).toBe('https://example.com/image.jpg')
  })

  it('authorName を author として含む', () => {
    const embed = buildEmbed(baseData)
    expect(embed.data.author?.name).toBe('testuser')
  })

  it('URL を含む', () => {
    const embed = buildEmbed(baseData)
    expect(embed.data.url).toBe('https://www.instagram.com/p/abc123/')
  })

  it('publishedAt がある場合は timestamp として含む', () => {
    const embed = buildEmbed(baseData)
    expect(embed.data.timestamp).toBe('2024-01-15T12:00:00.000Z')
  })

  it('publishedAt が null の場合は timestamp を含まない', () => {
    const embed = buildEmbed({ ...baseData, publishedAt: null })
    expect(embed.data.timestamp).toBeUndefined()
  })

  it('imageUrl が null の場合は image を含まない', () => {
    const embed = buildEmbed({ ...baseData, imageUrl: null })
    expect(embed.data.image).toBeUndefined()
  })

  it('reel タイプのタイトルを含む', () => {
    const embed = buildEmbed({ ...baseData, type: 'reel' })
    expect(embed.data.title).toContain('Reel')
  })

  it('post タイプのタイトルを含む', () => {
    const embed = buildEmbed(baseData)
    expect(embed.data.title).toContain('Post')
  })

  it('account タイプのタイトルを含む', () => {
    const embed = buildEmbed({ ...baseData, type: 'account' })
    expect(embed.data.title).toContain('Account')
  })

  it('story タイプのタイトルを含む', () => {
    const embed = buildEmbed({ ...baseData, type: 'story' })
    expect(embed.data.title).toContain('Story')
  })

  it('video タイプのタイトルを含む', () => {
    const embed = buildEmbed({ ...baseData, type: 'video' })
    expect(embed.data.title).toContain('Video')
  })
})

describe('buildFallbackEmbed', () => {
  it('フォールバック Embed を返す', () => {
    const embed = buildFallbackEmbed('https://www.instagram.com/p/abc123/')
    expect(embed.data.title).toBe('Instagram')
    expect(embed.data.description).toBe('情報を取得できませんでした')
    expect(embed.data.url).toBe('https://www.instagram.com/p/abc123/')
  })
})
