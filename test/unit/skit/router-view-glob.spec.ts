import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('dynamic view packaging boundary', () => {
  it('excludes accidental numbered AdminTable copies from the production bundle', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/utils/routerHelper.ts'), 'utf8')

    expect(source).toContain("'!../views/skit/admin/AdminTable [0-9]*.vue'")
  })
})
