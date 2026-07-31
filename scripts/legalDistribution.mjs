import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

export const LEGAL_RELEASE_FILES = [
  'SHA256SUMS',
  'THIRD_PARTY_NOTICES.txt',
  'licenses/APACHE-2.0.txt',
  'licenses/CC-BY-4.0.txt',
  'licenses/MIT.txt',
  'licenses/OFL-1.1.txt'
]

const CHECKSUM_PAYLOAD_FILES = LEGAL_RELEASE_FILES.filter((path) => path !== 'SHA256SUMS')

const normalizePath = (path) => path.replaceAll('\\', '/')

const listRelativeFiles = (directory) => {
  const visit = (current) =>
    readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
      const path = join(current, entry.name)
      return entry.isDirectory() ? visit(path) : [normalizePath(relative(directory, path))]
    })
  return visit(directory).sort()
}

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

export const parseLegalChecksums = (text) => {
  const entries = new Map()
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    if (!rawLine) continue
    const match = rawLine.match(/^([a-f0-9]{64}) {2}(.+)$/)
    if (!match) throw new Error(`invalid legal checksum line ${index + 1}`)
    const [, checksum, rawPath] = match
    const path = normalizePath(rawPath)
    if (isAbsolute(path) || path === '..' || path.startsWith('../') || path.includes('/../')) {
      throw new Error(`unsafe legal checksum path: ${path}`)
    }
    if (entries.has(path)) throw new Error(`duplicate legal checksum path: ${path}`)
    entries.set(path, checksum)
  }
  assert.deepEqual([...entries.keys()].sort(), CHECKSUM_PAYLOAD_FILES)
  return entries
}

export const assertLegalDistribution = ({
  root = process.cwd(),
  sourceDirectory = resolve(root, 'public/legal'),
  outputDirectory
} = {}) => {
  assert.ok(existsSync(sourceDirectory), `legal source directory is absent: ${sourceDirectory}`)
  assert.deepEqual(listRelativeFiles(sourceDirectory), LEGAL_RELEASE_FILES)

  const repositoryNotice = resolve(root, 'THIRD_PARTY_NOTICES.md')
  assert.deepEqual(
    readFileSync(repositoryNotice),
    readFileSync(join(sourceDirectory, 'THIRD_PARTY_NOTICES.txt')),
    'repository and release third-party notices must be byte-identical'
  )

  const checksums = parseLegalChecksums(readFileSync(join(sourceDirectory, 'SHA256SUMS'), 'utf8'))
  for (const [path, expected] of checksums) {
    assert.equal(sha256(join(sourceDirectory, path)), expected, `legal checksum mismatch: ${path}`)
  }

  if (outputDirectory) {
    const outputLegalDirectory = resolve(outputDirectory, 'legal')
    assert.ok(
      existsSync(outputLegalDirectory),
      `release legal directory is absent: ${outputLegalDirectory}`
    )
    assert.deepEqual(listRelativeFiles(outputLegalDirectory), LEGAL_RELEASE_FILES)
    for (const path of LEGAL_RELEASE_FILES) {
      assert.deepEqual(
        readFileSync(join(outputLegalDirectory, path)),
        readFileSync(join(sourceDirectory, path)),
        `release legal file differs from source: ${path}`
      )
    }
  }

  return {
    files: LEGAL_RELEASE_FILES.length,
    checksums: checksums.size,
    bytes: LEGAL_RELEASE_FILES.reduce(
      (total, path) => total + readFileSync(join(sourceDirectory, path)).byteLength,
      0
    )
  }
}
