import 'virtual:svg-icons-register'

import { addCollection } from '@iconify/vue'
import { productIconCollections } from './productIconCollections'

for (const collection of productIconCollections) {
  if (!addCollection(collection)) {
    throw new Error(`Failed to register bundled Iconify collection: ${collection.prefix}`)
  }
}
