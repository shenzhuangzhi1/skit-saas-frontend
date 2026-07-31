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
  const main = read('src/main.ts')
  const routerHelper = read('src/utils/routerHelper.ts')
  const permission = read('src/store/modules/permission.ts')
  const guard = read('src/permission.ts')
  const tagsView = read('src/layout/components/TagsView/src/TagsView.vue')

  assert.doesNotMatch(main, /views\/bpm|setupWangEditorPlugin|ProcessRecordMenu/)
  assert.doesNotMatch(routerHelper, /import\.meta\.glob\(\s*\[?\s*['"]\.\.\/views\/\*\*\/\*/)
  assert.doesNotMatch(routerHelper, /\bregisterComponent\b/)
  assert.doesNotMatch(routerHelper, /\bgenerateRoute\b/)
  assert.doesNotMatch(permission, /\baddRouters\b|\bgetAddRouters\b|\bROLE_ROUTERS\b/)
  assert.doesNotMatch(guard, /router\.addRoute|\bgetAddRouters\b/)
  assert.doesNotMatch(tagsView, /\bgetAddRouters\b/)
})

test('production build inventory verifier owns retained and banned view contracts', () => {
  const verifier = read('scripts/verify-product-build.mjs')
  const viteConfig = read('vite.config.ts')

  assert.match(verifier, /product-build\.json/)
  assert.match(verifier, /moduleIds/)
  assert.match(verifier, /assertProductBuildStampFresh/)
  assert.match(viteConfig, /createProductBoundaryPlugin/)
})
