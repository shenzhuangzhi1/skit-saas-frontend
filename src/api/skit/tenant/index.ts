import request from '@/config/axios'

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface TenantAgentVO {
  tenantId: number
  tenantCode: string
  rootInviteCode: string
  archivedTime?: number | null
  archivedBy?: number | null
  name: string
  mobile: string
  status: number
  websites: string[]
  expireTime: number
  remark?: string
  pangleUsername?: string
  pangleAppId?: string
  panglePlacementId?: string
  pangleEnabled?: boolean
  pangleSecretConfigured?: boolean
  takuUsername?: string
  takuAppId?: string
  takuPlacementId?: string
  takuEnabled?: boolean
  takuAppKeyConfigured?: boolean
  takuSecretConfigured?: boolean
  createTime?: number
}

export interface TenantInvitationVO {
  tenantId: number
  tenantCode: string
  rootInviteCode: string
  tenantName: string
}

interface TenantAgentProviderWriteFields {
  pangleUsername?: string
  pangleAppId?: string
  pangleAppSecret?: string
  panglePlacementId?: string
  pangleEnabled: boolean
  takuUsername?: string
  takuAppId?: string
  takuAppKey?: string
  takuAppSecret?: string
  takuPlacementId?: string
  takuEnabled: boolean
}

export interface TenantAgentCreateReqVO extends TenantAgentProviderWriteFields {
  name: string
  mobile: string
  password: string
  status: number
  expireTime: number
}

export interface TenantAgentUpdateReqVO extends TenantAgentProviderWriteFields {
  tenantId: number
  name: string
  status: number
  expireTime: number
  remark?: string
}

export interface TenantAgentMobileUpdateReqVO {
  tenantId: number
  mobile: string
}

export interface TenantAgentPasswordResetReqVO {
  tenantId: number
  password: string
}

export type TenantAdProvider = 'PANGLE' | 'TAKU'

export interface TenantAdAccountVO {
  pangleUsername?: string
  pangleAppId?: string
  panglePlacementId?: string
  pangleEnabled?: boolean
  pangleSecretConfigured?: boolean
  takuUsername?: string
  takuAppId?: string
  takuPlacementId?: string
  takuEnabled?: boolean
  takuAppKeyConfigured?: boolean
  takuSecretConfigured?: boolean
}

export interface TenantAdAccountSaveReqVO extends TenantAgentProviderWriteFields {
  tenantId?: number
}

export interface TenantAdCredentialClearReqVO {
  tenantId?: number
  provider: TenantAdProvider
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
  userId: number
  username: string
  nickname?: string
  mobile: string
  inviteCode: string
  parentId?: number
  parentUserId?: number
  parentName?: string
  parentNickname?: string
  inviterId?: number
  level?: number
  depth?: number
  status: number
  childCount?: number
  createTime?: number
  loginTime?: number
}

export interface TenantMemberPageReqVO extends PageParam {
  tenantId?: number
  keyword?: string
  status?: number
}

export interface TenantMemberStatusUpdateReqVO {
  tenantId?: number
  id: number
  status: number
}

export interface TenantMemberPasswordResetReqVO {
  tenantId?: number
  id: number
  password: string
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
  createTime?: number
}

export interface TenantCommissionLedgerPageReqVO extends PageParam {
  tenantId: number
  beneficiaryUserId?: number
}

export interface TenantAppReleaseProfileVO {
  tenantId: number
  profileCode: string
  channel: 'production' | 'staging'
  minNativeVersion: string
  hotVersion: string
  hotBundleUrl: string
  hotBundleSha256: string
  nativeVersion: string
  nativePackage: string
  status: number
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

export const getTenantInvitation = (tenantId?: number) => {
  return request.get<TenantInvitationVO>({
    url: '/skit/tenant/invitation',
    params: { tenantId }
  })
}

export const createTenantAgent = (data: TenantAgentCreateReqVO) => {
  return request.post<number>({ url: '/skit/tenant/agent/create', data })
}

export const updateTenantAgent = (data: TenantAgentUpdateReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/update', data })
}

export const updateTenantAgentMobile = (data: TenantAgentMobileUpdateReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/update-mobile', data })
}

export const resetTenantAgentPassword = (data: TenantAgentPasswordResetReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/reset-password', data })
}

export const archiveTenantAgent = (tenantId: number) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/archive', params: { tenantId } })
}

export const restoreTenantAgent = (tenantId: number) => {
  return request.put<boolean>({ url: '/skit/tenant/agent/restore', params: { tenantId } })
}

export const rotateTenantAgentRootInvite = (tenantId: number) => {
  return request.put<string>({
    url: '/skit/tenant/agent/rotate-root-invite',
    params: { tenantId }
  })
}

export const getTenantAdAccount = (tenantId?: number) => {
  return request.get<TenantAdAccountVO>({
    url: '/skit/tenant/ad-account',
    params: { tenantId }
  })
}

export const updateTenantAdAccount = (data: TenantAdAccountSaveReqVO) => {
  return request.put<TenantAdAccountVO>({ url: '/skit/tenant/ad-account', data })
}

export const clearTenantAdAccountCredentials = (data: TenantAdCredentialClearReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/ad-account/clear-credentials', data })
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

export const getTenantAppReleaseProfile = (tenantId: number) => {
  return request.get<TenantAppReleaseProfileVO>({
    url: '/skit/tenant/app-release',
    params: { tenantId }
  })
}

export const updateTenantAppReleaseProfile = (data: TenantAppReleaseProfileVO) => {
  return request.put<TenantAppReleaseProfileVO>({ url: '/skit/tenant/app-release', data })
}

export const getTenantMemberPage = (params: TenantMemberPageReqVO) => {
  return request.get<PageResult<TenantMemberVO>>({ url: '/skit/tenant/member/page', params })
}

export const getTenantMember = (id: number, tenantId?: number) => {
  return request.get<TenantMemberVO>({
    url: '/skit/tenant/member/get',
    params: { id, tenantId }
  })
}

export const updateTenantMemberStatus = (data: TenantMemberStatusUpdateReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/member/update-status', data })
}

export const resetTenantMemberPassword = (data: TenantMemberPasswordResetReqVO) => {
  return request.put<boolean>({ url: '/skit/tenant/member/reset-password', data })
}

export const getTenantCommissionLedgerPage = (params: TenantCommissionLedgerPageReqVO) => {
  return request.get<PageResult<TenantCommissionLedgerVO>>({
    url: '/skit/tenant/ledger/page',
    params
  })
}
