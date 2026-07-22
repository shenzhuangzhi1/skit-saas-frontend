export interface SkitColumn {
  prop: string
  label: string
  minWidth?: number
  width?: number
}

export interface SkitSearchField {
  prop: string
  label: string
  type?: 'input' | 'select' | 'dateRange'
}

export interface SkitFormSection {
  title: string
  fields: SkitSearchField[]
}

export interface SkitPageConfig {
  key: string
  title: string
  parent?: string
  liveRoute: string
  apiPath: string
  totalRows?: number
  status?: 'ready' | 'empty' | 'broken'
  description: string
  columns: SkitColumn[]
  searchFields: SkitSearchField[]
  toolbar: string[]
  operateMode?: 'icons' | 'detail'
  sections?: SkitFormSection[]
}

export interface SkitMenuItem {
  key: string
  title: string
  routeName: string
  totalRows?: number
  status?: SkitPageConfig['status']
}

export interface SkitMenuGroup {
  title: string
  items: SkitMenuItem[]
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
    liveRoute: '/manystore/general/attachment?addtabs=1',
    apiPath: '/admin-api/skit/general/attachments',
    totalRows: 2,
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
    liveRoute: '/manystore/general/log?addtabs=1',
    apiPath: '/admin-api/skit/general/operation-logs',
    totalRows: 147,
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
    liveRoute: '/manystore/duanju?addtabs=1',
    apiPath: '/admin-api/skit/duanju/dramas',
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
      ['publishStatus', '上架状态', 'select'],
      ['createtime', '创建时间', 'dateRange'],
      ['updatetime', '更新时间', 'dateRange']
    ]),
    toolbar: ['刷新', '导入 SDK 剧单', '添加', '编辑', '删除', '上架', '下架']
  },
  adRecord: {
    key: 'adRecord',
    title: '广告监控',
    liveRoute: '/skit/ad-record',
    apiPath: '/admin-api/skit/tenant/ad-events/page',
    description: '只读查看服务端验证广告事件、平台回调轨迹、对账差异和分成分录。',
    columns: cols([
      ['id', 'ID', 80],
      ['sessionId', '广告会话', 220],
      ['memberId', '会员ID', 100],
      ['provider', '平台', 100],
      ['sourceVerificationStatus', '证据状态', 150],
      ['rewardQualificationStatus', '奖励资格', 150],
      ['reconciliationStatus', '收益状态', 150],
      ['estimatedAmount', '预估收益', 120],
      ['reconciledAmount', '已对账收益', 130],
      ['occurredTime', '发生时间', 170]
    ]),
    searchFields: fields([
      ['memberId', '会员ID'],
      ['adAccountId', '广告账号ID'],
      ['provider', '平台', 'select'],
      ['reconciliationStatus', '收益状态', 'select'],
      ['currency', '币种'],
      ['occurredTime', '发生时间', 'dateRange']
    ]),
    toolbar: ['刷新', '查看轨迹'],
    operateMode: 'detail'
  },
  withdraw: {
    key: 'withdraw',
    title: '积分提现',
    liveRoute: '/manystore/duanju/withdraw?addtabs=1',
    apiPath: '/admin-api/skit/duanju/withdraws',
    totalRows: 26,
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
      ['withdraw_type', '提现类型', 'select'],
      ['account_type', '账号类型', 'select'],
      ['account', '收款账号'],
      ['money', '提现金额'],
      ['fee', '手续费'],
      ['real_money', '到账金额'],
      ['score', '冻结积分'],
      ['status', '状态', 'select'],
      ['review_mode', '审核方式', 'select'],
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
    liveRoute: '/manystore/duanju/score_log?addtabs=1',
    apiPath: '/admin-api/skit/duanju/score-logs',
    totalRows: 1936,
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
    liveRoute: '/manystore/duanju/user_login_record?addtabs=1',
    apiPath: '/admin-api/skit/duanju/user-login-records',
    totalRows: 1342,
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
      ['login_type', '登录方式', 'select'],
      ['device_platform', '设备平台', 'select'],
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
    liveRoute: '/manystore/duanju/user_info_log?addtabs=1',
    apiPath: '/admin-api/skit/duanju/user-info-logs',
    totalRows: 153,
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
      ['device_platform', '设备平台', 'select'],
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
      ['is_vpn', 'VPN', 'select'],
      ['is_proxy', '代理', 'select'],
      ['is_emulator', '模拟器', 'select'],
      ['is_root', 'Root', 'select'],
      ['is_developer_mode', '开发者模式', 'select'],
      ['is_usb_debug', 'USB调试', 'select'],
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
  user: {
    key: 'user',
    title: '用户管理',
    liveRoute: '/manystore/user/user?addtabs=1',
    apiPath: '/admin-api/skit/users',
    totalRows: 1258,
    description: '管理用户积分、余额、邀请码、直属用户、分佣比例和封禁状态。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['nickname', '昵称', 150],
      ['email', '电子邮箱', 180],
      ['invite_code', '邀请码', 120],
      ['direct_user_count', '直属用户', 110],
      ['ad_reward_ratio', '本人分佣比例', 140],
      ['avatar', '头像', 90],
      ['score', '积分', 100],
      ['money', '余额', 100],
      ['ban_status_text', '封禁状态', 110],
      ['ban_reason', '封禁原因', 180],
      ['logintime', '登录时间', 170],
      ['loginip', '登录IP', 140],
      ['jointime', '加入时间', 170],
      ['status', '状态', 100],
      ['operate', '操作', 200]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['nickname', '昵称'],
      ['email', '电子邮箱'],
      ['invite_code', '邀请码'],
      ['ad_reward_ratio', '本人分佣比例'],
      ['score', '积分'],
      ['money', '余额'],
      ['ban_reason', '封禁原因'],
      ['logintime', '登录时间', 'dateRange'],
      ['loginip', '登录IP'],
      ['jointime', '加入时间', 'dateRange'],
      ['status', '状态', 'select']
    ]),
    toolbar: ['刷新', '编辑', '普通搜索', '切换列', '导出数据', '直属用户', '调整积分', '封号']
  },
  announcement: {
    key: 'announcement',
    title: '公告管理',
    liveRoute: '/manystore/duanju/announcement?addtabs=1',
    apiPath: '/admin-api/skit/duanju/announcements',
    totalRows: 2,
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
  },
  douyinMiniProgram: {
    key: 'douyinMiniProgram',
    title: '抖音小程序',
    parent: '抖音管理',
    liveRoute: '/manystore/duanju/douyin_mini_program?addtabs=1',
    apiPath: '/admin-api/skit/douyin/mini-programs',
    description: '维护抖音小程序 AppID、广告基础积分、分佣、提现配置和 AccessToken 状态。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['name', '小程序名称', 160],
      ['appid', 'AppID', 190],
      ['appsecret', 'AppSecret', 220],
      ['ad_base_score', '广告基础积分', 130],
      ['max_ad_score', '最高积分', 110],
      ['withdraw_min_amount', '最低提现金额', 140],
      ['withdraw_fee_rate', '提现手续费比例(%)', 170],
      ['withdraw_fixed_fee', '提现固定手续费', 160],
      ['access_token_expiretime', 'AccessToken过期时间', 190],
      ['status', '状态', 100],
      ['createtime', '创建时间', 170],
      ['updatetime', '更新时间', 170],
      ['operate', '操作', 150]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['name', '小程序名称'],
      ['appid', 'AppID'],
      ['ad_base_score', '广告基础积分'],
      ['max_ad_score', '最高积分'],
      ['withdraw_min_amount', '最低提现金额'],
      ['withdraw_fee_rate', '提现手续费比例(%)'],
      ['withdraw_fixed_fee', '提现固定手续费'],
      ['access_token_expiretime', 'AccessToken过期时间', 'dateRange'],
      ['access_token_updatetime', 'AccessToken 刷新时间', 'dateRange'],
      ['status', '状态', 'select'],
      ['createtime', '创建时间', 'dateRange'],
      ['updatetime', '更新时间', 'dateRange']
    ]),
    toolbar: ['刷新', '添加', '编辑', '普通搜索', '切换列', '导出数据']
  },
  douyinLoginRecord: {
    key: 'douyinLoginRecord',
    title: '抖音登录记录',
    parent: '抖音管理',
    liveRoute: '/manystore/duanju/douyin_mini_program_login_record?addtabs=1',
    apiPath: '/admin-api/skit/douyin/login-records',
    totalRows: 1303,
    description: '记录抖音小程序用户登录、OpenID、设备、宿主 App 和 IP 信息。',
    columns: cols([
      ['0', '选择', 48],
      ['id', 'ID', 80],
      ['mini_program_text', '小程序', 170],
      ['appid', 'AppID', 190],
      ['user_id', '用户ID', 100],
      ['user_text', '用户', 170],
      ['nickname', '昵称', 150],
      ['mobile', '手机号', 130],
      ['scene', '记录场景', 120],
      ['ad_slot', '广告位', 110],
      ['rewarded_count', '奖励次数', 110],
      ['device_platform', '设备平台', 120],
      ['device_brand', '手机品牌', 120],
      ['device_model', '手机型号', 140],
      ['os_name', '操作系统', 120],
      ['os_version', '系统版本', 120],
      ['host_app_name', '宿主APP名称', 150],
      ['host_app_version', '宿主App版本号', 160],
      ['ip', 'IP', 140],
      ['createtime', '创建时间', 170]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['mini_program_id', '小程序ID'],
      ['appid', 'AppID'],
      ['user_id', '用户ID'],
      ['third_id', 'Third ID'],
      ['openid', 'OpenID'],
      ['unionid', 'UnionID'],
      ['anonymous_openid', '匿名 OpenID'],
      ['nickname', '昵称'],
      ['mobile', '手机号'],
      ['scene', '记录场景'],
      ['ad_slot', '广告位'],
      ['rewarded_count', '奖励次数'],
      ['device_platform', '设备平台'],
      ['device_brand', '手机品牌'],
      ['device_model', '手机型号'],
      ['os_name', '操作系统'],
      ['os_version', '系统版本'],
      ['android_version', '安卓版本'],
      ['host_app_name', '宿主APP名称'],
      ['host_app_version', '宿主App版本号'],
      ['app_version', '小游戏版本'],
      ['app_build', 'Build 号'],
      ['network_type', '网络类型'],
      ['screen_size', '屏幕'],
      ['language', '语言'],
      ['timezone', '时区'],
      ['ip', 'IP'],
      ['user_agent', 'User-Agent'],
      ['createtime', '创建时间', 'dateRange'],
      ['updatetime', '更新时间', 'dateRange']
    ]),
    toolbar: ['刷新', '普通搜索', '切换列', '导出数据']
  },
  douyinAdRecord: {
    key: 'douyinAdRecord',
    title: '抖音广告记录',
    parent: '抖音管理',
    liveRoute: '/manystore/duanju/douyin_mini_program_ad_record?addtabs=1',
    apiPath: '/admin-api/skit/douyin/ad-records',
    totalRows: 717,
    description: '记录抖音小程序广告展示收益、来源、设备和宿主版本信息。',
    columns: cols([
      ['id', 'ID', 80],
      ['mini_program_text', '小程序', 170],
      ['openid', 'OpenID', 240],
      ['nickname', '昵称', 140],
      ['ad_type', '广告类型', 120],
      ['ad_time', '广告时间', 170],
      ['ad_revenue', '广告收益', 120],
      ['source', '来源', 140],
      ['ip', 'IP', 140],
      ['city', '城市', 120],
      ['device_brand', '手机品牌', 120],
      ['device_model', '手机型号', 140],
      ['host_app_version', '宿主App版本号', 160]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['appid', 'AppID'],
      ['third_id', 'Third ID'],
      ['openid', 'OpenID'],
      ['nickname', '昵称'],
      ['ad_type', '广告类型'],
      ['ad_time', '广告时间', 'dateRange'],
      ['ad_revenue', '广告收益'],
      ['source', '来源'],
      ['ip', 'IP'],
      ['city', '城市'],
      ['device_brand', '手机品牌'],
      ['device_model', '手机型号'],
      ['host_app_version', '宿主App版本号']
    ]),
    toolbar: ['刷新', '普通搜索', '切换列', '导出数据']
  },
  douyinTrafficRecord: {
    key: 'douyinTrafficRecord',
    title: '抖音投流记录',
    parent: '抖音管理',
    liveRoute: '/manystore/duanju/douyin_mini_program_traffic_record?addtabs=1',
    apiPath: '/admin-api/skit/douyin/traffic-records',
    totalRows: 34513,
    description: '记录巨量/抖音投流回传参数、设备标识、广告计划、创意和去重 Hash。',
    columns: cols([
      ['id', 'ID', 80],
      ['type', '事件类型', 120],
      ['request_time', '请求时间', 170],
      ['request_ip', '请求IP', 140],
      ['param_ip', '投流IP', 140],
      ['os', '系统', 100],
      ['model', '设备型号', 150],
      ['csite', 'csite', 110],
      ['sl', 'sl', 110],
      ['callback_url', 'Callback URL', 260],
      ['callback_status', '是否回调', 110]
    ]),
    searchFields: fields([
      ['id', 'ID'],
      ['type', '事件类型', 'select'],
      ['request_time', '请求时间', 'dateRange'],
      ['request_ip', '请求IP'],
      ['param_ip', '投流IP'],
      ['oaid', 'OAID'],
      ['idfa', 'IDFA'],
      ['androidid', 'Android ID'],
      ['caid', 'CAID'],
      ['os', '系统', 'select'],
      ['model', '设备型号'],
      ['geo', '地理位置'],
      ['city_code', '城市编码'],
      ['csite', 'csite'],
      ['site', 'site'],
      ['union_site', 'union_site'],
      ['sl', 'sl'],
      ['ts', '投流时间戳'],
      ['callback', 'Callback'],
      ['callback_url', 'Callback URL'],
      ['advertiser_id', '广告主 ID'],
      ['promotion_id', '广告 ID'],
      ['project_id', '项目 ID'],
      ['aid', '计划 ID'],
      ['aid_name', '计划名称'],
      ['cid', '创意 ID'],
      ['cid_name', '创意名称'],
      ['campaign_id', '广告组 ID'],
      ['campaign_name', '广告组名称'],
      ['convert_id', '转化 ID'],
      ['request_id', '请求 ID'],
      ['track_id', '跟踪 ID'],
      ['outerid', 'outerid'],
      ['productid', 'productid'],
      ['request_path', '请求路径'],
      ['url', '完整 URL'],
      ['user_agent', 'User-Agent'],
      ['ua', '投流 UA'],
      ['dedupe_hash', '去重 Hash'],
      ['createtime', '创建时间', 'dateRange'],
      ['updatetime', '更新时间', 'dateRange']
    ]),
    toolbar: ['刷新', '普通搜索', '切换列', '导出数据']
  }
}

export const skitMenuGroups: SkitMenuGroup[] = [
  {
    title: '常规管理',
    items: [
      { key: 'attachment', title: '附件管理', routeName: 'SkitAttachment', totalRows: 2 },
      { key: 'operationLog', title: '操作日志', routeName: 'SkitOperationLog', totalRows: 147 }
    ]
  },
  {
    title: '短剧运营',
    items: [
      { key: 'drama', title: '短剧管理', routeName: 'SkitDrama' },
      { key: 'adRecord', title: '广告监控', routeName: 'SkitAdRecord' },
      { key: 'withdraw', title: '积分提现', routeName: 'SkitWithdraw', totalRows: 26 },
      { key: 'scoreLog', title: '积分记录', routeName: 'SkitScoreLog', totalRows: 1936 },
      { key: 'loginRecord', title: '登录记录', routeName: 'SkitLoginRecord', totalRows: 1342 },
      { key: 'deviceLog', title: '设备日志', routeName: 'SkitDeviceLog', totalRows: 153 },
      { key: 'user', title: '代理商管理', routeName: 'SkitAgentManagement' },
      { key: 'announcement', title: '公告管理', routeName: 'SkitAnnouncement', totalRows: 2 }
    ]
  }
]

export const statusText: Record<NonNullable<SkitPageConfig['status']>, string> = {
  ready: '已观测',
  empty: '线上空状态',
  broken: '线上 404'
}
