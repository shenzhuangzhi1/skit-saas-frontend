import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildAdAccountWritePayload,
  sanitizeAdAccountResponse,
  validateAdAccountForm
} from '@/views/skit/tenant/workspaceModel'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('AG163 configuration bootstrap', () => {
  it('keeps the Taku login account as an allow-listed identity while keeping secrets write-only', () => {
    const form = sanitizeAdAccountResponse({
      takuUsername: '  taku-operator  ',
      takuEnabled: true,
      takuAppId: 'taku-app',
      takuPlacementId: 'rewarded-placement',
      splashPlacementId: 'splash-placement',
      checkInEntryInterstitialPlacementId: 'check-in-placement',
      postCheckInDramaInterstitialPlacementId: 'post-check-in-placement',
      homeBannerPlacementId: 'banner-placement',
      takuAppKeyConfigured: true,
      takuAppKey: 'must-never-be-read'
    })

    expect(form.takuUsername).toBe('  taku-operator  ')
    expect(form.takuAppKey).toBe('')
    expect(validateAdAccountForm({ ...form, takuUsername: '   ' })).toEqual({
      valid: false,
      error: '启用 Taku 时登录账号不能为空'
    })
    expect(
      buildAdAccountWritePayload(
        { ...form, takuUsername: '  taku-operator  ' },
        { kind: 'own', tenantId: 23 }
      )
    ).toMatchObject({ takuUsername: 'taku-operator' })
  })

  it('exposes the safe Taku login-account field and writes it through the API contract', () => {
    const apiSource = readSource('src/api/skit/tenant/index.ts')
    const editorSource = readSource('src/views/skit/tenant/AdAccessEditor.vue')

    expect(apiSource).toMatch(/interface TenantAdAccountWriteFields[\s\S]*takuUsername\?: string/)
    expect(editorSource).toContain('label="Taku 登录账号"')
    expect(editorSource).toContain('v-model="accountForm.takuUsername"')
  })

  it('propagates the selected tenant code and only creates a disabled production draft after explicit operator action', () => {
    const apiSource = readSource('src/api/skit/tenant/index.ts')
    const pageSource = readSource('src/views/skit/tenant/index.vue')
    const editorSource = readSource('src/views/skit/tenant/AppReleaseEditor.vue')
    const releaseProfileContract = apiSource.match(
      /export interface TenantAppReleaseProfileVO \{([\s\S]*?)\n\}/
    )?.[1]

    expect(pageSource).toContain(':tenant-code="selectedAgent.tenantCode"')
    expect(releaseProfileContract).toBeDefined()
    expect(releaseProfileContract).not.toContain('tenantCode')
    expect(editorSource).toContain('tenantCode: string')
    expect(editorSource).toContain('初始化发布档案')
    expect(editorSource).toContain('初始化/修复发布档案')
    expect(editorSource).toContain("channel: 'production'")
    expect(editorSource).toContain('hotReleaseNo: 0')
    expect(editorSource).toContain('nativeProtocolVersion: 1')
    expect(editorSource).toContain('status: 1')
    expect(editorSource).toContain('profileCode: props.tenantCode')
    expect(editorSource).toContain('label="原生包名" prop="nativePackage" required')
    expect(editorSource).toMatch(/nativePackage:\s*\[[\s\S]*?required:\s*true/)
    expect(editorSource).not.toMatch(
      /getTenantAppReleaseProfile\([\s\S]{0,240}updateTenantAppReleaseProfile/
    )
  })
})
