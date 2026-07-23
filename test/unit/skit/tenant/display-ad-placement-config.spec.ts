import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAdAccountWritePayload,
  sanitizeAdAccountResponse,
  validateAdAccountForm
} from '@/views/skit/tenant/workspaceModel'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

const enabledForm = () => ({
  pangleAppId: '',
  pangleAppSecret: '',
  pangleEnabled: false,
  pangleSecretConfigured: false,
  takuAppId: 'taku-app',
  takuAppKey: '',
  takuPlacementId: 'reward-slot',
  checkInEntryInterstitialPlacementId: 'checkin-slot',
  postCheckInDramaInterstitialPlacementId: 'post-checkin-slot',
  homeBannerPlacementId: 'home-banner-slot',
  takuEnabled: true,
  takuAppKeyConfigured: true
})

describe('tenant display-ad placement configuration', () => {
  it('sanitizes and writes all three display placements without credential leakage', () => {
    const form = sanitizeAdAccountResponse({
      takuAppId: ' taku-app ',
      takuPlacementId: ' reward-slot ',
      checkInEntryInterstitialPlacementId: ' checkin-slot ',
      postCheckInDramaInterstitialPlacementId: ' post-checkin-slot ',
      homeBannerPlacementId: ' home-banner-slot ',
      takuEnabled: true,
      takuAppKeyConfigured: true,
      takuAppKey: 'must-not-copy'
    })

    expect(form).toMatchObject({
      checkInEntryInterstitialPlacementId: ' checkin-slot ',
      postCheckInDramaInterstitialPlacementId: ' post-checkin-slot ',
      homeBannerPlacementId: ' home-banner-slot '
    })
    expect(form).not.toHaveProperty('takuAppSecret')
    expect(form.takuAppKey).toBe('')
    expect(buildAdAccountWritePayload(form, { kind: 'own', tenantId: 162 })).toMatchObject({
      checkInEntryInterstitialPlacementId: 'checkin-slot',
      postCheckInDramaInterstitialPlacementId: 'post-checkin-slot',
      homeBannerPlacementId: 'home-banner-slot'
    })
  })

  it('requires distinct real placements whenever Taku is enabled', () => {
    expect(validateAdAccountForm(enabledForm())).toEqual({ valid: true, error: '' })

    for (const field of [
      'checkInEntryInterstitialPlacementId',
      'postCheckInDramaInterstitialPlacementId',
      'homeBannerPlacementId'
    ] as const) {
      const form = enabledForm()
      form[field] = ''
      expect(validateAdAccountForm(form).valid).toBe(false)
    }

    const duplicate = enabledForm()
    duplicate.homeBannerPlacementId = duplicate.takuPlacementId
    expect(validateAdAccountForm(duplicate)).toEqual({
      valid: false,
      error: 'Taku 的 4 个广告位必须分别使用独立 ID'
    })

    const invalidIdentifier = enabledForm()
    invalidIdentifier.homeBannerPlacementId = 'banner slot with spaces'
    expect(validateAdAccountForm(invalidIdentifier)).toEqual({
      valid: false,
      error: 'Taku 展示广告位 ID 仅支持字母、数字、点、下划线、冒号和连字符'
    })
  })

  it('allows an unchanged legacy enabled account but requires a complete display migration once edited', () => {
    const legacy = sanitizeAdAccountResponse({
      takuAppId: 'taku-app',
      takuPlacementId: 'reward-slot',
      takuEnabled: true,
      takuAppKeyConfigured: true
    })

    expect(validateAdAccountForm(legacy)).toEqual({ valid: true, error: '' })

    legacy.checkInEntryInterstitialPlacementId = 'checkin-slot'
    expect(validateAdAccountForm(legacy)).toEqual({
      valid: false,
      error: '启用 Taku 时签到后首播插屏广告位不能为空'
    })
  })

  it('renders the three scene-specific inputs and exposes their API contract', () => {
    const editor = read('src/views/skit/tenant/AdAccessEditor.vue')
    const api = read('src/api/skit/tenant/index.ts')

    expect(editor).toContain('签到页插屏广告位')
    expect(editor).toContain('签到后首播插屏')
    expect(editor).toContain('首页 Banner 广告位')
    expect(editor).toContain('accountForm.checkInEntryInterstitialPlacementId')
    expect(editor).toContain('accountForm.postCheckInDramaInterstitialPlacementId')
    expect(editor).toContain('accountForm.homeBannerPlacementId')
    expect(api).toContain('checkInEntryInterstitialPlacementId?: string')
    expect(api).toContain('postCheckInDramaInterstitialPlacementId?: string')
    expect(api).toContain('homeBannerPlacementId?: string')
  })
})
