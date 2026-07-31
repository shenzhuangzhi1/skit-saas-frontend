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

const createFixture = ({ viewSource, icons = ['search', 'view'] }) => {
  const root = mkdtempSync(join(tmpdir(), 'skit-product-icons-'))
  const manifestPath = 'src/plugins/svgIcon/productIconCollections.ts'
  const iconEntries = icons
    .map((name) => `${JSON.stringify(name)}: { "body": "<path/>" }`)
    .join(', ')

  write(
    root,
    manifestPath,
    `export const productIconCollections = [{ "prefix": "ep", "icons": { ${iconEntries} } }]\n`
  )
  write(root, 'src/View.vue', viewSource)

  return {
    root,
    options: {
      root,
      moduleIds: ['src/View.vue'],
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
    { file: 'src/View.vue', expression: 'row.icon', source: 'fixed fixture actions' }
  ]

  try {
    const result = assertProductIconCoverage(fixture.options)
    assert.deepEqual(result.iconNames, ['ep:search', 'ep:view'])
    assert.deepEqual(result.prefixes, ['ep'])
    assert.deepEqual(result.dynamicBindings, [
      { file: 'src/View.vue', expression: 'row.icon' }
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
    viewSource: '<template><Icon :icon="serverRow.icon" /></template>\n'
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

test('rejects a local svg-icon name without a matching file', () => {
  const fixture = createFixture({
    viewSource: '<template><Icon icon="svg-icon:missing" /></template>\n'
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
