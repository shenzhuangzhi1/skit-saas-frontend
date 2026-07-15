import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadEnv } from 'vite'

test('production build enables the login captcha', () => {
  const environment = loadEnv('prod', process.cwd(), 'VITE_')

  assert.equal(
    environment.VITE_APP_CAPTCHA_ENABLE,
    'true',
    'production must render the captcha before submitting admin credentials'
  )
})
