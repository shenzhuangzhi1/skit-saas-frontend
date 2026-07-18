import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import test from 'node:test'

const projectRoot = process.cwd()
const managedRoots = [
  'src/layout',
  'src/views/Login',
  'src/views/skit/admin',
  'src/components/Verifition'
]
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

test('captcha handle and sidebar selection have theme-specific contrast tokens', () => {
  const variables = readFileSync(join(projectRoot, 'src/styles/var.css'), 'utf8')
  const captcha = readFileSync(
    join(projectRoot, 'src/components/Verifition/src/Verify.vue'),
    'utf8'
  )
  const menu = readFileSync(join(projectRoot, 'src/layout/components/Menu/src/Menu.vue'), 'utf8')

  assert.match(variables, /--captcha-handle-border:/)
  assert.match(variables, /--captcha-handle-ring:/)
  assert.match(variables, /--left-menu-active-bg:/)
  assert.match(variables, /--left-menu-active-text:/)
  assert.match(captcha, /\.verify-move-block \.icon-right::before/)
  assert.match(captcha, /background-image:\s*none/)
  const sliderTrackRules = captcha.match(/\.verify-bar-area\s*\{[^}]*\}/g) || []
  assert.ok(
    sliderTrackRules.some((rule) => /overflow:\s*visible/.test(rule)),
    'the slider track must allow the puzzle piece to extend into the image panel'
  )
  assert.ok(
    sliderTrackRules.every((rule) => !/overflow:\s*hidden/.test(rule)),
    'overflow hidden clips the moving puzzle piece above the slider track'
  )
  assert.match(captcha, /\.verify-sub-block\s*\{[^}]*pointer-events:\s*none/s)
  assert.match(menu, /background:\s*var\(--left-menu-active-bg\)/)
  assert.match(menu, /color:\s*var\(--left-menu-active-text\)/)
})
