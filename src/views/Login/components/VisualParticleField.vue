<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'VisualParticleField' })

const props = defineProps<{ isDark?: boolean }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Particle {
  x: number
  y: number
  z: number
  size: number
  color: string
  spin: number
}

/** 浅色模式：主题靛蓝/青绿/点缀紫，压暗以保证浅底可见 */
const PALETTE_LIGHT = ['79, 70, 229', '13, 148, 136', '147, 51, 234']
/** 深色模式：亮一档，带辉光 */
const PALETTE_DARK = ['129, 140, 248', '45, 212, 191', '192, 132, 252']

let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let particles: Particle[] = []
let width = 0
let height = 0
let dpr = 1
let mouseX = 0
let mouseY = 0
let rotation = 0
let lastTs = 0
let reducedMotion = false
let disposed = false

function buildParticles(count: number) {
  const palette = props.isDark ? PALETTE_DARK : PALETTE_LIGHT
  particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random() * 2 - 1,
      size: 0.5 + Math.random() * 1.9,
      color: palette[Math.floor(Math.random() * palette.length)],
      spin: (Math.random() - 0.5) * 0.45,
    })
  }
}

function particleCountFor(widthPx: number): number {
  if (widthPx < 640) return 46
  if (widthPx < 1280) return 96
  return 150
}

function resize() {
  if (!canvasRef.value) return
  const el = canvasRef.value
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = el.clientWidth
  height = el.clientHeight
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (particles.length !== particleCountFor(width)) buildParticles(particleCountFor(width))
}

function draw(now: number) {
  if (disposed) return
  if (!ctx || !canvasRef.value) return
  const dt = lastTs ? Math.min(now - lastTs, 64) : 16
  lastTs = now
  rotation += dt * 0.000045
  const cx = width / 2
  const cy = height / 2
  const fov = 300
  const radius = Math.min(width, height) * 0.42
  ctx.clearRect(0, 0, width, height)

  for (const p of particles) {
    // 绕 Y 轴旋转 + 个体自旋
    const a = rotation + p.spin * 4
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    const rx = p.x * ca - p.z * sa
    const rz = p.x * sa + p.z * ca

    // 透视投影
    const depth = rz * radius * 0.6
    const scale = fov / (fov + depth)
    const sx = cx + rx * radius * scale + mouseX * 14 * scale
    const sy = cy + p.y * radius * scale + mouseY * 10 * scale

    // 近亮远暗
    const alpha = Math.max(0.06, Math.min(0.5, (scale - 0.55) * 1.1))
    const size = p.size * scale * (props.isDark ? 1.15 : 0.95)

    ctx.fillStyle = `rgba(${p.color}, ${alpha})`
    ctx.beginPath()
    ctx.arc(sx, sy, size, 0, Math.PI * 2)
    ctx.fill()
    // 外圈光晕（两次绘制代替 shadowBlur，性能友好）
    if (props.isDark) {
      ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.22})`
      ctx.beginPath()
      ctx.arc(sx, sy, size * 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  rafId = requestAnimationFrame(draw)
}

function onPointerMove(e: PointerEvent) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2
}

function onVisibilityChange() {
  if (document.hidden) {
    cancelAnimationFrame(rafId)
  } else if (!disposed) {
    lastTs = 0
    rafId = requestAnimationFrame(draw)
  }
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = canvasRef.value
  if (!el) return
  ctx = el.getContext('2d')
  if (!ctx) return

  resize()
  buildParticles(particleCountFor(width))
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)

  if (reducedMotion) {
    draw(0)
    cancelAnimationFrame(rafId)
  } else {
    rafId = requestAnimationFrame(draw)
  }
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  ctx = null
})
</script>

<template>
  <div class="particle-field" aria-hidden="true">
    <!-- 氛围光晕（CSS 层） -->
    <span class="glow glow--primary" />
    <span class="glow glow--accent" />
    <span class="glow glow--tertiary" />
    <canvas ref="canvasRef" class="particle-canvas" />
  </div>
</template>

<style lang="scss" scoped>
.particle-field {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.glow {
  position: absolute;
  display: block;
  border-radius: 50%;
  filter: blur(72px);
  will-change: transform;

  &--primary {
    top: -18%;
    right: -10%;
    width: 46vw;
    height: 46vw;
    background: radial-gradient(
      circle,
      var(--skit-glow-primary, rgb(99 102 241 / 0.16)),
      transparent 68%
    );
    animation: glow-drift-1 26s ease-in-out infinite alternate;
  }

  &--accent {
    bottom: -22%;
    left: -12%;
    width: 42vw;
    height: 42vw;
    background: radial-gradient(
      circle,
      var(--skit-glow-accent, rgb(15 159 145 / 0.14)),
      transparent 68%
    );
    animation: glow-drift-2 32s ease-in-out infinite alternate;
  }

  &--tertiary {
    top: 34%;
    left: 46%;
    width: 30vw;
    height: 30vw;
    background: radial-gradient(
      circle,
      var(--skit-glow-tertiary, rgb(168 85 247 / 0.08)),
      transparent 66%
    );
    animation: glow-drift-3 38s ease-in-out infinite alternate;
  }
}

@keyframes glow-drift-1 {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(-6vw, 5vh, 0) scale(1.12);
  }
}

@keyframes glow-drift-2 {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(5vw, -6vh, 0) scale(1.08);
  }
}

@keyframes glow-drift-3 {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(-3vw, -4vh, 0) scale(1.18);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glow {
    animation: none;
  }
}
</style>
