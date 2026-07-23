export interface VerifiedPageResult<T> {
  list: T[]
  total: number
}

export interface VerifiedStablePageResult<T> extends VerifiedPageResult<T> {
  tenantId: number
  asOf: number
  timezone: string
  pageNo: number
  pageSize: number
}

export interface StablePageExpectation {
  tenantId: number
  asOf?: number
  timezone: string
  pageNo: number
  pageSize: number
}

type RowGuard<T> = (value: unknown) => value is T

const responseError = (label: string) => new Error(`服务端返回的${label}不完整`)

export const requirePageResult = <T>(
  value: unknown,
  label: string,
  isRow: RowGuard<T>
): VerifiedPageResult<T> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw responseError(label)
  }
  const page = value as Record<string, unknown>
  if (
    !Array.isArray(page.list) ||
    typeof page.total !== 'number' ||
    !Number.isSafeInteger(page.total) ||
    page.total < 0 ||
    page.total < page.list.length ||
    !page.list.every(isRow)
  ) {
    throw responseError(label)
  }
  return value as VerifiedPageResult<T>
}

export const requireStablePageResult = <T>(
  value: unknown,
  label: string,
  isRow: RowGuard<T>,
  expected: StablePageExpectation
): VerifiedStablePageResult<T> => {
  const page = requirePageResult(value, label, isRow)
  const envelope = value as Record<string, unknown>
  if (
    envelope.tenantId !== expected.tenantId ||
    typeof envelope.asOf !== 'number' ||
    !Number.isSafeInteger(envelope.asOf) ||
    envelope.asOf <= 0 ||
    (expected.asOf !== undefined && envelope.asOf !== expected.asOf) ||
    envelope.timezone !== expected.timezone ||
    envelope.pageNo !== expected.pageNo ||
    envelope.pageSize !== expected.pageSize
  ) {
    throw responseError(label)
  }
  return { ...page, ...(value as VerifiedStablePageResult<T>) }
}
