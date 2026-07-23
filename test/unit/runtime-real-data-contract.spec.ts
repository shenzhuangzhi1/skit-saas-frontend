import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectPath = (path: string) => resolve(process.cwd(), path)
const readSource = (path: string) => readFileSync(projectPath(path), 'utf8')

describe('runtime real-data contract', () => {
  it('does not ship a demo-login API bypass', () => {
    for (const path of ['.env', '.env.local', '.env.prod', 'types/env.d.ts']) {
      expect(readSource(path)).not.toContain('VITE_SKIT_DEMO_LOGIN')
    }

    const dictSource = readSource('src/api/system/dict/dict.data.ts')
    expect(dictSource).not.toContain('demoDictList')
    expect(dictSource).not.toContain('Promise.resolve')

    const notifySource = readSource('src/api/system/notify/message/index.ts')
    expect(notifySource).not.toContain('isSkitDemoLogin')
    expect(notifySource).not.toMatch(/return\s+\[\]|return\s+0/)
  })

  it('does not publish fabricated management totals or profile values', () => {
    const pageConfigSource = readSource('src/views/skit/admin/pageConfig.ts')
    expect(pageConfigSource).not.toContain('totalRows')
    expect(pageConfigSource).not.toContain('liveRoute')
    expect(pageConfigSource).not.toContain('apiPath')
    expect(pageConfigSource).not.toContain("'select'")
    expect(pageConfigSource).not.toMatch(
      /^\s{2}(adRecord|user|douyinMiniProgram|douyinLoginRecord|douyinAdRecord|douyinTrafficRecord):/m
    )

    const adminTableSource = readSource('src/views/skit/admin/AdminTable.vue')
    expect(adminTableSource).not.toContain('defaultProfileValue')
    expect(adminTableSource).not.toContain('saveProfile')
    expect(adminTableSource).not.toContain('page.sections')
    expect(adminTableSource).not.toContain('123456@qq.com')
    expect(adminTableSource).not.toContain('smtp.example.com')
    expect(adminTableSource).not.toContain("|| '热播'")
    expect(adminTableSource).not.toContain("|| '未命名短剧'")
    expect(adminTableSource).not.toContain("|| '未知'")
    expect(adminTableSource).not.toContain('Number(value) === 0')
    expect(adminTableSource).not.toMatch(/<option value="正常">|<option value="待处理">/)
    expect(adminTableSource).not.toContain('skitPageConfigs.adRecord')
    expect(adminTableSource).toContain(
      'displayTotalRows.value ? (currentPage.value - 1) * pageSize.value + 1 : 0'
    )
  })

  it('starts shared tables at a truthful empty total', () => {
    expect(readSource('src/hooks/web/useTable.ts')).toMatch(/total:\s*0/)
    expect(readSource('src/hooks/web/useTable.ts')).not.toMatch(/total:\s*10/)
    expect(readSource('src/components/Table/src/Table.vue')).toMatch(/total:\s*0/)
    expect(readSource('src/components/Table/src/Table.vue')).not.toMatch(/total:\s*10/)
  })

  it('does not turn malformed tenant paging responses into fake empty lists', () => {
    for (const path of [
      'src/views/skit/tenant/index.vue',
      'src/views/skit/tenant/MemberList.vue',
      'src/views/skit/tenant/CommissionLedger.vue'
    ]) {
      const source = readSource(path)
      expect(source).not.toContain('data.list || []')
      expect(source).not.toContain('Number(data.total || 0)')
      expect(source).toContain('listError')
    }
  })

  it('does not bundle unused sample datasets', () => {
    expect(existsSync(projectPath('src/views/mp/draft/mock.js'))).toBe(false)
    expect(readSource('src/views/mp/draft/index.vue')).not.toContain("from './mock'")
    expect(existsSync(projectPath('src/views/Home/Index2.vue'))).toBe(false)
    expect(existsSync(projectPath('src/views/Home/echarts-data.ts'))).toBe(false)
  })

  it('does not bundle the disconnected AI music sample experience', () => {
    expect(existsSync(projectPath('src/views/ai/music/index/index.vue'))).toBe(true)
    expect(readSource('src/views/ai/music/index/index.vue')).toContain(
      '音乐生成服务尚未接入真实接口'
    )
    expect(existsSync(projectPath('src/views/ai/music/index/list'))).toBe(false)
    expect(existsSync(projectPath('src/views/ai/music/index/mode'))).toBe(false)
    expect(existsSync(projectPath('src/assets/audio/response.mp3'))).toBe(false)
    expect(existsSync(projectPath('src/views/ai/music/manager/index.vue'))).toBe(true)
  })
})
