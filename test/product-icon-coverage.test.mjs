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

test('accepts fully local literal and audited dynamic product icons', () => {
  const fixture = createFixture({
    viewSource: `<template><Icon icon="ep:search" /><Icon :icon="row.icon" /></template>
<script setup>const actions = [{ icon: 'ep:view' }]</script>\n`
  })
  fixture.options.approvedDynamicBindings = [
    {
      file: 'src/View.vue',
      expression: 'row.icon',
      source: 'fixed fixture actions',
      sourceFiles: ['src/View.vue']
    }
  ]

  try {
    const result = assertProductIconCoverage(fixture.options)
    assert.deepEqual(result.iconNames, ['ep:search', 'ep:view'])
    assert.deepEqual(result.prefixes, ['ep'])
    assert.deepEqual(result.dynamicBindings, [{ file: 'src/View.vue', expression: 'row.icon' }])
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
      "const serverProps = {}; export const View = () => <Icon icon=\"ep:view\" {...serverProps} />\n",
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

test('an unrelated static icon cannot approve an unclamped dynamic binding', () => {
  const fixture = createFixture({
    viewSource:
      '<template><Icon :icon="serverRow.icon" /><Icon icon="ep:view" /></template>\n',
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
      viewSource: '<template><Icon icon="ep:view" /></template>\n',
      icons: ['view']
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'row.icon',
        source: 'fixture actions',
        sourceFiles: ['src/View.vue']
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /stale approved dynamic icon binding:[\s\S]*row\.icon/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('empty source evidence', () => {
    const fixture = createFixture({
      viewSource: '<template><Icon :icon="row.icon" /></template>\n',
      icons: []
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'row.icon',
        source: '',
        sourceFiles: ['src/View.vue']
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

  await t.test('missing finite source files', () => {
    const fixture = createFixture({
      viewSource: '<template><Icon :icon="row.icon" /></template>\n',
      icons: []
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'row.icon',
        source: 'fixture actions',
        sourceFiles: []
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /approved dynamic icon binding requires finite source files:[\s\S]*row\.icon/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('source outside the product graph', () => {
    const fixture = createFixture({
      viewSource: '<template><Icon :icon="row.icon" /></template>\n',
      icons: []
    })
    write(fixture.root, 'src/ServerSchema.ts', "export const icon = 'ep:view'\n")
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'row.icon',
        source: 'server schema',
        sourceFiles: ['src/ServerSchema.ts']
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /approved dynamic icon binding source is outside the product graph:[\s\S]*ServerSchema/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })

  await t.test('in-graph source without a finite static icon domain', () => {
    const fixture = createFixture({
      viewSource: `<template><Icon :icon="row.icon" /></template>
<script setup>const rows = []</script>\n`,
      icons: []
    })
    fixture.options.approvedDynamicBindings = [
      {
        file: 'src/View.vue',
        expression: 'row.icon',
        source: 'empty rows',
        sourceFiles: ['src/View.vue']
      }
    ]

    try {
      assert.throws(
        () => assertProductIconCoverage(fixture.options),
        /approved dynamic icon binding has no finite static icon domain:[\s\S]*row\.icon/
      )
    } finally {
      rmSync(fixture.root, { recursive: true, force: true })
    }
  })
})
