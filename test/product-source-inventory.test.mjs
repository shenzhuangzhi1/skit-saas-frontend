import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (relativePath) => readFileSync(resolve(repositoryRoot, relativePath), 'utf8')
const inventory = JSON.parse(read('config/product-source-inventory.json'))

const expectedForbidden = {
  viewRoots: [
    'src/views/ai',
    'src/views/bpm',
    'src/views/crm',
    'src/views/erp',
    'src/views/im',
    'src/views/iot',
    'src/views/mall',
    'src/views/member',
    'src/views/mes',
    'src/views/mp',
    'src/views/pay',
    'src/views/report',
    'src/views/wms',
    'src/views/IFrame'
  ],
  apiRoots: [
    'src/api/ai',
    'src/api/bpm',
    'src/api/crm',
    'src/api/erp',
    'src/api/im',
    'src/api/iot',
    'src/api/mall',
    'src/api/member',
    'src/api/mes',
    'src/api/mp',
    'src/api/pay',
    'src/api/wms'
  ],
  mixedViewRoots: [
    'src/views/infra/apiAccessLog',
    'src/views/infra/build',
    'src/views/infra/codegen',
    'src/views/infra/config',
    'src/views/infra/dataSourceConfig',
    'src/views/infra/demo',
    'src/views/infra/druid',
    'src/views/infra/file',
    'src/views/infra/fileConfig',
    'src/views/infra/job',
    'src/views/infra/redis',
    'src/views/infra/server',
    'src/views/infra/skywalking',
    'src/views/infra/swagger',
    'src/views/infra/webSocket',
    'src/views/system/area',
    'src/views/system/dept',
    'src/views/system/dict',
    'src/views/system/loginlog',
    'src/views/system/mail',
    'src/views/system/menu',
    'src/views/system/notice',
    'src/views/system/oauth2',
    'src/views/system/operatelog',
    'src/views/system/post',
    'src/views/system/role',
    'src/views/system/sms',
    'src/views/system/social',
    'src/views/system/tenant',
    'src/views/system/tenantPackage',
    'src/views/system/user',
    'src/views/system/notify/message',
    'src/views/system/notify/template'
  ],
  mixedApiRoots: [
    'src/api/infra/apiAccessLog',
    'src/api/infra/codegen',
    'src/api/infra/config',
    'src/api/infra/dataSourceConfig',
    'src/api/infra/demo',
    'src/api/infra/fileConfig',
    'src/api/infra/job',
    'src/api/infra/jobLog',
    'src/api/infra/redis',
    'src/api/infra/websocket',
    'src/api/system/loginLog',
    'src/api/system/area',
    'src/api/system/dept',
    'src/api/system/mail',
    'src/api/system/menu',
    'src/api/system/notice',
    'src/api/system/oauth2',
    'src/api/system/operatelog',
    'src/api/system/permission',
    'src/api/system/post',
    'src/api/system/role',
    'src/api/system/sms',
    'src/api/system/social',
    'src/api/system/tenant',
    'src/api/system/tenantPackage'
  ],
  supportRoots: [
    'src/assets/ai',
    'src/assets/audio/im',
    'src/assets/imgs/diy',
    'src/assets/imgs/iot',
    'src/assets/map',
    'src/assets/svgs/bpm',
    'src/assets/svgs/iot',
    'src/assets/svgs/pay',
    'src/components/AppLinkInput',
    'src/components/Card',
    'src/components/ColorInput',
    'src/components/CountTo',
    'src/components/DeptSelectForm',
    'src/components/Descriptions',
    'src/components/DiyEditor',
    'src/components/Draggable',
    'src/components/Echart',
    'src/components/Editor',
    'src/components/FormCreate',
    'src/components/InputWithColor',
    'src/components/JsonEditor',
    'src/components/MagicCubeEditor',
    'src/components/Map',
    'src/components/MarkdownView',
    'src/components/OperateLogV2',
    'src/components/Qrcode',
    'src/components/ShortcutDateRangePicker',
    'src/components/SimpleProcessDesignerV2',
    'src/components/SummaryCard',
    'src/components/Tinyflow',
    'src/components/UserSelectForm',
    'src/components/VerticalButtonGroup',
    'src/components/bpmnProcessDesigner',
    'src/plugins/echarts',
    'src/plugins/formCreate',
    'src/store/modules/bpm',
    'src/store/modules/mall',
    'src/styles/FormCreate'
  ],
  supportFiles: [
    'src/assets/imgs/avatar.jpg',
    'src/assets/imgs/profile.jpg',
    'src/assets/imgs/skit/avatar.png',
    'src/assets/imgs/skit/login-head.png',
    'src/assets/imgs/wechat.png',
    'src/assets/svgs/icon.svg',
    'src/assets/svgs/login-bg.svg',
    'src/assets/svgs/login-box-bg.svg',
    'src/assets/svgs/member_balance.svg',
    'src/assets/svgs/member_expenditure_balance.svg',
    'src/assets/svgs/member_level.svg',
    'src/assets/svgs/member_point.svg',
    'src/assets/svgs/member_recharge_balance.svg',
    'src/assets/svgs/message.svg',
    'src/assets/svgs/money.svg',
    'src/assets/svgs/peoples.svg',
    'src/assets/svgs/send.svg',
    'src/assets/svgs/shopping.svg',
    'src/components/Icon/src/IconSelect.vue',
    'src/components/Icon/src/data.ts',
    'src/hooks/web/useEmitt.ts',
    'src/hooks/web/useGuide.ts',
    'src/types/qrcode.d.ts',
    'src/utils/cron.ts',
    'src/utils/file.ts',
    'src/utils/formCreate.ts',
    'src/utils/formatter.ts',
    'src/utils/url.ts',
    'src/utils/websocketTicket.ts',
    'types/wangeditor-types.d.ts'
  ]
}

const expectedRetained = {
  viewRoots: [
    'src/views/Home',
    'src/views/Login',
    'src/views/Profile',
    'src/views/Redirect',
    'src/views/Error',
    'src/views/skit',
    'src/views/infra/apiErrorLog',
    'src/views/system/notify/my'
  ],
  apiRoots: [
    'src/api/skit',
    'src/api/login',
    'src/api/system/dict',
    'src/api/system/user',
    'src/api/system/notify',
    'src/api/infra/file',
    'src/api/infra/apiErrorLog'
  ],
  requiredFiles: [
    'src/api/infra/apiErrorLog/index.ts',
    'src/api/infra/file/index.ts',
    'src/api/login/index.ts',
    'src/api/system/dict/dict.data.ts',
    'src/api/system/dict/dict.type.ts',
    'src/api/system/notify/message/index.ts',
    'src/api/system/notify/template/index.ts',
    'src/api/system/user/index.ts',
    'src/api/system/user/profile.ts',
    'src/config/axios/service.ts',
    'src/router/productRoutes.ts',
    'src/store/modules/dict.ts',
    'src/store/modules/permission.ts',
    'src/store/modules/user.ts',
    'src/utils/auth.ts',
    'src/utils/dict.ts',
    'src/utils/role.ts'
  ]
}

const forbiddenRoots = [
  ...expectedForbidden.viewRoots,
  ...expectedForbidden.apiRoots,
  ...expectedForbidden.mixedViewRoots,
  ...expectedForbidden.mixedApiRoots,
  ...expectedForbidden.supportRoots
]
const retainedRoots = [...expectedRetained.viewRoots, ...expectedRetained.apiRoots]
const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  cwd: repositoryRoot,
  encoding: 'utf8'
})
  .split('\0')
  .filter(Boolean)

const trackedFileSet = new Set(trackedFiles)
const filesUnder = (tracked, root) =>
  [...tracked].filter((path) => path === root || path.startsWith(`${root}/`))

const assertInventoryContract = (candidate, tracked) => {
  assert.equal(candidate.schemaVersion, 2)
  assert.deepEqual(candidate.forbidden, expectedForbidden)
  assert.deepEqual(candidate.retained, expectedRetained)
  assert.deepEqual(candidate.productRouteContract, {
    source: 'src/router/productRoutes.ts',
    recordCount: 32
  })

  const rootViolations = forbiddenRoots
    .map((root) => ({ root, trackedFiles: filesUnder(tracked, root) }))
    .filter(({ trackedFiles: files }) => files.length > 0)
  const fileViolations = expectedForbidden.supportFiles.filter((path) => tracked.has(path))
  assert.deepEqual(
    rootViolations,
    [],
    `quarantined roots contain source: ${rootViolations.map(({ root }) => root).join(', ')}`
  )
  assert.deepEqual(fileViolations, [], `quarantined files returned: ${fileViolations.join(', ')}`)

  const missingRoots = retainedRoots.filter((root) => filesUnder(tracked, root).length === 0)
  const missingFiles = expectedRetained.requiredFiles.filter((path) => !tracked.has(path))
  assert.deepEqual(missingRoots, [], `retained roots disappeared: ${missingRoots.join(', ')}`)
  assert.deepEqual(
    missingFiles,
    [],
    `protected product files disappeared: ${missingFiles.join(', ')}`
  )
}

test('the source inventory schema and exact product boundaries stay pinned', () => {
  assertInventoryContract(inventory, trackedFileSet)
})

test('quarantined domain and support source stays absent', () => {
  const rootViolations = forbiddenRoots
    .map((root) => ({ root, trackedFiles: filesUnder(trackedFileSet, root) }))
    .filter(({ trackedFiles: files }) => files.length > 0)
  const fileViolations = expectedForbidden.supportFiles.filter((path) => trackedFileSet.has(path))

  assert.deepEqual(rootViolations, [])
  assert.deepEqual(fileViolations, [])
})

test('every retained product root and protected file still exists', () => {
  const missingRoots = retainedRoots.filter((root) => filesUnder(trackedFileSet, root).length === 0)
  const missingFiles = expectedRetained.requiredFiles.filter(
    (path) => !trackedFileSet.has(path) || !existsSync(resolve(repositoryRoot, path))
  )

  assert.deepEqual(missingRoots, [])
  assert.deepEqual(missingFiles, [])
})

test('the static product route source still declares exactly 32 records', () => {
  const { source, recordCount } = inventory.productRouteContract
  const routeSource = read(source)
  const declaredRouteNames = routeSource.match(/^\s*name:\s*(?:'[^']*'|PRODUCT_[A-Z0-9_]+),?\s*$/gm)

  assert.equal(declaredRouteNames?.length ?? 0, recordCount)
})

test('negative inventory fixtures reject every protected deletion and retired return path', () => {
  for (const requiredFile of expectedRetained.requiredFiles) {
    const tracked = new Set(trackedFileSet)
    tracked.delete(requiredFile)
    assert.throws(
      () => assertInventoryContract(inventory, tracked),
      /(?:retained roots|protected product files) disappeared/,
      requiredFile
    )
  }

  for (const forbiddenRoot of forbiddenRoots) {
    const tracked = new Set(trackedFileSet)
    tracked.add(`${forbiddenRoot}/__fixture__.ts`)
    assert.throws(
      () => assertInventoryContract(inventory, tracked),
      /quarantined roots contain source/,
      forbiddenRoot
    )
  }

  for (const forbiddenFile of expectedForbidden.supportFiles) {
    const tracked = new Set(trackedFileSet)
    tracked.add(forbiddenFile)
    assert.throws(
      () => assertInventoryContract(inventory, tracked),
      /quarantined files returned/,
      forbiddenFile
    )
  }
})

test('same-change weakening of the canonical inventory cannot pass', () => {
  const mutations = [
    (candidate) => {
      candidate.forbidden.mixedViewRoots = []
    },
    (candidate) => {
      candidate.forbidden.mixedApiRoots = []
    },
    (candidate) => {
      candidate.retained.apiRoots = candidate.retained.apiRoots.filter(
        (root) => root !== 'src/api/system/user'
      )
    },
    (candidate) => {
      candidate.forbidden.viewRoots[0] = 'src/views/not-a-real-retired-domain'
    }
  ]

  for (const mutate of mutations) {
    const candidate = structuredClone(inventory)
    mutate(candidate)
    assert.throws(() => assertInventoryContract(candidate, trackedFileSet))
  }
})
