import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import test from 'node:test'

const projectRoot = process.cwd()
const managedRoots = ['src/layout', 'src/views/Login', 'src/components/Verifition']
const managedExtensions = new Set(['.vue', '.tsx', '.scss', '.css'])
const forbiddenPatterns = [
  { label: 'hex color', pattern: /#[0-9a-f]{3,8}\b/i },
  { label: 'rgb color', pattern: /rgba?\(/i },
  { label: 'local dark color override', pattern: /dark:(?:bg|text|border)-/ },
  { label: 'literal black/white utility', pattern: /\b(?:bg|text|border)-(?:black|white)\b/ }
]

const listFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })

const isAccentPaletteEntry = (file, line) =>
  file.endsWith('src/layout/components/Setting/src/Setting.vue') &&
  /^\s*'#[0-9a-f]{3,8}',?\s*$/i.test(line)

test('theme-managed surfaces use semantic color variables', () => {
  const violations = managedRoots
    .flatMap((root) => listFiles(join(projectRoot, root)))
    .filter((file) => managedExtensions.has(extname(file)))
    .flatMap((file) => {
      const displayPath = relative(projectRoot, file).replaceAll('\\', '/')
      return readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .flatMap((line, index) => {
          if (isAccentPaletteEntry(displayPath, line)) return []

          const inspectableLine = line.replaceAll('#default', '')
          return forbiddenPatterns
            .filter(({ pattern }) => pattern.test(inspectableLine))
            .map(({ label }) => `${displayPath}:${index + 1} (${label}) ${line.trim()}`)
        })
    })

  assert.deepEqual(
    violations,
    [],
    `Theme-managed components must consume variables from src/styles/var.css:\n${violations.join('\n')}`
  )
})
