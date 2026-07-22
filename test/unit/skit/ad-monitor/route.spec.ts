import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('advertising monitoring route', () => {
  it('replaces the editable sample ad record page with the dedicated read-only monitor', () => {
    const source = readSource('src/router/modules/remaining.ts')
    const routeStart = source.indexOf("path: '/skit/ad-record'")
    const nextRouteStart = source.indexOf("path: 'withdraw'", routeStart)

    expect(routeStart).toBeGreaterThan(-1)
    expect(nextRouteStart).toBeGreaterThan(routeStart)

    const route = source.slice(routeStart, nextRouteStart)
    expect(route).toMatch(/import\('@\/views\/skit\/ad-monitor\/index\.vue'\)/)
    expect(route).toMatch(/title:\s*'广告监控'/)
    expect(route).toMatch(/roles:\s*\['super_admin',\s*'tenant_admin'\]/)
    expect(route).not.toMatch(/AdminTable|pageKey|编辑|删除/)
  })

  it('removes the fake ad-record total from the dashboard menu entry', () => {
    const source = readSource('src/views/skit/admin/pageConfig.ts')
    const menuStart = source.indexOf('export const skitMenuGroups')
    const menu = source.slice(menuStart)

    expect(menu).toContain("title: '广告监控'")
    expect(menu).not.toMatch(/key:\s*'adRecord'.*totalRows:\s*947/)
  })

  it('keeps super-admin all-scope on the server aggregation path', () => {
    const source = readSource('src/views/skit/ad-monitor/index.vue')

    expect(source).toContain('loadAdMonitorSnapshot')
    expect(source).not.toContain('请选择一个代理商')
    expect(source).not.toMatch(/tenantOptions\.value\.map\([^)]*getAdAnalytics/)
  })
})
