import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('admin record production API contract', () => {
  it('does not expose the demo record seed endpoint', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/api/skit/adminRecord/index.ts'), 'utf8')

    expect(source).not.toContain('seedSkitAdminRecordPage')
    expect(source).not.toContain('/skit/admin-record/seed')
  })
})
