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
    expect(result.imageUrl).toBe('https://example.com/image.jpg')
    expect(result.publishedAt).toBe('2024-01-15T12:00:00.000Z')
  })

  it('アカウントページの OGP を正しくパースする', async () => {
    mockFetch(fixture('account.html'))
    const result = await fetchInstagramData(
      'https://www.instagram.com/testuser/',
      'account',
    )

    expect(result.type).toBe('account')
    expect(result.title).toBe('testuser (@testuser) • Instagram')
    expect(result.imageUrl).toBe('https://example.com/avatar.jpg')
    expect(result.publishedAt).toBeNull()
  })

  it('OGP が取得できない場合はフォールバックデータを返す', async () => {
    mockFetch(fixture('empty.html'))
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.title).toBe('Instagram')
    expect(result.description).toBe('')
    expect(result.imageUrl).toBeNull()
    expect(result.publishedAt).toBeNull()
  })

  it('HTTP エラー時はフォールバックデータを返す', async () => {
    mockFetch('', 429)
    const result = await fetchInstagramData('https://www.instagram.com/p/abc123/', 'post')

    expect(result.title).toBe('Instagram')
    expect(result.imageUrl).toBeNull()
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
})
