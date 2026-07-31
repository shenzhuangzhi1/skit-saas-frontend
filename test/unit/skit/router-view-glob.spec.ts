import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('dynamic view packaging boundary', () => {
  it('keeps router helpers focused and free of an all-views component registry', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/utils/routerHelper.ts'), 'utf8')

    expect(source).toContain('export const Layout')
    expect(source).toContain('export const getParentLayout')
    expect(source).toContain('export const getRawRoute')
    expect(source).toContain('export const pathResolve')
    expect(source).not.toContain('import.meta.glob')
    expect(source).not.toContain('generateRoute')
  })
})
