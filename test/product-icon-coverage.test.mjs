import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { assertProductIconCoverage } from '../scripts/productIconCoverage.mjs'

const write = (root, relativePath, content) => {
  const path = join(root, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

const createFixture = ({
  viewSource,
  icons = ['search', 'view'],
  manifestSource,
  modulePath = 'src/View.vue'
}) => {
  const root = mkdtempSync(join(tmpdir(), 'skit-product-icons-'))
  const manifestPath = 'src/plugins/svgIcon/productIconCollections.ts'
  const iconEntries = icons
    .map((name) => `${JSON.stringify(name)}: { "body": "<path/>" }`)
    .join(', ')

  write(
    root,
    manifestPath,
    manifestSource ||
      (icons.length
        ? `export const productIconCollections = [{ "prefix": "ep", "icons": { ${iconEntries} } }]\n`
        : 'export const productIconCollections = []\n')
  )
  write(root, modulePath, viewSource)

  return {
    root,
    options: {
      root,
      moduleIds: [modulePath],
      manifestPath,
      approvedDynamicBindings: []
    }
  }
}

const addFixtureDomain = (
  fixture,
  {
    exportName = 'FIXTURE_ICON_NAMES',
    source = `export const ${exportName} = Object.freeze(['ep:view'] as const)\n`,
    modulePath = 'src/iconDomains.ts'
  } = {}
) => {
  write(fixture.root, modulePath, source)
  fixture.options.moduleIds.push(modulePath)
  return { domainFile: modulePath, domainExport: exportName }
}

test('accepts fully local literal and audited dynamic product icons', () => {
  const fixture = createFixture({
    viewSource: `<template><Icon icon="ep:search" /><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>
<script setup>
import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/iconDomains'
const actions = [{ icon: 'ep:view' }]
</script>\n`
  })
  const domain = addFixtureDomain(fixture)
  fixture.options.approvedDynamicBindings = [
    {
      file: 'src/View.vue',
      expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
      source: 'fixed fixture actions',
      ...domain
    }
  ]

  try {
    const result = assertProductIconCoverage(fixture.options)
    assert.deepEqual(result.iconNames, ['ep:search', 'ep:view'])
    assert.deepEqual(result.prefixes, ['ep'])
    assert.deepEqual(result.dynamicBindings, [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)'
      }
    ])
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('accepts an exact policy import from a Vue TSX script', () => {
  const fixture = createFixture({
    viewSource: `<script lang="tsx" setup>
import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/iconDomains'
const renderIcon = () => <Icon icon={clampProductIcon(row.icon, FIXTURE_ICON_NAMES)} />
</script>\n`,
    icons: ['view']
  })
  const domain = addFixtureDomain(fixture)
  fixture.options.approvedDynamicBindings = [
    {
      file: 'src/View.vue',
      expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
      source: 'Vue TSX bindings use the exact frozen policy',
      ...domain
    }
  ]

  try {
    const result = assertProductIconCoverage(fixture.options)
    assert.deepEqual(result.dynamicBindings, [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)'
      }
    ])
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a retained literal that is absent from the manifest', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon icon="ep:warning" /></template>\n',
    icons: ['search']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /missing product icons:[\s\S]*ep:warning/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unapproved dynamic icon binding', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon :icon="serverRow.icon" /></template>\n',
    icons: []
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unapproved dynamic icon binding:[\s\S]*serverRow\.icon/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded Vue Icon prop spread', () => {
  const fixture = createFixture({
    viewSource:
      '<template><Icon icon="ep:view" v-bind="serverProps" /></template><script setup>const serverProps = {}</script>\n',
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*v-bind="serverProps"/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded JSX Icon prop spread', () => {
  const fixture = createFixture({
    modulePath: 'src/View.tsx',
    viewSource:
      'const serverProps = {}; export const View = () => <Icon icon="ep:view" {...serverProps} />\n',
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*\{\.\.\.serverProps\}/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded spread on an aliased product Icon import', () => {
  const fixture = createFixture({
    modulePath: 'src/View.tsx',
    viewSource: `import { Icon as ProductIcon } from '@/components/Icon'
const serverProps = {}
export const View = () => <ProductIcon icon="ep:view" {...serverProps} />\n`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*\{\.\.\.serverProps\}/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded spread on a local product Icon alias', () => {
  const fixture = createFixture({
    modulePath: 'src/View.tsx',
    viewSource: `import { Icon } from '@/components/Icon'
const ProductIcon = Icon
const serverProps = {}
export const View = () => <ProductIcon icon="ep:view" {...serverProps} />\n`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*\{\.\.\.serverProps\}/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded JSX spread on a relative default product Icon import', () => {
  const fixture = createFixture({
    modulePath: 'src/View.tsx',
    viewSource: `import ProductIcon from './components/Icon/src/Icon.vue'
const serverProps = {}
export const View = () => <><Icon icon="ep:view" /><ProductIcon {...serverProps} /></>
`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*\{\.\.\.serverProps\}/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded Vue spread on a relative default product Icon import', () => {
  const fixture = createFixture({
    viewSource: `<script setup>
import ProductIcon from './components/Icon/src/Icon.vue'
const serverProps = {}
</script>
<template><Icon icon="ep:view" /><ProductIcon v-bind="serverProps" /></template>
`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*v-bind="serverProps"/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded JSX spread on a namespace product Icon member', () => {
  const fixture = createFixture({
    modulePath: 'src/View.tsx',
    viewSource: `import * as Icons from '@/components/Icon'
const serverProps = {}
export const View = () => <><Icon icon="ep:view" /><Icons.Icon {...serverProps} /></>
`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*\{\.\.\.serverProps\}/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded Vue spread on a namespace product Icon member', () => {
  const fixture = createFixture({
    viewSource: `<script setup>
import * as Icons from '@/components/Icon'
const serverProps = {}
</script>
<template><Icon icon="ep:view" /><Icons.Icon v-bind="serverProps" /></template>
`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop spread:[\s\S]*v-bind="serverProps"/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects unbounded props passed to h for a product Icon', () => {
  const fixture = createFixture({
    modulePath: 'src/View.ts',
    viewSource: `import { h } from 'vue'
import { Icon } from '@/components/Icon'
export const safe = () => h(Icon, { icon: 'ep:view' })
export const render = (serverProps) => h(Icon, serverProps)
`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon render props:[\s\S]*h\(Icon, serverProps\)/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects unbounded props passed through an aliased createVNode renderer', () => {
  const fixture = createFixture({
    modulePath: 'src/View.ts',
    viewSource: `import { createVNode as renderVNode } from 'vue'
import ProductIcon from './components/Icon/src/Icon.vue'
export const safe = () => renderVNode(ProductIcon, { icon: 'ep:view' })
export const render = (serverProps) => renderVNode(ProductIcon, serverProps)
`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon render props:[\s\S]*renderVNode\(ProductIcon, serverProps\)/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('accepts static object calls through a transparent product Icon wrapper', () => {
  const fixture = createFixture({
    modulePath: 'src/View.ts',
    viewSource: `import { useIcon } from '@/hooks/web/useIcon'
export const viewIcon = useIcon({ icon: 'ep:view' })
`,
    icons: ['view']
  })
  write(
    fixture.root,
    'src/hooks/web/useIcon.ts',
    `import { h } from 'vue'
import { Icon } from '@/components/Icon'
export const useIcon = (props) => h(Icon, props)
`
  )
  fixture.options.moduleIds.push('src/hooks/web/useIcon.ts')

  try {
    assert.doesNotThrow(() => assertProductIconCoverage(fixture.options))
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects unbounded calls through a transparent product Icon wrapper', () => {
  const fixture = createFixture({
    modulePath: 'src/View.ts',
    viewSource: `import { useIcon } from '@/hooks/web/useIcon'
const serverProps = getServerProps()
const retainedIcon = 'ep:view'
export const viewIcon = useIcon(serverProps)
`,
    icons: ['view']
  })
  write(
    fixture.root,
    'src/hooks/web/useIcon.ts',
    `import { h } from 'vue'
import { Icon } from '@/components/Icon'
export const useIcon = (props) => h(Icon, props)
`
  )
  fixture.options.moduleIds.push('src/hooks/web/useIcon.ts')

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon render props:[\s\S]*useIcon\(serverProps\)/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects spread calls through a transparent product Icon wrapper', () => {
  const fixture = createFixture({
    modulePath: 'src/View.ts',
    viewSource: `import { useIcon } from '@/hooks/web/useIcon'
const serverProps = getServerProps()
export const viewIcon = useIcon({ icon: 'ep:view', ...serverProps })
`,
    icons: ['view']
  })
  write(
    fixture.root,
    'src/hooks/web/useIcon.ts',
    `import { h } from 'vue'
import { Icon } from '@/components/Icon'
export const useIcon = (props) => h(Icon, props)
`
  )
  fixture.options.moduleIds.push('src/hooks/web/useIcon.ts')

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon render props:[\s\S]*useIcon\(\{ icon: 'ep:view', \.\.\.serverProps \}\)/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded same-module call hidden by a bounded imported wrapper call', () => {
  const fixture = createFixture({
    modulePath: 'src/View.ts',
    viewSource: `import { useIcon } from '@/hooks/web/useIcon'
export const viewIcon = useIcon({ icon: 'ep:view' })
`,
    icons: ['view']
  })
  write(
    fixture.root,
    'src/hooks/web/useIcon.ts',
    `import { h } from 'vue'
import { Icon } from '@/components/Icon'
export const useIcon = (props) => h(Icon, props)
const serverProps = getServerProps()
export const unsafeIcon = useIcon(serverProps)
`
  )
  fixture.options.moduleIds.push('src/hooks/web/useIcon.ts')

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon render props:[\s\S]*useIcon\(serverProps\)/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded Vue dynamic Icon prop name', () => {
  const fixture = createFixture({
    viewSource:
      '<template><Icon v-bind:[serverKey]="serverValue" /></template><script setup>const serverKey = "icon"</script>\n',
    icons: []
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unbounded Icon prop binding:[\s\S]*v-bind:\[serverKey\]="serverValue"/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('treats Vue same-name :icon shorthand as a dynamic icon expression', () => {
  const fixture = createFixture({
    viewSource:
      '<template><Icon :icon /></template><script setup>const icon = serverRow.icon</script>\n',
    icons: []
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unapproved dynamic icon binding:[\s\S]*src\/View\.vue: icon/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('an unrelated static icon cannot approve an unclamped dynamic binding', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon :icon="serverRow.icon" /><Icon icon="ep:view" /></template>\n',
    icons: ['view']
  })
  fixture.options.approvedDynamicBindings = [
    {
      file: 'src/View.vue',
      expression: 'serverRow.icon',
      source: 'unrelated literal must not establish a finite runtime domain',
      sourceFiles: ['src/View.vue']
    }
  ]

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /approved dynamic icon binding must use clampProductIcon:[\s\S]*serverRow\.icon/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a clamp and domain imported from the wrong module', () => {
  const fixture = createFixture({
    viewSource: `<template><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>
<script setup>
import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/wrongPolicy'
</script>\n`,
    icons: ['view']
  })
  const domain = addFixtureDomain(fixture)
  fixture.options.approvedDynamicBindings = [
    {
      file: 'src/View.vue',
      expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
      source: 'wrong imports must not establish the runtime policy',
      ...domain
    }
  ]

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /must import clampProductIcon, FIXTURE_ICON_NAMES from @\/iconDomains/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a locally shadowed product icon clamp', () => {
  const fixture = createFixture({
    modulePath: 'src/View.tsx',
    viewSource: `import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/iconDomains'
export const View = (clampProductIcon) => (
  <Icon icon={clampProductIcon(row.icon, FIXTURE_ICON_NAMES)} />
)\n`,
    icons: ['view']
  })
  const domain = addFixtureDomain(fixture)
  fixture.options.approvedDynamicBindings = [
    {
      file: 'src/View.tsx',
      expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
      source: 'lexical shadowing must not replace the audited helper',
      ...domain
    }
  ]

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /shadows product icon policy:[\s\S]*clampProductIcon/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a product icon clamp shadowed by a named function expression', () => {
  const fixture = createFixture({
    modulePath: 'src/View.tsx',
    viewSource: `import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/iconDomains'
export const View = function clampProductIcon() {
  return <Icon icon={clampProductIcon(row.icon, FIXTURE_ICON_NAMES)} />
}\n`,
    icons: ['view']
  })
  const domain = addFixtureDomain(fixture)
  fixture.options.approvedDynamicBindings = [
    {
      file: 'src/View.tsx',
      expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
      source: 'named runtime expressions must not shadow the audited helper',
      ...domain
    }
  ]

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /shadows product icon policy:[\s\S]*clampProductIcon/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a local svg-icon name without a matching file', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon icon="svg-icon:missing" /></template>\n',
    icons: []
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /missing local SVG:[\s\S]*svg-icon:missing/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects a mixed literal and unbounded dynamic icon expression', () => {
  const fixture = createFixture({
    viewSource: `<template><Icon :icon="ok ? 'ep:view' : serverRow.icon" /></template>\n`,
    icons: ['view']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unapproved dynamic icon binding:[\s\S]*serverRow\.icon/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded icon value in a script object', () => {
  const fixture = createFixture({
    viewSource: '<script setup>const action = { icon: serverRow.icon }</script>\n',
    icons: []
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unapproved dynamic icon binding:[\s\S]*serverRow\.icon/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an unbounded shorthand icon value in a script object', () => {
  const fixture = createFixture({
    viewSource: '<script setup>const icon = serverRow.icon; const action = { icon }</script>\n',
    icons: []
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unapproved dynamic icon binding:[\s\S]*\bicon\b/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects manifest icons that are not required by the product graph', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon icon="ep:view" /></template>\n',
    icons: ['view', 'warning']
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /extra product manifest icons:[\s\S]*ep:warning/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects duplicate collection prefixes', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon icon="ep:view" /></template>\n',
    manifestSource: `export const productIconCollections = [
      { prefix: 'ep', icons: { view: { body: '<path/>' } } },
      { prefix: 'ep', icons: { search: { body: '<path/>' } } }
    ]\n`
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /duplicate product icon prefix:[\s\S]*ep/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects an invalid or unused collection prefix', async (t) => {
  await t.test('invalid prefix', () => {
    const fixture = createFixture({
      viewSource: '<template><Icon icon="ep:view" /></template>\n',
      manifestSource: `export const productIconCollections = [
        { prefix: 'Bad Prefix', icons: { view: { body: '<path/>' } } }
      ]\n`
    })

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /invalid product icon prefix:[\s\S]*Bad Prefix/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('unused empty prefix', () => {
    const fixture = createFixture({
      viewSource: '<template><Icon icon="ep:view" /></template>\n',
      manifestSource: `export const productIconCollections = [
        { prefix: 'ep', icons: { view: { body: '<path/>' } } },
        { prefix: 'unused', icons: {} }
      ]\n`
    })

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /extra product manifest icons:[\s\S]*unused:\*/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })
})

test('rejects duplicate and invalid icon names', async (t) => {
  await t.test('duplicate icon name', () => {
    const fixture = createFixture({
      viewSource: '<template><Icon icon="ep:view" /></template>\n',
      manifestSource: `export const productIconCollections = [{
        prefix: 'ep',
        icons: { view: { body: '<path/>' }, view: { body: '<path/>' } }
      }]\n`
    })

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /duplicate product icon name:[\s\S]*ep:view/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('invalid icon name', () => {
    const fixture = createFixture({
      viewSource: '<template><Icon icon="ep:view" /></template>\n',
      manifestSource: `export const productIconCollections = [{
        prefix: 'ep',
        icons: { view: { body: '<path/>' }, 'Bad Name': { body: '<path/>' } }
      }]\n`
    })

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /invalid product icon name:[\s\S]*ep:Bad Name/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })
})

test('rejects an alias whose parent cannot be resolved', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon icon="ep:visible" /></template>\n',
    manifestSource: `export const productIconCollections = [{
      prefix: 'ep',
      icons: { view: { body: '<path/>' } },
      aliases: { visible: { parent: 'missing' } }
    }]\n`
  })

  try {
    assert.throws(
      () => assertProductIconCoverage(fixture.options),
      /unresolved product icon alias:[\s\S]*ep:visible[\s\S]*ep:missing/
    )
  } finally {
    rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('rejects stale or undocumented dynamic approvals', async (t) => {
  await t.test('stale approval', () => {
    const fixture = createFixture({
      viewSource: `<template><Icon icon="ep:view" /></template>
<script setup>
import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/iconDomains'
</script>\n`,
      icons: ['view']
    })
    const domain = addFixtureDomain(fixture)
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
        source: 'fixture actions',
        ...domain
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /stale approved dynamic icon binding:[\s\S]*clampProductIcon\(row\.icon/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('empty source evidence', () => {
    const fixture = createFixture({
      viewSource:
        '<template><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>\n',
      icons: ['view']
    })
    const domain = addFixtureDomain(fixture)
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
        source: '',
        ...domain
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /approved dynamic icon binding requires source evidence:[\s\S]*row\.icon/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('missing icon domain file', () => {
    const fixture = createFixture({
      viewSource:
        '<template><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>\n',
      icons: ['view']
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
        source: 'fixture actions',
        domainFile: '',
        domainExport: 'FIXTURE_ICON_NAMES'
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /approved dynamic icon binding requires a domain file:[\s\S]*row\.icon/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('source outside the product graph', () => {
    const fixture = createFixture({
      viewSource:
        '<template><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>\n',
      icons: ['view']
    })
    write(
      fixture.root,
      'src/ServerSchema.ts',
      "export const FIXTURE_ICON_NAMES = ['ep:view'] as const\n"
    )
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
        source: 'server schema',
        domainFile: 'src/ServerSchema.ts',
        domainExport: 'FIXTURE_ICON_NAMES'
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /approved dynamic icon binding domain is outside the product graph:[\s\S]*ServerSchema/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('in-graph domain must be a finite static array', () => {
    const fixture = createFixture({
      viewSource: `<template><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>
<script setup>const rows = []</script>\n`,
      icons: ['view']
    })
    const domain = addFixtureDomain(fixture, {
      source: 'export const FIXTURE_ICON_NAMES = loadRemoteIcons()\n'
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
        source: 'empty rows',
        ...domain
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /product icon domain must be a static array frozen with Object\.freeze:[\s\S]*FIXTURE_ICON_NAMES/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('a compile-time readonly but runtime-mutable domain is rejected', () => {
    const fixture = createFixture({
      viewSource: `<template><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>
<script setup>
import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/iconDomains'
</script>\n`,
      icons: ['view']
    })
    const domain = addFixtureDomain(fixture, {
      source: "export const FIXTURE_ICON_NAMES = ['ep:view'] as const\n"
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
        source: 'runtime domains must not be mutable through a cast',
        ...domain
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /product icon domain must be a static array frozen with Object\.freeze/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('a reassignable exported domain is rejected', () => {
    const fixture = createFixture({
      viewSource: `<template><Icon :icon="clampProductIcon(row.icon, FIXTURE_ICON_NAMES)" /></template>
<script setup>
import { clampProductIcon, FIXTURE_ICON_NAMES } from '@/iconDomains'
</script>\n`,
      icons: ['view']
    })
    const domain = addFixtureDomain(fixture, {
      source: `export let FIXTURE_ICON_NAMES = Object.freeze(['ep:view'] as const)
FIXTURE_ICON_NAMES = getServerAllowlist() as any\n`
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'clampProductIcon(row.icon, FIXTURE_ICON_NAMES)',
        source: 'live bindings must not replace the audited frozen domain',
        ...domain
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /product icon domain must be a top-level export const/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })
})
