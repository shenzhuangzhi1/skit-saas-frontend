export interface SkitColumn {
  prop: string
  label: string
  minWidth?: number
  width?: number
}

export interface SkitSearchField {
  prop: string
  label: string
  type?: 'input' | 'dateRange'
}

export interface SkitPageConfig {
  key: string
  title: string
  parent?: string
  description: string
  columns: SkitColumn[]
  searchFields: SkitSearchField[]
  toolbar: string[]
}

const cols = (items: Array<[string, string, number?]>): SkitColumn[] =>
  items.map(([prop, label, minWidth]) => ({ prop, label, minWidth }))

const fields = (items: Array<[string, string, SkitSearchField['type']?]>): SkitSearchField[] =>
  items.map(([prop, label, type = 'input']) => ({ prop, label, type }))

export const skitPageConfigs: Record<string, SkitPageConfig> = {
  attachment: {
    key: 'attachment',
    title: '附件管理',
    parent: '常规管理',
    description: '管理上传到本地或第三方存储的图片、文档、压缩包等附件。',
    columns: cols([
      ['state', '选择', 48],
      ['id', 'ID', 72],
      ['preview', '预览', 88],
      ['filename', '文件名', 180],
      ['filesize', '文件大小', 110],
      ['imagewidth', '宽度', 90],
      ['imageheight', '高度', 90],
      ['imagetype', '图片类型', 110],
      ['storage', '存储引擎', 110],
      ['mimetype', 'Mime类型', 150],
      ['createtime', '创建日期', 170],
      ['operate', '操作', 130]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['url', '物理路径'],
      ['filename', '文件名'],
      ['filesize', '文件大小'],
      ['imagewidth', '宽度'],
      ['imageheight', '高度'],
      ['imagetype', '图片类型'],
      ['storage', '存储引擎'],
      ['mimetype', 'Mime类型'],
      ['createtime', '创建日期', 'dateRange']
    ]),
    toolbar: ['刷新', '添加', '编辑', '删除', '普通搜索', '切换列', '导出数据']
  },
  operationLog: {
    key: 'operationLog',
    title: '操作日志',
    parent: '常规管理',
    description: '记录后台操作动作、访问链接、IP 和操作时间。',
    columns: cols([
      ['id', 'ID', 80],
      ['title', '标题', 150],
      ['url', '链接', 220],
      ['ip', 'IP地址', 140],
      ['createtime', '操作时间', 170]
    ]),
    searchFields: [],
    toolbar: ['刷新', '切换列', '导出数据']
  },
  drama: {
    key: 'drama',
    title: '短剧管理',
    description: '导入 SDK 返回的剧单后审核上架。总集数、免费集数和解锁范围均以导入内容为准。',
    columns: cols([
      ['state', '选择', 48],
      ['pangleDramaId', '剧目 ID', 110],
      ['title', '短剧标题', 180],
      ['cover', '封面', 140],
      ['category', '分类', 120],
      ['episodes', '总集数', 90],
      ['freeEpisodes', '免费集数', 100],
      ['unlockSize', '解锁范围', 100],
      ['contentStatus', '内容状态', 100],
      ['publishStatus', '上架状态', 100],
      ['createtime', '创建时间', 170],
      ['updatetime', '更新时间', 170],
      ['operate', '操作', 130]
    ]),
    searchFields: fields([
      ['pangleDramaId', '剧目 ID'],
      ['title', '短剧标题'],
      ['category', '分类'],
      ['publishStatus', '上架状态'],
      ['createtime', '创建时间', 'dateRange'],
      ['updatetime', '更新时间', 'dateRange']
    ]),
    toolbar: ['刷新', '导入 SDK 剧单', '添加', '编辑', '删除', '上架', '下架']
  },
  withdraw: {
    key: 'withdraw',
    title: '积分提现',
    description: '处理用户积分提现、手续费、到账金额、审核和微信打款状态。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['user_text', '会员', 160],
      ['withdraw_type', '提现类型', 120],
      ['account_type', '账号类型', 120],
      ['account', '收款账号', 180],
      ['money', '提现金额', 110],
      ['fee', '手续费', 100],
      ['real_money', '到账金额', 110],
      ['score', '冻结积分', 110],
      ['status', '状态', 110],
      ['payment_status_text', '微信状态', 120],
      ['review_mode', '审核方式', 120],
      ['reject_reason', '拒绝原因', 180],
      ['createtime', '申请时间', 170],
      ['audittime', '审核时间', 170],
      ['paytime', '打款时间', 170],
      ['operate', '操作', 150]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['withdraw_type', '提现类型'],
      ['account_type', '账号类型'],
      ['account', '收款账号'],
      ['money', '提现金额'],
      ['fee', '手续费'],
      ['real_money', '到账金额'],
      ['score', '冻结积分'],
      ['status', '状态'],
      ['review_mode', '审核方式'],
      ['reject_reason', '拒绝原因'],
      ['createtime', '申请时间', 'dateRange'],
      ['audittime', '审核时间', 'dateRange'],
      ['paytime', '打款时间', 'dateRange']
    ]),
    toolbar: ['刷新', '普通搜索', '切换列', '导出数据', '审核通过', '审核拒绝']
  },
  scoreLog: {
    key: 'scoreLog',
    title: '积分记录',
    description: '记录积分变更前后值、变更积分和业务备注。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['user_id', '用户ID', 100],
      ['user_text', '用户', 160],
      ['score', '变更积分', 110],
      ['before', '变更前积分', 120],
      ['after', '变更后积分', 120],
      ['memo', '备注', 220],
      ['createtime', '创建时间', 170]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['user_id', '用户ID'],
      ['score', '变更积分'],
      ['before', '变更前积分'],
      ['after', '变更后积分'],
      ['memo', '备注'],
      ['createtime', '创建时间', 'dateRange']
    ]),
    toolbar: ['刷新', '普通搜索', '切换列', '导出数据']
  },
  loginRecord: {
    key: 'loginRecord',
    title: '登录记录',
    description: '记录 App 用户登录方式、设备标识、地理位置、系统版本和 IP。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['user_id', '用户ID', 100],
      ['user_text', '用户', 160],
      ['mobile', '手机号', 130],
      ['login_type', '登录方式', 120],
      ['device_platform', '设备平台', 120],
      ['device_id', '设备ID', 180],
      ['idf', 'IDF', 160],
      ['oaid', 'OAID', 160],
      ['imei', 'IMEI', 160],
      ['location', '地理位置', 160],
      ['province', '省份', 100],
      ['city', '城市', 100],
      ['district', '区县', 100],
      ['device_brand', '手机品牌', 120],
      ['device_model', '手机型号', 140],
      ['os_name', '系统名称', 120],
      ['os_version', '系统版本', 120],
      ['android_version', '安卓版本', 120],
      ['ip', 'IP', 140],
      ['createtime', '登录时间', 170]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['user_id', '用户ID'],
      ['mobile', '手机号'],
      ['login_type', '登录方式'],
      ['device_platform', '设备平台'],
      ['device_id', '设备ID'],
      ['idf', 'IDF'],
      ['idfa', 'IDFA'],
      ['idfv', 'IDFV'],
      ['oaid', 'OAID'],
      ['imei', 'IMEI'],
      ['location', '地理位置'],
      ['latitude', '纬度'],
      ['longitude', '经度'],
      ['country', '国家'],
      ['province', '省份'],
      ['city', '城市'],
      ['district', '区县'],
      ['address', '详细地址'],
      ['device_brand', '手机品牌'],
      ['device_model', '手机型号'],
      ['os_name', '系统名称'],
      ['os_version', '系统版本'],
      ['android_version', '安卓版本'],
      ['app_version', 'App 版本'],
      ['app_build', 'Build 号'],
      ['network_type', '网络类型'],
      ['screen_size', '屏幕'],
      ['language', '语言'],
      ['timezone', '时区'],
      ['ip', 'IP'],
      ['user_agent', 'User-Agent'],
      ['createtime', '登录时间', 'dateRange']
    ]),
    toolbar: ['刷新', '普通搜索', '切换列', '导出数据']
  },
  deviceLog: {
    key: 'deviceLog',
    title: '设备日志',
    description: '记录设备环境、VPN/代理/模拟器/Root 风险状态和 SIM 信息。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['user_id', '用户ID', 100],
      ['user_text', '用户', 160],
      ['log_date', '日志日期', 120],
      ['ip', 'IP', 140],
      ['device_platform', '设备平台', 120],
      ['device_id', '设备ID', 180],
      ['oaid', 'OAID', 160],
      ['android_id', 'Android ID', 160],
      ['device_brand', '手机品牌', 120],
      ['device_model', '手机型号', 140],
      ['os_version', '系统版本', 120],
      ['network_type', '网络类型', 110],
      ['is_vpn', 'VPN', 90],
      ['is_proxy', '代理', 90],
      ['is_emulator', '模拟器', 100],
      ['is_root', 'Root', 90],
      ['is_developer_mode', '开发者模式', 120],
      ['is_usb_debug', 'USB调试', 110],
      ['sim_operator', 'SIM运营商', 130],
      ['location', '位置', 160],
      ['createtime', '创建时间', 170]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['user_id', '用户ID'],
      ['log_date', '日志日期', 'dateRange'],
      ['ip', 'IP'],
      ['device_platform', '设备平台'],
      ['device_id', '设备ID'],
      ['oaid', 'OAID'],
      ['android_id', 'Android ID'],
      ['device_brand', '手机品牌'],
      ['device_model', '手机型号'],
      ['os_name', '系统名称'],
      ['os_version', '系统版本'],
      ['app_version', 'App 版本'],
      ['app_build', 'Build 号'],
      ['package_name', '包名'],
      ['network_type', '网络类型'],
      ['is_vpn', 'VPN'],
      ['is_proxy', '代理'],
      ['is_emulator', '模拟器'],
      ['is_root', 'Root'],
      ['is_developer_mode', '开发者模式'],
      ['is_usb_debug', 'USB调试'],
      ['sim_state', 'SIM 状态'],
      ['sim_operator', 'SIM运营商'],
      ['sim_count', 'SIM 数量'],
      ['install_time', '安装时间', 'dateRange'],
      ['location', '位置'],
      ['latitude', '纬度'],
      ['longitude', '经度'],
      ['info_hash', '信息 Hash'],
      ['user_agent', 'User-Agent'],
      ['createtime', '创建时间', 'dateRange']
    ]),
    toolbar: ['刷新', '普通搜索', '切换列', '导出数据']
  },
  announcement: {
    key: 'announcement',
    title: '公告管理',
    description: '维护短剧 App 公告标题、正文和发布时间。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['title', '标题', 180],
      ['content', '正文', 260],
      ['createtime', '创建时间', 170],
      ['updatetime', '更新时间', 170],
      ['operate', '操作', 130]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['title', '标题'],
      ['content', '正文'],
      ['createtime', '创建时间', 'dateRange'],
      ['updatetime', '更新时间', 'dateRange']
    ]),
    toolbar: ['刷新', '添加', '编辑', '删除', '普通搜索', '切换列', '导出数据']
  }
}
