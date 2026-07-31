import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

const retiredPackages = [
  '@microsoft/fetch-event-source',
  '@types/jsoneditor',
  '@types/qrcode',
  '@videojs-player/vue',
  'benz-amr-recorder',
  'bpmn-js',
  'bpmn-js-properties-panel',
  'bpmn-js-token-simulation',
  'camunda-bpmn-moddle',
  'dhtmlx-gantt',
  'diagram-js',
  'driver.js',
  'echarts',
  'echarts-wordcloud',
  'fast-xml-parser',
  'highlight.js',
  'jsbarcode',
  'jsoneditor',
  'livekit-client',
  'markdown-it',
  'markmap-common',
  'markmap-lib',
  'markmap-toolbar',
  'markmap-view',
  'min-dash',
  'mitt',
  'qrcode',
  'snabbdom',
  'sortablejs',
  'steady-xml',
  'tyme4ts',
  'url',
  'video.js',
  'vue3-signature',
  'vuedraggable',
  'xml-js'
]

const retiredSourceRoots = [
  'src/assets/ai',
  'src/assets/audio',
  'src/assets/imgs/diy',
  'src/assets/imgs/iot',
  'src/assets/map',
  'src/assets/svgs/bpm',
  'src/assets/svgs/iot',
  'src/components/AppLinkInput',
  'src/components/Card',
  'src/components/ColorInput',
  'src/components/CountTo',
  'src/components/DeptSelectForm',
  'src/components/Descriptions',
  'src/components/Draggable',
  'src/components/Echart',
  'src/components/InputWithColor',
  'src/components/JsonEditor',
  'src/components/MagicCubeEditor',
  'src/components/MarkdownView',
  'src/components/Map',
  'src/components/Qrcode',
  'src/components/ShortcutDateRangePicker',
  'src/components/SummaryCard',
  'src/components/Tinyflow',
  'src/components/UserSelectForm',
  'src/components/VerticalButtonGroup',
  'src/hooks/web/useEmitt.ts',
  'src/hooks/web/useGuide.ts',
  'src/plugins/echarts',
  'src/api/system/area',
  'src/api/system/dept'
]

test('zero-consumer dependency families stay absent', () => {
  const declared = { ...packageJson.dependencies, ...packageJson.devDependencies }
  assert.deepEqual(
    retiredPackages.filter((dependency) => dependency in declared),
    []
  )

  const tracked = execFileSync('git', ['ls-files', '--', ...retiredSourceRoots], {
    cwd: root,
    encoding: 'utf8'
  })
    .trim()
    .split('\n')
    .filter(Boolean)

  assert.deepEqual(tracked, [])
})
