import {
  PRODUCT_BUILD_STAMP_PATH,
  calculateProductBuildFingerprint,
  loadProductBoundaryContract,
  normalizeProjectModuleId
} from './productBoundary.mjs'

export const createProductBoundaryPlugin = ({ root, mode = 'prod' }) => ({
  name: 'skit-product-boundary',
  apply: 'build',
  enforce: 'post',
  generateBundle() {
    const contract = loadProductBoundaryContract()
    const moduleIds = [
      ...new Set(
        [...this.getModuleIds()]
          .map((id) => normalizeProjectModuleId(id, root))
          .filter(Boolean)
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
          moduleIds,
          bannedModuleIds
        },
        null,
        2
      )
    })
  }
})
