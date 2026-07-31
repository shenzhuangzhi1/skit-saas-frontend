import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (relativePath) => readFileSync(resolve(repositoryRoot, relativePath), 'utf8')
const inventory = JSON.parse(read('config/product-source-inventory.json'))

const forbiddenRoots = Object.values(inventory.forbidden).flat()
const retainedRoots = Object.values(inventory.retained).flat()
const inventoryRoots = [...forbiddenRoots, ...retainedRoots]

const trackedFiles = execFileSync('git', ['ls-files', '--', ...inventoryRoots], {
  cwd: repositoryRoot,
  encoding: 'utf8'
})
  .trim()
  .split('\n')
  .filter(Boolean)

const trackedFilesUnder = (root) =>
  trackedFiles.filter((path) => path === root || path.startsWith(`${root}/`))

test('quarantined view and API roots have no tracked source', () => {
  assert.equal(inventory.forbidden.viewRoots.length, 14)
  assert.equal(inventory.forbidden.apiRoots.length, 12)

  const violations = forbiddenRoots
    .map((root) => ({ root, trackedFiles: trackedFilesUnder(root) }))
    .filter(({ trackedFiles: files }) => files.length > 0)

  assert.equal(
    violations.length,
    0,
    `quarantined roots still contain tracked source:\n${violations
      .map(({ root, trackedFiles: files }) => `- ${root}: ${files.length} file(s)`)
      .join('\n')}`
  )
})

test('every retained product source exception still exists', () => {
  const missingRoots = retainedRoots.filter((root) => trackedFilesUnder(root).length === 0)

  assert.deepEqual(missingRoots, [])
})

test('the static product route source still declares exactly 32 records', () => {
  const { source, recordCount } = inventory.productRouteContract
  const routeSource = read(source)
  const declaredRouteNames = routeSource.match(
    /^\s*name:\s*(?:'[^']*'|PRODUCT_[A-Z0-9_]+),?\s*$/gm
  )

  assert.equal(declaredRouteNames?.length ?? 0, recordCount)
})
