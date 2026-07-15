import { createWebSocketTicket } from '@/api/infra/websocket'

const WEBSOCKET_TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/
const MAX_TICKET_LIFETIME_SECONDS = 30

/**
 * 为一次连接尝试签发新票并生成 URL。调用方不得缓存或复用返回值。
 * 长期 access/refresh token 只能存在于 HTTPS Authorization header，不能进入 WebSocket URL。
 */
export async function createTicketedWebSocketUrl(endpoint: string): Promise<string> {
  const response = await createWebSocketTicket()
  if (!WEBSOCKET_TICKET_PATTERN.test(response?.ticket ?? '')) {
    throw new Error('Invalid WebSocket ticket')
  }
  if (
    !Number.isInteger(response.expiresInSeconds) ||
    response.expiresInSeconds < 1 ||
    response.expiresInSeconds > MAX_TICKET_LIFETIME_SECONDS
  ) {
    throw new Error('Invalid WebSocket ticket lifetime')
  }
  if (!endpoint || endpoint.includes('?') || endpoint.includes('#')) {
    throw new Error('Invalid WebSocket endpoint')
  }
  return `${endpoint}?ticket=${encodeURIComponent(response.ticket)}`
}
