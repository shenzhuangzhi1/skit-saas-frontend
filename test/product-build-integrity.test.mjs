import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'vite'

import {
  assertProductBuildMetrics,
  assertProductBuildStampFresh,
  calculateProductBuildFingerprint,
  loadProductBoundaryContract
} from '../build/productBoundary.mjs'
import { createProductBoundaryPlugin } from '../build/productBoundaryPlugin.mjs'

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

const write = (root, relativePath, content) => {
  const path = join(root, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

const createFingerprintFixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'skit-product-fingerprint-'))
  write(root, 'src/entry.ts', 'export const entry = true\n')
  write(root, 'public/logo.txt', 'logo-v1\n')
  write(root, 'build/vite/index.ts', 'export const plugin = true\n')
  write(root, '.env', 'VITE_APP_TITLE=base\n')
  write(root, '.env.prod', 'VITE_API_URL=/admin-api\n')
  write(root, 'index.html', '<div id="app"></div>\n')
  write(root, 'vite.config.ts', 'export default {}\n')
  write(root, 'uno.config.ts', 'export default {}\n')
  write(root, 'postcss.config.js', 'export default {}\n')
  write(root, 'tsconfig.json', '{}\n')
  write(root, 'package.json', '{}\n')
  write(root, 'pnpm-lock.yaml', 'lockfileVersion: 9\n')
  return root
}

test('content build stamp accepts unchanged production inputs', () => {
  const root = createFingerprintFixture()
  try {
    const { schemaVersion } = loadProductBoundaryContract()
    const inputFingerprint = calculateProductBuildFingerprint(root, 'prod').fingerprint
    assert.doesNotThrow(() =>
      assertProductBuildStampFresh({ schemaVersion, mode: 'prod', inputFingerprint }, root)
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('Task 4 build telemetry is required and uses inclusive ceilings', () => {
  const { buildBudget } = loadProductBoundaryContract()
  assert.deepEqual(buildBudget, {
    transformedModules: 3500,
    peakBuildRssBytes: 2684354560
  })

  assert.doesNotThrow(() =>
    assertProductBuildMetrics(
      {
        transformedModules: buildBudget.transformedModules,
        peakBuildRssBytes: buildBudget.peakBuildRssBytes
      },
      buildBudget
    )
  )
  assert.throws(
    () =>
      assertProductBuildMetrics(
        {
          transformedModules: buildBudget.transformedModules + 1,
          peakBuildRssBytes: buildBudget.peakBuildRssBytes
        },
        buildBudget
      ),
    /transformedModules/
  )
  assert.throws(
    () =>
      assertProductBuildMetrics(
        {
          transformedModules: buildBudget.transformedModules,
          peakBuildRssBytes: buildBudget.peakBuildRssBytes + 1
        },
        buildBudget
      ),
    /peakBuildRssBytes/
  )
  assert.throws(
    () => assertProductBuildMetrics({ transformedModules: 1 }, buildBudget),
    /peakBuildRssBytes/
  )
})

test('content build stamp rejects changes to every production input family', async (t) => {
  const changes = [
    ['src source', 'src/entry.ts'],
    ['public asset', 'public/logo.txt'],
    ['base env', '.env'],
    ['mode env', '.env.prod'],
    ['local env overlay', '.env.local'],
    ['mode local env overlay', '.env.prod.local'],
    ['build plugin', 'build/vite/index.ts'],
    ['Vite config', 'vite.config.ts']
  ]

  for (const [label, relativePath] of changes) {
    await t.test(label, () => {
      const root = createFingerprintFixture()
      try {
        const { schemaVersion } = loadProductBoundaryContract()
        const inputFingerprint = calculateProductBuildFingerprint(root, 'prod').fingerprint
        write(root, relativePath, `changed ${label}\n`)
        assert.throws(
          () =>
            assertProductBuildStampFresh({ schemaVersion, mode: 'prod', inputFingerprint }, root),
          /stale/i
        )
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    })
  }
})

test('actual Vite module graph rejects an injected banned static import', async () => {
  const fixtureRoot = realpathSync(mkdtempSync(join(tmpdir(), 'skit-product-boundary-')))
  write(fixtureRoot, 'src/views/bpm/fixture.ts', 'export const bannedFixture = true\n')
  write(fixtureRoot, 'entry.ts', "import './src/views/bpm/fixture.ts'\nexport const entry = true\n")

  try {
    await assert.rejects(
      build({
        root: fixtureRoot,
        configFile: false,
        logLevel: 'silent',
        plugins: [createProductBoundaryPlugin({ root: fixtureRoot, mode: 'prod' })],
        build: {
          write: false,
          rollupOptions: { input: join(fixtureRoot, 'entry.ts') }
        }
      }),
      /banned production modules[\s\S]*src\/views\/bpm\//
    )
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})
