import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/views/Home/Index.vue'), 'utf8')

describe('home dashboard metric copy', () => {
  it('labels SHOWN telemetry as a client observation instead of a platform fact', () => {
    expect(source).toContain("label: '客户端展示'")
    expect(source).toContain("hint: '客户端 SHOWN 遥测'")
    expect(source).not.toContain('平台展示事实')
  })
})
