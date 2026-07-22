import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const routes = readFileSync(resolve(process.cwd(), 'src/router/modules/remaining.ts'), 'utf8')
const pageConfig = readFileSync(
  resolve(process.cwd(), 'src/views/skit/admin/pageConfig.ts'),
  'utf8'
)
const home = readFileSync(resolve(process.cwd(), 'src/views/Home/Index.vue'), 'utf8')

describe('agent and app user navigation', () => {
  it('uses a visible two-item left submenu under user management', () => {
    expect(routes).toContain("path: 'user-center'")
    expect(routes).toContain("path: 'agents'")
    expect(routes).toContain("name: 'SkitAgentManagement'")
    expect(routes).toContain("title: '代理商管理'")
    expect(routes).toContain("path: 'users'")
    expect(routes).toContain("name: 'SkitAppUserManagement'")
    expect(routes).toContain("import('@/views/skit/user/index.vue')")
  })

  it('keeps the old user URL as a hidden redirect and updates the management shortcut', () => {
    expect(routes).toContain("redirect: '/skit/user-center/agents'")
    expect(routes).toMatch(/path: 'user',[\s\S]*?hidden: true/)
    expect(pageConfig).toContain("title: '代理商管理', routeName: 'SkitAgentManagement'")
    expect(pageConfig).not.toContain("routeName: 'SkitUser'")
  })

  it('updates the home shortcut to the agent workspace instead of the removed route', () => {
    expect(home).toContain("go('SkitAgentManagement')")
    expect(home).toContain('>代理商管理</el-button>')
    expect(home).not.toContain("go('SkitUser')")
  })
})
