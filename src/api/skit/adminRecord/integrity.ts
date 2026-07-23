import type { PageResult, SkitAdminRecordRespVO } from './index'

const isRecordData = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isCompleteRow = (value: unknown, expectedPageKey: string): value is SkitAdminRecordRespVO => {
  if (!isRecordData(value)) return false
  return (
    Number.isSafeInteger(value.id) &&
    Number(value.id) > 0 &&
    value.pageKey === expectedPageKey &&
    typeof value.rowKey === 'string' &&
    value.rowKey.length > 0 &&
    value.rowKey === value.rowKey.trim() &&
    isRecordData(value.recordData) &&
    Number.isInteger(value.status) &&
    Number.isInteger(value.sort)
  )
}

export const assertSkitAdminRecordPage = (
  source: unknown,
  expectedPageKey: string
): PageResult<SkitAdminRecordRespVO> => {
  if (
    !isRecordData(source) ||
    !Array.isArray(source.list) ||
    !Number.isSafeInteger(source.total) ||
    Number(source.total) < 0 ||
    Number(source.total) < source.list.length
  ) {
    throw new Error('服务端返回的管理页数据不完整')
  }
  if (!source.list.every((record) => isCompleteRow(record, expectedPageKey))) {
    throw new Error('服务端返回的管理页行数据不完整')
  }
  return source as unknown as PageResult<SkitAdminRecordRespVO>
}
