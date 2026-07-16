import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('tenant native App build material', () => {
  it('keeps the API response redacted and exposes write-only material inputs', () => {
    const source = readSource('src/api/skit/tenant/index.ts')
    const editor = readSource('src/views/skit/tenant/AppBuildMaterialEditor.vue')

    expect(source).toMatch(/interface TenantAppBuildMaterialVO/)
    expect(source).toMatch(/pangleSettingsConfigured:\s*boolean/)
    expect(source).toMatch(/signingConfigured:\s*boolean/)
    expect(source).toContain("'/skit/tenant/app-build/material'")
    expect(editor).toContain('仅写入敏感资料')
    expect(editor).toContain('留空表示保留服务端已保存的密文')
    expect(editor).toContain('secrets.pangleSettingsJson')
    expect(editor).toContain('secrets.releaseKeystoreBase64')
    expect(editor).toContain('Object.assign(secrets')
    expect(editor).toContain('APK 暂由本地 Mac 构建，本页面只保存租户构建资料')
    expect(editor).not.toContain('material.takuAppSecret')
  })

  it('keeps native build material separate from the hot-update editor', () => {
    const tenantPage = readSource('src/views/skit/tenant/index.vue')

    expect(tenantPage).toContain('<AppBuildMaterialEditor')
    expect(tenantPage).toContain('<AppReleaseEditor')
  })
})
