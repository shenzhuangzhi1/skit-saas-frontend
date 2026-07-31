import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PRODUCT_BUILD_STAMP_PATH = '.vite/product-build.json'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const contractPath = join(moduleDirectory, 'product-boundary.json')

export const loadProductBoundaryContract = () => JSON.parse(readFileSync(contractPath, 'utf8'))

const listFiles = (directory) => {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

export const collectProductBuildInputFiles = (root, mode = 'prod') => {
  const inputDirectories = ['src', 'public', 'build']
  const optionalInputs = [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`,
    'index.html',
    'package.json',
    'pnpm-lock.yaml',
    'postcss.config.js',
    'tsconfig.json',
    'uno.config.ts',
    'vite.config.ts'
  ]

  return [
    ...inputDirectories.flatMap((directory) => listFiles(resolve(root, directory))),
    ...optionalInputs.map((path) => resolve(root, path)).filter(existsSync)
  ].sort((left, right) => left.localeCompare(right))
}

export const calculateProductBuildFingerprint = (root, mode = 'prod') => {
  const hash = createHash('sha256')
  const inputFiles = collectProductBuildInputFiles(root, mode)

  for (const path of inputFiles) {
    const relativePath = relative(root, path).replaceAll('\\', '/')
    hash.update(relativePath)
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }

  return {
    fingerprint: hash.digest('hex'),
    inputFiles: inputFiles.map((path) => relative(root, path).replaceAll('\\', '/'))
  }
}

export const assertProductBuildStampFresh = (stamp, root, mode = 'prod') => {
  const contract = loadProductBoundaryContract()
  if (stamp?.schemaVersion !== contract.schemaVersion || stamp?.mode !== mode) {
    throw new Error('production build stamp is stale: schema or mode mismatch')
  }

  const current = calculateProductBuildFingerprint(root, mode)
  if (stamp.inputFingerprint !== current.fingerprint) {
    throw new Error('production build stamp is stale: production inputs changed')
  }

  return current
}

export const assertProductBuildMetrics = (buildMetrics, buildBudget) => {
  for (const [metric, ceiling] of Object.entries(buildBudget)) {
    const value = buildMetrics?.[metric]
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`production build stamp is missing ${metric}`)
    }
    if (value > ceiling) {
      throw new Error(
        `${metric} must remain at or below product-build ceiling ${ceiling}; received ${value}`
      )
    }
  }
}

export const normalizeProjectModuleId = (rawId, root) => {
  const withoutQuery = String(rawId).replace(/^\0/, '').split('?')[0]
  const path = withoutQuery.startsWith('/@fs/') ? withoutQuery.slice('/@fs'.length) : withoutQuery
  if (!isAbsolute(path)) return null

  const relativePath = relative(root, path).replaceAll('\\', '/')
  if (
    !relativePath ||
    relativePath.startsWith('../') ||
    relativePath.startsWith('node_modules/') ||
    isAbsolute(relativePath)
  ) {
    return null
  }
  return relativePath
}
