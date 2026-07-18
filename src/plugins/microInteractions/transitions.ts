import { nextTick } from 'vue'
import { animateView, stagger } from 'motion'
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
  const grid = document.createElement('div')
  const halo = document.createElement('div')
  const core = document.createElement('div')
  const orbit = document.createElement('div')
  const orbitOuter = document.createElement('div')
  const line = document.createElement('div')
  const copy = document.createElement('div')
  const eyebrow = document.createElement('span')
  const title = document.createElement('strong')
  const particles = Array.from({ length: 10 }, (_, index) => {
    const particle = document.createElement('i')
    const angle = (index / 10) * Math.PI * 2
    particle.className = 'micro-login-transition__particle'
    particle.style.setProperty('--particle-index', String(index))
    particle.style.left = `calc(50% + ${Math.cos(angle) * 54}%)`
    particle.style.top = `calc(50% + ${Math.sin(angle) * 54}%)`
    return particle
  })

  portal.className = 'micro-login-transition'
  grid.className = 'micro-login-transition__grid'
  halo.className = 'micro-login-transition__halo'
  core.className = 'micro-login-transition__core'
  orbit.className = 'micro-login-transition__orbit'
  orbitOuter.className = 'micro-login-transition__orbit micro-login-transition__orbit--outer'
  line.className = 'micro-login-transition__line'
  copy.className = 'micro-login-transition__copy'
  eyebrow.className = 'micro-login-transition__eyebrow'
  title.className = 'micro-login-transition__title'
  eyebrow.textContent = 'ACCESS GRANTED'
  title.textContent = 'ENTERING SKIT WORKSPACE'
  portal.setAttribute('aria-hidden', 'true')
  copy.append(eyebrow, title)
  halo.append(core, orbit, orbitOuter, ...particles)
  portal.append(grid, halo, line, copy)
  document.body.append(portal)

  return { portal, grid, halo, core, orbit, orbitOuter, line, copy, particles }
}

export const runLoginChallengeTransition = async (update: ViewUpdate) => {
  if (prefersReducedMotion()) {
    await updateView(update)
    return
  }

  setTransitionState('login-challenge')
  const card = document.querySelector<HTMLElement>('.login-card')
  const button = document.querySelector<HTMLElement>('.skit-login-button')

  try {
    await Promise.all([
      card
        ? animate(
            card,
            {
              transform: ['scale(1)', 'scale(0.975)', 'scale(1.018)', 'scale(1)'],
              filter: ['brightness(1)', 'brightness(0.94)', 'brightness(1.1)', 'brightness(1)']
            },
            { duration: 0.48, ease: EASE_OUT }
          )
        : Promise.resolve(),
      button
        ? animate(
            button,
            {
              transform: ['scale(1)', 'scale(0.92)', 'scale(1.065)', 'scale(1)'],
              filter: [
                'brightness(1) saturate(1)',
                'brightness(1.35) saturate(1.4)',
                'brightness(1.08) saturate(1.15)',
                'brightness(1) saturate(1)'
              ]
            },
            { duration: 0.48, ease: EASE_OUT }
          )
        : Promise.resolve()
    ])

    await updateView(update)
    const box = document.querySelector<HTMLElement>('.verifybox')
    const mask = document.querySelector<HTMLElement>('.mask')
    await Promise.all([
      box
        ? animate(
            box,
            {
              opacity: [0, 1],
              transform: [
                'translate3d(0, 34px, 0) scale(0.76) rotateX(12deg)',
                'translate3d(0, -5px, 0) scale(1.025) rotateX(0deg)',
                'translate3d(0, 0, 0) scale(1) rotateX(0deg)'
              ],
              filter: ['blur(10px) brightness(1.2)', 'blur(0px) brightness(1)']
            },
            { duration: 0.68, ease: EASE_OUT }
          )
        : Promise.resolve(),
      mask
        ? animate(mask, { opacity: [0, 1] }, { duration: 0.5, ease: 'easeOut' })
        : Promise.resolve()
    ])
  } finally {
    setTransitionState(null)
  }
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
      animate(parts.portal, { opacity: [0, 1] }, { duration: 0.42, ease: 'easeOut' }),
      animate(
        parts.grid,
        { opacity: [0, 0.72], transform: ['scale(1.2)', 'scale(1)'] },
        { duration: 0.72, ease: EASE_OUT }
      ),
      animate(
        parts.halo,
        {
          opacity: [0, 1],
          transform: [
            'scale(0.08) rotate(-36deg)',
            'scale(1.08) rotate(3deg)',
            'scale(1) rotate(0deg)'
          ]
        },
        { duration: 0.82, ease: EASE_OUT }
      ),
      animate(
        parts.line,
        { opacity: [0, 1], transform: ['scaleX(0)', 'scaleX(1.08)', 'scaleX(1)'] },
        { duration: 0.68, delay: 0.08, ease: EASE_OUT }
      ),
      animate(
        parts.copy,
        {
          opacity: [0, 1],
          transform: ['translate3d(0, 24px, 0) scale(0.92)', 'translate3d(0, 0, 0) scale(1)']
        },
        { duration: 0.62, delay: 0.22, ease: EASE_OUT }
      ),
      animate(
        parts.orbitOuter,
        { transform: ['rotate(-150deg) scale(0.45)', 'rotate(0deg) scale(1)'] },
        { duration: 0.9, ease: EASE_OUT }
      ),
      animate(
        parts.particles,
        { opacity: [0, 1], transform: ['scale(0) translateY(28px)', 'scale(1) translateY(0)'] },
        { duration: 0.5, delay: stagger(0.045, { startDelay: 0.18 }), ease: EASE_OUT }
      )
    ])

    const transition = animateView(() => updateView(update), {
      duration: 1.02,
      ease: EASE_OUT,
      interrupt: 'immediate'
    })
    transition.old(
      {
        opacity: [1, 0],
        transform: ['scale(1)', 'scale(1.025)'],
        filter: ['blur(0px)', 'blur(4px)']
      },
      { duration: 0.55, ease: 'easeIn' }
    )
    transition.new(
      {
        opacity: [0, 1],
        transform: ['scale(1.045)', 'scale(1)'],
        filter: ['blur(12px) brightness(1.25)', 'blur(0px) brightness(1)']
      },
      { duration: 1.02, ease: EASE_OUT }
    )

    await Promise.all([
      transition,
      animate(
        parts.halo,
        { opacity: [1, 0], transform: ['scale(1)', 'scale(10) rotate(28deg)'] },
        { duration: 1.02, ease: EASE_OUT }
      ),
      animate(
        parts.core,
        { opacity: [1, 0], transform: ['scale(1)', 'scale(5.4)'] },
        { duration: 0.82, ease: EASE_OUT }
      ),
      animate(
        parts.orbit,
        { opacity: [0.75, 0], transform: ['rotate(0deg) scale(1)', 'rotate(210deg) scale(3.2)'] },
        { duration: 0.96, ease: EASE_OUT }
      ),
      animate(
        parts.copy,
        { opacity: [1, 0], transform: ['translateY(0)', 'translateY(-26px)'] },
        { duration: 0.48, delay: 0.34, ease: 'easeIn' }
      ),
      animate(parts.portal, { opacity: [1, 0] }, { duration: 0.52, delay: 0.58, ease: 'easeIn' })
    ])
  } finally {
    parts.portal.remove()
    setTransitionState(null)
  }
}
