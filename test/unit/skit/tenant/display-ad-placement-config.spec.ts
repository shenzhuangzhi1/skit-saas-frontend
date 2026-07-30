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
  splashPlacementId: 'splash-slot',
  checkInEntryInterstitialPlacementId: 'checkin-slot',
  postCheckInDramaInterstitialPlacementId: 'post-checkin-slot',
  homeBannerPlacementId: 'home-banner-slot',
  takuEnabled: true,
  takuAppKeyConfigured: true
})

describe('tenant display-ad placement configuration', () => {
  it('sanitizes and writes splash plus all display placements without credential leakage', () => {
    const form = sanitizeAdAccountResponse({
      takuAppId: ' taku-app ',
      takuPlacementId: ' reward-slot ',
      splashPlacementId: ' splash-slot ',
      checkInEntryInterstitialPlacementId: ' checkin-slot ',
      postCheckInDramaInterstitialPlacementId: ' post-checkin-slot ',
      homeBannerPlacementId: ' home-banner-slot ',
      takuEnabled: true,
      takuAppKeyConfigured: true,
      takuAppKey: 'must-not-copy'
    })

    expect(form).toMatchObject({
      splashPlacementId: ' splash-slot ',
      checkInEntryInterstitialPlacementId: ' checkin-slot ',
      postCheckInDramaInterstitialPlacementId: ' post-checkin-slot ',
      homeBannerPlacementId: ' home-banner-slot '
    })
    expect(form).not.toHaveProperty('takuAppSecret')
    expect(form.takuAppKey).toBe('')
    expect(buildAdAccountWritePayload(form, { kind: 'own', tenantId: 162 })).toEqual({
      pangleAppId: '',
      panglePlacementId: '',
      pangleEnabled: false,
      takuAppId: 'taku-app',
      takuPlacementId: 'reward-slot',
      splashPlacementId: 'splash-slot',
      checkInEntryInterstitialPlacementId: 'checkin-slot',
      postCheckInDramaInterstitialPlacementId: 'post-checkin-slot',
      homeBannerPlacementId: 'home-banner-slot',
      takuEnabled: true
    })
  })

  it('keeps the Pangle reward Security Key write-only while exposing its placement state', () => {
    const form = sanitizeAdAccountResponse({
      pangleAppId: 'pangle-app',
      panglePlacementId: 'pangle-reward-placement',
      pangleEnabled: true,
      pangleSecretConfigured: true,
      pangleRewardSecurityKeyConfigured: true,
      pangleRewardSecurityKey: 'malicious-response-security-key'
    })

    expect(form).toMatchObject({
      panglePlacementId: 'pangle-reward-placement',
      pangleRewardSecurityKeyConfigured: true,
      pangleRewardSecurityKey: ''
    })
    expect(JSON.stringify(form)).not.toContain('malicious-response-security-key')
    expect(buildAdAccountWritePayload(form, { kind: 'own', tenantId: 162 })).not.toHaveProperty(
      'pangleRewardSecurityKey'
    )
    expect(
      buildAdAccountWritePayload(
        { ...form, pangleRewardSecurityKey: ' newly-entered-security-key ' },
        { kind: 'own', tenantId: 162 }
      )
    ).toMatchObject({
      panglePlacementId: 'pangle-reward-placement',
      pangleRewardSecurityKey: ' newly-entered-security-key '
    })
  })

  it('requires distinct real placements whenever Taku is enabled', () => {
    expect(validateAdAccountForm(enabledForm())).toEqual({ valid: true, error: '' })

    const emptySplash = enabledForm()
    emptySplash.splashPlacementId = ''
    expect(validateAdAccountForm(emptySplash)).toEqual({
      valid: false,
      error: '启用 Taku 时开屏广告位不能为空'
    })

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
      error: 'Taku 的 5 个广告位必须分别使用独立 ID'
    })

    const invalidIdentifier = enabledForm()
    invalidIdentifier.homeBannerPlacementId = 'banner slot with spaces'
    expect(validateAdAccountForm(invalidIdentifier)).toEqual({
      valid: false,
      error: 'Taku 展示广告位 ID 仅支持字母、数字、点、下划线、冒号和连字符'
    })
  })

  it('allows an unchanged legacy enabled account but requires a complete five-placement migration once edited', () => {
    const legacy = sanitizeAdAccountResponse({
      takuAppId: 'taku-app',
      takuPlacementId: 'reward-slot',
      takuEnabled: true,
      takuAppKeyConfigured: true
    })

    expect(validateAdAccountForm(legacy)).toEqual({ valid: true, error: '' })

    legacy.checkInEntryInterstitialPlacementId = 'checkin-slot'
    legacy.splashPlacementId = 'splash-slot'
    expect(validateAdAccountForm(legacy)).toEqual({
      valid: false,
      error: '启用 Taku 时签到后首播插屏广告位不能为空'
    })
  })

  it('renders splash after reward plus the three scene-specific inputs and exposes their API contract', () => {
    const editor = read('src/views/skit/tenant/AdAccessEditor.vue')
    const api = read('src/api/skit/tenant/index.ts')

    expect(editor).toContain('签到页插屏广告位')
    expect(editor).toContain('签到后首播插屏')
    expect(editor).toContain('首页 Banner 广告位')
    expect(editor).toContain('accountForm.checkInEntryInterstitialPlacementId')
    expect(editor).toContain('label="开屏广告位" :required="accountForm.takuEnabled"')
    expect(editor).toContain('accountForm.splashPlacementId')
    expect(editor).toContain('accountForm.postCheckInDramaInterstitialPlacementId')
    expect(editor).toContain('accountForm.homeBannerPlacementId')
    expect((api.match(/splashPlacementId\?: string/g) || []).length).toBe(3)
    expect(api).toContain('checkInEntryInterstitialPlacementId?: string')
    expect(api).toContain('postCheckInDramaInterstitialPlacementId?: string')
    expect(api).toContain('homeBannerPlacementId?: string')
    expect(editor).toContain('label="Pangle 激励广告位"')
    expect(editor).toContain('accountForm.panglePlacementId')
    expect(editor).toContain('pangleRewardSecurityKeyConfigured')
    expect(editor).toContain('奖励 Security Key')
    expect(api).toContain('pangleRewardSecurityKey?: string')
    expect(api).toContain('pangleRewardSecurityKeyConfigured?: boolean')

    const nginx = read('deploy/nginx.conf')
    const pangleRoute = 'location ^~ /app-api/skit/ad-callback/pangle/ {'
    const genericRoute =
      'location ~ ^/(admin-api|app-api|infra/ws|druid|doc.html|swagger-ui|jmreport|drag|admin/applications) {'
    expect(nginx).toContain(pangleRoute)
    expect(nginx.indexOf(pangleRoute)).toBeLessThan(nginx.indexOf(genericRoute))
    expect(nginx).toContain('access_log off;')
    expect(nginx).toContain('error_log /dev/null crit;')
  })
})
