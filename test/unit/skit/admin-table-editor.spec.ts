import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/views/skit/admin/AdminTable.vue'), 'utf8')

describe('admin table editor', () => {
  it('preserves valid zero values when an existing row is opened', () => {
    expect(source).toContain("editorModel[column.prop] = target[column.prop] ?? ''")
    expect(source).not.toContain("editorModel[column.prop] = target[column.prop] || ''")
  })
})
