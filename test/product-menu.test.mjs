import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  PRODUCT_AD_MONITOR_ROUTE_NAME,
  selectProductTopLevelRoutes
} from '../src/router/productMenu.ts'

test('product navigation keeps only Home, Skit SaaS, and hidden utility routes', () => {
  const routes = [
    { name: 'RedirectRoot', meta: { hidden: true } },
    { name: 'Home', meta: {} },
    { name: 'SkitSaas', meta: {} },
    { name: 'System', meta: {} },
    { name: 'Member', meta: {} }
  ]

  assert.deepEqual(
    selectProductTopLevelRoutes(routes).map((route) => route.name),
    ['RedirectRoot', 'Home', 'SkitSaas']
  )
})

test('Skit SaaS user management exposes agent and app user left submenus', () => {
  const source = readFileSync(
    new URL('../src/router/modules/remaining.ts', import.meta.url),
    'utf8'
  )
  assert.equal(source.match(/name:\s*'SkitUserCenter'/g)?.length, 1)

  const userRouteStart = source.indexOf("path: 'user-center'")
  const nextRouteStart = source.indexOf("path: 'announcement'", userRouteStart)

  assert.notEqual(userRouteStart, -1)
  assert.notEqual(nextRouteStart, -1)
  const userRoute = source.slice(userRouteStart, nextRouteStart)
  assert.match(userRoute, /redirect:\s*'\/skit\/user-center\/agents'/)
  assert.match(userRoute, /path:\s*'agents'[\s\S]*name:\s*'SkitAgentManagement'/)
  assert.match(userRoute, /path:\s*'users'[\s\S]*name:\s*'SkitAppUserManagement'/)
  assert.match(userRoute, /import\('@\/views\/skit\/tenant\/index\.vue'\)/)
  assert.match(userRoute, /import\('@\/views\/skit\/user\/index\.vue'\)/)
  assert.match(userRoute, /roles:\s*\['super_admin',\s*'tenant_admin'\]/)
})

test('local push verification runs the same Node product tests as CI', () => {
  const source = readFileSync(
    new URL('../scripts/verify-local.sh', import.meta.url),
    'utf8'
  )

  assert.match(source, /node --test test\/\*\.test\.mjs/)
})

test('Skit general management exposes API error logs only to super administrators', () => {
  const source = readFileSync(
    new URL('../src/router/modules/remaining.ts', import.meta.url),
    'utf8'
  )
  const routeStart = source.indexOf("path: 'api-error-log'")
  const generalEnd = source.indexOf("path: 'drama'", routeStart)

  assert.notEqual(routeStart, -1)
  assert.notEqual(generalEnd, -1)

  const route = source.slice(routeStart, generalEnd)
  assert.match(
    route,
    /component:\s*\(\)\s*=>\s*import\('@\/views\/infra\/apiErrorLog\/index\.vue'\)/
  )
  assert.match(route, /roles:\s*\['super_admin'\]/)
  assert.doesNotMatch(route, /tenant_admin/)
})

test('permission store never registers backend framework menus', () => {
  const source = readFileSync(
    new URL('../src/store/modules/permission.ts', import.meta.url),
    'utf8'
  )

  assert.match(source, /selectProductTopLevelRoutes\(roleFilteredRoutes\)/)
  assert.doesNotMatch(source, /\bgenerateRoute\b/)
  assert.doesNotMatch(source, /ROLE_ROUTERS/)
})

test('dashboard has no duplicate agent tenant entry', () => {
  const source = readFileSync(
    new URL('../src/views/skit/admin/pageConfig.ts', import.meta.url),
    'utf8'
  )

  assert.doesNotMatch(source, /代理商租户管理/)
  assert.doesNotMatch(source, /promotionAgent/)
  assert.doesNotMatch(source, /SkitPromotionAgent/)
})

test('advertising monitor keeps the stable route name used by dashboard links', () => {
  assert.equal(PRODUCT_AD_MONITOR_ROUTE_NAME, 'SkitAdRecord')
})

test('product routes do not retain duplicate dashboard or legacy Douyin management', () => {
  const source = readFileSync(
    new URL('../src/router/modules/remaining.ts', import.meta.url),
    'utf8'
  )

  assert.doesNotMatch(source, /SkitDashboard/)
  assert.doesNotMatch(source, /SkitDouyin/)
  assert.doesNotMatch(source, /douyin-(?:mini-program|login-record|ad-record|traffic-record)/)
})

test('home uses verified analytics and contains no seeded financial fallback', () => {
  const source = readFileSync(new URL('../src/views/Home/Index.vue', import.meta.url), 'utf8')

  assert.match(source, /getAdAnalyticsOverview/)
  assert.doesNotMatch(source, /getSkitDashboardSummary/)
  assert.doesNotMatch(source, /defaultSummary/)
  assert.doesNotMatch(source, /totalProfit|profitRate|rankRows|v1\.0\.62/)
})

test('legacy sample configuration no longer exposes a second commission editor', () => {
  const source = readFileSync(
    new URL('../src/views/skit/admin/pageConfig.ts', import.meta.url),
    'utf8'
  )

  assert.doesNotMatch(source, /self_commission_rate|agent_commission_rate/)
  assert.doesNotMatch(source, /title:\s*'抖音管理'/)
})

test('legacy generic dashboard and system configuration sources are removed', () => {
  const routes = readFileSync(
    new URL('../src/router/modules/remaining.ts', import.meta.url),
    'utf8'
  )
  const api = readFileSync(new URL('../src/api/skit/adminRecord/index.ts', import.meta.url), 'utf8')

  assert.doesNotMatch(routes, /SkitSystemConfig/)
  assert.doesNotMatch(api, /dashboard-summary|SkitDashboardSummaryRespVO|getSkitDashboardSummary/)
})

test('drama cleanup is selectable and carries the audited tenant mutation scope', () => {
  const config = readFileSync(
    new URL('../src/views/skit/admin/pageConfig.ts', import.meta.url),
    'utf8'
  )
  const table = readFileSync(
    new URL('../src/views/skit/admin/AdminTable.vue', import.meta.url),
    'utf8'
  )
  const api = readFileSync(new URL('../src/api/skit/adminRecord/index.ts', import.meta.url), 'utf8')

  assert.match(config, /\['state', '选择', 48\]/)
  assert.match(config, /'导入 SDK 剧单'.*'删除'.*'上架'/)
  assert.match(table, /dramaMutationScope\('删除目标租户短剧目录记录'\)/)
  assert.match(api, /params: \{ id, \.\.\.scope \}/)
  assert.match(api, /params: \{ ids: ids\.join\(','\), \.\.\.scope \}/)
})
