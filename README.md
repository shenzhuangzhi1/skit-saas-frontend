# Skit SaaS 管理前端

`skit-saas-frontend` 是短剧 SaaS 的运营管理控制台，负责管理侧的数据总览、短剧、广告、积分、租户代理和应用用户等功能。它依赖 Skit 后端 API，不包含移动端播放器或广告 SDK。

> 重要边界：管理前端的单元测试、静态路由合同和生产构建通过，不等于视频播放、广告填充与展示、签名回调、幂等入账、权益解锁和视频切换的广告闭环 E2E 已通过。正式发布仍需在真实客户端、广告平台配置和后端回调链路上完成端到端验收。

## 当前产品范围

当前静态产品路由只提供以下管理能力：

- 数据总览。
- 常规管理：附件、操作日志，以及仅超级管理员可见的 API 错误日志。
- 短剧管理。
- 广告中心：广告消费明细和只读广告监控，面向超级管理员与租户管理员。
- 积分提现、积分记录、登录记录和设备日志。
- 用户中心：代理商管理和应用用户管理，面向超级管理员与租户管理员。
- 公告管理、个人资料和个人站内信。
- 登录、重定向、兼容跳转和 403/404/500 等工具页面。

本仓库不再提供上游通用平台中的商城、BPM/OA、支付、会员、ERP、WMS、CRM、MES、AI、IoT、IM、报表设计、表单设计和富文本编辑等业务域。前端菜单是否展示也不是授权边界；最终权限与租户隔离必须由后端校验。

## 静态路由与构建边界

生产路由由一份显式清单维护，共 **32 条静态路由记录**。该数字包含布局节点、业务页面、隐藏页、兼容重定向和错误页，不代表 32 个可见菜单。

- [产品路由](src/router/productRoutes.ts) 是路由注册、角色过滤菜单和路由合同的共同来源。
- [生产构建边界](build/product-boundary.json) 固定 14 个保留视图入口、禁止进入产物的视图前缀和体积预算。
- [源码清单](config/product-source-inventory.json) 固定保留与退役的源码/API 根目录，并记录 32 条路由合同。
- `pnpm verify:product-build` 校验构建指纹、实际模块图、保留入口、禁用前缀和产物预算。

后端返回的菜单数据不能重新启用已隔离的页面。新增管理能力时，应同时更新路由、源码清单、构建边界和对应合同测试。

## 运行要求

- Node.js `>= 20.19.0`；推荐使用 Node.js 22 LTS。
- 通过 Corepack 使用仓库锁定的 `pnpm@9.15.9`。
- 本地后端 API 可访问；默认联调地址为 `http://localhost:48080`。

```bash
corepack enable
pnpm install --frozen-lockfile
```

## 本地开发

后端服务就绪后运行：

```bash
pnpm dev
```

`pnpm dev` 使用本地环境模式，默认连接 `http://localhost:48080`。需要连接共享开发环境时可运行 `pnpm dev-server`，但应先检查对应环境文件中的 API 地址是否属于当前部署环境。

常用脚本：

| 命令                          | 用途                               |
| ----------------------------- | ---------------------------------- |
| `pnpm dev`                    | 本地联调                           |
| `pnpm dev-server`             | 共享开发环境联调                   |
| `pnpm test:unit`              | 运行 Vitest 单元测试               |
| `node --test test/*.test.mjs` | 运行 Node 合同测试                 |
| `pnpm ts:check`               | TypeScript 类型检查                |
| `pnpm lint`                   | ESLint、Stylelint 和 Prettier 检查 |
| `pnpm build:prod`             | 构建生产产物到 `dist-prod`         |
| `pnpm verify:product-build`   | 审计生产产物的产品边界             |

## 验证与构建

提交前的完整验证：

```bash
pnpm install --frozen-lockfile
pnpm test:unit
node --test test/*.test.mjs
pnpm ts:check
pnpm lint
pnpm build:prod
pnpm verify:product-build
pnpm exec playwright install chromium
pnpm test:icons:browser
```

仓库还提供统一入口：

```bash
./scripts/install-local-hooks.sh
./scripts/verify-local.sh
```

`install-local-hooks.sh` 配置本仓库的 pre-push 门禁。`verify-local.sh` 会安装锁定依赖，执行测试、类型检查和代码风格检查，随后验证生产构建的模块、体积、峰值内存、离线图标与许可证边界，并用 Chromium 在屏蔽 Iconify 网络的条件下巡检保留页面。

生产构建及产物审计：

```bash
pnpm build:prod
pnpm verify:product-build
```

部署相关的 Docker、Nginx 和发布脚本位于 `deploy/`。部署前应使用新生成的 `dist-prod`，不要复用未经构建指纹校验的旧产物。

## 环境模式

| 模式     | 入口                                               | 用途                                   |
| -------- | -------------------------------------------------- | -------------------------------------- |
| 公共配置 | `.env`                                             | 应用标题、端口、租户开关、验证码开关等 |
| 本地     | `.env.local` / `pnpm dev`                          | 本机后端 `http://localhost:48080` 联调 |
| 开发     | `.env.dev` / `pnpm dev-server` 或 `pnpm build:dev` | 共享开发环境                           |
| 测试     | `.env.test` / `pnpm build:test`                    | 测试环境构建                           |
| 预发布   | `.env.stage` / `pnpm build:stage`                  | 预发布环境构建                         |
| 生产     | `.env.prod` / `pnpm build:prod`                    | 生产构建，输出 `dist-prod`             |

环境文件中的 API 地址必须与目标部署一致。生产 API 地址优先由反向代理或部署配置管理，不要把真实密钥、签名材料、广告平台凭据、数据库凭据或个人账号写入前端环境变量。

## 安全提示

- 所有 `VITE_` 变量都可能进入浏览器产物，不能作为秘密存储。
- 不要在 README、提交记录、测试夹具或构建日志中写入登录账号、密码、回调密钥或广告平台凭据。
- 前端角色控制只影响页面可见性；后端必须继续执行身份认证、角色授权和租户隔离。
- 广告监控页面展示的配置或事件状态不能替代真实设备上的展示、奖励和解锁验收。
- 发布前应重新运行生产构建边界检查，并确认环境文件没有沿用演示或测试地址。

## 仓库结构

```text
src/router/                 静态产品路由与菜单筛选
src/views/skit/             Skit 管理业务页面
src/views/{Home,Login,...}/ 保留的公共与工具页面
src/api/skit/               Skit 管理 API 客户端
config/                     产品源码清单
build/                      Vite 配置与生产构建边界
test/                       Node 合同测试与 Vitest 测试
scripts/                    本地门禁和产物验证脚本
deploy/                     Docker、Nginx 与发布脚本
```

## 许可证与上游致谢

本项目使用 [MIT License](LICENSE)，保留许可证文件中的原始版权声明。第三方图标、字体与素材的许可证和署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

当前仓库：[shenzhuangzhi1/skit-saas-frontend](https://github.com/shenzhuangzhi1/skit-saas-frontend)。前端基础能力改造自 [Yudao UI Admin Vue3](https://github.com/yudaocode/yudao-ui-admin-vue3)，其界面基础源自 [vue-element-plus-admin](https://gitee.com/kailong110120130/vue-element-plus-admin)。各上游项目仍分别适用其自身许可证与版权声明。
