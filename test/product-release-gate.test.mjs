import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const readJson = (path) => JSON.parse(read(path))

const workflow = read('.github/workflows/cicd.yml')
const verifyLocal = read('scripts/verify-local.sh')
const packageJson = readJson('package.json')
const boundary = readJson('build/product-boundary.json')

const assertOrdered = (source, commands, label) => {
  let previousIndex = -1
  for (const command of commands) {
    const index = source.indexOf(command, previousIndex + 1)
    assert.ok(index > previousIndex, `${label} must run ${command} in release order`)
    previousIndex = index
  }
}

test('CI and the local release gate build, verify, then run blocked-network icon smoke', () => {
  const releaseSequence = [
    'pnpm build:prod',
    'pnpm verify:product-build',
    'pnpm test:icons:browser'
  ]

  assertOrdered(workflow, releaseSequence, 'CI')
  assertOrdered(verifyLocal, releaseSequence, 'verify-local.sh')
  assert.equal(
    packageJson.scripts['test:icons:browser'],
    'playwright test test/e2e/product-icons.spec.ts --project=chromium'
  )
  assert.ok(existsSync(resolve(root, 'playwright.config.ts')))
  assert.ok(existsSync(resolve(root, 'test/e2e/product-icons.spec.ts')))
  assert.match(workflow, /pnpm exec playwright install --with-deps chromium/)
  assert.match(verifyLocal, /pnpm exec playwright install chromium/)
})

test('all agreed Task 4 build ceilings are executable product budgets', () => {
  assert.equal(boundary.buildBudget.transformedModules, 3500)
  assert.equal(boundary.buildBudget.peakBuildRssBytes, 2.5 * 1024 * 1024 * 1024)
  assert.ok(boundary.budget.gzipJsBytes <= 3.5 * 1024 * 1024)

  const plugin = read('build/productBoundaryPlugin.mjs')
  const verifier = read('scripts/verify-product-build.mjs')
  for (const metric of ['transformedModules', 'peakBuildRssBytes']) {
    assert.ok(plugin.includes(metric), `build stamp must persist ${metric}`)
    assert.ok(verifier.includes(metric), `product verifier must enforce ${metric}`)
  }
  assert.match(plugin, /resourceUsage\(\)\.maxRSS/)
})

test('third-party icon notices and full license texts ship in dist-prod and Docker', () => {
  const requiredReleaseFiles = [
    'public/legal/SHA256SUMS',
    'public/legal/THIRD_PARTY_NOTICES.txt',
    'public/legal/licenses/APACHE-2.0.txt',
    'public/legal/licenses/CC-BY-4.0.txt',
    'public/legal/licenses/MIT.txt',
    'public/legal/licenses/OFL-1.1.txt'
  ]

  for (const path of requiredReleaseFiles) {
    assert.ok(existsSync(resolve(root, path)), `release legal file is missing: ${path}`)
  }

  const notices = read('public/legal/THIRD_PARTY_NOTICES.txt')
  for (const notice of [
    'Ant UED',
    'Element Plus',
    'Fontisto',
    'Ionic',
    'WorkOS',
    'IBM',
    'Bytedance',
    'Pictogrammers',
    'Vaadin',
    'EmojiTwo',
    'Material Design Iconic Font'
  ]) {
    assert.ok(notices.includes(notice), `release notice must identify ${notice}`)
  }

  const repositoryNotice = read('THIRD_PARTY_NOTICES.md')
  assert.ok(repositoryNotice.includes('public/legal/'))
  const legalVerifier = read('scripts/legalDistribution.mjs')
  for (const path of requiredReleaseFiles.map((path) => path.replace(/^public\//, ''))) {
    assert.ok(
      legalVerifier.includes(path.replace(/^legal\//, '')),
      `product verifier must require ${path} in the release output`
    )
  }

  const dockerfile = read('deploy/Dockerfile')
  assert.match(dockerfile, /COPY dist-prod\/ .*\/usr\/share\/nginx\/html\//)
})
