# 旧导航 vs 终稿导航

## 目的

这份文档用于沉淀本仓库在“顶导收敛为两视角 + JSON 驱动导航 + `userMenu` 配置化”改造中的导航差异，方便后续继续做 IA、路由兼容和页面归属优化。

当前终稿配置文件见 `src/config/navigation.json`。

## 范围

- 顶导视角切换
- 左侧边导航
- 头像菜单 `userMenu`
- 动态详情页的导航归属
- legacy 路由的暴露策略

不包含：

- 页面内部内容布局
- `/marketplace/asset/:id` 诊断详情页内部 4 Layer 结构
- 权限系统本身的角色定义

## 一、旧导航概览

旧版导航的核心特征：

- `navigation.json` 使用 `views: []` 数组结构
- 每个导航项内显式维护 `id`、`to`、`excludedFromNav`、`navParentId`
- consumer 侧边导航按“资产市集 / 智能推荐 / 大盘 / 我的”分组
- producer 侧边导航按“市集工作台 / 供给大盘 / 工坊产线 / 资产目录 / 需求缺口 / 质量治理 / 发布门禁 / 语义与反馈”分组
- 头像菜单不是配置驱动，而是 `AppHeader.tsx` 里的 hardcode quick links
- `userMenu` 不支持 badge 聚合协议
- consumer / producer 的页面归属和菜单分组没有完全对齐终稿 IA

旧版典型问题：

- 导航 schema 偏实现细节，配置噪音较大
- `quickLinks` 与左侧导航是两套信息源，容易漂移
- producer 导航分组过于贴实现，不够贴近最终产品 IA
- consumer 的 `subRole` 没有进入统一配置模型
- 用户菜单无法承接“我的收藏 / 我的订阅 / 我的工单”等 badge 类入口

## 二、终稿导航概览

终稿导航的核心特征：

- `navigation.json` 切换为 `version + views.consumer/producer + userMenu + excludedFromNav`
- 顶导只保留两个公开视角：`consumer`、`producer`
- consumer 显式声明 `subRoles: business | algorithm`
- 左侧边导航以产品 IA 为中心建模，而不是以实现模块名为中心
- 头像菜单改为完全配置驱动，支持 `badge.source / style / severity`
- legacy 路由继续保留，但不进入 IA 公开导航

终稿 consumer 导航分组：

- 市集(业务运营)
- 算法工坊
- 质量查验
- 我的

终稿 producer 导航分组：

- 工作台
- 需求洞察
- 注册与发布
- 生产流水线
- 资产诊断
- 质量治理
- 评测工具箱
- 我的

终稿头像菜单分层：

- consumer 私有组：我的收藏 / 我的订阅 / 我的策略 / 历史会话
- producer 私有组：我的资产 / 我负责的工单 / 我的归因报告 / 我的订阅者
- common 组：个人中心 / 切换视角 / 登出

## 三、逐项差异

### 1. 配置 schema

旧版：

- `views` 是数组
- consumer / producer 视图项都带 `groups`
- 每个 item 自带 `id` 和 `to`
- 隐藏页通过 `excludedFromNav` 和 `navParentId` 手工维护

终稿：

- `views` 是对象：`views.consumer`、`views.producer`
- 导航入口统一放在 `nav`
- 用户菜单单独进入 `userMenu`
- `excludedFromNav` 提升到根级配置
- 动态页只保留 `dynamic: true`，由运行时做父级推断

影响：

- 配置可读性更高
- UI 层和配置层边界更清晰
- 导航高亮逻辑从“完全手写 parentId”变成“配置 + 运行时推断”混合模式

### 2. 顶导视角

旧版：

- 代码实现已经收敛到两视角，但标签与菜单语义仍偏“实现态”
- 头像菜单中有 quick links 兜底跳转

终稿：

- 只公开 `消费 / 供给`
- 切换视角时回到各自落地页
- 头像菜单保留“切换到另一视角”作为兜底能力

落地规则：

- `consumer -> /marketplace`
- `producer -> /dashboard`

### 3. Consumer 左侧导航

旧版 consumer 分组：

- 资产市集
- 智能推荐
- 大盘
- 我的

终稿 consumer 分组：

- 市集(业务运营)
- 算法工坊
- 质量查验
- 我的

主要变化：

- “智能推荐”不再单独成组，而是回收到“市集(业务运营)”组
- “大盘”从 consumer 公开导航中移除
- 新增“算法工坊”组，用于承接 `factory/*`
- 新增“质量查验”组，用于承接 `quality/precheck` 和 `quality/badges`
- “我的”组补上 `我的订阅资产 -> /catalog/my-assets?scope=subscribed`

设计意图：

- consumer 导航更加贴近“业务运营 / 算法同学”两条消费侧工作流
- 避免旧版 consumer 导航中出现过强的 producer 心智

### 4. Producer 左侧导航

旧版 producer 分组：

- 市集工作台
- 供给大盘
- 工坊产线
- 资产目录
- 需求缺口
- 质量治理
- 发布门禁
- 语义与反馈

终稿 producer 分组：

- 工作台
- 需求洞察
- 注册与发布
- 生产流水线
- 资产诊断
- 质量治理
- 评测工具箱
- 我的

主要变化：

- “市集工作台”不再作为 producer 公开分组
- “供给大盘”改名为“工作台”
- “工坊产线”改名为“生产流水线”
- “资产目录”并入“注册与发布”
- “发布门禁”与“语义与反馈”合并升级为“评测工具箱”
- 新增“资产诊断”组，显式容纳 `drilldown/*`
- 新增“我的”组，仅保留 `个人中心`

设计意图：

- 按供给方工作流重排：看盘 -> 洞察 -> 注册发布 -> 流水线 -> 诊断 -> 治理 -> 评测
- 避免旧版组名过于贴近技术实现模块

### 5. “注册与发布”首项变化

旧版：

- 首项是“我的资产”
- 跳转通常带 `scope=owned`

终稿：

- 首项改名为“资产目录”
- path 固定为 `/catalog/my-assets`
- 由页面内部再识别 `view / scope / owner`

设计意图：

- 对用户暴露的 IA 用语更稳定
- 避免在导航配置层强绑定 `scope=owned`

### 6. 用户菜单

旧版：

- `AppHeader.tsx` 内部 hardcode quick links
- consumer 和 producer 的入口不来自统一配置
- 没有聚合 badge 数据源

终稿：

- `userMenu.consumer`
- `userMenu.producer`
- `userMenu.common`

新增能力：

- consumer 身份行支持子角色切换
- producer 身份行只展示当前供给身份
- 菜单项支持 `path` 或 `action`
- 菜单项支持 badge 样式：
  - `number`
  - `dot-number`
  - `number-new`

实际落地的 badge source：

- consumer
  - `favorites_count`
  - `subscriptions_count`
  - `strategies_count`
- producer
  - `owned_assets_count`
  - `unresolved_tickets`
  - `new_subscribers_7d`

### 7. 动态详情页处理方式

旧版：

- 通过 `excludedFromNav + navParentId` 明确挂回父项

终稿：

- JSON 中只标 `dynamic: true`
- 运行时根据同组 path 前缀自动推断父项

当前实现策略：

- 可见项自动生成稳定 id
- 动态路由不出现在侧边栏
- 命中动态路由时，侧边栏高亮回最近的可见父项

这样做的好处：

- 减少配置噪音
- 新增动态详情页时不必同步维护大量 `navParentId`

风险：

- 如果未来同组里出现多个相同 prefix 的详情路由，可能需要恢复显式父级声明

### 8. Legacy 路由策略

旧版：

- legacy 路由主要是代码层 redirect
- 配置层没有集中声明

终稿：

- 统一放在 `excludedFromNav`
- 不进入公开 IA，但保留访问兼容

当前排除项：

- `/monitor`
- `/monitor/*`
- `/market/*`
- `/foundry/*`
- `/placeholder/:module`
- `/marketplace/:assetId`

设计意图：

- 对外暴露 canonical IA
- 对内保留历史地址兼容

## 四、当前代码落点

配置与解析：

- `src/config/navigation.json`
- `src/lib/navigation.ts`

顶导与用户菜单：

- `src/components/layout/AppHeader.tsx`
- `src/components/layout/UserMenu.tsx`

状态与视角：

- `src/store/globalState.ts`
- `src/lib/view.ts`

`/my` 与二级页：

- `src/pages/MyPage.tsx`
- `src/pages/my/MySubPages.tsx`

相关 query 兼容：

- `src/pages/catalog/CatalogMyAssetsPage.tsx`
- `src/pages/quality/QualityWorkspace.tsx`

badge 聚合 mock API：

- `src/api/my.ts`

## 五、当前实现与终稿的一个现实差异

终稿 JSON 中 producer 有 8 个分组，但当前运行时侧边栏只会显示 7 个。

原因：

- “资产诊断”组下目前只有动态路由：
  - `/drilldown/:id`
  - `/drilldown/features/:id`
- 运行时侧边栏会自动隐藏纯动态项，因此该组不会生成可点击入口

这不影响：

- 动态详情页访问
- 父级高亮逻辑
- IA 文档表达

如果未来需要让“资产诊断”组在侧边栏显式可见，建议补一个静态入口，例如：

- `/drilldown`
- 或 `/drilldown/index`

## 六、后续建议

### P0

- 给“资产诊断”补一个静态入口页，避免 IA 有组但侧边栏无入口
- 继续观察 `/catalog/my-assets` 是否要长期同时承接 `scope` 与 `owner` 两套 query

### P1

- 给 `UserMenu` 补交互测试，覆盖 badge 渲染、切视角、subRole 切换
- 给导航解析补一组“多动态前缀冲突”测试，验证父级推断健壮性

### P2

- 若后续 IA 继续演进，可把这份文档升级为“导航契约文档”，明确：
  - JSON schema
  - 路由归属规则
  - excludedFromNav 策略
  - dynamic route 父级匹配规则

## 附：一句话结论

旧导航偏“实现模块组织”，终稿导航偏“用户任务流组织”；这次改造的本质，是把顶导、侧边导航、头像菜单和 legacy 路由策略收敛到同一份配置语义里。
