import request from '@/config/axios'

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface TenantAgentVO {
  tenantId: number
  tenantCode: string
  rootInviteCode: string
  name: string
  contactName: string
  contactMobile: string
  status: number
  packageId: number
  packageName?: string
  expireTime: number | string
  accountCount: number
  username?: string
  pangleUsername?: string
  pangleAppId?: string
  panglePlacementId?: string
  pangleSecretConfigured?: boolean
  takuUsername?: string
  takuAppId?: string
  takuPlacementId?: string
  takuAppKeyConfigured?: boolean
  takuSecretConfigured?: boolean
  createTime?: string
}

export interface TenantInvitationVO {
  tenantId: number
  tenantCode: string
  rootInviteCode: string
  tenantName: string
}

export interface TenantAgentSaveReqVO {
  tenantId?: number
  name: string
  contactName: string
  contactMobile: string
  status: number
  packageId: number
  expireTime: number | string
  accountCount: number
  username?: string
  password?: string
  pangleUsername?: string
  pangleAppId?: string
  pangleAppSecret?: string
  panglePlacementId?: string
  takuUsername?: string
  takuAppId?: string
  takuAppKey?: string
  takuAppSecret?: string
  takuPlacementId?: string
}

export interface TenantAgentPageReqVO extends PageParam {
  keyword?: string
  status?: number
}

export interface CommissionRuleVO {
  level: number
  rate: number
}

export interface TenantCommissionRuleSaveReqVO {
  tenantId: number
  rules: CommissionRuleVO[]
}

export interface TenantMemberVO {
  id: number
  userId?: number
  username?: string
  nickname?: string
  mobile?: string
  inviteCode?: string
  parentId?: number
  parentUserId?: number
  parentName?: string
  parentNickname?: string
  inviterId?: number
  level?: number
  depth?: number
  status?: number
  createTime?: string
}

export interface TenantMemberPageReqVO extends PageParam {
  tenantId: number
  keyword?: string
}

export interface TenantCommissionLedgerVO {
  id: number
  beneficiaryType?: number
  memberId?: number
  beneficiaryUserId?: number
  memberName?: string
  beneficiaryNickname?: string
  sourceMemberId?: number
  sourceUserId?: number
  sourceMemberName?: string
  sourceNickname?: string
  adRecordId?: number | string
  level?: number
  rate?: number
  adRevenue?: number
  revenueAmount?: number
  commissionAmount?: number
  status?: string
  createTime?: string
}

export interface TenantCommissionLedgerPageReqVO extends PageParam {
  tenantId: number
  beneficiaryUserId?: number
}

export const getTenantAgentPage = (params: TenantAgentPageReqVO) => {
  return request.get<PageResult<TenantAgentVO>>({ url: '/skit/tenant/agent/page', params })
}

export const getTenantAgent = (tenantId: number) => {
  return request.get<TenantAgentVO>({
    url: '/skit/tenant/agent/get',
    params: { tenantId }
  })
}

export const getTenantInvitation = () => {
  return request.get<TenantInvitationVO>({ url: '/skit/tenant/invitation' })
}

export const createTenantAgent = (data: TenantAgentSaveReqVO) => {
  return request.post<number>({ url: '/skit/tenant/agent/create', data })
}

export const updateTenantAgent = (data: TenantAgentSaveReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/update', data })
}

export const getTenantCommissionRules = (tenantId: number) => {
  return request.get<CommissionRuleVO[] | { version: number; rules: CommissionRuleVO[] }>({
    url: '/skit/tenant/commission-rules',
    params: { tenantId }
  })
}

export const updateTenantCommissionRules = (data: TenantCommissionRuleSaveReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/commission-rules', data })
}

export const getTenantMemberPage = (params: TenantMemberPageReqVO) => {
  return request.get<PageResult<TenantMemberVO>>({ url: '/skit/tenant/member/page', params })
}

export const getTenantCommissionLedgerPage = (params: TenantCommissionLedgerPageReqVO) => {
  return request.get<PageResult<TenantCommissionLedgerVO>>({
    url: '/skit/tenant/ledger/page',
    params
  })
}
