import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Router, menu permissions, and route contracts share productRoutes', () => {
  const router = read('src/router/index.ts')
  const permission = read('src/store/modules/permission.ts')
  const contract = read('test/unit/skit/product-routes.spec.ts')

  assert.match(router, /import productRoutes from ['"]\.\/productRoutes['"]/)
  assert.match(permission, /import productRoutes from ['"]@\/router\/productRoutes['"]/)
  assert.match(contract, /import productRoutes from ['"]@\/router\/productRoutes['"]/)
  assert.doesNotMatch(router, /remainingRouter/)
  assert.doesNotMatch(permission, /remainingRouter/)
})

test('static production routing has no backend component registry or broad views glob', () => {
  const routerHelper = read('src/utils/routerHelper.ts')
  const permission = read('src/store/modules/permission.ts')
  const guard = read('src/permission.ts')

  assert.doesNotMatch(routerHelper, /import\.meta\.glob\(\s*\[?\s*['"]\.\.\/views\/\*\*\/\*/)
  assert.doesNotMatch(routerHelper, /\bregisterComponent\b/)
  assert.doesNotMatch(routerHelper, /\bgenerateRoute\b/)
  assert.doesNotMatch(permission, /\baddRouters\b|\bgetAddRouters\b|\bROLE_ROUTERS\b/)
  assert.doesNotMatch(guard, /router\.addRoute|\bgetAddRouters\b/)
})

test('production build inventory verifier owns retained and banned view contracts', () => {
  const verifier = read('scripts/verify-product-build.mjs')

  for (const retainedView of [
    'views/Home/Index.vue',
    'views/skit/admin/AdminTable.vue',
    'views/infra/apiErrorLog/index.vue',
    'views/skit/ad-consumption/index.vue',
    'views/skit/ad-monitor/index.vue',
    'views/skit/tenant/index.vue',
    'views/skit/user/index.vue',
    'views/Profile/Index.vue',
    'views/system/notify/my/index.vue'
  ]) {
    assert.ok(verifier.includes(retainedView), `missing retained view inventory: ${retainedView}`)
  }

  for (const bannedPrefix of [
    'views/system/dict/',
    'views/infra/codegen/',
    'views/infra/job/',
    'views/bpm/',
    'views/mall/',
    'views/member/',
    'views/pay/',
    'views/crm/',
    'views/ai/',
    'views/iot/',
    'views/mes/',
    'views/im/'
  ]) {
    assert.ok(verifier.includes(bannedPrefix), `missing banned view inventory: ${bannedPrefix}`)
  }
})
