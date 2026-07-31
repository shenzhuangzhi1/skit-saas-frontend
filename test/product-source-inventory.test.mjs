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
    'src/assets/audio',
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
    'src/assets/imgs/profile.jpg',
    'src/assets/imgs/wechat.png',
    'src/components/Icon/src/IconSelect.vue',
    'src/components/Icon/src/data.ts',
    'src/hooks/web/useEmitt.ts',
    'src/hooks/web/useGuide.ts',
    'src/types/qrcode.d.ts',
    'src/types/wangeditor-types.d.ts',
    'src/utils/cron.ts',
    'src/utils/file.ts',
    'src/utils/formCreate.ts',
    'src/utils/formatter.ts',
    'src/utils/url.ts',
    'src/utils/websocketTicket.ts'
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
    'src/utils/dict.ts'
  ]
}

test('the source inventory schema and exact product boundaries stay pinned', () => {
  assert.equal(inventory.schemaVersion, 2)
  assert.deepEqual(inventory.forbidden, expectedForbidden)
  assert.deepEqual(inventory.retained, expectedRetained)
  assert.deepEqual(inventory.productRouteContract, {
    source: 'src/router/productRoutes.ts',
    recordCount: 32
  })
})

const forbiddenRoots = [
  ...expectedForbidden.viewRoots,
  ...expectedForbidden.apiRoots,
  ...expectedForbidden.mixedViewRoots,
  ...expectedForbidden.mixedApiRoots,
  ...expectedForbidden.supportRoots
]
const retainedRoots = [...expectedRetained.viewRoots, ...expectedRetained.apiRoots]
const inventoryPaths = [
  ...forbiddenRoots,
  ...expectedForbidden.supportFiles,
  ...retainedRoots,
  ...expectedRetained.requiredFiles
]

const trackedFiles = execFileSync('git', ['ls-files', '--', ...inventoryPaths], {
  cwd: repositoryRoot,
  encoding: 'utf8'
})
  .trim()
  .split('\n')
  .filter(Boolean)

const trackedFilesUnder = (root) =>
  trackedFiles.filter((path) => path === root || path.startsWith(`${root}/`))

test('quarantined domain and support source stays absent', () => {
  const rootViolations = forbiddenRoots
    .map((root) => ({ root, trackedFiles: trackedFilesUnder(root) }))
    .filter(({ trackedFiles: files }) => files.length > 0)
  const fileViolations = expectedForbidden.supportFiles.filter((path) =>
    trackedFiles.includes(path)
  )

  assert.deepEqual(rootViolations, [])
  assert.deepEqual(fileViolations, [])
})

test('every retained product root and protected file still exists', () => {
  const missingRoots = retainedRoots.filter((root) => trackedFilesUnder(root).length === 0)
  const missingFiles = expectedRetained.requiredFiles.filter(
    (path) => !trackedFiles.includes(path) || !existsSync(resolve(repositoryRoot, path))
  )

  assert.deepEqual(missingRoots, [])
  assert.deepEqual(missingFiles, [])
})

test('the static product route source still declares exactly 32 records', () => {
  const { source, recordCount } = inventory.productRouteContract
  const routeSource = read(source)
  const declaredRouteNames = routeSource.match(
    /^\s*name:\s*(?:'[^']*'|PRODUCT_[A-Z0-9_]+),?\s*$/gm
  )

  assert.equal(declaredRouteNames?.length ?? 0, recordCount)
})
