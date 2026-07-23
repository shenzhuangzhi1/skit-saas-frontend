import { describe, expect, it } from 'vitest'
import { assertSkitAdminRecordPage } from '@/api/skit/adminRecord/integrity'

const validRecord = {
  id: 17,
  pageKey: 'drama',
  rowKey: 'drama-17',
  recordData: { title: '真实短剧' },
  status: 0,
  sort: 10
}

describe('admin record response integrity', () => {
  it('accepts a complete page returned for the requested page key', () => {
    const page = { list: [validRecord], total: 1 }

    expect(assertSkitAdminRecordPage(page, 'drama')).toBe(page)
  })

  it.each([
    undefined,
    {},
    { list: [], total: undefined },
    { list: undefined, total: 0 },
    { list: [], total: -1 },
    { list: [], total: 0.5 },
    { list: [validRecord], total: 0 }
  ])('rejects malformed page metadata instead of coercing it to an empty page', (page) => {
    expect(() => assertSkitAdminRecordPage(page, 'drama')).toThrow('服务端返回的管理页数据不完整')
  })

  it.each([
    { ...validRecord, id: undefined },
    { ...validRecord, pageKey: 'withdraw' },
    { ...validRecord, rowKey: '' },
    { ...validRecord, recordData: undefined },
    { ...validRecord, recordData: [] },
    { ...validRecord, status: undefined },
    { ...validRecord, sort: undefined }
  ])('rejects malformed rows instead of synthesizing missing fields', (record) => {
    expect(() => assertSkitAdminRecordPage({ list: [record], total: 1 }, 'drama')).toThrow(
      '服务端返回的管理页行数据不完整'
    )
  })
})
