import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const RETAINED_VIEW_ENTRIES = [
  'views/Redirect/Redirect.vue',
  'views/Home/Index.vue',
  'views/skit/admin/AdminTable.vue',
  'views/infra/apiErrorLog/index.vue',
  'views/skit/ad-consumption/index.vue',
  'views/skit/ad-monitor/index.vue',
  'views/skit/tenant/index.vue',
  'views/skit/user/index.vue',
  'views/Profile/Index.vue',
  'views/system/notify/my/index.vue',
  'views/Login/Login.vue',
  'views/Error/403.vue',
  'views/Error/404.vue',
  'views/Error/500.vue'
]

const BANNED_VIEW_PREFIXES = [
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
  'views/im/',
  'views/erp/',
  'views/mp/',
  'views/report/',
  'views/wms/'
]

// Audited Task 3 output with modest headroom for normal product evolution.
// Task 4 may tighten these again after removing quarantined dependencies.
const BUILD_BUDGET = {
  outputFiles: 80,
  jsFiles: 48,
  cssFiles: 20,
  rawBytes: 9_300_000,
  rawJsBytes: 5_600_000,
  gzipJsBytes: 1_800_000
}

const outputDirectory = resolve(process.argv[2] || 'dist')
const manifestPath = join(outputDirectory, '.vite', 'manifest.json')

const listFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })

assert.ok(existsSync(manifestPath), `production manifest not found: ${manifestPath}`)

const buildInputs = [
  ...listFiles(resolve('src')),
  ...listFiles(resolve('build')),
  resolve('.env.prod'),
  resolve('index.html'),
  resolve('postcss.config.js'),
  resolve('uno.config.ts'),
  resolve('vite.config.ts'),
  resolve('package.json'),
  resolve('pnpm-lock.yaml')
]
const newestInputMtime = Math.max(...buildInputs.map((path) => statSync(path).mtimeMs))
assert.ok(
  statSync(manifestPath).mtimeMs >= newestInputMtime,
  'production manifest is stale; run a fresh production build before verification'
)

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const manifestEntries = Object.keys(manifest).map((entry) => entry.replace(/^src\//, ''))

for (const retainedView of RETAINED_VIEW_ENTRIES) {
  assert.ok(
    manifestEntries.includes(retainedView),
    `retained product view is absent from manifest: ${retainedView}`
  )
}

for (const bannedPrefix of BANNED_VIEW_PREFIXES) {
  assert.equal(
    manifestEntries.some((entry) => entry.startsWith(bannedPrefix)),
    false,
    `quarantined feature view leaked into manifest: ${bannedPrefix}`
  )
}

const files = listFiles(outputDirectory)
const jsFiles = files.filter((file) => extname(file) === '.js')
const cssFiles = files.filter((file) => extname(file) === '.css')
const sumFileBytes = (paths) => paths.reduce((sum, file) => sum + statSync(file).size, 0)

const metrics = {
  outputDirectory,
  outputFiles: files.length,
  jsFiles: jsFiles.length,
  cssFiles: cssFiles.length,
  rawBytes: sumFileBytes(files),
  rawJsBytes: sumFileBytes(jsFiles),
  gzipJsBytes: jsFiles.reduce(
    (sum, file) => sum + gzipSync(readFileSync(file), { level: 9 }).byteLength,
    0
  ),
  manifestEntries: manifestEntries.length,
  retainedViewEntries: RETAINED_VIEW_ENTRIES.length,
  bannedViewEntries: manifestEntries.filter((entry) =>
    BANNED_VIEW_PREFIXES.some((prefix) => entry.startsWith(prefix))
  )
}

for (const [metric, ceiling] of Object.entries(BUILD_BUDGET)) {
  assert.ok(
    metrics[metric] < ceiling,
    `${metric} must remain below product-build ceiling ${ceiling}; received ${metrics[metric]}`
  )
}

console.log(
  JSON.stringify(
    {
      ...metrics,
      outputDirectory: relative(process.cwd(), metrics.outputDirectory) || '.',
      budget: BUILD_BUDGET
    },
    null,
    2
  )
)
