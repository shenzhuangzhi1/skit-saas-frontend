import autoAnimate, { type AnimationController } from '@formkit/auto-animate'
import { hover, press } from 'motion'
import { animate } from 'motion/mini'
import type { Router } from 'vue-router'

const INTERACTIVE_SELECTOR = [
  'button',
  '[role="button"]',
  '.el-button',
  '.btn',
  '.page-btn',
  '.action-btn',
  '.config-tab',
  '.el-tabs__item',
  '.el-dropdown-menu__item',
  '.el-pagination button',
  '.el-radio-button__inner',
  '.el-checkbox-button__inner',
  '.el-switch',
  '.el-segmented__item'
].join(',')

const SURFACE_SELECTOR = [
  '.el-card',
  '.el-dialog',
  '.el-drawer',
  '.el-popover',
  '.skit-panel',
  '.login-card',
  '.dashboard-card',
  '.overview-card',
  '.stat-card',
  '.metric-card'
].join(',')

const AUTO_ANIMATE_SELECTOR = [
  '.el-table__body > tbody',
  '.data-table > tbody',
  '.fixed-table-body tbody',
  '.el-menu',
  '.el-tabs__nav',
  '.el-upload-list',
  '.el-select__selection',
  '.el-tree',
  '.el-tree-node__children',
  '.el-collapse',
  '.el-steps',
  '.el-dialog__body',
  '.el-timeline',
  '.el-breadcrumb'
].join(',')

const MOTION_EXCLUSION_SELECTOR = [
  '[data-motion="off"]',
  '.el-button.is-disabled',
  '[aria-disabled="true"]',
  '[disabled]'
].join(',')

const interactiveElements = new WeakSet<HTMLElement>()
const surfaceElements = new WeakSet<HTMLElement>()
const animatedLayouts = new WeakMap<HTMLElement, AnimationController>()
const layoutControllers = new Set<AnimationController>()

const isHTMLElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const isMotionExcluded = (element: HTMLElement) =>
  element.matches(MOTION_EXCLUSION_SELECTOR) || Boolean(element.closest('[data-motion="off"]'))

const setPointerOrigin = (element: HTMLElement, event: PointerEvent) => {
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
  const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100))
  element.style.setProperty('--motion-pointer-x', `${x.toFixed(2)}%`)
  element.style.setProperty('--motion-pointer-y', `${y.toFixed(2)}%`)
}

const setupPointerTracking = (element: HTMLElement, startEvent: PointerEvent) => {
  let frameId = 0
  let latestEvent = startEvent

  const render = () => {
    frameId = 0
    setPointerOrigin(element, latestEvent)
  }
  const onPointerMove = (event: PointerEvent) => {
    latestEvent = event
    if (!frameId) frameId = requestAnimationFrame(render)
  }

  setPointerOrigin(element, startEvent)
  element.addEventListener('pointermove', onPointerMove, { passive: true })

  return () => {
    element.removeEventListener('pointermove', onPointerMove)
    if (frameId) cancelAnimationFrame(frameId)
  }
}

const bindInteractive = (element: HTMLElement, prefersReducedMotion: () => boolean) => {
  if (interactiveElements.has(element)) return
  interactiveElements.add(element)
  element.dataset.microInteractive = ''

  hover(element, (target, startEvent) => {
    if (prefersReducedMotion() || isMotionExcluded(element)) return

    const stopTracking = setupPointerTracking(element, startEvent)
    element.dataset.microActive = ''
    animate(
      target,
      { transform: 'translate3d(0, -1px, 0) scale(1.01)' },
      { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
    )

    return () => {
      stopTracking()
      delete element.dataset.microActive
      animate(
        target,
        { transform: 'translate3d(0, 0, 0) scale(1)' },
        { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
      )
    }
  })

  press(element, (target) => {
    if (prefersReducedMotion() || isMotionExcluded(element)) return

    animate(
      target,
      { transform: 'translate3d(0, 0, 0) scale(0.985)' },
      { duration: 0.1, ease: 'easeOut' }
    )

    return () => {
      const isHovered = 'microActive' in element.dataset
      animate(
        target,
        {
          transform: isHovered
            ? 'translate3d(0, -1px, 0) scale(1.01)'
            : 'translate3d(0, 0, 0) scale(1)'
        },
        { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
      )
    }
  })
}

const bindSurface = (element: HTMLElement, prefersReducedMotion: () => boolean) => {
  if (surfaceElements.has(element)) return
  surfaceElements.add(element)
  element.dataset.microSurface = ''

  hover(element, (_, startEvent) => {
    if (prefersReducedMotion() || isMotionExcluded(element)) return

    const stopTracking = setupPointerTracking(element, startEvent)
    element.dataset.microSurfaceActive = ''

    return () => {
      stopTracking()
      delete element.dataset.microSurfaceActive
    }
  })
}

const bindAutoAnimate = (element: HTMLElement, prefersReducedMotion: () => boolean) => {
  if (animatedLayouts.has(element)) return

  const controller = autoAnimate(element, {
    duration: 190,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
  })
  animatedLayouts.set(element, controller)
  layoutControllers.add(controller)
  element.dataset.microLayout = ''

  if (prefersReducedMotion()) controller.disable()
}

const releaseAutoAnimate = (root: Element) => {
  visitMatches(root, '[data-micro-layout]', (element) => {
    const controller = animatedLayouts.get(element)
    if (!controller) return

    controller.disable()
    layoutControllers.delete(controller)
    animatedLayouts.delete(element)
    delete element.dataset.microLayout
  })
}

const visitMatches = (root: Element, selector: string, visitor: (element: HTMLElement) => void) => {
  if (root.matches(selector) && isHTMLElement(root)) visitor(root)
  root.querySelectorAll(selector).forEach((element) => {
    if (isHTMLElement(element)) visitor(element)
  })
}

const animateCurrentPage = (prefersReducedMotion: () => boolean) => {
  if (prefersReducedMotion() || 'motionTransition' in document.documentElement.dataset) return

  requestAnimationFrame(() => {
    const page = document.querySelector<HTMLElement>(
      '.v-layout-content-scrollbar .el-scrollbar__view > section'
    )
    if (!page) return

    animate(
      page,
      {
        opacity: [0.84, 1],
        transform: ['translate3d(0, 5px, 0)', 'translate3d(0, 0, 0)'],
        filter: ['blur(1.5px)', 'blur(0px)']
      },
      { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
    )
  })
}

export const setupMicroInteractions = (router: Router) => {
  if (typeof window === 'undefined') return () => undefined

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const prefersReducedMotion = () => reducedMotionQuery.matches
  const scan = (root: Element) => {
    visitMatches(root, INTERACTIVE_SELECTOR, (element) =>
      bindInteractive(element, prefersReducedMotion)
    )
    visitMatches(root, SURFACE_SELECTOR, (element) => bindSurface(element, prefersReducedMotion))
    visitMatches(root, AUTO_ANIMATE_SELECTOR, (element) =>
      bindAutoAnimate(element, prefersReducedMotion)
    )
  }

  let scanFrame = 0
  const pendingRoots = new Set<Element>()
  const scheduleScan = (root: Element) => {
    pendingRoots.add(root)
    if (scanFrame) return

    scanFrame = requestAnimationFrame(() => {
      pendingRoots.forEach(scan)
      pendingRoots.clear()
      scanFrame = 0
    })
  }

  document.documentElement.dataset.motion = prefersReducedMotion() ? 'reduced' : 'full'
  scan(document.documentElement)

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) scheduleScan(node)
      })
      mutation.removedNodes.forEach((node) => {
        if (node instanceof Element) releaseAutoAnimate(node)
      })
    })
  })
  observer.observe(document.body, { childList: true, subtree: true })

  const onMotionPreferenceChange = () => {
    const reduced = prefersReducedMotion()
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
    layoutControllers.forEach((controller) => {
      if (reduced) controller.disable()
      else controller.enable()
    })
  }
  reducedMotionQuery.addEventListener('change', onMotionPreferenceChange)

  const removeRouteHook = router.afterEach(() => animateCurrentPage(prefersReducedMotion))
  animateCurrentPage(prefersReducedMotion)

  return () => {
    observer.disconnect()
    reducedMotionQuery.removeEventListener('change', onMotionPreferenceChange)
    removeRouteHook()
    if (scanFrame) cancelAnimationFrame(scanFrame)
    layoutControllers.forEach((controller) => controller.disable())
    layoutControllers.clear()
  }
}
