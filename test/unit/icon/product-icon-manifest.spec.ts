import { addCollection, getIcon } from '@iconify/vue'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { productIconCollections } from '@/plugins/svgIcon/productIconCollections'
import {
  ADMIN_ACTION_ICON_NAMES,
  CONTEXT_MENU_ICON_NAMES,
  INPUT_PASSWORD_ICON_NAMES,
  PRODUCT_ROUTE_ICON_NAMES,
  clampProductIcon
} from '@/components/Icon/src/productIconDomains'

const productIconNames = productIconCollections.flatMap((collection) => [
  ...Object.keys(collection.icons).map((name) => `${collection.prefix}:${name}`),
  ...Object.keys('aliases' in collection ? collection.aliases : {}).map(
    (name) => `${collection.prefix}:${name}`
  )
])

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const propertyIconLiterals = (source: string) =>
  [...new Set([...source.matchAll(/\bicon:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]))].sort()

describe('product Iconify manifest', () => {
  it('contains exactly the audited product subset', () => {
    expect(productIconCollections).toHaveLength(11)
    expect(productIconNames).toHaveLength(77)
    expect(new Set(productIconNames).size).toBe(77)
  })

  it('resolves every product icon from local memory without an API request', () => {
    for (const collection of productIconCollections) {
      expect(addCollection(collection), collection.prefix).toBe(true)
    }

    for (const name of productIconNames) {
      expect(getIcon(name), name).not.toBeNull()
    }
  })

  it('clamps every dynamic product surface to its checked-in finite domain', () => {
    expect(INPUT_PASSWORD_ICON_NAMES).toEqual(['ep:hide', 'ep:view'])
    expect(PRODUCT_ROUTE_ICON_NAMES).toHaveLength(19)
    expect(CONTEXT_MENU_ICON_NAMES).toHaveLength(6)
    expect(ADMIN_ACTION_ICON_NAMES).toEqual(['ep:edit', 'ep:view'])
    for (const domain of [
      INPUT_PASSWORD_ICON_NAMES,
      PRODUCT_ROUTE_ICON_NAMES,
      CONTEXT_MENU_ICON_NAMES,
      ADMIN_ACTION_ICON_NAMES
    ]) {
      expect(Object.isFrozen(domain)).toBe(true)
    }

    expect(clampProductIcon('ep:view', INPUT_PASSWORD_ICON_NAMES)).toBe('ep:view')
    expect(clampProductIcon('ep:download', INPUT_PASSWORD_ICON_NAMES)).toBeUndefined()
    expect(
      clampProductIcon('https://api.iconify.design/ep.json', PRODUCT_ROUTE_ICON_NAMES)
    ).toBeUndefined()
    expect(clampProductIcon({ icon: 'ep:view' }, ADMIN_ACTION_ICON_NAMES)).toBeUndefined()
  })

  it('keeps password, context-menu and row-action producers equal to their runtime domains', () => {
    const inputPassword = readSource('src/components/InputPassword/src/InputPassword.vue')
    const passwordProducer = inputPassword.match(/const getIconName = computed\([^\n]+\)/)?.[0]
    expect(passwordProducer).toBeTruthy()
    const passwordIcons = [
      ...new Set(
        [...(passwordProducer || '').matchAll(/['"]([^'"]+:[^'"]+)['"]/g)].map((match) => match[1])
      )
    ].sort()
    expect(passwordIcons).toEqual([...INPUT_PASSWORD_ICON_NAMES].sort())

    const tagsView = readSource('src/layout/components/TagsView/src/TagsView.vue')
    expect(propertyIconLiterals(tagsView)).toEqual([...CONTEXT_MENU_ICON_NAMES].sort())

    const adminTable = readSource('src/views/skit/admin/AdminTable.vue')
    const rowActionProducer = adminTable.match(
      /const rowOperateActions:[^=]+=\s*\[([\s\S]*?)\n\]/
    )?.[1]
    expect(rowActionProducer).toBeTruthy()
    expect(propertyIconLiterals(rowActionProducer || '')).toEqual(
      [...ADMIN_ACTION_ICON_NAMES].sort()
    )
  })
})
