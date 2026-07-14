export interface ProductTopLevelRoute {
  name?: string | symbol | null
  meta?: {
    hidden?: boolean
  }
}

const PRODUCT_TOP_LEVEL_ROUTE_NAMES = new Set(['Home', 'SkitSaas'])

/** Stable name retained so existing dashboard links open the real read-only monitor. */
export const PRODUCT_AD_MONITOR_ROUTE_NAME = 'SkitAdRecord' as const

/**
 * The skit product deliberately exposes only Home and Skit SaaS as top-level navigation.
 * Hidden utility routes remain available for redirects, callbacks, profiles, and error pages.
 */
export const selectProductTopLevelRoutes = <T extends ProductTopLevelRoute>(routes: T[]): T[] =>
  routes.filter(
    (route) =>
      route.meta?.hidden === true || PRODUCT_TOP_LEVEL_ROUTE_NAMES.has(String(route.name || ''))
  )
