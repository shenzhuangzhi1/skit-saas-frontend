import { describe, expect, it } from 'vitest'
import { pathResolve } from '@/utils/routerHelper'

describe('pathResolve', () => {
  it('keeps an absolute child independent from its menu parent', () => {
    expect(pathResolve('/skit/ad-center', '/skit/ad-consumption')).toBe('/skit/ad-consumption')
  })

  it('joins a relative child', () => {
    expect(pathResolve('/skit/ad-center', 'history')).toBe('/skit/ad-center/history')
  })

  it('preserves empty paths and external URLs', () => {
    expect(pathResolve('/skit/ad-center', '')).toBe('/skit/ad-center')
    expect(pathResolve('/skit/ad-center', 'https://example.com/report')).toBe(
      'https://example.com/report'
    )
  })
})
