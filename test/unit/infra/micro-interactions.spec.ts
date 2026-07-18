import { beforeEach, describe, expect, it, vi } from 'vitest'

const motionMocks = vi.hoisted(() => ({
  animate: vi.fn(() => Promise.resolve()),
  animateView: vi.fn((update: () => void | Promise<unknown>) => {
    const completion = Promise.resolve().then(update)
    const builder = {
      new: vi.fn(() => builder),
      old: vi.fn(() => builder),
      then: (resolve: (value?: unknown) => void, reject: (reason?: unknown) => void) =>
        completion.then(resolve, reject)
    }
    return builder
  })
}))

vi.mock('motion', () => ({ animateView: motionMocks.animateView, stagger: vi.fn(() => 0) }))
vi.mock('motion/mini', () => ({ animate: motionMocks.animate }))

import {
  runLoginChallengeTransition,
  runLoginTransition,
  runThemeTransition,
  runWorkspaceTransition
} from '@/plugins/microInteractions/transitions'

const setReducedMotion = (matches: boolean) => {
  vi.stubGlobal('matchMedia', () => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
}

describe('micro interaction transitions', () => {
  beforeEach(() => {
    motionMocks.animate.mockClear()
    motionMocks.animateView.mockClear()
    document.body.innerHTML = ''
    delete document.documentElement.dataset.motionTransition
    setReducedMotion(false)
  })

  it('runs and cleans up the cinematic login transition', async () => {
    const update = vi.fn()

    await runLoginTransition(update)

    expect(update).toHaveBeenCalledOnce()
    expect(motionMocks.animateView).toHaveBeenCalledOnce()
    expect(motionMocks.animate.mock.calls.length).toBeGreaterThanOrEqual(7)
    expect(document.querySelector('.micro-login-transition')).toBeNull()
    expect(document.documentElement.dataset.motionTransition).toBeUndefined()
  })

  it('animates the login controls and expands the captcha challenge', async () => {
    document.body.innerHTML = `
      <div class="login-card"><button class="skit-login-button">Login</button></div>
    `
    const update = vi.fn(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<div class="mask"><div class="verifybox"></div></div>'
      )
    })

    await runLoginChallengeTransition(update)

    expect(update).toHaveBeenCalledOnce()
    expect(motionMocks.animate).toHaveBeenCalledTimes(4)
    expect(document.documentElement.dataset.motionTransition).toBeUndefined()
  })

  it('uses view transitions for theme and workspace changes', async () => {
    const themeUpdate = vi.fn()
    const workspaceUpdate = vi.fn()

    await runThemeTransition(themeUpdate)
    await runWorkspaceTransition(workspaceUpdate, -1)

    expect(themeUpdate).toHaveBeenCalledOnce()
    expect(workspaceUpdate).toHaveBeenCalledOnce()
    expect(motionMocks.animateView).toHaveBeenCalledTimes(2)
    expect(document.documentElement.dataset.motionTransition).toBeUndefined()
  })

  it('fully respects the reduced-motion preference', async () => {
    setReducedMotion(true)
    const update = vi.fn()

    await runLoginTransition(update)

    expect(update).toHaveBeenCalledOnce()
    expect(motionMocks.animateView).not.toHaveBeenCalled()
    expect(motionMocks.animate).not.toHaveBeenCalled()
    expect(document.querySelector('.micro-login-transition')).toBeNull()
  })
})
