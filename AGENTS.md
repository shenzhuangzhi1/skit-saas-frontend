# skit-saas-frontend — AI 协作边界（强制）

本文件约束所有 AI 编码助手（Claude Code / Cursor / Hermes / Codex）在本仓库的修改行为。
**违反边界 = 修改必须回退。**

## 绝对禁止修改（逻辑禁区）

以下目录/文件的任何修改（包括"顺手优化""重构""修复注释"）一律禁止：

- `src/api/` — 接口层，所有后端契约
- `src/store/` — 状态管理，含 token/权限/用户状态
- `src/router/` + `src/permission.ts` — 路由与访问控制（动态路由、守卫）
- `src/directives/` — 权限指令（v-hasPermi 等）
- `src/utils/` — 通用工具（request、auth、cookie 等）
- `src/hooks/` — 组合式逻辑
- `src/config/` — 配置
- `src/views/skit/` 下所有 `*.ts` 文件及组件内的 `<script>` 逻辑部分 — 业务逻辑
- `package.json` / `pnpm-lock.yaml` — 依赖版本（新增依赖必须单独提交并说明理由）

## 允许修改（视觉层白名单）

- `src/views/Login/`、`src/views/Home/`、`src/views/Error/` 的**模板结构与样式**（`<template>` 的纯展示节点 + `<style>` 块）
- `src/styles/`（var.css / theme.scss / variables.scss / index.scss）
- `src/layout/` 的**样式**（不碰组件逻辑与菜单/标签页行为）
- 新增独立视觉组件：`src/components/**/visual/` 或页面级 `Visual*.vue`（纯展示、无业务副作用）
- 新增 AGENTS.md 允许的独立文件

## 硬性规则

1. **只改样式层，不重构组件结构**：样式能解决的（class/变量/覆盖）绝不动组件内部逻辑。必须改 `<template>` 结构时，只允许增删纯展示节点，事件绑定、v-model、props 传参、状态初始化一律不动。
2. **diff 门禁**：任何提交的 diff 中，逻辑禁区文件必须为零改动。不为零 = 未守住，回退重做。
3. **回归验证**：改动后必须本地构建通过（`pnpm build`），并手动走查：登录、菜单渲染、权限按钮显隐、暗色切换。
4. **视觉变量优先**：颜色/圆角/阴影/动效一律走 `src/styles/var.css` 的 CSS 变量，不硬编码。
5. **动效约束**：尊重 `prefers-reduced-motion`；新增动画不阻塞交互；首屏不引入超过 200KB 的视觉资源。
6. **新依赖需审批**：3D/动效库（three.js 等）默认用动态 `import()` 按需加载，不进主 bundle；加依赖前先问用户。
