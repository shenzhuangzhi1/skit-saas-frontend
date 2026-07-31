import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (relativePath) => readFileSync(resolve(repositoryRoot, relativePath), 'utf8')

const retiredPackages = [
  '@form-create/designer',
  '@form-create/element-ui',
  '@wangeditor-next/editor',
  '@wangeditor-next/editor-for-vue',
  '@wangeditor-next/plugin-mention',
  'vue3-print-nb'
]

const retiredSourceRoots = [
  'src/components/Editor',
  'src/components/FormCreate',
  'src/plugins/formCreate',
  'src/styles/FormCreate',
  'src/utils/formCreate.ts',
  'types/wangeditor-types.d.ts'
]

test('retired form designers, rich-text editors, and print plugin stay removed', () => {
  const packageJson = JSON.parse(read('package.json'))
  const declaredPackages = { ...packageJson.dependencies, ...packageJson.devDependencies }
  const lockfile = read('pnpm-lock.yaml')
  const main = read('src/main.ts')
  const viteConfig = read('vite.config.ts')
  const optimize = read('build/vite/optimize.ts')
  const globalStyles = read('src/styles/index.scss')
  const autoComponents = read('src/types/auto-components.d.ts')
  const trackedRetiredSource = execFileSync('git', ['ls-files', '--', ...retiredSourceRoots], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })
    .trim()
    .split('\n')
    .filter(Boolean)

  assert.deepEqual(
    retiredPackages.filter((dependency) => dependency in declaredPackages),
    [],
    'retired packages remain declared'
  )
  assert.deepEqual(
    retiredPackages.filter((dependency) => lockfile.includes(dependency)),
    [],
    'retired packages remain in pnpm-lock.yaml'
  )
  assert.deepEqual(trackedRetiredSource, [], 'retired editor integration source remains tracked')
  assert.doesNotMatch(main, /setupFormCreate|@\/plugins\/formCreate|vue3-print-nb|app\.use\(print\)/)
  assert.doesNotMatch(viteConfig, /form-create|form-designer|@form-create/)
  assert.doesNotMatch(optimize, /@wangeditor-next/)
  assert.doesNotMatch(globalStyles, /FormCreate/)
  assert.doesNotMatch(autoComponents, /components\/(?:FormCreate|Editor)\//)
})

test('the retained profile form map exposes only its proven schema field types', () => {
  const profile = read('src/views/Profile/components/BasicInfo.vue')
  const componentMap = read('src/components/Form/src/componentMap.ts')
  const retainedSchemaTypes = [
    ...profile.matchAll(/component:\s*['"]([A-Za-z0-9]+)['"]/g)
  ].map((match) => match[1])
  const mappedTypes = [...componentMap.matchAll(/^\s{2}([A-Za-z0-9]+):/gm)].map(
    (match) => match[1]
  )

  assert.deepEqual([...new Set(retainedSchemaTypes)].sort(), ['Input', 'InputNumber'])
  assert.deepEqual(mappedTypes.sort(), ['Input', 'InputNumber'])
  assert.doesNotMatch(componentMap, /components\/(?:Editor|UploadFile)/)
})
