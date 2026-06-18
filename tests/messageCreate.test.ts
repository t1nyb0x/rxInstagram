import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EmbedBuilder } from 'discord.js'

vi.mock('../src/instagram/detector.ts', () => ({
  extractInstagramUrls: vi.fn(),
  classifyUrl: vi.fn(),
}))

vi.mock('../src/instagram/fetcher.ts', () => ({
  fetchInstagramData: vi.fn(),
}))

vi.mock('../src/embed/builder.ts', () => ({
  buildEmbed: vi.fn(),
  buildFallbackEmbed: vi.fn(),
}))

import { onMessageCreate } from '../src/bot/events/messageCreate.ts'
import { classifyUrl, extractInstagramUrls } from '../src/instagram/detector.ts'
import { fetchInstagramData } from '../src/instagram/fetcher.ts'
import { buildEmbed, buildFallbackEmbed } from '../src/embed/builder.ts'
import type { InstagramData } from '../src/instagram/types.ts'

const mockExtractUrls = vi.mocked(extractInstagramUrls)
const mockClassifyUrl = vi.mocked(classifyUrl)
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

describe('onMessageCreate', () => {
  it('Bot のメッセージは無視する', async () => {
    const send = vi.fn()
    await onMessageCreate({ author: { bot: true }, content: '', channel: { isSendable: () => true, send } } as any)
    expect(mockExtractUrls).not.toHaveBeenCalled()
  })

  it('Instagram URL がない場合は何もしない', async () => {
    mockExtractUrls.mockReturnValue([])
    const send = vi.fn()
    await onMessageCreate({ author: { bot: false }, content: 'hello', channel: { isSendable: () => true, send } } as any)
    expect(mockFetchData).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('チャンネルが送信不可の場合は何もしない', async () => {
    mockExtractUrls.mockReturnValue(['https://www.instagram.com/p/abc123/'])
    const send = vi.fn()
    await onMessageCreate({ author: { bot: false }, content: 'url', channel: { isSendable: () => false, send } } as any)
    expect(mockFetchData).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('unknown タイプの URL はフォールバック Embed を返す', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockClassifyUrl.mockReturnValue('unknown')
    mockBuildFallbackEmbed.mockReturnValue(stubEmbed)
    const send = vi.fn().mockResolvedValue(undefined)
    await onMessageCreate({ author: { bot: false }, content: url, channel: { isSendable: () => true, send } } as any)
    expect(mockBuildFallbackEmbed).toHaveBeenCalledWith(url)
    expect(send).toHaveBeenCalled()
  })

  it('fetchInstagramData が Instagram タイトルを返す場合はフォールバック Embed を返す', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockClassifyUrl.mockReturnValue('post')
    mockFetchData.mockResolvedValue(makeData('Instagram'))
    mockBuildFallbackEmbed.mockReturnValue(stubEmbed)
    const send = vi.fn().mockResolvedValue(undefined)
    await onMessageCreate({ author: { bot: false }, content: url, channel: { isSendable: () => true, send } } as any)
    expect(mockBuildFallbackEmbed).toHaveBeenCalledWith(url)
  })

  it('正常なデータの場合は Embed を送信する', async () => {
    const url = 'https://www.instagram.com/p/abc123/'
    mockExtractUrls.mockReturnValue([url])
    mockClassifyUrl.mockReturnValue('post')
    mockFetchData.mockResolvedValue(makeData('testuser on Instagram'))
    mockBuildEmbed.mockReturnValue(stubEmbed)
    const send = vi.fn().mockResolvedValue(undefined)
    await onMessageCreate({ author: { bot: false }, content: url, channel: { isSendable: () => true, send } } as any)
    expect(mockBuildEmbed).toHaveBeenCalled()
    expect(send).toHaveBeenCalled()
  })
})
