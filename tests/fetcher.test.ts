import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchInstagramData } from '../src/instagram/fetcher.ts'

const fixture = (name: string): string =>
  readFileSync(resolve(import.meta.dirname, 'fixtures', name), 'utf-8')

const mockFetch = (html: string, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(html),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchInstagramData', () => {
  it('投稿の OGP を正しくパースする', async () => {
    mockFetch(fixture('post.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.type).toBe('post')
    expect(result.title).toBe('testuser on Instagram')
    expect(result.description).toBe('テストキャプションです')
    expect(result.imageUrls).toEqual(['https://example.com/image.jpg'])
    expect(result.publishedAt).toBe(new Date(1747439400 * 1000).toISOString())
    expect(result.likeCount).toBe(3320)
    expect(result.commentCount).toBe(12)
  })

  it('description から自動生成プレフィックスを除去する', async () => {
    mockFetch(fixture('post.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.description).not.toContain('likes')
    expect(result.description).not.toContain('comments')
    expect(result.description).toBe('テストキャプションです')
  })

  it('taken_at から publishedAt を生成する', async () => {
    mockFetch(fixture('post.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.publishedAt).toBe(new Date(1747439400 * 1000).toISOString())
  })

  it('アカウントページの OGP を正しくパースする', async () => {
    mockFetch(fixture('account.html'))
    const result = await fetchInstagramData(
      'https://www.instagram.com/testuser/',
      'account',
    )

    expect(result.type).toBe('account')
    expect(result.title).toBe('testuser (@testuser) • Instagram')
    expect(result.imageUrls).toEqual(['https://example.com/avatar.jpg'])
    expect(result.publishedAt).toBeNull()
  })

  it('OGP が取得できない場合はフォールバックデータを返す', async () => {
    mockFetch(fixture('empty.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.title).toBe('Instagram')
    expect(result.description).toBe('')
    expect(result.imageUrls).toEqual([])
    expect(result.publishedAt).toBeNull()
    expect(result.likeCount).toBeNull()
    expect(result.commentCount).toBeNull()
  })

  it('HTTP エラー時はフォールバックデータを返す', async () => {
    mockFetch('', 429)
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.title).toBe('Instagram')
    expect(result.imageUrls).toEqual([])
  })

  it('authorName を URL から取得する（account）', async () => {
    mockFetch(fixture('account.html'))
    const result = await fetchInstagramData(
      'https://www.instagram.com/testuser/',
      'account',
    )
    expect(result.authorName).toBe('testuser')
  })

  it('authorName を URL から取得する（post）', async () => {
    mockFetch(fixture('post.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')
    expect(result.authorName).toBe('testuser')
  })

  it('カルーセル投稿の複数画像を全件取得する', async () => {
    mockFetch(fixture('carousel.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.imageUrls).toHaveLength(3)
    expect(result.imageUrls[0]).toBe('https://cdn.instagram.com/img1.jpg?stp=dst-jpg_e35')
    expect(result.imageUrls[1]).toBe('https://cdn.instagram.com/img2.jpg?stp=dst-jpg_e35')
    expect(result.imageUrls[2]).toBe('https://cdn.instagram.com/img3.jpg?stp=dst-jpg_e35')
  })

  it('display_uri がない場合は og:image にフォールバックする', async () => {
    mockFetch(fixture('post.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.imageUrls).toEqual(['https://example.com/image.jpg'])
  })
})
