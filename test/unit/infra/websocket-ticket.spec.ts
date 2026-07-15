import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('@/config/axios', () => ({ default: { post } }))

import { createWebSocketTicket } from '@/api/infra/websocket'
import { createTicketedWebSocketUrl } from '@/utils/websocketTicket'

const ticketA = 'A'.repeat(43)
const ticketB = 'B'.repeat(43)

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      return listSourceFiles(path)
    }
    return /\.(?:js|jsx|ts|tsx|vue)$/.test(entry.name) ? [path] : []
  })
}

describe('short-lived one-time WebSocket tickets', () => {
  beforeEach(() => post.mockReset())

  it('issues a ticket through the authenticated admin API', async () => {
    post.mockResolvedValue({ ticket: ticketA, expiresInSeconds: 30 })

    await expect(createWebSocketTicket()).resolves.toEqual({
      ticket: ticketA,
      expiresInSeconds: 30
    })
    expect(post).toHaveBeenCalledWith({
      url: '/infra/websocket-tickets',
      skipErrorMessage: true
    })
  })

  it('gets a fresh ticket for every initial or reconnect URL', async () => {
    post
      .mockResolvedValueOnce({ ticket: ticketA, expiresInSeconds: 30 })
      .mockResolvedValueOnce({ ticket: ticketB, expiresInSeconds: 12 })

    await expect(createTicketedWebSocketUrl('wss://saas.example/infra/ws')).resolves.toBe(
      `wss://saas.example/infra/ws?ticket=${ticketA}`
    )
    await expect(createTicketedWebSocketUrl('wss://saas.example/infra/ws')).resolves.toBe(
      `wss://saas.example/infra/ws?ticket=${ticketB}`
    )
    expect(post).toHaveBeenCalledTimes(2)
  })

  it.each([
    [{ ticket: 'short', expiresInSeconds: 30 }, 'ticket'],
    [{ ticket: ticketA, expiresInSeconds: 0 }, 'lifetime'],
    [{ ticket: ticketA, expiresInSeconds: 31 }, 'lifetime']
  ])('fails closed for an invalid server ticket response %#', async (response, message) => {
    post.mockResolvedValue(response)

    await expect(createTicketedWebSocketUrl('wss://saas.example/infra/ws')).rejects.toThrow(message)
  })

  it('removes long-lived tokens and URL-reusing reconnect from every /infra/ws consumer', () => {
    const infraDemo = readFileSync(
      resolve(process.cwd(), 'src/views/infra/webSocket/index.vue'),
      'utf8'
    )
    const imStore = readFileSync(
      resolve(process.cwd(), 'src/views/im/home/store/websocketStore.ts'),
      'utf8'
    )
    const mallKefu = readFileSync(
      resolve(process.cwd(), 'src/views/mall/promotion/kefu/index.vue'),
      'utf8'
    )
    const ticketUrl = readFileSync(resolve(process.cwd(), 'src/utils/websocketTicket.ts'), 'utf8')
    const consumers = listSourceFiles(resolve(process.cwd(), 'src'))
      .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
      .filter(({ source }) => source.includes('/infra/ws'))

    expect(consumers.map(({ path }) => path)).toEqual(
      expect.arrayContaining([
        resolve(process.cwd(), 'src/views/infra/webSocket/index.vue'),
        resolve(process.cwd(), 'src/views/im/home/store/websocketStore.ts'),
        resolve(process.cwd(), 'src/views/mall/promotion/kefu/index.vue')
      ])
    )
    for (const { source } of consumers) {
      expect(source).not.toContain('getRefreshToken')
      expect(source).not.toMatch(/[?&]token=/)
      expect(source).toContain('createTicketedWebSocketUrl')
      expect(source).not.toContain('autoReconnect: true')
    }
    expect(ticketUrl).not.toMatch(/[?&]token=/)
    expect(ticketUrl).toContain('?ticket=')
    expect(infraDemo).toContain('onDisconnected: () => scheduleReconnect()')
    expect(infraDemo).toContain('void connectSecurely()')
    expect(infraDemo).toMatch(
      /const ticketedUrl = await createTicketedWebSocketUrl[\s\S]*connectionUrl\.value = ticketedUrl[\s\S]*open\(\)/
    )
    expect(imStore).toMatch(
      /async connect\(\)[\s\S]*await createTicketedWebSocketUrl[\s\S]*new WebSocket\(url\)/
    )
    expect(imStore).toMatch(
      /reconnect\(\)[\s\S]*reconnectTimer = setTimeout[\s\S]*void this\.connect\(\)/
    )
    expect(mallKefu).toContain('onDisconnected: () => scheduleReconnect()')
    expect(mallKefu).toMatch(
      /const ticketedUrl = await createTicketedWebSocketUrl[\s\S]*connectionUrl\.value = ticketedUrl[\s\S]*open\(\)/
    )
  })
})
