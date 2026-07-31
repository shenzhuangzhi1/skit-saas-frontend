import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import router, { resetRouter } from '@/router'
import productRoutes from '@/router/productRoutes'
import { PRODUCT_AD_MONITOR_ROUTE_NAME } from '@/router/productMenu'

const EXPECTED_ROUTES = [
  ['RedirectRoot', '/redirect'],
  ['Redirect', '/redirect/:path(.*)'],
  ['Home', '/'],
  ['Index', '/index'],
  ['SkitSaas', '/skit'],
  ['SkitGeneral', '/skit/general'],
  ['SkitAttachment', '/skit/general/attachment'],
  ['SkitOperationLog', '/skit/general/operation-log'],
  ['SkitApiErrorLog', '/skit/general/api-error-log'],
  ['SkitDrama', '/skit/drama'],
  ['SkitAdCenter', '/skit/ad-center'],
  ['SkitAdConsumption', '/skit/ad-consumption'],
  [PRODUCT_AD_MONITOR_ROUTE_NAME, '/skit/ad-record'],
  ['SkitWithdraw', '/skit/withdraw'],
  ['SkitScoreLog', '/skit/score-log'],
  ['SkitLoginRecord', '/skit/login-record'],
  ['SkitDeviceLog', '/skit/device-log'],
  ['SkitUserCenter', '/skit/user-center'],
  ['SkitAgentManagement', '/skit/user-center/agents'],
  ['SkitAppUserManagement', '/skit/user-center/users'],
  ['SkitUserLegacyRedirect', '/skit/user'],
  ['SkitAnnouncement', '/skit/announcement'],
  ['SkitAdConsumptionLegacyRedirect', '/skit/ad-center/skit/ad-consumption'],
  ['SkitAdRecordLegacyRedirect', '/skit/ad-center/skit/ad-record'],
  ['UserInfo', '/user'],
  ['Profile', '/user/profile'],
  ['MyNotifyMessage', '/user/notify-message'],
  ['Login', '/login'],
  ['NoAccess', '/403'],
  ['NoFound', '/404'],
  ['Error', '/500'],
  ['', '/:pathMatch(.*)*']
] as const

const REMOVED_DEEP_LINKS = [
  '/dict/type/data/foo',
  '/codegen/edit',
  '/job/job-log',
  '/bpm/manager/form/edit',
  '/mall/product/spu/add',
  '/member/user/detail/1',
  '/pay/cashier',
  '/diy/template/decorate/1',
  '/crm/clue/detail/1',
  '/ai/image/square',
  '/iot/device/detail/1',
  '/mes/wm/warehouse/location',
  '/im/home/conversation'
] as const

const joinRoutePath = (parentPath: string, path: string) => {
  if (path.startsWith('/')) return path
  return `${parentPath.replace(/\/$/, '')}/${path}`.replace(/\/+/g, '/')
}

const flattenRoutes = (
  routes: AppRouteRecordRaw[],
  parentPath = ''
): Array<{ name: string; path: string; route: AppRouteRecordRaw }> =>
  routes.flatMap((route) => {
    const path = joinRoutePath(parentPath, route.path)
    const current = { name: String(route.name ?? ''), path, route }
    return [current, ...flattenRoutes(route.children || [], path)]
  })

describe('explicit Skit product route contract', () => {
  const flattenedRoutes = flattenRoutes(productRoutes)

  it('contains exactly the 32 retained route records and paths', () => {
    expect(flattenedRoutes.map(({ name, path }) => [name, path])).toEqual(EXPECTED_ROUTES)
  })

  it('preserves protected role metadata, props, and compatibility redirects', () => {
    const byName = new Map(flattenedRoutes.map((entry) => [entry.name, entry.route]))

    expect(byName.get('SkitApiErrorLog')?.meta?.roles).toEqual(['super_admin'])
    for (const name of [
      'SkitAdCenter',
      'SkitAdConsumption',
      PRODUCT_AD_MONITOR_ROUTE_NAME,
      'SkitUserCenter',
      'SkitAgentManagement',
      'SkitAppUserManagement'
    ]) {
      expect(byName.get(name)?.meta?.roles).toEqual(['super_admin', 'tenant_admin'])
    }
    expect(byName.get('SkitAttachment')?.props).toEqual({ pageKey: 'attachment' })
    expect(byName.get('SkitDrama')?.props).toEqual({ pageKey: 'drama' })
    expect(byName.get('SkitAdConsumptionLegacyRedirect')?.redirect).toBe(
      '/skit/ad-consumption'
    )
    expect(byName.get('SkitAdRecordLegacyRedirect')?.redirect).toBe('/skit/ad-record')
    expect(byName.get('SkitUserLegacyRedirect')?.redirect).toBe('/skit/user-center/agents')
  })

  it('contains no banned top-level product prefix', () => {
    const bannedPrefixes = [
      '/dict',
      '/codegen',
      '/job',
      '/bpm',
      '/mall',
      '/member',
      '/pay',
      '/diy',
      '/crm',
      '/ai',
      '/iot',
      '/mes',
      '/im'
    ]

    expect(
      flattenedRoutes.filter(({ path }) =>
        bannedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
      )
    ).toEqual([])
  })

  it('keeps the static product router intact when an authenticated session resets', () => {
    const before = router.getRoutes().map((route) => String(route.name ?? '')).sort()

    resetRouter()

    expect(router.getRoutes().map((route) => String(route.name ?? '')).sort()).toEqual(before)
    expect(router.hasRoute('SkitSaas')).toBe(true)
    expect(router.hasRoute('Login')).toBe(true)
  })

  it.each(REMOVED_DEEP_LINKS)('resolves authenticated removed deep link %s to 404', (path) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: productRoutes
    })
    const resolved = router.resolve(path)

    expect(resolved.matched.at(-1)?.path).toBe('/:pathMatch(.*)*')
    expect(resolved.matched.at(-1)?.components.default).toBeDefined()
  })
})
