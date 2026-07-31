import { defineStore } from 'pinia'
import { store } from '@/store'
import { cloneDeep } from 'lodash-es'
import productRoutes from '@/router/productRoutes'
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
  menuTabRouters: AppRouteRecordRaw[]
  menuRootPath: string
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    menuTabRouters: [],
    menuRootPath: ''
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    },
    getMenuRootPath(): string {
      return this.menuRootPath
    }
  },
  actions: {
    async generateRoutes(): Promise<void> {
      // The Router already owns the full static product tree. Permission state is menu-only.
      const userInfo = wsCache.get(CACHE_KEY.USER)
      const roles = (userInfo?.roles || []) as string[]
      const roleFilteredRoutes = filterRoutesByRole(cloneDeep(productRoutes), roles)
      this.routers = selectProductTopLevelRoutes(roleFilteredRoutes)
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
