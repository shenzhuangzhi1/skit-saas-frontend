import request from '@/config/axios'

export interface WebSocketTicketRespVO {
  ticket: string
  expiresInSeconds: number
}

/** 使用当前管理端 access token 签发短时、单次 WebSocket 票据。 */
export const createWebSocketTicket = () =>
  request.post<WebSocketTicketRespVO>({
    url: '/infra/websocket-tickets',
    skipErrorMessage: true
  })
