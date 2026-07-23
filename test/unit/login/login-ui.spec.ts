import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getCaptchaDimensions } from '@/views/Login/components/captchaSizing'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

const pageSource = readSource('src/views/Login/Login.vue')
const formSource = readSource('src/views/Login/components/LoginForm.vue')
const verifySource = readSource('src/components/Verifition/src/Verify.vue')
const verifySlideSource = readSource('src/components/Verifition/src/Verify/VerifySlide.vue')
const documentSource = readSource('index.html')

describe('login UI contract', () => {
  it('presents a restrained short-drama operations workspace instead of generic decoration', () => {
    expect(pageSource).toContain('短剧 SaaS 运营控制台')
    expect(pageSource).toContain('代理商隔离')
    expect(pageSource).toContain('广告对账')
    expect(pageSource).toContain('版本发布')
    expect(pageSource).toContain('{{ appStore.getTitle }}')
    expect(pageSource).toContain('class="login-shell"')
    expect(pageSource).toMatch(/grid-template-columns:\s*minmax\(/)
    expect(pageSource).toContain('@media (width <= 880px)')

    expect(pageSource).not.toContain('login-orb')
    expect(pageSource).not.toContain('@/assets/imgs/logo.png')
    expect(pageSource).not.toContain('SKIT CONSOLE')
  })

  it('gives theme and language controls durable accessible names', () => {
    expect(pageSource).toContain(':aria-label="themeActionLabel"')
    expect(pageSource).toContain(':aria-label="`切换语言，当前${currentLanguageLabel}`"')
    expect(pageSource).toContain('const currentLanguageLabel = computed')
    expect(pageSource).toMatch(/\|\|\s*currentLang\.value\?\.lang\s*\|\|\s*'语言'/)
    expect(pageSource).toContain('aria-hidden="true"')
  })

  it('exposes password-manager friendly login fields', () => {
    expect(formSource).toContain('name="username"')
    expect(formSource).toContain('autocomplete="username"')
    expect(formSource).toContain('autocapitalize="none"')
    expect(formSource).toContain(':spellcheck="false"')
    expect(formSource).toContain('name="password"')
    expect(formSource).toContain('autocomplete="current-password"')
  })

  it.each([
    [320, '260px', '130px'],
    [390, '330px', '165px'],
    [1440, '400px', '200px']
  ])('keeps the captcha inside a %ipx viewport', (viewportWidth, expectedWidth, expectedHeight) => {
    const dimensions = getCaptchaDimensions(viewportWidth)

    expect(dimensions.barSize).toEqual({ width: expectedWidth, height: '46px' })
    expect(dimensions.imgSize).toEqual({ width: expectedWidth, height: expectedHeight })
  })

  it('feeds responsive dimensions into the captcha instead of a fixed desktop width', () => {
    expect(formSource).toContain('useWindowSize')
    expect(formSource).toContain(':barSize="captchaDimensions.barSize"')
    expect(formSource).toContain(':imgSize="captchaDimensions.imgSize"')
    expect(formSource).not.toContain(":barSize=\"{ width: '400px'")
    expect(formSource).not.toContain(":imgSize=\"{ width: '400px'")
    expect(verifySource).not.toContain(':key="componentSizeKey"')
    expect(verifySource).toContain("parseInt(imgSize.width) + 32 + 'px'")
    expect(verifySlideSource).toContain('const syncSize = () =>')
    expect(verifySlideSource).toContain('props.imgSize.width')
    expect(verifySlideSource).toContain('props.barSize.width')
  })

  it('keeps the primary login action visually restrained', () => {
    expect(formSource).toContain('background: var(--el-color-primary);')
    expect(formSource).not.toContain('background: var(--skit-active-gradient);')
  })

  it('keeps the pre-app loading screen consistent with the new product identity', () => {
    expect(documentSource).toContain('<html lang="zh-CN">')
    expect(documentSource).toContain('class="app-loading-brand"')
    expect(documentSource).toContain('正在进入运营工作台')
    expect(documentSource).toContain('@media (prefers-reduced-motion: reduce)')
    expect(documentSource).not.toContain('/logo.gif')
  })
})
