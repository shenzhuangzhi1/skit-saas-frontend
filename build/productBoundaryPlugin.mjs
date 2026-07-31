import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import {
  PRODUCT_BUILD_STAMP_PATH,
  calculateProductBuildFingerprint,
  loadProductBoundaryContract,
  normalizeProjectModuleId
} from './productBoundary.mjs'

export const createProductBoundaryPlugin = ({ root, mode = 'prod' }) => {
  const transformedModuleIds = new Set()
  let writtenOutputDirectory

  return {
    name: 'skit-product-boundary',
    apply: 'build',
    enforce: 'post',
    buildStart() {
      transformedModuleIds.clear()
      writtenOutputDirectory = undefined
    },
    transform(_code, id) {
      transformedModuleIds.add(id)
      return null
    },
    generateBundle() {
      const contract = loadProductBoundaryContract()
      const moduleIds = [
        ...new Set(
          [...this.getModuleIds()].map((id) => normalizeProjectModuleId(id, root)).filter(Boolean)
        )
      ].sort()
      const bannedModuleIds = moduleIds.filter((id) =>
        contract.bannedViewPrefixes.some((prefix) => id.startsWith(prefix))
      )

      if (bannedModuleIds.length > 0) {
        this.error(`banned production modules detected:\n${bannedModuleIds.join('\n')}`)
      }

      const buildInputs = calculateProductBuildFingerprint(root, mode)
      this.emitFile({
        type: 'asset',
        fileName: PRODUCT_BUILD_STAMP_PATH,
        source: JSON.stringify(
          {
            schemaVersion: contract.schemaVersion,
            mode,
            inputFingerprint: buildInputs.fingerprint,
            inputFileCount: buildInputs.inputFiles.length,
            buildMetrics: {
              transformedModules: transformedModuleIds.size,
              peakBuildRssBytes: process.resourceUsage().maxRSS * 1024
            },
            moduleIds,
            bannedModuleIds
          },
          null,
          2
        )
      })
    },
    writeBundle(outputOptions) {
      writtenOutputDirectory = outputOptions.dir
        ? resolve(root, outputOptions.dir)
        : outputOptions.file
          ? dirname(resolve(root, outputOptions.file))
          : undefined
    },
    closeBundle() {
      if (!writtenOutputDirectory) return
      const stampPath = resolve(writtenOutputDirectory, PRODUCT_BUILD_STAMP_PATH)
      const stamp = JSON.parse(readFileSync(stampPath, 'utf8'))
      stamp.buildMetrics.peakBuildRssBytes = process.resourceUsage().maxRSS * 1024
      writeFileSync(stampPath, `${JSON.stringify(stamp, null, 2)}\n`)
    }
  }
}
