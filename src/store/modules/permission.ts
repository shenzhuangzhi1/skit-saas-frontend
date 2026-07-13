import { defineStore } from 'pinia'
import { store } from '@/store'
import { cloneDeep } from 'lodash-es'
import remainingRouter from '@/router/modules/remaining'
import { flatMultiLevelRoutes } from '@/utils/routerHelper'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { hasAnyRole } from '@/utils/role'
import { selectProductTopLevelRoutes } from '@/router/productMenu'

const { wsCache } = useCache()

const filterRoutesByRole = (routes: AppRouteRecordRaw[], roles: string[]): AppRouteRecordRaw[] =>
  routes.flatMap((route) => {
    if (!hasAnyRole(route.meta?.roles, roles)) return []
    const children = route.children ? filterRoutesByRole(route.children, roles) : undefined
    return [{ ...route, ...(children ? { children } : {}) }]
  })

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  menuTabRouters: AppRouteRecordRaw[]
  menuRootPath: string
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    menuTabRouters: [],
    menuRootPath: ''
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    },
    getMenuRootPath(): string {
      return this.menuRootPath
    }
  },
  actions: {
    async generateRoutes(): Promise<unknown> {
      return new Promise<void>(async (resolve) => {
        // 产品路由全部由 remainingRouter 提供；不注册框架返回的会员、商城、CRM 等菜单。
        this.addRouters = [
          {
            path: '/:path(.*)*',
            // redirect: '/404',
            component: () => import('@/views/Error/404.vue'),
            name: '404Page',
            meta: {
              hidden: true,
              breadcrumb: false
            }
          }
        ]
        // 侧栏只展示首页和短剧 SaaS；隐藏工具路由继续保留。
        const userInfo = wsCache.get(CACHE_KEY.USER)
        const roles = (userInfo?.roles || []) as string[]
        const roleFilteredRoutes = filterRoutesByRole(cloneDeep(remainingRouter), roles)
        this.routers = selectProductTopLevelRoutes(roleFilteredRoutes)
        resolve()
      })
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    },
    setMenuRootPath(path: string): void {
      this.menuRootPath = path
    }
  },
  persist: false
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
