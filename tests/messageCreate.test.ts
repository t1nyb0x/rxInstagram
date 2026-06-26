import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EmbedBuilder } from 'discord.js'

vi.mock('../src/instagram/detector.ts', () => ({
  extractInstagramUrls: vi.fn(),
  classifyUrl: vi.fn(),
  stripQueryParams: vi.fn((url: string) => url),
}))

vi.mock('../src/instagram/fetcher.ts', () => ({
  fetchInstagramData: vi.fn(),
}))

vi.mock('../src/embed/builder.ts', () => ({
  buildEmbed: vi.fn(),
  buildFallbackEmbed: vi.fn(),
}))

import { onMessageCreate } from '../src/bot/events/messageCreate.ts'
import { classifyUrl, extractInstagramUrls, stripQueryParams } from '../src/instagram/detector.ts'
import { fetchInstagramData } from '../src/instagram/fetcher.ts'
import { buildEmbed, buildFallbackEmbed } from '../src/embed/builder.ts'
import type { InstagramData } from '../src/instagram/types.ts'

const mockExtractUrls = vi.mocked(extractInstagramUrls)
const mockClassifyUrl = vi.mocked(classifyUrl)
const mockStripQueryParams = vi.mocked(stripQueryParams)
const mockFetchData = vi.mocked(fetchInstagramData)
const mockBuildEmbed = vi.mocked(buildEmbed)
const mockBuildFallbackEmbed = vi.mocked(buildFallbackEmbed)

const stubEmbed = [{ data: {} }] as unknown as EmbedBuilder[]

const makeData = (title: string): InstagramData => ({
  type: 'post',
  url: 'https://www.instagram.com/p/abc123/',
  title,
  description: 'caption',
  imageUrls: [],
  authorName: 'testuser',
  publishedAt: null,
  likeCount: null,
  commentCount: null,
})

afterEach(() => {
  vi.clearAllMocks()
})

const makeMessage = (overrides: Record<string, unknown> = {}) => ({
  author: { bot: false },
  content: 'url',
  delete: vi.fn().mockResolvedValue(undefined),
  channel: { isSendable: () => true, send: vi.fn().mockResolvedValue(undefined) },
  ...overrides,
})

describe('onMessageCreate', () => {
  it('Bot のメッセージは無視する', async () => {
    await onMessageCreate(makeMessage({ author: { bot: true } }) as any)
    expect(mockExtractUrls).not.toHaveBeenCalled()
  })

  it('Instagram URL がない場合は何もしない', async () => {
    mockExtractUrls.mockReturnValue([])
    const message = makeMessage()
    await onMessageCreate(message as any)
    expect(mockFetchData).not.toHaveBeenCalled()
    expect(message.channel.send).not.toHaveBeenCalled()
    expect(message.delete).not.toHaveBeenCalled()
  })

  it('チャンネルが送信不可の場合は何もしない', async () => {
    mockExtractUrls.mockReturnValue(['https://www.instagram.com/p/abc123/'])
    const message = makeMessage({ channel: { isSendable: () => false, send: vi.fn() } })
    await onMessageCreate(message as any)
    expect(mockFetchData).not.toHaveBeenCalled()
    expect(message.channel.send).not.toHaveBeenCalled()
  })

  it('Instagram URL が含まれる場合は元のメッセージを削除する', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockStripQueryParams.mockReturnValue(url)
    mockClassifyUrl.mockReturnValue('post')
    mockFetchData.mockResolvedValue(makeData('testuser on Instagram'))
    mockBuildEmbed.mockReturnValue(stubEmbed)
    const message = makeMessage()
    await onMessageCreate(message as any)
    expect(message.delete).toHaveBeenCalled()
  })

  it('クエリパラメータを除去したクリーン URL を使用する', async () => {
    const dirtyUrl = 'https://www.instagram.com/p/abc123/?igsh=xxx'
    const cleanUrl = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([dirtyUrl])
    mockStripQueryParams.mockReturnValue(cleanUrl)
    mockClassifyUrl.mockReturnValue('post')
    mockFetchData.mockResolvedValue(makeData('testuser on Instagram'))
    mockBuildEmbed.mockReturnValue(stubEmbed)
    const message = makeMessage()
    await onMessageCreate(message as any)
    expect(mockStripQueryParams).toHaveBeenCalled()
    expect(mockFetchData).toHaveBeenCalledWith(cleanUrl, 'post')
  })

  it('メッセージ削除が失敗しても Embed を送信する', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockStripQueryParams.mockReturnValue(url)
    mockClassifyUrl.mockReturnValue('post')
    mockFetchData.mockResolvedValue(makeData('testuser on Instagram'))
    mockBuildEmbed.mockReturnValue(stubEmbed)
    const message = makeMessage({ delete: vi.fn().mockRejectedValue(new Error('Missing Permissions')) })
    await onMessageCreate(message as any)
    expect(message.channel.send).toHaveBeenCalled()
  })

  it('unknown タイプの URL はフォールバック Embed を返す', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockStripQueryParams.mockReturnValue(url)
    mockClassifyUrl.mockReturnValue('unknown')
    mockBuildFallbackEmbed.mockReturnValue(stubEmbed)
    const message = makeMessage()
    await onMessageCreate(message as any)
    expect(mockBuildFallbackEmbed).toHaveBeenCalledWith(url)
    expect(message.channel.send).toHaveBeenCalled()
  })

  it('fetchInstagramData が Instagram タイトルを返す場合はフォールバック Embed を返す', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockStripQueryParams.mockReturnValue(url)
    mockClassifyUrl.mockReturnValue('post')
    mockFetchData.mockResolvedValue(makeData('Instagram'))
    mockBuildFallbackEmbed.mockReturnValue(stubEmbed)
    const message = makeMessage()
    await onMessageCreate(message as any)
    expect(mockBuildFallbackEmbed).toHaveBeenCalledWith(url)
  })

  it('正常なデータの場合は Embed を送信する', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockStripQueryParams.mockReturnValue(url)
    mockClassifyUrl.mockReturnValue('post')
    mockFetchData.mockResolvedValue(makeData('testuser on Instagram'))
    mockBuildEmbed.mockReturnValue(stubEmbed)
    const message = makeMessage()
    await onMessageCreate(message as any)
    expect(mockBuildEmbed).toHaveBeenCalled()
    expect(message.channel.send).toHaveBeenCalled()
  })
})
