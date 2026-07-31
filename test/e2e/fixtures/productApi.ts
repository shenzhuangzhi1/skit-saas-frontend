import type { Page, Route } from '@playwright/test'

const user = {
  id: 1,
  username: 'product-smoke',
  nickname: 'Product Smoke',
  deptId: 1,
  avatar: ''
}

const profile = {
  ...user,
  dept: { id: 1, name: 'Skit' },
  roles: [{ id: 1, name: '超级管理员' }],
  posts: [{ id: 1, name: '发布验证' }],
  email: 'smoke@example.invalid',
  mobile: '13800000000',
  sex: 1,
  status: 0,
  remark: '',
  loginIp: '127.0.0.1',
  loginDate: '2026-07-31T00:00:00.000Z',
  createTime: '2026-07-31T00:00:00.000Z'
}

const apiError = {
  id: 1,
  traceId: 'product-icon-smoke',
  userId: 1,
  userType: 2,
  userIp: '127.0.0.1',
  userAgent: 'Playwright',
  applicationName: 'skit-saas-server',
  requestMethod: 'GET',
  requestUrl: '/smoke',
  requestParams: '{}',
  exceptionTime: '2026-07-31T00:00:00.000Z',
  exceptionName: 'ProductIconSmoke',
  exceptionMessage: 'fixture',
  processStatus: 0
}

const attachmentRecord = {
  id: 501,
  pageKey: 'attachment',
  rowKey: 'attachment-product-icon-smoke',
  recordData: {
    id: 501,
    preview: 'fixture',
    filename: 'smoke-attachment.png',
    filesize: '12 KB',
    imagewidth: 320,
    imageheight: 180,
    imagetype: 'png',
    storage: 'fixture',
    mimetype: 'image/png',
    createtime: '2026-07-31T00:00:00.000Z'
  },
  status: 0,
  sort: 0,
  createTime: '2026-07-31T00:00:00.000Z',
  updateTime: '2026-07-31T00:00:00.000Z'
}

const responseData = (url: URL) => {
  const path = url.pathname.replace(/^\/admin-api/, '')

  if (path === '/system/auth/get-permission-info') {
    return {
      user,
      roles: ['super_admin'],
      permissions: ['*:*:*'],
      menus: []
    }
  }
  if (path === '/system/dict-data/simple-list') return []
  if (path === '/system/user/profile/get') return profile
  if (path === '/infra/api-error-log/page') return { list: [apiError], total: 1 }
  if (path === '/skit/admin-record/page') {
    return url.searchParams.get('pageKey') === 'attachment'
      ? { list: [attachmentRecord], total: 1 }
      : { list: [], total: 0 }
  }
  if (path === '/system/notify-message/get-unread-list') return []
  if (path === '/system/notify-message/get-unread-count') return 0
  if (path.endsWith('/page') || path.endsWith('/my-page')) return { list: [], total: 0 }
  if (path.includes('/overview')) return {}
  if (path.includes('/timeseries')) return []
  if (path.includes('/invitation')) {
    return {
      tenantId: 1,
      tenantCode: 'smoke',
      tenantName: 'Product Smoke',
      roles: ['super_admin']
    }
  }
  return {}
}

const fulfillProductApi = async (route: Route) => {
  const url = new URL(route.request().url())
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      code: 0,
      data: responseData(url),
      msg: 'success'
    })
  })
}

export const installProductApiFixture = async (page: Page) => {
  await page.route('**/admin-api/**', fulfillProductApi)
  await page.route('**/hm.baidu.com/**', (route) =>
    route.fulfill({
      status: 204,
      contentType: 'application/javascript',
      body: ''
    })
  )
}

export const seedAuthenticatedProductSession = async (page: Page) => {
  await page.evaluate(
    ({ cachedUser }) => {
      const put = (key: string, value: unknown) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            c: Date.now(),
            e: 253402300799999,
            v: JSON.stringify(value)
          })
        )
      }

      put('ACCESS_TOKEN', 'product-icon-smoke-token')
      put('REFRESH_TOKEN', 'product-icon-smoke-refresh')
      put('tenantId', 1)
      put('user', {
        user: cachedUser,
        roles: ['super_admin'],
        permissions: ['*:*:*'],
        menus: []
      })
    },
    { cachedUser: user }
  )
}
