import { expect, test, type Page } from '@playwright/test'

import { installProductApiFixture, seedAuthenticatedProductSession } from './fixtures/productApi'

const ICONIFY_HOSTS = new Set(['api.iconify.design', 'api.simplesvg.com', 'api.unisvg.com'])

const retainedSurfaces = [
  { name: 'Home', path: '/index' },
  { name: 'Profile', path: '/user/profile' },
  { name: 'API Error Log', path: '/skit/general/api-error-log' },
  { name: 'Ad Consumption', path: '/skit/ad-consumption' },
  { name: 'Ad Monitor', path: '/skit/ad-record' },
  { name: 'Tenant Agents', path: '/skit/user-center/agents' },
  { name: 'Application Users', path: '/skit/user-center/users' },
  { name: 'Notifications', path: '/user/notify-message' }
]

const expectRenderedIcons = async (page: Page, surface: string) => {
  await expect(page.locator('#app')).not.toBeEmpty()
  const icons = page.locator('svg.iconify')
  await expect
    .poll(() => icons.count(), { message: `${surface} must render product icons` })
    .toBeGreaterThan(0)

  const emptyIcons = await icons.evaluateAll((nodes) =>
    nodes
      .map((node, index) => ({ index, body: node.innerHTML.trim() }))
      .filter(({ body }) => body.length === 0)
  )
  expect(emptyIcons, `${surface} contains an empty product SVG`).toEqual([])
}

test('retained product icons render locally with Iconify networks blocked', async ({ page }) => {
  const remoteIconRequests: string[] = []
  const missingIconMessages: string[] = []
  const pageErrors: string[] = []
  const unexpectedRequestFailures: string[] = []

  await page.route(
    (url) => ICONIFY_HOSTS.has(url.hostname),
    async (route) => {
      remoteIconRequests.push(route.request().url())
      await route.abort('blockedbyclient')
    }
  )
  page.on('request', (request) => {
    if (ICONIFY_HOSTS.has(new URL(request.url()).hostname)) {
      remoteIconRequests.push(request.url())
    }
  })
  page.on('console', (message) => {
    const text = message.text()
    if (/icon|svg/i.test(text) && /missing|not found|failed to load/i.test(text)) {
      missingIconMessages.push(text)
    }
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.stack || error.message)
  })
  page.on('requestfailed', (request) => {
    const hostname = new URL(request.url()).hostname
    if (!ICONIFY_HOSTS.has(hostname)) {
      unexpectedRequestFailures.push(
        `${request.failure()?.errorText || 'unknown failure'} ${request.url()}`
      )
    }
  })

  await installProductApiFixture(page)

  await page.goto('/login')
  const loginPassword = page.locator('#skit-login-password')
  await expect(loginPassword).toBeVisible({ timeout: 15_000 })
  await expectRenderedIcons(page, 'Login')
  await expect(loginPassword).toHaveAttribute('type', 'password')
  await loginPassword.fill('product-icon-smoke')
  await loginPassword.locator('xpath=../..').locator('.el-input__suffix .el-input__icon').click()
  await expect(loginPassword).toHaveAttribute('type', 'text')

  await seedAuthenticatedProductSession(page)

  for (const surface of retainedSurfaces) {
    await page.goto(surface.path)
    await expect(page).toHaveURL(new RegExp(`${surface.path.replaceAll('/', '\\/')}(?:\\?.*)?$`))
    await expect(page.locator('.header-theme-toggle')).toBeVisible({ timeout: 15_000 })
    await expectRenderedIcons(page, surface.name)
  }

  await page.goto('/skit/general/api-error-log')
  await page.getByRole('button', { name: '详细' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectRenderedIcons(page, 'API Error Log dialog')
  await page.keyboard.press('Escape')

  await page.goto('/index')
  const themeToggle = page.locator('.header-theme-toggle')
  const initialThemeLabel = await themeToggle.getAttribute('aria-label')
  await themeToggle.click()
  await expect(themeToggle).not.toHaveAttribute('aria-label', initialThemeLabel || '')

  const screenfull = page.locator('.v-screenfull')
  await screenfull.click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  await screenfull.click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)

  const tag = page.locator('[class*="tags-view__item"]').first()
  await tag.click({ button: 'right' })
  const visibleContextMenu = page.locator('.v-context-menu-popper:visible')
  await expect(visibleContextMenu).toHaveCount(1)
  await expect(visibleContextMenu).toBeVisible()
  await expectRenderedIcons(page, 'TagsView context menu')

  await page.goto('/user/profile')
  await page.getByRole('tab').nth(1).click()
  const profilePassword = page.locator('.v-input-password input').first()
  await expect(profilePassword).toHaveAttribute('type', 'password')
  await page.locator('.v-input-password .el-input__icon').first().click()
  await expect(profilePassword).toHaveAttribute('type', 'text')
  await expectRenderedIcons(page, 'Profile password controls')

  expect(remoteIconRequests, 'Iconify remote APIs must remain unused').toEqual([])
  expect(missingIconMessages, 'console must not report missing product icons').toEqual([])
  expect(pageErrors, 'retained product surfaces must not raise page errors').toEqual([])
  expect(unexpectedRequestFailures, 'retained product requests must not fail').toEqual([])
})
