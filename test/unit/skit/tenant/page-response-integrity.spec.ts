import { describe, expect, it } from 'vitest'
import { requirePageResult, requireStablePageResult } from '@/api/skit/tenant/pageIntegrity'

const isRow = (value: unknown): value is { id: number } =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Number.isSafeInteger((value as { id?: unknown }).id) &&
  Number((value as { id?: unknown }).id) > 0

describe('tenant page response integrity', () => {
  it('accepts a complete page and preserves a truthful empty page', () => {
    expect(requirePageResult({ list: [], total: 0 }, '成员分页', isRow)).toEqual({
      list: [],
      total: 0
    })
    expect(requirePageResult({ list: [{ id: 7 }], total: 1 }, '成员分页', isRow)).toEqual({
      list: [{ id: 7 }],
      total: 1
    })
  })

  it('rejects missing lists, fabricated totals, and malformed rows', () => {
    expect(() => requirePageResult({ total: 0 }, '成员分页', isRow)).toThrow('成员分页')
    expect(() => requirePageResult({ list: [{ id: 7 }], total: 0 }, '成员分页', isRow)).toThrow(
      '成员分页'
    )
    expect(() => requirePageResult({ list: [{ id: 0 }], total: 1 }, '成员分页', isRow)).toThrow(
      '成员分页'
    )
  })

  it('rejects cross-tenant, drifting snapshot, and mismatched paging envelopes', () => {
    const page = {
      tenantId: 23,
      asOf: 1_753_228_800_000,
      timezone: 'UTC+8',
      pageNo: 2,
      pageSize: 10,
      list: [{ id: 7 }],
      total: 11
    }
    const expected = {
      tenantId: 23,
      asOf: 1_753_228_800_000,
      timezone: 'UTC+8',
      pageNo: 2,
      pageSize: 10
    }

    expect(requireStablePageResult(page, '分成账本', isRow, expected)).toEqual(page)
    expect(() =>
      requireStablePageResult({ ...page, tenantId: 24 }, '分成账本', isRow, expected)
    ).toThrow('分成账本')
    expect(() =>
      requireStablePageResult({ ...page, asOf: 1_753_228_801_000 }, '分成账本', isRow, expected)
    ).toThrow('分成账本')
    expect(() =>
      requireStablePageResult({ ...page, pageNo: 1 }, '分成账本', isRow, expected)
    ).toThrow('分成账本')
  })
})
