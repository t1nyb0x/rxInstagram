import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('config', () => {
  let originalToken: string | undefined

  beforeEach(() => {
    originalToken = process.env.DISCORD_TOKEN
    vi.resetModules()
  })

  afterEach(() => {
    if (originalToken !== undefined) {
      process.env.DISCORD_TOKEN = originalToken
    } else {
      delete process.env.DISCORD_TOKEN
    }
    vi.resetModules()
  })

  it('DISCORD_TOKEN が設定されている場合は discordToken を返す', async () => {
    process.env.DISCORD_TOKEN = 'test-discord-token'
    const { config } = await import('../src/config.ts')
    expect(config.discordToken).toBe('test-discord-token')
  })

  it('DISCORD_TOKEN が未設定の場合はエラーをスローする', async () => {
    delete process.env.DISCORD_TOKEN
    await expect(import('../src/config.ts')).rejects.toThrow(
      'Missing required environment variable: DISCORD_TOKEN',
    )
  })
})
