import { expect, test, type Page } from '@playwright/test'

import { installProductApiFixture, seedAuthenticatedProductSession } from './fixtures/productApi'

const ICONIFY_HOSTS = new Set(['api.iconify.design', 'api.simplesvg.com', 'api.unisvg.com'])

const retainedSurfaces = [
  {
    name: 'Home',
    path: '/index',
    selector: '[class*="tags-view__item"].is-active svg.iconify[data-icon="ep:home-filled"]'
  },
  {
    name: 'Profile',
    path: '/user/profile',
    selector: '.list-group-item svg.iconify[data-icon="fontisto:email"]'
  },
  {
    name: 'API Error Log',
    path: '/skit/general/api-error-log',
    selector: '.el-form svg.iconify[data-icon="ep:download"]'
  },
  {
    name: 'Ad Consumption',
    path: '/skit/ad-consumption',
    selector: '.consumption-page .filter-actions svg.iconify[data-icon="ep:refresh-left"]'
  },
  {
    name: 'Ad Monitor',
    path: '/skit/ad-record',
    selector: '.ad-monitor-page .monitor-filters svg.iconify[data-icon="ep:refresh-left"]'
  },
  {
    name: 'Tenant Agents',
    path: '/skit/user-center/agents',
    selector: 'button:has-text("新增代理商") svg.iconify[data-icon="ep:office-building"]'
  },
  {
    name: 'Application Users',
    path: '/skit/user-center/users',
    selector: '.user-management-page .el-form svg.iconify[data-icon="ep:search"]'
  },
  {
    name: 'Notifications',
    path: '/user/notify-message',
    selector: '.el-form svg.iconify[data-icon="ep:reading"]'
  }
]

const expectRenderedIcon = async (page: Page, surface: string, selector: string) => {
  await expect(page.locator('#app')).not.toBeEmpty()
  const icon = page.locator(`${selector}:visible`).first()
  await expect(icon, `${surface} must render its expected product icon`).toBeVisible({
    timeout: 15_000
  })
  await expect.poll(() => icon.evaluate((node) => node.innerHTML.trim().length)).toBeGreaterThan(0)
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
  await expectRenderedIcon(
    page,
    'Login security notice',
    '.security-note svg.iconify[data-icon="ep:lock"]'
  )
  await expect(loginPassword).toHaveAttribute('type', 'password')
  await loginPassword.fill('product-icon-smoke')
  await loginPassword.locator('xpath=../..').locator('.el-input__suffix .el-input__icon').click()
  await expect(loginPassword).toHaveAttribute('type', 'text')

  await seedAuthenticatedProductSession(page)

  for (const surface of retainedSurfaces) {
    await page.goto(surface.path)
    await expect(page).toHaveURL(new RegExp(`${surface.path.replaceAll('/', '\\/')}(?:\\?.*)?$`))
    await expect(page.locator('.header-theme-toggle')).toBeVisible({ timeout: 15_000 })
    await expectRenderedIcon(page, surface.name, surface.selector)
  }

  await page.goto('/skit/general/api-error-log')
  await page.getByRole('button', { name: '详细' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('ProductIconSmoke')
  await page.keyboard.press('Escape')

  await page.goto('/skit/general/attachment')
  await expect(page.getByText('smoke-attachment.png', { exact: true })).toBeVisible()
  await expectRenderedIcon(
    page,
    'AdminTable view row action',
    '.btn-operate svg.iconify[data-icon="ep:view"]'
  )
  await expectRenderedIcon(
    page,
    'AdminTable edit row action',
    '.btn-operate svg.iconify[data-icon="ep:edit"]'
  )

  await page.goto('/index')
  const themeToggle = page.locator('.header-theme-toggle')
  const initialThemeLabel = await themeToggle.getAttribute('aria-label')
  const initialThemeIcon = await themeToggle
    .locator('svg.iconify[data-icon]')
    .getAttribute('data-icon')
  await themeToggle.click()
  await expect(themeToggle).not.toHaveAttribute('aria-label', initialThemeLabel || '')
  await expect(themeToggle.locator('svg.iconify[data-icon]')).not.toHaveAttribute(
    'data-icon',
    initialThemeIcon || ''
  )

  const screenfull = page.locator('.v-screenfull')
  await expectRenderedIcon(
    page,
    'Fullscreen enter control',
    '.v-screenfull svg.iconify[data-icon="zmdi:fullscreen"]'
  )
  await screenfull.click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true)
  await expectRenderedIcon(
    page,
    'Fullscreen exit control',
    '.v-screenfull svg.iconify[data-icon="zmdi:fullscreen-exit"]'
  )
  await screenfull.click()
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false)

  const tag = page.locator('[class*="tags-view__item"]').first()
  await tag.click({ button: 'right' })
  const visibleContextMenu = page.locator('.v-context-menu-popper:visible')
  await expect(visibleContextMenu).toHaveCount(1)
  await expect(visibleContextMenu).toBeVisible()
  const contextIcons = visibleContextMenu.locator('svg.iconify[data-icon]')
  await expect(contextIcons).toHaveCount(6)
  expect(
    await contextIcons.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-icon')).sort()
    )
  ).toEqual(
    [
      'ep:close',
      'ep:d-arrow-left',
      'ep:d-arrow-right',
      'ep:discount',
      'ep:minus',
      'ep:refresh'
    ].sort()
  )
  expect(
    await contextIcons.evaluateAll(
      (nodes) => nodes.filter((node) => node.innerHTML.trim().length === 0).length
    )
  ).toBe(0)

  await page.goto('/user/profile')
  await page.getByRole('tab').nth(1).click()
  const profilePassword = page.locator('.v-input-password input').first()
  const profilePasswordWrap = page.locator('.v-input-password').first()
  await expect(profilePassword).toHaveAttribute('type', 'password')
  await expectRenderedIcon(
    page,
    'Profile hidden-password control',
    '.v-input-password svg.iconify[data-icon="ep:hide"]'
  )
  await page.locator('.v-input-password .el-input__icon').first().click()
  await expect(profilePassword).toHaveAttribute('type', 'text')
  await expect(profilePasswordWrap.locator('svg.iconify[data-icon="ep:view"]')).toBeVisible()

  expect(remoteIconRequests, 'Iconify remote APIs must remain unused').toEqual([])
  expect(missingIconMessages, 'console must not report missing product icons').toEqual([])
  expect(pageErrors, 'retained product surfaces must not raise page errors').toEqual([])
  expect(unexpectedRequestFailures, 'retained product requests must not fail').toEqual([])
})
