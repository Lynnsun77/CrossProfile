# Cross-Profile Demo

## 启动方式

```bash
npm install
npm run dev
```

## 常用命令

```bash
npx tsc --noEmit
npm run test
npm run build
npm run lint
```

## 诊断详情页路由

- 旧路由兼容：`/marketplace/:assetId`
- 新路由规范：`/marketplace/asset/:id`

## 当前状态

- 已完成 `PRD-1`：诊断详情页骨架、双路由兼容、URL 参数解析、4 个 Layer 容器
- 已完成 `PRD-2`：17 个 P0 组件、下钻抽屉、试算、对比和订阅 CTA
- 已完成 `PRD-3`：22 个 P1 组件、视角切换、来源感知、范围编辑重算、供给方折叠区、超时重试
- 已完成 `PRD-4`：P2 占位、错误态演练、三条 demo 动线说明、构建期按需懒加载、README 交付

## 目录说明

- `src/pages/marketplace/asset/`
  - `AssetDiagnosticDetailPage.tsx`：详情页主容器
  - `components/`：P0/P1 组件、错误态、P2 占位、通用交互
  - `layers/`：Layer 0-3 集成层
  - `services/`：fixture 和 mock 聚合层
  - `stores/`：view / scope / shortlist / ui 局部状态
  - `hooks/`：详情数据加载与超时重试

## 功能点映射

- `Layer 0`：身份卡、定义、是/不是、定量摘要、推荐理由、Verdict、场景标签、样例预览、分布图、供给方折叠区
- `Layer 1`：范围选择、覆盖瀑布、用途选择、质量红线、质量徽章、覆盖缺口、粒度提示、真实样例、同类用户订阅、切片分布
- `Layer 2`：已知问题、稳定性曲线、边界案例、口径变更、血缘图、基准线对照
- `Layer 3`：订阅影响、试算、对比、ROI 预估、预检、Shortlist、AB 入口、订阅 CTA
- `横向`：术语提示、下钻抽屉、空状态、错误态、P2 占位

## Demo 动线

- 消费方：`/marketplace/recommend` → 进入详情页 → 查看 Verdict 与覆盖瀑布 → 运行试算 → 订阅/加入待选
- 供给方：切到 `?view=producer` → 查看供给方折叠区与 Layer 2 → 使用 P2 派工占位
- 运维方：使用 `?source=alert&view=operator` → 默认展开 Layer 2 → 查看稳定性曲线与错误态/P2 占位

## 错误态与演练参数

- `?mockError=401`
- `?mockError=403`
- `?mockError=404`
- `?mockError=500`
- `?mockError=random`
- `?chaos=1`

## 已知问题

- `build` 仍会提示部分 chunk 偏大，但诊断详情页和推荐页已经先做了懒加载切分
- 当前错误态和 chaos 演练基于前端 mock query 参数，不是后端真实接口
