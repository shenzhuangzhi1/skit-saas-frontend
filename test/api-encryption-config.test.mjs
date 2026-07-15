import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const baseEnvironment = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const axiosService = readFileSync(
  new URL('../src/config/axios/service.ts', import.meta.url),
  'utf8'
)

test('production does not bundle the optional framework API encryption keys', () => {
  assert.match(baseEnvironment, /^VITE_APP_API_ENCRYPT_ENABLE[ \t]*=[ \t]*false[ \t]*$/m)
  assert.doesNotMatch(
    baseEnvironment,
    /^VITE_APP_API_ENCRYPT_(?:REQUEST|RESPONSE)_KEY[ \t]*=[ \t]*\S+/m
  )
  assert.match(axiosService, /ApiEncrypt\.isEnabled\(\)\s*&&\s*\(config!/)
})
