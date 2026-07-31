import { addCollection, getIcon } from '@iconify/vue'
import { describe, expect, it } from 'vitest'

import { productIconCollections } from '@/plugins/svgIcon/productIconCollections'

const productIconNames = productIconCollections.flatMap((collection) => [
  ...Object.keys(collection.icons).map((name) => `${collection.prefix}:${name}`),
  ...Object.keys('aliases' in collection ? collection.aliases : {}).map(
    (name) => `${collection.prefix}:${name}`
  )
])

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
})
