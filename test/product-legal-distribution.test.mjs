import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

import {
  LEGAL_RELEASE_FILES,
  assertLegalDistribution,
  parseLegalChecksums
} from '../scripts/legalDistribution.mjs'

const root = process.cwd()

test('the exact legal payload and upstream notices are release-ready', () => {
  assert.deepEqual(LEGAL_RELEASE_FILES, [
    'SHA256SUMS',
    'THIRD_PARTY_NOTICES.txt',
    'licenses/APACHE-2.0.txt',
    'licenses/CC-BY-4.0.txt',
    'licenses/MIT.txt',
    'licenses/OFL-1.1.txt'
  ])
  assert.deepEqual(assertLegalDistribution({ root }), {
    files: 6,
    checksums: 5,
    bytes: 40405
  })

  const notices = requireNotice()
  for (const row of [
    '`ant-design` | 4.4.2 | MIT',
    '`carbon` | 11.79.0 | Apache-2.0',
    '`emojione-monotone` | 2.2.7 | CC-BY-4.0',
    '`ep` | 2.3.2 | MIT',
    '`fontisto` | 3.0.4 | MIT',
    '`icon-park-outline` | 1.4.2 | Apache-2.0',
    '`ion` | 8.0.13 | MIT',
    '`mdi` | snapshot metadata has no version | Apache-2.0',
    '`radix-icons` | 1.3.2 | MIT',
    '`vaadin` | 4.3.2 | Apache-2.0',
    '`zmdi` | snapshot metadata has no version | OFL-1.1'
  ]) {
    assert.ok(notices.includes(row), row)
  }
  for (const copyright of [
    'Copyright (c) 2018-present Ant UED, https://xtech.antfin.com/',
    'Copyright (c) 2020-PRESENT Element Plus (https://github.com/element-plus)',
    'Copyright (c) 2017 Fontisto(@kenangundogan), Inc.',
    'Copyright (c) 2015-present Ionic (http://ionic.io/)',
    'Copyright (c) 2022 WorkOS',
    'Copyright (c) 2017, 2018 Vjacheslav Trushkin',
    'Copyright 2015 IBM Corp.',
    'Copyright 2019-present Bytedance Inc.',
    'Copyright 2014-2016 Vaadin Ltd.',
    'Sergey Kupletsky'
  ]) {
    assert.ok(notices.includes(copyright), copyright)
  }
  assert.match(notices, /emojione-monotone:crescent-moon/)
  assert.match(notices, /emojione-monotone:sun/)
  assert.match(notices, /No semantic\s+artwork changes were made/)
  assert.match(notices, /does not imply endorsement/)
})

function requireNotice() {
  return readFileSync(resolve(root, 'public/legal/THIRD_PARTY_NOTICES.txt'), 'utf8')
}

function requireFile(path) {
  return readFileSync(path)
}

test('legal checksum parser rejects unsafe, duplicate and incomplete manifests', () => {
  const checksum = '0'.repeat(64)
  assert.throws(() => parseLegalChecksums(`${checksum}  ../escape.txt\n`), /unsafe/)
  assert.throws(
    () => parseLegalChecksums(`${checksum}  licenses/MIT.txt\n${checksum}  licenses/MIT.txt\n`),
    /duplicate/
  )
  assert.throws(() => parseLegalChecksums(`${checksum}  licenses/MIT.txt\n`))
})

test('legal distribution rejects missing, changed and extra release files', async (t) => {
  const fixture = () => {
    const directory = mkdtempSync(join(tmpdir(), 'skit-legal-'))
    cpSync(resolve(root, 'public/legal'), resolve(directory, 'public/legal'), {
      recursive: true
    })
    cpSync(resolve(root, 'THIRD_PARTY_NOTICES.md'), resolve(directory, 'THIRD_PARTY_NOTICES.md'))
    return directory
  }

  await t.test('changed license byte', () => {
    const directory = fixture()
    try {
      writeFileSync(resolve(directory, 'public/legal/licenses/MIT.txt'), 'changed\n')
      assert.throws(() => assertLegalDistribution({ root: directory }), /checksum mismatch/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  await t.test('missing legal file', () => {
    const directory = fixture()
    try {
      rmSync(resolve(directory, 'public/legal/licenses/MIT.txt'))
      assert.throws(() => assertLegalDistribution({ root: directory }))
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  await t.test('extra legal file', () => {
    const directory = fixture()
    try {
      writeFileSync(resolve(directory, 'public/legal/EXTRA.txt'), 'extra\n')
      assert.throws(() => assertLegalDistribution({ root: directory }))
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})

test('Docker verifies legal checksums after copying dist-prod', () => {
  const dockerfile = requireFile(resolve(root, 'deploy/Dockerfile')).toString('utf8')
  assert.match(dockerfile, /COPY dist-prod\/ \/usr\/share\/nginx\/html\//)
  assert.match(dockerfile, /RUN cd \/usr\/share\/nginx\/html\/legal && sha256sum -c SHA256SUMS/)
})
