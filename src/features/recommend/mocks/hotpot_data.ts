import type { ActionCard, FeatureBundle, GapItem, RequirementDraft } from '../types';
import { buildAssetId } from '../../../lib/runtimeTokens';

export const hotpotRequirement: RequirementDraft = {
  industry: '川渝火锅',
  merchantId: 'M-88231',
  merchantName: '示例火锅店',
  merchant: { id: 'M-88231', name: '示例火锅店' },
  problemCrowds: [
    { key: 'p_a3', label: 'A3 人群：转化率低', priority: 1 },
    { key: 'p_a1', label: 'A1 人群：拉新不足', priority: 2 },
  ],
  problems: [
    { id: 'p_a3', segment: 'A3 人群', description: '转化率低', priority: 'high' },
    { id: 'p_a1', segment: 'A1 人群', description: '拉新不足', priority: 'medium' },
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
    { key: 'acquire', label: '人群拉新', checked: true },
  ],
  actionTypes: { product: true, marketing: true, content: false, acquisition: true },
  features: [
    { key: 'power', label: '消费力', checked: true },
    { key: 'scene', label: '消费场景', checked: true },
    { key: 'interest', label: '兴趣关键词', checked: true },
    { key: 'freq', label: '频次', checked: false },
  ],
  featureDims: { consumeLevel: true, scene: true, keyword: true, frequency: false },
  confidence: 0.82,
};

export const hotpotActions: ActionCard[] = [
  {
    id: 'a_01',
    problemId: 'p_a3',
    actionType: 'product',
    title: '上线“双人聚餐牛排套餐 ¥166”',
    detail: '参考标杆商家组合，提升双人聚餐转化。',
    referencedAssets: [{ id: buildAssetId(4), name: '电商复购人群模板', type: 'crowd_template' }],
    expectedKpi: { metric: 'GMV', lift: 0.18 },
    confidence: 0.84,
    reasoning: '标杆“聚餐场景”贡献显著，建议先在套餐供给侧做验证。',
    status: 'recommended',
  },
  {
    id: 'a_02',
    problemId: 'p_a3',
    actionType: 'marketing',
    title: '发起“周末双人聚餐券”营销活动',
    detail: '对高意向人群投放券，拉升转化。',
    referencedAssets: [{ id: buildAssetId(1), name: '跨域券敏感度人群', type: 'crowd_template' }],
    expectedKpi: { metric: 'ROI', lift: 0.12 },
    confidence: 0.76,
    reasoning: '券敏感人群覆盖较广，可作为低成本触达方式。',
    status: 'needReview',
  },
  {
    id: 'a_03',
    problemId: 'p_a1',
    actionType: 'acquisition',
    title: '拉新：本地生活新客首单补贴',
    detail: '对新客人群做首单补贴，促进首次下单。',
    referencedAssets: [{ id: buildAssetId(2), name: '电商消费力等级标签', type: 'tag' }],
    expectedKpi: { metric: '新客', lift: 0.22 },
    confidence: 0.81,
    reasoning: '新客补贴对首单转化有效，但需控制预算与人群门槛。',
    status: 'recommended',
  },
  {
    id: 'a_04',
    problemId: 'p_a1',
    actionType: 'product',
    title: '优化套餐结构：增加“1人份快手套餐”',
    detail: '覆盖单人就餐场景，提升拉新转化。',
    referencedAssets: [{ id: buildAssetId(3), name: '跨域统一交易用户画像', type: 'tag' }],
    expectedKpi: { metric: 'CVR', lift: 0.09 },
    confidence: 0.65,
    reasoning: '需验证本地门店供给是否支持，落地成本较高。',
    status: 'needReview',
  },
  {
    id: 'a_05',
    problemId: 'p_a3',
    actionType: 'product',
    title: '优化曝光：提升“聚餐”关键词权重',
    detail: '在商详与搜索词上强化聚餐关键词。',
    referencedAssets: [{ id: 'feat_001', name: '兴趣关键词-聚餐', type: 'feature' }],
    expectedKpi: { metric: '曝光', lift: 0.11 },
    confidence: 0.58,
    reasoning: '需要复核关键词质量与覆盖，先做小流量实验。',
    status: 'needReview',
  },
];

export const hotpotBundle: FeatureBundle = {
  crowdSegments: [
    { id: 'c_01', name: 'A3 机会人群', size: 420000 },
    { id: 'c_02', name: 'C1 新客', size: 310000 },
    { id: 'c_03', name: '标杆 A4+A5', size: 160000 },
  ],
  features: [
    { id: 'f_01', dim: 'consume_level', value: 'L2', ratio: 0.68 },
    { id: 'f_02', dim: 'scene', value: '双人聚餐', ratio: 0.52 },
    { id: 'f_03', dim: 'keyword', value: '牛排/聚餐', ratio: 0.49 },
    { id: 'f_04', dim: 'keyword', value: '周末/夜宵', ratio: 0.31 },
  ],
  executableAssets: [
    { id: buildAssetId(4), name: '电商复购人群模板', type: 'crowd_template' },
    { id: buildAssetId(1), name: '跨域券敏感度人群', type: 'crowd_template' },
    { id: 'model_001', name: '聚餐意图模型', type: 'model' },
    { id: 'rule_001', name: '聚餐关键词规则', type: 'rule' },
  ],
};

export const hotpotGaps: GapItem[] = [
  {
    id: 'g_01',
    type: 'asset_missing',
    title: '缺少“聚餐意向高”人群模板（跨域）',
    impact: '动作矩阵中营销/商品优化覆盖不足，推荐置信度下降。',
    owner: '画像供给团队',
    suggestedOwner: '画像供给团队',
    severity: 'P1',
    draft: {
      title: '【缺少“聚餐意向高”人群模板（跨域）】',
      source: '智能推荐 · 飞书文档推荐链路',
      desc: '动作矩阵中营销/商品优化覆盖不足，推荐置信度下降。',
      assignee: '画像供给团队',
    },
  },
  {
    id: 'g_02',
    type: 'feature_deprecated',
    title: '特征“关键词-聚餐”即将下线（需替代）',
    impact: 'B 视角特征拼装中的关键特征需替换，影响稳定性。',
    owner: '特征平台团队',
    suggestedOwner: '特征平台团队',
    severity: 'P2',
    draft: {
      title: '【特征“关键词-聚餐”即将下线（需替代）】',
      source: '智能推荐 · 飞书文档推荐链路',
      desc: 'B 视角特征拼装中的关键特征需替换，影响稳定性。',
      assignee: '特征平台团队',
    },
  },
];
