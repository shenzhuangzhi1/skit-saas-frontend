import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/router/modules/remaining.ts'), 'utf8')

const routeSource = (path: string) => {
  const start = source.indexOf(`path: '${path}'`)
  if (start < 0) return ''
  return source.slice(start, source.indexOf('\n  },', start) + 5)
}

describe('advertising route compatibility', () => {
  it('redirects the duplicated consumption path without exposing it in navigation', () => {
    const route = routeSource('/skit/ad-center/skit/ad-consumption')

    expect(route).toContain("redirect: '/skit/ad-consumption'")
    expect(route).toMatch(/hidden:\s*true/)
    expect(route).toMatch(/noTagsView:\s*true/)
  })

  it('redirects the duplicated monitor path without exposing it in navigation', () => {
    const route = routeSource('/skit/ad-center/skit/ad-record')

    expect(route).toContain("redirect: '/skit/ad-record'")
    expect(route).toMatch(/hidden:\s*true/)
    expect(route).toMatch(/noTagsView:\s*true/)
  })
})
