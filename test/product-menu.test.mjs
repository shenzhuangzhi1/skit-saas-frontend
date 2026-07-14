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

test('Skit SaaS user management renders the agent management component', () => {
  const source = readFileSync(
    new URL('../src/router/modules/remaining.ts', import.meta.url),
    'utf8'
  )
  assert.equal(source.match(/name:\s*'SkitUser'/g)?.length, 1)

  const userRouteStart = source.indexOf("path: 'user'")
  const nextRouteStart = source.indexOf("path: 'announcement'", userRouteStart)

  assert.notEqual(userRouteStart, -1)
  assert.notEqual(nextRouteStart, -1)
  const userRoute = source.slice(userRouteStart, nextRouteStart)
  assert.match(userRoute, /component:\s*\(\)\s*=>\s*import\('@\/views\/skit\/tenant\/index\.vue'\)/)
  assert.doesNotMatch(userRoute, /AdminTable/)
  assert.match(userRoute, /roles:\s*\['super_admin',\s*'tenant_admin'\]/)
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
