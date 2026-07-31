import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import {
  PRODUCT_BUILD_STAMP_PATH,
  assertProductBuildStampFresh,
  loadProductBoundaryContract
} from '../build/productBoundary.mjs'
import { assertProductIconCoverage } from './productIconCoverage.mjs'

const outputDirectory = resolve(process.argv[2] || 'dist')
const manifestPath = join(outputDirectory, '.vite', 'manifest.json')
const buildStampPath = join(outputDirectory, PRODUCT_BUILD_STAMP_PATH)

const listFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })

assert.ok(existsSync(manifestPath), `production manifest not found: ${manifestPath}`)
assert.ok(existsSync(buildStampPath), `product build stamp not found: ${buildStampPath}`)

const contract = loadProductBoundaryContract()
const buildStamp = JSON.parse(readFileSync(buildStampPath, 'utf8'))
assertProductBuildStampFresh(buildStamp, process.cwd(), 'prod')

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const manifestEntries = Object.keys(manifest)
const moduleIds = buildStamp.moduleIds || []
const iconCoverage = assertProductIconCoverage({
  root: process.cwd(),
  moduleIds
})

for (const retainedView of contract.retainedViewEntries) {
  assert.ok(
    manifestEntries.includes(retainedView),
    `retained product view is absent from manifest: ${retainedView}`
  )
  assert.ok(
    moduleIds.includes(retainedView),
    `retained product view is absent from transformed module graph: ${retainedView}`
  )
}

const bannedViewModules = moduleIds.filter((id) =>
  contract.bannedViewPrefixes.some((prefix) => id.startsWith(prefix))
)
assert.deepEqual(
  bannedViewModules,
  [],
  `quarantined feature modules leaked into production graph:\n${bannedViewModules.join('\n')}`
)
assert.deepEqual(buildStamp.bannedModuleIds, [])

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
  moduleIds: moduleIds.length,
  retainedViewModules: contract.retainedViewEntries.length,
  bannedViewModules,
  productIcons: iconCoverage.iconNames.length,
  productIconPrefixes: iconCoverage.prefixes.length,
  dynamicIconBindings: iconCoverage.dynamicBindings.length,
  localSvgIcons: iconCoverage.localSvgNames.length
}

for (const [metric, ceiling] of Object.entries(contract.budget)) {
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
      budget: contract.budget
    },
    null,
    2
  )
)
