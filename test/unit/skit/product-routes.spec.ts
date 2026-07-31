import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import router, { resetRouter } from '@/router'
import productRoutes from '@/router/productRoutes'
import { PRODUCT_AD_MONITOR_ROUTE_NAME } from '@/router/productMenu'

const EXPECTED_ROUTE_CONTRACT = [
  {
    name: 'RedirectRoot',
    path: '/redirect',
    component: 'src/layout/Layout.vue',
    meta: { hidden: true, noTagsView: true }
  },
  {
    name: 'Redirect',
    path: '/redirect/:path(.*)',
    component: 'src/views/Redirect/Redirect.vue',
    meta: {}
  },
  {
    name: 'Home',
    path: '/',
    component: 'src/layout/Layout.vue',
    redirect: '/index',
    meta: {}
  },
  {
    name: 'Index',
    path: '/index',
    component: 'src/views/Home/Index.vue',
    meta: {
      title: '数据总览',
      icon: 'ep:home-filled',
      noCache: false,
      affix: true
    }
  },
  {
    name: 'SkitSaas',
    path: '/skit',
    component: 'src/layout/Layout.vue',
    redirect: '/skit/user-center/agents',
    meta: { title: '管理后台', icon: 'ep:video-play', alwaysShow: true }
  },
  {
    name: 'SkitGeneral',
    path: '/skit/general',
    component: 'component:ParentLayout',
    redirect: '/skit/general/attachment',
    meta: { title: '常规管理', icon: 'ep:setting', alwaysShow: true }
  },
  {
    name: 'SkitAttachment',
    path: '/skit/general/attachment',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'attachment' },
    meta: { title: '附件管理', icon: 'ep:folder-opened', noCache: false }
  },
  {
    name: 'SkitOperationLog',
    path: '/skit/general/operation-log',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'operationLog' },
    meta: { title: '操作日志', icon: 'ep:document', noCache: false }
  },
  {
    name: 'SkitApiErrorLog',
    path: '/skit/general/api-error-log',
    component: 'src/views/infra/apiErrorLog/index.vue',
    meta: {
      title: '错误日志',
      icon: 'ep:warning',
      noCache: true,
      roles: ['super_admin']
    }
  },
  {
    name: 'SkitDrama',
    path: '/skit/drama',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'drama' },
    meta: { title: '短剧管理', icon: 'ep:video-camera', noCache: false }
  },
  {
    name: 'SkitAdCenter',
    path: '/skit/ad-center',
    component: 'component:ParentLayout',
    redirect: '/skit/ad-consumption',
    meta: {
      title: '广告中心',
      icon: 'ep:histogram',
      alwaysShow: true,
      roles: ['super_admin', 'tenant_admin']
    }
  },
  {
    name: 'SkitAdConsumption',
    path: '/skit/ad-consumption',
    component: 'src/views/skit/ad-consumption/index.vue',
    meta: {
      title: '消费明细',
      icon: 'ep:list',
      noCache: false,
      roles: ['super_admin', 'tenant_admin']
    }
  },
  {
    name: PRODUCT_AD_MONITOR_ROUTE_NAME,
    path: '/skit/ad-record',
    component: 'src/views/skit/ad-monitor/index.vue',
    meta: {
      title: '广告监控',
      icon: 'ep:data-analysis',
      noCache: false,
      roles: ['super_admin', 'tenant_admin']
    }
  },
  {
    name: 'SkitWithdraw',
    path: '/skit/withdraw',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'withdraw' },
    meta: { title: '积分提现', icon: 'ep:wallet', noCache: false }
  },
  {
    name: 'SkitScoreLog',
    path: '/skit/score-log',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'scoreLog' },
    meta: { title: '积分记录', icon: 'ep:coin', noCache: false }
  },
  {
    name: 'SkitLoginRecord',
    path: '/skit/login-record',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'loginRecord' },
    meta: { title: '登录记录', icon: 'ep:key', noCache: false }
  },
  {
    name: 'SkitDeviceLog',
    path: '/skit/device-log',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'deviceLog' },
    meta: { title: '设备日志', icon: 'ep:monitor', noCache: false }
  },
  {
    name: 'SkitUserCenter',
    path: '/skit/user-center',
    component: 'component:ParentLayout',
    redirect: '/skit/user-center/agents',
    meta: {
      title: '用户管理',
      icon: 'ep:user',
      alwaysShow: true,
      roles: ['super_admin', 'tenant_admin']
    }
  },
  {
    name: 'SkitAgentManagement',
    path: '/skit/user-center/agents',
    component: 'src/views/skit/tenant/index.vue',
    meta: {
      title: '代理商管理',
      icon: 'ep:office-building',
      noCache: true,
      roles: ['super_admin', 'tenant_admin']
    }
  },
  {
    name: 'SkitAppUserManagement',
    path: '/skit/user-center/users',
    component: 'src/views/skit/user/index.vue',
    meta: {
      title: '用户管理',
      icon: 'ep:user-filled',
      noCache: true,
      roles: ['super_admin', 'tenant_admin']
    }
  },
  {
    name: 'SkitUserLegacyRedirect',
    path: '/skit/user',
    redirect: '/skit/user-center/agents',
    meta: { hidden: true, noTagsView: true }
  },
  {
    name: 'SkitAnnouncement',
    path: '/skit/announcement',
    component: 'src/views/skit/admin/AdminTable.vue',
    props: { pageKey: 'announcement' },
    meta: { title: '公告管理', icon: 'ep:bell', noCache: false }
  },
  {
    name: 'SkitAdConsumptionLegacyRedirect',
    path: '/skit/ad-center/skit/ad-consumption',
    redirect: '/skit/ad-consumption',
    meta: { hidden: true, noTagsView: true }
  },
  {
    name: 'SkitAdRecordLegacyRedirect',
    path: '/skit/ad-center/skit/ad-record',
    redirect: '/skit/ad-record',
    meta: { hidden: true, noTagsView: true }
  },
  {
    name: 'UserInfo',
    path: '/user',
    component: 'src/layout/Layout.vue',
    meta: { hidden: true }
  },
  {
    name: 'Profile',
    path: '/user/profile',
    component: 'src/views/Profile/Index.vue',
    meta: {
      canTo: true,
      hidden: true,
      noTagsView: false,
      icon: 'ep:user',
      title: 'common.profile'
    }
  },
  {
    name: 'MyNotifyMessage',
    path: '/user/notify-message',
    component: 'src/views/system/notify/my/index.vue',
    meta: {
      canTo: true,
      hidden: true,
      noTagsView: false,
      icon: 'ep:message',
      title: '我的站内信'
    }
  },
  {
    name: 'Login',
    path: '/login',
    component: 'src/views/Login/Login.vue',
    meta: { hidden: true, title: 'router.login', noTagsView: true }
  },
  {
    name: 'NoAccess',
    path: '/403',
    component: 'src/views/Error/403.vue',
    meta: { hidden: true, title: '403', noTagsView: true }
  },
  {
    name: 'NoFound',
    path: '/404',
    component: 'src/views/Error/404.vue',
    meta: { hidden: true, title: '404', noTagsView: true }
  },
  {
    name: 'Error',
    path: '/500',
    component: 'src/views/Error/500.vue',
    meta: { hidden: true, title: '500', noTagsView: true }
  },
  {
    name: '',
    path: '/:pathMatch(.*)*',
    component: 'src/views/Error/404.vue',
    meta: { title: '404', hidden: true, breadcrumb: false }
  }
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

const componentIdentity = (component: AppRouteRecordRaw['component']) => {
  if (!component) return undefined
  if (typeof component === 'object') return `component:${String(component.name || '')}`

  const sourcePath = String(component).match(/['"](?:\/src\/|@\/)([^'"]+)['"]/)?.[1]
  return sourcePath ? `src/${sourcePath}` : `function:${component.name}`
}

describe('explicit Skit product route contract', () => {
  const flattenedRoutes = flattenRoutes(productRoutes)

  it('preserves the exact 32-record path, component, redirect, props, and metadata contract', () => {
    const actualContract = flattenedRoutes.map(({ name, path, route }) => ({
      name,
      path,
      ...(componentIdentity(route.component)
        ? { component: componentIdentity(route.component) }
        : {}),
      ...(route.redirect !== undefined ? { redirect: route.redirect } : {}),
      ...(route.props !== undefined ? { props: route.props } : {}),
      meta: route.meta || {}
    }))

    expect(actualContract).toEqual(EXPECTED_ROUTE_CONTRACT)
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

  it('keeps the static product router intact when the legacy reset hook runs', () => {
    const before = router
      .getRoutes()
      .map((route) => String(route.name ?? ''))
      .sort()

    resetRouter()

    expect(
      router
        .getRoutes()
        .map((route) => String(route.name ?? ''))
        .sort()
    ).toEqual(before)
    expect(router.hasRoute('SkitSaas')).toBe(true)
    expect(router.hasRoute('Login')).toBe(true)
  })

  it.each(REMOVED_DEEP_LINKS)('routes removed deep link %s to the product 404', async (path) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: productRoutes
    })
    await router.push(path)
    const resolved = router.currentRoute.value
    const noFound = flattenRoutes(productRoutes).find((entry) => entry.name === 'NoFound')
    const catchAll = resolved.matched.at(-1)
    const noFoundModule = await (
      noFound?.route.component as () => Promise<{ default: unknown }>
    )()

    expect(catchAll?.path).toBe('/:pathMatch(.*)*')
    expect(catchAll?.components.default).toBe(noFoundModule.default)
  })
})
