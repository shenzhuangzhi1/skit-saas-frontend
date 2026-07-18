import { nextTick } from 'vue'
import { animateView } from 'motion'
import { animate } from 'motion/mini'

type ViewUpdate = () => void | Promise<unknown>

const EASE_OUT = [0.22, 1, 0.36, 1] as const

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const updateView = async (update: ViewUpdate) => {
  await update()
  await nextTick()
}

const setTransitionState = (value: string | null) => {
  if (value) document.documentElement.dataset.motionTransition = value
  else delete document.documentElement.dataset.motionTransition
}

const resolveOrigin = (origin?: HTMLElement | null) => {
  if (!origin) return { x: window.innerWidth - 44, y: 44 }
  const rect = origin.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

export const runThemeTransition = async (update: ViewUpdate, origin?: HTMLElement | null) => {
  if (prefersReducedMotion()) {
    await updateView(update)
    return
  }

  const { x, y } = resolveOrigin(origin)
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  setTransitionState('theme')

  try {
    const transition = animateView(() => updateView(update), {
      duration: 0.58,
      ease: EASE_OUT,
      interrupt: 'immediate'
    })
    transition.new(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        filter: ['brightness(1.06) saturate(1.04)', 'brightness(1) saturate(1)'],
        opacity: [0.78, 1]
      },
      { duration: 0.58, ease: EASE_OUT }
    )
    await transition
  } finally {
    setTransitionState(null)
  }
}

export const runWorkspaceTransition = async (update: ViewUpdate, direction = 1) => {
  if (prefersReducedMotion()) {
    await updateView(update)
    return
  }

  setTransitionState('workspace')
  try {
    const transition = animateView(() => updateView(update), {
      duration: 0.46,
      ease: EASE_OUT,
      interrupt: 'immediate'
    })
    transition.old(
      {
        opacity: [1, 0],
        transform: [
          'translate3d(0, 0, 0) scale(1)',
          `translate3d(${-10 * direction}px, 0, 0) scale(0.992)`
        ],
        filter: ['blur(0px)', 'blur(2px)']
      },
      { duration: 0.3, ease: 'easeIn' }
    )
    transition.new(
      {
        opacity: [0, 1],
        transform: [
          `translate3d(${14 * direction}px, 0, 0) scale(0.992)`,
          'translate3d(0, 0, 0) scale(1)'
        ],
        filter: ['blur(2px)', 'blur(0px)']
      },
      { duration: 0.46, ease: EASE_OUT }
    )
    await transition
  } finally {
    setTransitionState(null)
  }
}

const createLoginPortal = () => {
  const portal = document.createElement('div')
  const halo = document.createElement('div')
  const core = document.createElement('div')
  const orbit = document.createElement('div')
  const line = document.createElement('div')

  portal.className = 'micro-login-transition'
  halo.className = 'micro-login-transition__halo'
  core.className = 'micro-login-transition__core'
  orbit.className = 'micro-login-transition__orbit'
  line.className = 'micro-login-transition__line'
  portal.setAttribute('aria-hidden', 'true')
  halo.append(core, orbit)
  portal.append(halo, line)
  document.body.append(portal)

  return { portal, halo, core, orbit, line }
}

export const runLoginTransition = async (update: ViewUpdate) => {
  if (prefersReducedMotion()) {
    await updateView(update)
    return
  }

  const parts = createLoginPortal()
  setTransitionState('login')

  try {
    await Promise.all([
      animate(parts.portal, { opacity: [0, 1] }, { duration: 0.24, ease: 'easeOut' }),
      animate(
        parts.halo,
        {
          opacity: [0, 1],
          transform: ['scale(0.28) rotate(-12deg)', 'scale(1) rotate(0deg)']
        },
        { duration: 0.46, ease: EASE_OUT }
      ),
      animate(
        parts.line,
        { opacity: [0, 0.9], transform: ['scaleX(0)', 'scaleX(1)'] },
        { duration: 0.38, delay: 0.08, ease: EASE_OUT }
      )
    ])

    const transition = animateView(() => updateView(update), {
      duration: 0.72,
      ease: EASE_OUT,
      interrupt: 'immediate'
    })
    transition.old(
      {
        opacity: [1, 0],
        transform: ['scale(1)', 'scale(1.025)'],
        filter: ['blur(0px)', 'blur(4px)']
      },
      { duration: 0.38, ease: 'easeIn' }
    )
    transition.new(
      {
        opacity: [0, 1],
        transform: ['scale(1.025)', 'scale(1)'],
        filter: ['blur(5px)', 'blur(0px)']
      },
      { duration: 0.72, ease: EASE_OUT }
    )

    await Promise.all([
      transition,
      animate(
        parts.halo,
        { opacity: [1, 0], transform: ['scale(1)', 'scale(8)'] },
        { duration: 0.72, ease: EASE_OUT }
      ),
      animate(
        parts.core,
        { opacity: [1, 0], transform: ['scale(1)', 'scale(3.2)'] },
        { duration: 0.52, ease: EASE_OUT }
      ),
      animate(
        parts.orbit,
        { opacity: [0.75, 0], transform: ['rotate(0deg) scale(1)', 'rotate(90deg) scale(2.4)'] },
        { duration: 0.62, ease: EASE_OUT }
      ),
      animate(parts.portal, { opacity: [1, 0] }, { duration: 0.34, delay: 0.4, ease: 'easeIn' })
    ])
  } finally {
    parts.portal.remove()
    setTransitionState(null)
  }
}
