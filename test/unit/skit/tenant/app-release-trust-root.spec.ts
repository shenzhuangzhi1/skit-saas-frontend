import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('tenant App runtime-update trust root', () => {
  it('models the per-tenant public key and server-derived fingerprint in the API contract', () => {
    const source = readSource('src/api/skit/tenant/index.ts')

    expect(source).toMatch(/runtimeUpdatePublicKey:\s*string/)
    expect(source).toMatch(/runtimeUpdateKeyFingerprint:\s*string/)
    expect(source).toMatch(/hotReleaseNo:\s*number/)
    expect(source).toMatch(/hotManifestSignature:\s*string/)
    expect(source).toMatch(/nativeProtocolVersion:\s*number/)
  })

  it('lets an administrator configure one tenant key and inspect its fingerprint', () => {
    const source = readSource('src/views/skit/tenant/AppReleaseEditor.vue')

    expect(source).toContain('租户热更新 RSA 公钥')
    expect(source).toContain('公钥指纹')
    expect(source).toContain('formData.runtimeUpdatePublicKey')
    expect(source).toContain('formData.runtimeUpdateKeyFingerprint')
    expect(source).not.toContain('SKIT_RUNTIME_UPDATE_PUBLIC_KEY')
  })
})
