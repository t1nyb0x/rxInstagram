import { describe, expect, it } from 'vitest'
import { buildEmbed, buildFallbackEmbed } from '../src/embed/builder.ts'
import type { InstagramData } from '../src/instagram/types.ts'

const baseData: InstagramData = {
  type: 'post',
  url: 'https://www.instagram.com/p/abc123/',
  title: 'testuser on Instagram',
  description: 'テストキャプション',
  imageUrls: ['https://example.com/image.jpg'],
  authorName: 'testuser',
  publishedAt: '2024-01-15T12:00:00.000Z',
  likeCount: null,
  commentCount: null,
}

describe('buildEmbed', () => {
  it('description をキャプションとして含む', () => {
    const [embed] = buildEmbed(baseData)
    expect(embed.data.description).toBe('テストキャプション')
  })

  it('最初の画像をメイン Embed に設定する', () => {
    const [embed] = buildEmbed(baseData)
    expect(embed.data.image?.url).toBe('https://example.com/image.jpg')
  })

  it('authorName を author として含む', () => {
    const [embed] = buildEmbed(baseData)
    expect(embed.data.author?.name).toBe('testuser')
  })

  it('URL を含む', () => {
    const [embed] = buildEmbed(baseData)
    expect(embed.data.url).toBe('https://www.instagram.com/p/abc123/')
  })

  it('publishedAt がある場合は footer に日時を表示する', () => {
    const [embed] = buildEmbed(baseData)
    expect(embed.data.footer?.text).toBe('2024/01/15 21:00')
  })

  it('publishedAt が null の場合は footer を含まない', () => {
    const [embed] = buildEmbed({ ...baseData, publishedAt: null })
    expect(embed.data.footer).toBeUndefined()
  })

  it('5 枚以上ある場合は残り枚数をメイン Embed の footer に表示する', () => {
    const imageUrls = Array.from({ length: 7 }, (_, i) => `https://example.com/img${i}.jpg`)
    const [embed] = buildEmbed({ ...baseData, imageUrls })
    expect(embed.data.footer?.text).toContain('他 3 枚')
    expect(embed.data.footer?.text).toContain('2024/01/15 21:00')
  })

  it('imageUrls が空の場合は image を含まない', () => {
    const [embed] = buildEmbed({ ...baseData, imageUrls: [] })
    expect(embed.data.image).toBeUndefined()
  })

  it('reel タイプのタイトルを含む', () => {
    const [embed] = buildEmbed({ ...baseData, type: 'reel' })
    expect(embed.data.title).toContain('Reel')
  })

  it('post タイプのタイトルを含む', () => {
    const [embed] = buildEmbed(baseData)
    expect(embed.data.title).toContain('Post')
  })

  it('account タイプのタイトルを含む', () => {
    const [embed] = buildEmbed({ ...baseData, type: 'account' })
    expect(embed.data.title).toContain('Account')
  })

  it('story タイプのタイトルを含む', () => {
    const [embed] = buildEmbed({ ...baseData, type: 'story' })
    expect(embed.data.title).toContain('Story')
  })

  it('video タイプのタイトルを含む', () => {
    const [embed] = buildEmbed({ ...baseData, type: 'video' })
    expect(embed.data.title).toContain('Video')
  })

  it('likeCount と commentCount を fields として含む', () => {
    const [embed] = buildEmbed({ ...baseData, likeCount: 3320, commentCount: 12 })
    const fields = embed.data.fields ?? []
    expect(fields.find((f) => f.name === 'いいね')?.value).toBe('3,320')
    expect(fields.find((f) => f.name === 'コメント')?.value).toBe('12')
  })

  it('1万以上のいいね数を万単位でフォーマットする', () => {
    const [embed] = buildEmbed({ ...baseData, likeCount: 12345, commentCount: null })
    const fields = embed.data.fields ?? []
    expect(fields.find((f) => f.name === 'いいね')?.value).toBe('1.2万')
  })

  it('likeCount が null の場合は field を含まない', () => {
    const [embed] = buildEmbed({ ...baseData, likeCount: null, commentCount: null })
    expect(embed.data.fields ?? []).toHaveLength(0)
  })

  it('description が空の場合は description を含まない', () => {
    const [embed] = buildEmbed({ ...baseData, description: '' })
    expect(embed.data.description).toBeUndefined()
  })

  it('複数画像の場合は追加 Embed を生成する', () => {
    const data = { ...baseData, imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'] }
    const embeds = buildEmbed(data)

    expect(embeds).toHaveLength(3)
    expect(embeds[0]?.data.image?.url).toBe('https://example.com/img1.jpg')
    expect(embeds[1]?.data.image?.url).toBe('https://example.com/img2.jpg')
    expect(embeds[2]?.data.image?.url).toBe('https://example.com/img3.jpg')
  })

  it('追加 Embed は同じ URL を持つ', () => {
    const data = { ...baseData, imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'] }
    const embeds = buildEmbed(data)

    expect(embeds[1]?.data.url).toBe('https://www.instagram.com/p/abc123/')
  })

  it('画像が 4 枚を超える場合は 4 件に制限する', () => {
    const imageUrls = Array.from({ length: 6 }, (_, i) => `https://example.com/img${i}.jpg`)
    const embeds = buildEmbed({ ...baseData, imageUrls })

    expect(embeds).toHaveLength(4)
  })

  it('4 枚以下の場合は残り枚数を footer に含まない', () => {
    const imageUrls = Array.from({ length: 4 }, (_, i) => `https://example.com/img${i}.jpg`)
    const [embed] = buildEmbed({ ...baseData, imageUrls })
    expect(embed.data.footer?.text).not.toContain('他')
  })
})

describe('buildFallbackEmbed', () => {
  it('フォールバック Embed を返す', () => {
    const [embed] = buildFallbackEmbed('https://www.instagram.com/p/abc123/')
    expect(embed.data.title).toBe('Instagram')
    expect(embed.data.description).toBe('情報を取得できませんでした')
    expect(embed.data.url).toBe('https://www.instagram.com/p/abc123/')
  })
})
