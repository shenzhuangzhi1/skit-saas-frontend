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
  tenantId?: number
  keyword?: string
  status?: number
}

export interface SkitAdminRecordSaveReqVO {
  id?: number
  tenantId?: number
  reason?: string
  pageKey: string
  rowKey?: string
  recordData: Record<string, unknown>
  status?: number
  sort?: number
}

export type SkitAdminRecordMutationScope = Pick<SkitAdminRecordSaveReqVO, 'tenantId' | 'reason'>

export interface PageResult<T> {
  list: T[]
  total: number
}

// 业务数据必须随登录 token 与 tenant-id 访问；这里只静默处理页面级错误提示。
const silent = { skipErrorMessage: true }

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

export const deleteSkitAdminRecord = (id: number, scope: SkitAdminRecordMutationScope = {}) => {
  return request.delete<boolean>({
    url: '/skit/admin-record/delete',
    params: { id, ...scope },
    ...silent
  })
}

export const deleteSkitAdminRecordList = (
  ids: number[],
  scope: SkitAdminRecordMutationScope = {}
) => {
  return request.delete<boolean>({
    url: '/skit/admin-record/delete-list',
    params: { ids: ids.join(','), ...scope },
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
