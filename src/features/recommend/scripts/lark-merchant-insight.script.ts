import type { GapItem, RecommendCard, RecommendScript, RequirementDraft, ScriptStep, ThinkingEvent } from '../types';

const mkThinking = (phase: ThinkingEvent['phase'], arr: [number, string, string][]): ThinkingEvent[] =>
  arr.map(([t, node, text], index) => ({
    id: `${phase}-${index + 1}`,
    t: t * 1000,
    phase,
    node,
    text,
    status: 'ok',
  }));

const parseThinking = mkThinking('parse', [
  [1, 'parse_document', '正在读取文档…识别为「商家人群洞察需求」类型'],
  [3, 'extract_entity', '抽取关键实体：行业=川渝火锅、商家ID=M-88231'],
  [5, 'detect_problems', '识别问题人群：A3 转化低、A1 拉新不足'],
  [8, 'infer_scope', '推断挖掘范围：自身历史 + 标杆商家'],
  [11, 'infer_actions', '识别目标动作：商品优化、营销活动'],
  [14, 'confidence_check', '整体置信度 0.82，达到可确认阈值 ✓'],
]);

const requirement: RequirementDraft = {
  industry: '川渝火锅',
  merchantId: 'M-88231',
  merchantName: '示例火锅店',
  merchant: { id: 'M-88231', name: '示例火锅店' },
  problemCrowds: [
    { key: 'A3', label: 'A3 人群：转化率低(高优先级)', priority: 1 },
    { key: 'A1', label: 'A1 人群：拉新不足', priority: 2 },
  ],
  problems: [
    { id: 'A3', segment: 'A3 人群', description: '转化率低', priority: 'high' },
    { id: 'A1', segment: 'A1 人群', description: '拉新不足', priority: 'medium' },
  ],
  scopes: [
    { key: 'self', label: '当前商家跃迁人群', checked: true },
    { key: 'bench', label: '标杆商家', checked: true },
    { key: 'cross', label: '跨行业相似', checked: false },
  ],
  miningScope: { selfHistory: true, benchmark: true, crossIndustry: false },
  actions: [
    { key: 'product', label: '商品优化', checked: true },
    { key: 'campaign', label: '营销活动', checked: true },
    { key: 'content', label: '内容优化', checked: false },
    { key: 'acquire', label: '人群拉新', checked: false },
  ],
  actionTypes: { product: true, marketing: true, content: false, acquisition: false },
  features: [
    { key: 'power', label: '消费力', checked: true },
    { key: 'scene', label: '消费场景', checked: true },
    { key: 'interest', label: '兴趣关键词', checked: true },
    { key: 'freq', label: '频次', checked: false },
  ],
  featureDims: { consumeLevel: true, scene: true, keyword: true, frequency: false },
  confidence: 0.82,
  docUrl: 'https://bytedance.larkoffice.com/wiki/ZuLgwSoT6i7EdPkBvw3c5vFanQ6',
  docTitle: '商家人群洞察行为建议',
};

const recommendThinking = mkThinking('recommend', [
  [1, 'retrieve_assets', '并行召回 4 类资产：人群模板 6 / 特征包 8 / 模型 3 / 规则 4'],
  [4, 'cluster_features', '关键发现：标杆"双人聚餐"场景占比 52%，商家当前仅 18%'],
  [7, 'map_actions', '命中 5 条可直接落地动作(3×商品 + 2×营销)'],
  [10, 'gap_check', '发现 2 个缺口：跨行业火锅人群模板、消费频次维度'],
  [13, 'rank_and_render', '综合打分，按双轨视图组织 ✓'],
]);

export const DEFAULT_RECOMMEND_CARDS: RecommendCard[] = [
  {
    id: 'R-001',
    title: '上线双人聚餐牛排套餐 ¥166',
    crowd: 'A3 转化低',
    action: 'product',
    desc: '对标杆商家双人聚餐场景做差异补齐，主推牛排+饮品组合。',
    refs: ['牛排兴趣特征包', '双人场景人群模板'],
    kpi: 'GMV ↑ 18%',
    confidence: 0.84,
    tag: '🟢',
    problemId: 'A3',
    actionType: 'product',
    detail: '对标杆商家双人聚餐场景做差异补齐，主推牛排+饮品组合。',
    referencedAssets: [
      { id: 'asset-1', name: '牛排兴趣特征包', type: 'feature_pack' },
      { id: 'asset-2', name: '双人场景人群模板', type: 'crowd_template' },
    ],
    expectedKpi: { metric: 'GMV', lift: 0.18 },
    reasoning: '补齐双人聚餐场景供给，优先改善高意向人群转化。',
    status: 'recommended',
    summary: '对标杆商家双人聚餐场景做差异补齐，主推牛排+饮品组合。',
    assetRefs: [
      { id: 'asset-1', name: '牛排兴趣特征包', type: 'feature_pack' },
      { id: 'asset-2', name: '双人场景人群模板', type: 'crowd_template' },
    ],
    reason_humanized:
      "高匹配度原因：该人群的“孕期/育儿”标签与您的需求高度吻合。且在过往同类的“生服留存”活动中，使用该资产平均带来了 12% 的 GMV 提升，历史表现非常稳定。",
    audience_narrative:
      "这个人群主要包含在电商和生服双端都有过消费，且近 3 个月内购买过母婴类目商品，客单价排名在全站 Top 20% 的女性用户。",
  },
  {
    id: 'R-002',
    title: '直播定向发券 80-10',
    crowd: 'A3 转化低',
    action: 'campaign',
    desc: '对 A3 机会人群在直播间定向下发 80-10 券，拉动当日复购。',
    refs: ['人群券模型', 'A3 机会人群'],
    kpi: '复购率 ↑ 14%',
    confidence: 0.78,
    tag: '🟢',
    problemId: 'A3',
    actionType: 'marketing',
    detail: '对 A3 机会人群在直播间定向下发 80-10 券，拉动当日复购。',
    referencedAssets: [
      { id: 'asset-3', name: '人群券模型', type: 'model' },
      { id: 'asset-4', name: 'A3 机会人群', type: 'crowd_template' },
    ],
    expectedKpi: { metric: '复购率', lift: 0.14 },
    reasoning: '对高转化潜力人群做场景化触达，适合快速验证。',
    status: 'accepted',
    summary: '对 A3 机会人群在直播间定向下发 80-10 券，拉动当日复购。',
    assetRefs: [
      { id: 'asset-3', name: '人群券模型', type: 'model' },
      { id: 'asset-4', name: 'A3 机会人群', type: 'crowd_template' },
    ],
    reason_humanized:
      "高匹配度原因：该人群在直播场景的高活跃与价格敏感度，与您“当日复购拉升”的诉求强相关。同类“电商营销 + 券触达”活动中，平均带来 14% 的复购率提升。",
    audience_narrative:
      "这个人群主要包含近 30 天进入直播间观看时长 Top 20% 的高活跃女性用户，且对小额满减券（80-10 区间）领取与核销率显著高于大盘的价格敏感型买家。",
  },
  {
    id: 'R-003',
    title: '获客卡定向本地推',
    crowd: 'A1 拉新不足',
    action: 'acquire',
    desc: '结合潜客挖掘模型，对本地 3km 潜客下发获客卡。',
    refs: ['潜客挖掘模型', '本地推投放能力'],
    kpi: 'ROI 1.8x',
    confidence: 0.81,
    tag: '🟢',
    problemId: 'A1',
    actionType: 'acquisition',
    detail: '结合潜客挖掘模型，对本地 3km 潜客下发获客卡。',
    referencedAssets: [
      { id: 'asset-5', name: '潜客挖掘模型', type: 'model' },
      { id: 'asset-6', name: '本地推投放能力', type: 'capability' },
    ],
    expectedKpi: { metric: 'ROI', lift: 0.8 },
    reasoning: '优先覆盖门店周边潜客，直接补齐拉新动作能力。',
    status: 'recommended',
    summary: '结合潜客挖掘模型，对本地 3km 潜客下发获客卡。',
    assetRefs: [
      { id: 'asset-5', name: '潜客挖掘模型', type: 'model' },
      { id: 'asset-6', name: '本地推投放能力', type: 'capability' },
    ],
  },
];

const gapThinking = mkThinking('gap', [
  [1, 'gap_analysis', '对比期望特征 vs 平台可用特征 → 缺失"消费频次"'],
  [3, 'gap_analysis', '对比期望人群 vs 平台资产 → 缺失"跨行业火锅标杆 C3+C4"'],
  [5, 'gap_analysis', '生成提需草稿,绑定责任团队 ✓'],
]);

const gaps: GapItem[] = [
  {
    id: 'G-001',
    title: '跨行业火锅标杆 C3+C4 复购人群模板',
    impact: '无法借鉴同赛道标杆复购画像',
    owner: '生服·人群资产团队',
    suggestedOwner: '生服·人群资产团队',
    type: 'asset_missing',
    severity: 'P1',
    draft: {
      title: '【跨行业火锅标杆 C3+C4 复购人群模板】',
      source: '智能推荐 · 场景「川渝火锅 A3→C1 转化」',
      desc: '希望平台新增跨行业火锅标杆的 C3+C4 复购人群模板,用于借鉴同赛道标杆复购画像。已由 Agent 自动填充来源与场景。',
      assignee: '生服·人群资产团队',
    },
  },
  {
    id: 'G-002',
    title: '【消费频次】维度已于 2026-Q1 下线',
    impact: '你勾选的频次维度将无法在本轮推荐中使用',
    owner: '生服·特征加工团队',
    suggestedOwner: '生服·特征加工团队',
    type: 'feature_deprecated',
    severity: 'P2',
    draft: {
      title: '【恢复或替代：消费频次维度】',
      source: '智能推荐 · 场景「川渝火锅 A3→C1 转化」',
      desc: '请评估恢复消费频次维度或提供等价替代特征,当前策略场景重度依赖此维度。',
      assignee: '生服·特征加工团队',
    },
  },
];

export const scriptSteps: ScriptStep[] = [
  { phase: 'parse', thinking: parseThinking, onExit: (d) => d({ type: 'SET_REQUIREMENT', payload: requirement }) },
  { phase: 'recommend', thinking: recommendThinking, onExit: (d) => d({ type: 'SET_RECOMMENDS', payload: DEFAULT_RECOMMEND_CARDS }) },
  { phase: 'gap', thinking: gapThinking, onExit: (d) => d({ type: 'SET_GAPS', payload: gaps }) },
];

export const DEFAULT_DOC_URL = 'https://bytedance.larkoffice.com/wiki/ZuLgwSoT6i7EdPkBvw3c5vFanQ6';
export const DEFAULT_DOC_TITLE = '商家人群洞察行为建议';
export const DEFAULT_LARK_DOC_URL = DEFAULT_DOC_URL;
export const DEFAULT_LARK_DOC_TITLE = DEFAULT_DOC_TITLE;

export const larkMerchantInsightScript: RecommendScript = {
  id: 'lark_merchant_insight',
  name: '飞书商家洞察推荐脚本',
  defaultDocUrl: DEFAULT_DOC_URL,
  defaultDocTitle: DEFAULT_DOC_TITLE,
  steps: scriptSteps,
};
