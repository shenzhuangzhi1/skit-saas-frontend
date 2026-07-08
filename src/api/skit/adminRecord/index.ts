import request from '@/config/axios'

export interface SkitAdminRecordRespVO {
  id: number
  pageKey: string
  rowKey: string
  recordData: Record<string, unknown>
  status: number
  sort: number
  createTime?: string
  updateTime?: string
}

export interface SkitAdminRecordPageReqVO {
  pageNo: number
  pageSize: number
  pageKey: string
  keyword?: string
  status?: number
}

export interface SkitAdminRecordSaveReqVO {
  id?: number
  pageKey: string
  rowKey?: string
  recordData: Record<string, unknown>
  status?: number
  sort?: number
}

export interface SkitDashboardSummaryRespVO {
  totalMembers: number
  totalAdCount: number
  totalRevenue: number
  totalProfit: number
  todayRegisterCount: number
  todayAdCount: number
  todayRevenue: number
  todayProfit: number
  rewardExchange: number
  scorePerYuan: number
}

export type SkitSystemConfigRespVO = Record<string, unknown>

export interface PageResult<T> {
  list: T[]
  total: number
}

const silent = { skipErrorMessage: true, headers: { isToken: false } }

export const getSkitAdminRecordPage = (params: SkitAdminRecordPageReqVO) => {
  return request.get<PageResult<SkitAdminRecordRespVO>>({
    url: '/skit/admin-record/page',
    params,
    ...silent
  })
}

export const createSkitAdminRecord = (data: SkitAdminRecordSaveReqVO) => {
  return request.post<number>({
    url: '/skit/admin-record/create',
    data,
    ...silent
  })
}

export const updateSkitAdminRecord = (data: SkitAdminRecordSaveReqVO) => {
  return request.put<boolean>({
    url: '/skit/admin-record/update',
    data,
    ...silent
  })
}

export const deleteSkitAdminRecord = (id: number) => {
  return request.delete<boolean>({
    url: '/skit/admin-record/delete',
    params: { id },
    ...silent
  })
}

export const deleteSkitAdminRecordList = (ids: number[]) => {
  return request.delete<boolean>({
    url: '/skit/admin-record/delete-list',
    params: { ids: ids.join(',') },
    ...silent
  })
}

export const seedSkitAdminRecordPage = (pageKey: string) => {
  return request.post<number>({
    url: '/skit/admin-record/seed',
    params: { pageKey },
    ...silent
  })
}

export const getSkitDashboardSummary = () => {
  return request.get<SkitDashboardSummaryRespVO>({
    url: '/skit/admin-record/dashboard-summary',
    ...silent
  })
}

export const getSkitSystemConfig = () => {
  return request.get<SkitSystemConfigRespVO>({
    url: '/skit/general/config',
    ...silent
  })
}

export const updateSkitSystemConfig = (data: Record<string, unknown>) => {
  return request.put<boolean>({
    url: '/skit/general/config',
    data,
    ...silent
  })
}

export const resetSkitSystemConfig = () => {
  return request.post<SkitSystemConfigRespVO>({
    url: '/skit/general/config/reset',
    ...silent
  })
}
