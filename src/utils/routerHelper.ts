import { defineComponent, h } from 'vue'
import type { RouteLocationNormalized, RouteRecordNormalized } from 'vue-router'
import { RouterView } from 'vue-router'
import { isUrl } from '@/utils/is'

/** Top-level application shell used by the explicit product route tree. */
export const Layout = () => import('@/layout/Layout.vue')

// Nested route groups only pass through their child view. Rendering the full
// Layout here would duplicate the header and side navigation.
const ParentLayout = defineComponent({
  name: 'ParentLayout',
  setup() {
    return () => h(RouterView)
  }
})

export const getParentLayout = () => ParentLayout

export const getRawRoute = (route: RouteLocationNormalized): RouteLocationNormalized => {
  if (!route) return route
  const { matched, ...opt } = route
  return {
    ...opt,
    matched: (matched
      ? matched.map((item) => ({
          meta: item.meta,
          name: item.name,
          path: item.path
        }))
      : undefined) as RouteRecordNormalized[]
  }
}

export const pathResolve = (parentPath: string, path: string) => {
  if (isUrl(path)) return path
  if (!path) return parentPath
  if (path.startsWith('/')) return path.replace(/\/+/g, '/')
  return `${parentPath}/${path}`.replace(/\/+/g, '/')
}
