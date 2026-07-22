import type {
  AdConsumptionBaseQuery,
  AdConsumptionQueryStatus,
  AdConsumptionTimelineEventType
} from '@/api/skit/adConsumption'
import { tenantScopeQuery, type TenantScope } from '@/views/skit/shared/tenantScope'

export interface ConsumptionQueryInput extends AdConsumptionBaseQuery {
  pageNo?: number
  pageSize?: number
}

const ALLOWED_QUERY_FIELDS = [
  'pageNo',
  'pageSize',
  'startTime',
  'endTime',
  'timezone',
  'dramaId',
  'episodeNo',
  'provider',
  'networkFirmId',
  'status',
  'memberKeyword',
  'providerTransactionId'
] as const satisfies readonly (keyof ConsumptionQueryInput)[]

/** Tenant identity comes from the authenticated scope. Any input tenantId is discarded. */
export const buildScopedConsumptionParams = (
  scope: TenantScope,
  input: ConsumptionQueryInput
): Record<string, string | number> => {
  const params: Record<string, string | number> = { ...tenantScopeQuery(scope) }
  for (const field of ALLOWED_QUERY_FIELDS) {
    const value = input[field]
    if (value !== undefined && value !== '') params[field] = value as string | number
  }
  return params
}

export const formatConversionRate = (numerator: number, denominator: number): string => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return '—'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

const CONSUMPTION_STATUS_LABELS: Record<AdConsumptionQueryStatus, string> = {
  CREATED: '会话已创建',
  LOAD_STARTED: '开始加载',
  SHOWN: '客户端已展示',
  REWARD_OBSERVED: '客户端观察到奖励',
  CLOSED: '广告已关闭',
  FAILED: '加载或展示失败',
  LOAD_EXPIRED: '加载已过期',
  REWARD_VERIFIED: '签名奖励已验证',
  REWARD_REJECTED: '奖励验证被拒绝',
  VERIFY_TIMEOUT: '奖励验证超时',
  UNLOCKED: '权益已授予'
}

const TIMELINE_EVENT_LABELS: Record<string, string> = {
  SESSION_CREATED: '广告会话已创建',
  LOAD_STARTED: '开始加载广告素材',
  SHOWN: '客户端上报 SHOWN',
  CLOSED: '客户端关闭广告',
  REWARD_OBSERVED: '客户端观察到奖励',
  FAILED: '客户端链路失败',
  REWARD_VERIFIED: '服务端签名奖励已验证',
  ENTITLEMENT_GRANTED: '剧集权益已授予',
  NATIVE_GRANT_REFERENCED: '会话引用原生授权凭据',
  NATIVE_GRANT_USED: '原生授权凭据已使用（非 Activity 启动证明）',
  CALLBACK_ATTEMPT: '回调处理尝试',
  IMPRESSION: '平台 Impression 回调',
  REWARD: '平台奖励回调'
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: '已创建',
  LOADING: '加载中',
  SHOWN: '已展示',
  CLIENT_REWARDED: '客户端已观察奖励',
  CLOSED: '已关闭',
  LOAD_EXPIRED: '加载已过期',
  EXPIRED: '已过期',
  REVOKED: '已撤销',
  SUCCEEDED: '成功',
  SUCCESS: '成功',
  VALID: '有效',
  SIGNED_VERIFIED: '签名有效',
  GRANTED: '已授予',
  ACTIVE: '有效',
  USED: '已使用',
  FAILED: '失败',
  REJECTED: '已拒绝',
  VERIFY_TIMEOUT: '验证超时',
  DEAD_LETTER: '死信',
  PENDING: '待处理',
  PROCESSING: '处理中',
  NOT_TRACKED: '未上报'
}

export const consumptionStatusLabel = (status: AdConsumptionQueryStatus): string =>
  CONSUMPTION_STATUS_LABELS[status] || status

export const consumptionTimelineEventLabel = (eventType: AdConsumptionTimelineEventType): string =>
  TIMELINE_EVENT_LABELS[eventType] || eventType

export const consumptionTimelineStatusLabel = (status: string): string =>
  STATUS_LABELS[status] || status

export type StatusTagType = 'success' | 'warning' | 'danger' | 'info'

export const consumptionStatusTagType = (status: AdConsumptionQueryStatus): StatusTagType => {
  if (['FAILED', 'LOAD_EXPIRED', 'REWARD_REJECTED', 'VERIFY_TIMEOUT'].includes(status)) {
    return 'danger'
  }
  if (['REWARD_VERIFIED', 'UNLOCKED'].includes(status)) return 'success'
  if (['CLOSED', 'REWARD_OBSERVED'].includes(status)) return 'warning'
  return 'info'
}

export const timelineStatusTagType = (status: string): StatusTagType => {
  if (/FAIL|REJECT|TIMEOUT|DEAD|ERROR/.test(status)) return 'danger'
  if (/SUCCESS|SUCCEEDED|VALID|VERIFIED|GRANTED|ACTIVE|USED/.test(status)) return 'success'
  if (/PENDING|PROCESS|WAIT/.test(status)) return 'warning'
  return 'info'
}
