import { describe, expect, it } from 'vitest'
import { classifyUrl, extractInstagramUrls, stripQueryParams } from '../src/instagram/detector.ts'

describe('extractInstagramUrls', () => {
  it('メッセージから Instagram URL を抽出する', () => {
    const message = 'チェックして https://www.instagram.com/p/abc123/ いい投稿だよ'
    expect(extractInstagramUrls(message)).toEqual(['https://www.instagram.com/p/abc123/'])
  })

  it('複数の URL を全件抽出する', () => {
    const message =
      'https://www.instagram.com/p/abc123/ と https://www.instagram.com/reel/xyz789/'
    expect(extractInstagramUrls(message)).toEqual([
      'https://www.instagram.com/p/abc123/',
      'https://www.instagram.com/reel/xyz789/',
    ])
  })

  it('Instagram URL が含まれない場合は空配列を返す', () => {
    expect(extractInstagramUrls('普通のメッセージ')).toEqual([])
  })

  it('重複 URL は除去する', () => {
    const message =
      'https://www.instagram.com/p/abc123/ https://www.instagram.com/p/abc123/'
    expect(extractInstagramUrls(message)).toEqual(['https://www.instagram.com/p/abc123/'])
  })

  it('http スキームの URL も抽出する', () => {
    const message = 'http://www.instagram.com/p/abc123/'
    expect(extractInstagramUrls(message)).toEqual(['http://www.instagram.com/p/abc123/'])
  })
})

describe('classifyUrl', () => {
  it('投稿 URL を post と分類する', () => {
    expect(classifyUrl('https://www.instagram.com/p/abc123/')).toBe('post')
  })

  it('リール URL を reel と分類する', () => {
    expect(classifyUrl('https://www.instagram.com/reel/abc123/')).toBe('reel')
  })

  it('動画 URL を video と分類する', () => {
    expect(classifyUrl('https://www.instagram.com/tv/abc123/')).toBe('video')
  })

  it('ストーリー URL を story と分類する', () => {
    expect(classifyUrl('https://www.instagram.com/stories/username/123456/')).toBe('story')
  })

  it('アカウント URL を account と分類する', () => {
    expect(classifyUrl('https://www.instagram.com/username/')).toBe('account')
  })

  it('不明な URL を unknown と分類する', () => {
    expect(classifyUrl('https://www.instagram.com/')).toBe('unknown')
  })

  it('クエリパラメータ付き URL も正しく分類する', () => {
    expect(classifyUrl('https://www.instagram.com/p/abc123/?igsh=xxx')).toBe('post')
  })
})

describe('stripQueryParams', () => {
  it('クエリパラメータを除去する', () => {
    expect(stripQueryParams('https://www.instagram.com/p/abc123/?igsh=xxx')).toBe(
      'https://www.instagram.com/p/abc123/',
    )
  })

  it('複数のクエリパラメータを除去する', () => {
    expect(
      stripQueryParams('https://www.instagram.com/p/abc123/?igsh=xxx&utm_source=ig_web_copy_link'),
    ).toBe('https://www.instagram.com/p/abc123/')
  })

  it('クエリパラメータがない URL はそのまま返す', () => {
    expect(stripQueryParams('https://www.instagram.com/p/abc123/')).toBe(
      'https://www.instagram.com/p/abc123/',
    )
  })
})
