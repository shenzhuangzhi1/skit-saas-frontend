import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/config/axios', () => ({ default: { get } }))

import { getManagedTenantMemberPage } from '@/api/skit/tenant'

const userPagePath = resolve(process.cwd(), 'src/views/skit/user/index.vue')
const memberListPath = resolve(process.cwd(), 'src/views/skit/tenant/MemberList.vue')

describe('dynamic tenant user management', () => {
  beforeEach(() => get.mockReset())

  it('omits tenantId only for the platform-wide read page', async () => {
    get.mockResolvedValue({ list: [], total: 0 })

    await getManagedTenantMemberPage({ kind: 'all' }, { pageNo: 1, pageSize: 10 })

    expect(get).toHaveBeenCalledWith({
      url: '/skit/tenant/member/page',
      params: { pageNo: 1, pageSize: 10 },
      skipErrorMessage: true
    })
  })

  it('renders a dynamic agent scope and keeps row writes bound to the row tenant', () => {
    expect(existsSync(userPagePath)).toBe(true)
    if (!existsSync(userPagePath)) return

    const userPageSource = readFileSync(userPagePath, 'utf8')
    const memberListSource = readFileSync(memberListPath, 'utf8')

    expect(userPageSource).toContain('<TenantScopeBar')
    expect(userPageSource).toContain('getTenantAgentPage')
    expect(userPageSource).toContain('getTenantInvitation')
    expect(userPageSource).toContain('<MemberList')
    expect(memberListSource).toContain('concreteTargetFor')
    expect(memberListSource).toContain('member.tenantId')
    expect(memberListSource).toContain('label="所属代理商"')
  })
})
