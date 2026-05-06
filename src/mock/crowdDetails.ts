import type {
  CrowdBasisCategory,
  CrowdComplianceAdvice,
  CrowdComplianceDimension,
  CrowdComplianceRisk,
  CrowdConsumerRow,
  CrowdDetail,
  CrowdDistributionGroup,
  CrowdRuleNode,
  CrowdRevenuePoint,
  CrowdSceneCard,
} from '../types';
import { buildLegacyMarketFeaturePath } from '../lib/runtimeTokens';

const TIMELINE_DAYS = 90;
const REQUIRED_COMPLIANCE_DIMENSIONS = 4;
const MIN_RULE_LEAF_COUNT = 6;
const marketFeaturePathA001 = (segment: string) => buildLegacyMarketFeaturePath('a_001', segment);
const marketFeaturePathA004 = (segment: string) => buildLegacyMarketFeaturePath('a_004', segment);

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[crowdDetails] ${message}`);
  }
}

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function createTimeline(
  startDate: string,
  {
    baseGmv,
    dailyStep,
    wave,
    roiBase,
    roiWave,
    roiStep,
  }: {
    baseGmv: number;
    dailyStep: number;
    wave: number;
    roiBase: number;
    roiWave: number;
    roiStep: number;
  },
): CrowdRevenuePoint[] {
  const start = new Date(`${startDate}T00:00:00`);

  return Array.from({ length: TIMELINE_DAYS }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);

    const gmv =
      baseGmv +
      dailyStep * index +
      Math.round(Math.sin(index / 5) * wave) +
      ((index % 9) - 4) * 2200;
    const roi = round(
      roiBase + Math.sin(index / 7) * roiWave + ((index % 6) - 2) * roiStep,
      2,
    );

    return {
      date: current.toISOString().slice(0, 10),
      gmv,
      roi,
    };
  });
}

function createHeatmap(offset: number) {
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const peak = hour >= 11 && hour <= 20 ? 0.22 : 0;
      const workday = day >= 1 && day <= 5 ? 0.08 : 0.02;
      return round(
        0.24 +
          peak +
          workday +
          ((day * 7 + hour + offset) % 5) * 0.07 +
          Math.sin((hour + offset) / 3) * 0.03,
        2,
      );
    }),
  );
}

function countRuleLeaves(node: CrowdRuleNode): number {
  if (!node.children || node.children.length === 0) {
    return 1;
  }

  return node.children.reduce((total, child) => total + countRuleLeaves(child), 0);
}

function sumRatios(group: CrowdDistributionGroup) {
  return group.segments.reduce((total, item) => total + item.ratio, 0);
}

function validateDistributions(detail: CrowdDetail) {
  const ecommerce = detail.distributions.find((item) => item.system === 'ecommerce');
  const lifestyle = detail.distributions.find((item) => item.system === 'lifestyle');

  assert(Boolean(ecommerce), `${detail.id} 缺少电商分布`);
  assert(Boolean(lifestyle), `${detail.id} 缺少生服分布`);
  assert(ecommerce!.segments.length === 8, `${detail.id} 电商分布必须为 8 段`);
  assert(lifestyle!.segments.length === 5, `${detail.id} 生服分布必须为 5 段`);
  assert(Math.abs(sumRatios(ecommerce!) - 1) < 0.001, `${detail.id} 电商分布占比之和必须为 1`);
  assert(Math.abs(sumRatios(lifestyle!) - 1) < 0.001, `${detail.id} 生服分布占比之和必须为 1`);
}

function validateConsumers(detail: CrowdDetail) {
  assert(detail.consumers.columns.length >= 4, `${detail.id} 消费方矩阵列数不足`);
  assert(detail.consumers.rows.length >= 3, `${detail.id} 消费方矩阵至少需要 3 行`);
}

function validateScenes(detail: CrowdDetail) {
  assert(detail.topScenes.length >= 3, `${detail.id} Top 场景卡至少需要 3 张`);
}

function validateTimeline(detail: CrowdDetail) {
  assert(
    detail.revenueTimeline90d.length === TIMELINE_DAYS,
    `${detail.id} 收益时间线必须为 ${TIMELINE_DAYS} 天`,
  );
}

function validateCompliance(detail: CrowdDetail) {
  assert(
    detail.compliance.dimensions.length === REQUIRED_COMPLIANCE_DIMENSIONS,
    `${detail.id} 合规维度必须为 ${REQUIRED_COMPLIANCE_DIMENSIONS} 个`,
  );
}

function validateRuleTree(detail: CrowdDetail) {
  assert(
    countRuleLeaves(detail.rule.tree) >= MIN_RULE_LEAF_COUNT,
    `${detail.id} 规则树叶子节点数不足 ${MIN_RULE_LEAF_COUNT}`,
  );
}

function validateBasisTabs(detail: CrowdDetail) {
  assert(detail.basisTabs.length === 7, `${detail.id} 依据 Tab 必须为 7 类`);
  assert(
    detail.basisTabs.every((tab) => tab.items.length > 0 || !tab.enabled),
    `${detail.id} 依据 Tab 配置不合法`,
  );
}

function validateDetail(detail: CrowdDetail) {
  assert(detail.kpis.length === 4, `${detail.id} 顶部 KPI 必须为 4 个`);
  assert(detail.quadrants.length === 4, `${detail.id} 四象限卡片必须为 4 个`);
  assert(detail.timeHeatmap.values.length === 7, `${detail.id} 时空热力图必须为 7 行`);
  assert(
    detail.timeHeatmap.values.every((row) => row.length === 24),
    `${detail.id} 时空热力图每行必须为 24 列`,
  );

  validateDistributions(detail);
  validateConsumers(detail);
  validateScenes(detail);
  validateTimeline(detail);
  validateCompliance(detail);
  validateRuleTree(detail);
  validateBasisTabs(detail);
}

const baseColumns = ['消费方', '投放渠道', '收益表现', '状态'];

const a001Consumers: CrowdConsumerRow[] = [
  {
    id: 'a001-consumer-1',
    consumer: '站内推荐',
    channel: '首页猜你喜欢',
    gmv: 4620000,
    roi: 3.42,
    ctrDelta: 2.6,
    status: 'active',
    note: '高客单商品点击显著提升',
  },
  {
    id: 'a001-consumer-2',
    consumer: '短信召回',
    channel: '节促短信',
    gmv: 2280000,
    roi: 2.18,
    ctrDelta: 1.1,
    status: 'active',
    note: '大促前 3 天表现最稳',
  },
  {
    id: 'a001-consumer-3',
    consumer: '直播间重定向',
    channel: '直播间挂件',
    gmv: 1860000,
    roi: 1.74,
    ctrDelta: -0.4,
    status: 'paused',
    note: '素材疲劳导致 CTR 回落',
  },
  {
    id: 'a001-consumer-4',
    consumer: '私域复购',
    channel: '企微社群',
    gmv: 1390000,
    roi: 3.85,
    ctrDelta: null,
    status: 'active',
    note: '以高复购券包驱动成交',
  },
];

const a004Consumers: CrowdConsumerRow[] = [
  {
    id: 'a004-consumer-1',
    consumer: '本地团购',
    channel: '团购频道',
    gmv: 3180000,
    roi: 2.76,
    ctrDelta: 1.8,
    status: 'active',
    note: '周末夜场提升明显',
  },
  {
    id: 'a004-consumer-2',
    consumer: '短视频种草',
    channel: '同城视频流',
    gmv: 2040000,
    roi: 1.96,
    ctrDelta: 0.7,
    status: 'active',
    note: '年轻客群互动率较高',
  },
  {
    id: 'a004-consumer-3',
    consumer: '到店券核销',
    channel: '到店核销码',
    gmv: 1760000,
    roi: 1.41,
    ctrDelta: -0.3,
    status: 'paused',
    note: '需结合门店容量评估',
  },
  {
    id: 'a004-consumer-4',
    consumer: '商圈屏投放',
    channel: '商圈 DOOH',
    gmv: 1260000,
    roi: 1.22,
    ctrDelta: null,
    status: 'active',
    note: '拉新贡献大于复购贡献',
  },
];

const baseAdvices = (crowdName: string): CrowdComplianceAdvice[] => [
  {
    id: `${crowdName}-advice-1`,
    title: '优先投站内推荐',
    description: '使用站内可解释标签组合，优先承接高意向流量。',
    bucket: 'recommended',
  },
  {
    id: `${crowdName}-advice-2`,
    title: '短信触达需评审',
    description: '涉及高频召回节奏，建议先走策略评审和频控检查。',
    bucket: 'review',
  },
  {
    id: `${crowdName}-advice-3`,
    title: '禁止外部名单扩投',
    description: '当前规则未覆盖外部名单授权链路，禁止直接扩投。',
    bucket: 'forbidden',
  },
];

const baseRisks = (prefix: string): CrowdComplianceRisk[] => [
  {
    id: `${prefix}-risk-1`,
    point: '跨渠道频控未完全打通',
    regulation: '营销触达频控规范 3.2',
    level: 'mid',
  },
  {
    id: `${prefix}-risk-2`,
    point: '外部名单未保留授权证明',
    regulation: '数据使用合规红线 1.4',
    level: 'high',
  },
];

const basisTabsA001: CrowdBasisCategory[] = [
  {
    key: 'demographic',
    label: '人口属性',
    enabled: true,
    items: [
      { id: 'a001-demo-1', label: '25-34 岁白领', description: '占比 31%，消费意愿高', contribution: 0.23 },
      { id: 'a001-demo-2', label: '新一线城市', description: '华东和华南核心商圈集中', contribution: 0.18 },
    ],
  },
  {
    key: 'behavior',
    label: '行为偏好',
    enabled: true,
    items: [
      { id: 'a001-behavior-1', label: '近 30 天复购 >= 2 次', description: '复购倾向强', contribution: 0.29 },
      { id: 'a001-behavior-2', label: '加购后 7 天内成交', description: '决策链路短', contribution: 0.22 },
    ],
  },
  {
    key: 'merchant',
    label: '商家关系',
    enabled: true,
    items: [
      { id: 'a001-merchant-1', label: '品牌会员等级 >= 银卡', description: '品牌忠诚度稳定', contribution: 0.16 },
    ],
  },
  {
    key: 'product',
    label: '货品偏好',
    enabled: true,
    items: [
      { id: 'a001-product-1', label: '高毛利礼盒偏好', description: '礼盒品类转化高于均值', contribution: 0.14 },
      { id: 'a001-product-2', label: '新品套装首购成功', description: '新品承接能力强', contribution: 0.1 },
    ],
  },
  {
    key: 'channel',
    label: '渠道偏好',
    enabled: true,
    items: [
      { id: 'a001-channel-1', label: '站内推荐点击率高', description: '核心曝光位反馈稳定', contribution: 0.12 },
    ],
  },
  {
    key: 'time',
    label: '时间特征',
    enabled: true,
    items: [
      { id: 'a001-time-1', label: '周四晚间购买峰值', description: '晚 8 点后成交占比提升', contribution: 0.08 },
    ],
  },
  {
    key: 'risk',
    label: '风险排除',
    enabled: true,
    items: [
      { id: 'a001-risk-1', label: '排除近 7 天投诉用户', description: '避免低体验人群误触达', contribution: 0.07 },
    ],
  },
];

const basisTabsA004: CrowdBasisCategory[] = [
  {
    key: 'demographic',
    label: '人口属性',
    enabled: true,
    items: [
      { id: 'a004-demo-1', label: '18-28 岁同城青年', description: '夜间消费与即时决策强', contribution: 0.24 },
      { id: 'a004-demo-2', label: '大学城周边人群', description: '周末活动频次高', contribution: 0.15 },
    ],
  },
  {
    key: 'behavior',
    label: '行为偏好',
    enabled: true,
    items: [
      { id: 'a004-behavior-1', label: '近 14 天同城视频互动 >= 3 次', description: '种草后转化效率好', contribution: 0.27 },
      { id: 'a004-behavior-2', label: '周末夜场搜索门店', description: '具备即时到店意图', contribution: 0.2 },
    ],
  },
  {
    key: 'merchant',
    label: '商家关系',
    enabled: true,
    items: [
      { id: 'a004-merchant-1', label: '高频商圈门店老客', description: '对商圈活动响应更快', contribution: 0.12 },
    ],
  },
  {
    key: 'product',
    label: '货品偏好',
    enabled: true,
    items: [
      { id: 'a004-product-1', label: '夜场套餐偏好', description: '偏好多人分享套餐', contribution: 0.11 },
      { id: 'a004-product-2', label: '限时券秒杀参与', description: '价格敏感但行动快', contribution: 0.09 },
    ],
  },
  {
    key: 'channel',
    label: '渠道偏好',
    enabled: true,
    items: [
      { id: 'a004-channel-1', label: '同城视频流点击高', description: '视频导流效率高于图文', contribution: 0.13 },
    ],
  },
  {
    key: 'time',
    label: '时间特征',
    enabled: true,
    items: [
      { id: 'a004-time-1', label: '周五至周日夜间高活跃', description: '21:00-23:00 到店意图强', contribution: 0.1 },
    ],
  },
  {
    key: 'risk',
    label: '风险排除',
    enabled: true,
    items: [
      { id: 'a004-risk-1', label: '排除未成年人敏感品类曝光', description: '保证内容和场景安全', contribution: 0.06 },
    ],
  },
];

const a001Compliance: CrowdComplianceDimension[] = [
  {
    key: 'data',
    label: '数据来源',
    status: 'green',
    reason: '全部来源于站内一方行为和会员数据。',
    suggestion: '可继续沿用当前授权链路。',
  },
  {
    key: 'channel',
    label: '渠道权限',
    status: 'yellow',
    reason: '短信与站外渠道频控未完全联动。',
    suggestion: '短信投放前先补充频控校验。',
  },
  {
    key: 'content',
    label: '内容适配',
    status: 'green',
    reason: '当前推荐货品和文案均属于低风险类目。',
    suggestion: '保留默认文案模板即可。',
  },
  {
    key: 'delivery',
    label: '投放动作',
    status: 'green',
    reason: '派发链路在平台白名单内。',
    suggestion: '可直接派发并记录埋点。',
  },
];

const a004Compliance: CrowdComplianceDimension[] = [
  {
    key: 'data',
    label: '数据来源',
    status: 'green',
    reason: '数据来源均为站内同城行为和门店核销数据。',
    suggestion: '继续维持站内闭环。',
  },
  {
    key: 'channel',
    label: '渠道权限',
    status: 'yellow',
    reason: '商圈屏与到店券的联合触达策略仍需评审。',
    suggestion: '线下渠道先走人工审核。',
  },
  {
    key: 'content',
    label: '内容适配',
    status: 'red',
    reason: '夜场套餐涉及年龄和场景限制，当前内容模板未区分敏感人群。',
    suggestion: '补齐年龄过滤和素材分层前禁止立即派发。',
  },
  {
    key: 'delivery',
    label: '投放动作',
    status: 'yellow',
    reason: '高峰时段门店履约承压较大。',
    suggestion: '缩小门店范围后再试投。',
  },
];

const a001TopScenes: CrowdSceneCard[] = [
  {
    id: 'a001-scene-1',
    title: '新品礼盒首发',
    summary: '适合承接上新礼盒和高毛利组合包，首发 48 小时效果最佳。',
    channel: '首页推荐',
    expectedGmv: 1860000,
    roi: 3.58,
    status: 'recommended',
  },
  {
    id: 'a001-scene-2',
    title: '会员复购召回',
    summary: '结合阶梯券包可提升复购，适合节后回流。',
    channel: '企微社群',
    expectedGmv: 1280000,
    roi: 3.12,
    status: 'recommended',
  },
  {
    id: 'a001-scene-3',
    title: '直播预售引流',
    summary: '适合直播预售前 24 小时预热，但素材需定期更新。',
    channel: '直播间挂件',
    expectedGmv: 860000,
    roi: 1.84,
    status: 'review',
  },
];

const a004TopScenes: CrowdSceneCard[] = [
  {
    id: 'a004-scene-1',
    title: '周末夜场团购',
    summary: '聚焦 21:00-23:00 夜场套餐，适合商圈门店集中投放。',
    channel: '团购频道',
    expectedGmv: 1420000,
    roi: 2.64,
    status: 'recommended',
  },
  {
    id: 'a004-scene-2',
    title: '同城视频种草',
    summary: '适合用短视频展示门店氛围，先种草再承接券包。',
    channel: '同城视频流',
    expectedGmv: 980000,
    roi: 1.92,
    status: 'review',
  },
  {
    id: 'a004-scene-3',
    title: '线下大屏拉新',
    summary: '适合商圈活动联动，但需注意履约与年龄限制。',
    channel: '商圈 DOOH',
    expectedGmv: 620000,
    roi: 1.18,
    status: 'blocked',
  },
];

const a001RuleTree: CrowdRuleNode = {
  id: 'a001-rule-root',
  type: 'group',
  label: '高价值复购人群规则',
  operator: 'AND',
  children: [
    {
      id: 'a001-rule-group-1',
      type: 'group',
      label: '基础画像',
      operator: 'AND',
      children: [
        {
          id: 'a001-rule-1',
          type: 'leaf',
          label: '年龄 25-34 岁',
          field: 'age_band',
          comparator: 'IN',
          value: '[25,34]',
          contribution: 0.12,
        },
        {
          id: 'a001-rule-2',
          type: 'leaf',
          label: '城市等级 >= 新一线',
          field: 'city_tier',
          comparator: '>=',
          value: 'new_tier_1',
          contribution: 0.1,
        },
      ],
    },
    {
      id: 'a001-rule-group-2',
      type: 'group',
      label: '消费行为',
      operator: 'AND',
      children: [
        {
          id: 'a001-rule-3',
          type: 'leaf',
          label: '近 30 天支付次数 >= 2',
          field: 'pay_cnt_30d',
          comparator: '>=',
          value: '2',
          contribution: 0.18,
        },
        {
          id: 'a001-rule-4',
          type: 'leaf',
          label: '客单价 >= 180',
          field: 'aov_30d',
          comparator: '>=',
          value: '180',
          contribution: 0.16,
        },
        {
          id: 'a001-rule-5',
          type: 'leaf',
          label: '近 14 天加购后成交',
          field: 'cart_to_pay_14d',
          comparator: '=',
          value: 'true',
          contribution: 0.13,
        },
      ],
    },
    {
      id: 'a001-rule-group-3',
      type: 'group',
      label: '风险排除',
      operator: 'AND',
      children: [
        {
          id: 'a001-rule-6',
          type: 'leaf',
          label: '排除近 7 天投诉用户',
          field: 'complaint_7d',
          comparator: '=',
          value: 'false',
          contribution: 0.08,
        },
        {
          id: 'a001-rule-7',
          type: 'leaf',
          label: '排除售后处理中用户',
          field: 'aftersale_open',
          comparator: '=',
          value: 'false',
          contribution: 0.06,
        },
      ],
    },
  ],
};

const a004RuleTree: CrowdRuleNode = {
  id: 'a004-rule-root',
  type: 'group',
  label: '同城夜场活跃人群规则',
  operator: 'AND',
  children: [
    {
      id: 'a004-rule-group-1',
      type: 'group',
      label: '同城兴趣',
      operator: 'AND',
      children: [
        {
          id: 'a004-rule-1',
          type: 'leaf',
          label: '近 14 天同城视频互动 >= 3',
          field: 'local_video_engage_14d',
          comparator: '>=',
          value: '3',
          contribution: 0.19,
        },
        {
          id: 'a004-rule-2',
          type: 'leaf',
          label: '收藏夜场门店 >= 1',
          field: 'night_store_fav_30d',
          comparator: '>=',
          value: '1',
          contribution: 0.11,
        },
      ],
    },
    {
      id: 'a004-rule-group-2',
      type: 'group',
      label: '到店意图',
      operator: 'AND',
      children: [
        {
          id: 'a004-rule-3',
          type: 'leaf',
          label: '周末晚间搜索门店',
          field: 'search_night_weekend',
          comparator: '=',
          value: 'true',
          contribution: 0.16,
        },
        {
          id: 'a004-rule-4',
          type: 'leaf',
          label: '近 30 天核销团购券 >= 1',
          field: 'coupon_verify_30d',
          comparator: '>=',
          value: '1',
          contribution: 0.14,
        },
      ],
    },
    {
      id: 'a004-rule-group-3',
      type: 'group',
      label: '安全约束',
      operator: 'AND',
      children: [
        {
          id: 'a004-rule-5',
          type: 'leaf',
          label: '年龄 >= 18',
          field: 'age',
          comparator: '>=',
          value: '18',
          contribution: 0.08,
        },
        {
          id: 'a004-rule-6',
          type: 'leaf',
          label: '排除敏感类目投诉用户',
          field: 'sensitive_complaint_90d',
          comparator: '=',
          value: 'false',
          contribution: 0.07,
        },
        {
          id: 'a004-rule-7',
          type: 'leaf',
          label: '门店容量评分 >= 0.7',
          field: 'store_capacity_score',
          comparator: '>=',
          value: '0.7',
          contribution: 0.05,
        },
      ],
    },
  ],
};

export const mockCrowdDetails: CrowdDetail[] = [
  {
    id: 'a_001',
    crowdName: '高价值复购人群',
    crowdCode: 'CROWD-HV-001',
    description: '面向高客单、短决策链路、复购意图明确的电商老客人群。',
    version: 'v3.2',
    owner: {
      name: '王蕾',
      role: '增长运营',
      team: '电商增长组',
    },
    updatedAt: '2026-04-22 18:30',
    status: 'ready',
    scale: 3280000,
    estimatedRevenue: 9820000,
    healthScore: 91,
    kpis: [
      { key: 'size', label: '人群规模', value: '328 万', trend: 'up', changeText: '+6.8%', hint: '近 7 天' },
      { key: 'gmv', label: '预估收益', value: '982 万', trend: 'up', changeText: '+12.4%', hint: '未来 30 天' },
      { key: 'roi', label: '历史 ROI', value: '3.42', trend: 'up', changeText: '+0.28', hint: '近 90 天' },
      { key: 'health', label: '健康度', value: '91', trend: 'flat', changeText: '稳定', hint: '规则与血缘' },
    ],
    portrait: {
      summary:
        '这是一群已经建立品牌偏好、对上新礼盒和套装商品响应快、对阶梯优惠敏感的成熟复购用户。她们通常在工作日晚间完成决策，愿意为确定性体验支付溢价。',
      confidence: 0.91,
      regeneratedNote: '已重新生成后会在原画像后追加补充说明。',
      sources: [
        { label: '近 90 天交易行为', value: '35%' },
        { label: '会员等级与复购', value: '27%' },
        { label: '商品偏好画像', value: '22%' },
        { label: '触达响应日志', value: '16%' },
      ],
    },
    distributions: [
      {
        system: 'ecommerce',
        title: '电商 8 大人群',
        segments: [
          { key: 'core_repurchase', label: '高价值复购', ratio: 0.22, tgi: 165, samplePath: marketFeaturePathA001('ecommerce:core_repurchase') },
          { key: 'new_high_potential', label: '高潜新客', ratio: 0.12, tgi: 136, samplePath: marketFeaturePathA001('ecommerce:new_high_potential') },
          { key: 'cart_waiting', label: '加购待转化', ratio: 0.11, tgi: 128, samplePath: marketFeaturePathA001('ecommerce:cart_waiting') },
          { key: 'coupon_sensitive', label: '优惠敏感', ratio: 0.14, tgi: 142, samplePath: marketFeaturePathA001('ecommerce:coupon_sensitive') },
          { key: 'category_loyal', label: '品类忠诚', ratio: 0.1, tgi: 121, samplePath: marketFeaturePathA001('ecommerce:category_loyal') },
          { key: 'member_growth', label: '会员成长', ratio: 0.09, tgi: 118, samplePath: marketFeaturePathA001('ecommerce:member_growth') },
          { key: 'price_sensitive', label: '价格敏感', ratio: 0.1, tgi: 96, samplePath: marketFeaturePathA001('ecommerce:price_sensitive') },
          { key: 'silent_recall', label: '沉默召回', ratio: 0.12, tgi: 84, samplePath: marketFeaturePathA001('ecommerce:silent_recall') },
        ],
      },
      {
        system: 'lifestyle',
        title: '生服 5A 人群',
        segments: [
          { key: 'A1', label: 'A1 高活跃', ratio: 0.24, tgi: 158, samplePath: marketFeaturePathA001('lifestyle:A1') },
          { key: 'A2', label: 'A2 可转化', ratio: 0.22, tgi: 147, samplePath: marketFeaturePathA001('lifestyle:A2') },
          { key: 'A3', label: 'A3 需激发', ratio: 0.2, tgi: 121, samplePath: marketFeaturePathA001('lifestyle:A3') },
          { key: 'A4', label: 'A4 弱活跃', ratio: 0.18, tgi: 102, samplePath: marketFeaturePathA001('lifestyle:A4') },
          { key: 'A5', label: 'A5 待召回', ratio: 0.16, tgi: 88, samplePath: marketFeaturePathA001('lifestyle:A5') },
        ],
      },
    ],
    quadrants: [
      { key: 'people', title: '人', summary: '以白领女性、品牌会员、节奏稳定的成熟客群为主。', tags: ['白领', '成熟客群', '高客单'] },
      { key: 'product', title: '货', summary: '更偏好礼盒、新品套装和高毛利组合。', tags: ['礼盒', '套装', '新品'] },
      { key: 'scene', title: '场', summary: '工作日晚间站内推荐与私域社群承接最好。', tags: ['首页推荐', '企微社群', '直播预售'] },
      { key: 'time', title: '时', summary: '周四到周六晚 8 点后成交最集中。', tags: ['周四', '晚间', '大促前'] },
    ],
    timeHeatmap: {
      days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      hours: Array.from({ length: 24 }, (_, index) => index),
      values: createHeatmap(2),
    },
    consumers: {
      columns: baseColumns,
      rows: a001Consumers,
    },
    topScenes: a001TopScenes,
    revenueTimeline90d: createTimeline('2026-01-24', {
      baseGmv: 76000,
      dailyStep: 460,
      wave: 11800,
      roiBase: 2.78,
      roiWave: 0.33,
      roiStep: 0.03,
    }),
    rule: {
      tree: a001RuleTree,
      sql:
        "SELECT user_id FROM dwd_trade_user_tag WHERE pay_cnt_30d >= 2 AND aov_30d >= 180 AND cart_to_pay_14d = true AND complaint_7d = false AND aftersale_open = false AND age_band BETWEEN 25 AND 34 AND city_tier >= 'new_tier_1';",
      naturalLanguage:
        '筛选 25-34 岁、新一线及以上城市、近 30 天至少支付 2 次、客单价不低于 180 且近 14 天加购后成交，同时排除投诉与售后中的用户。',
      foundryPath: '/factory/pack?base=a_001',
    },
    basisTabs: basisTabsA001,
    lineage: [
      {
        id: 'a001-lineage-1',
        table: 'dwd_trade_user_profile',
        description: '用户基础画像宽表',
        confidence: 0.96,
        coverage: 0.98,
        fields: ['age_band', 'city_tier', 'member_level'],
        upstream: ['ods_member_user_profile'],
      },
      {
        id: 'a001-lineage-2',
        table: 'dws_order_behavior_30d',
        description: '近 30 天交易行为聚合',
        confidence: 0.94,
        coverage: 0.95,
        fields: ['pay_cnt_30d', 'aov_30d', 'cart_to_pay_14d'],
        upstream: ['dwd_trade_order_detail', 'dwd_trade_cart_log'],
      },
      {
        id: 'a001-lineage-3',
        table: 'dws_risk_exclusion_7d',
        description: '投诉与售后排除集',
        confidence: 0.9,
        coverage: 0.92,
        fields: ['complaint_7d', 'aftersale_open'],
        upstream: ['dwd_service_ticket', 'dwd_aftersale_case'],
      },
    ],
    compliance: {
      dimensions: a001Compliance,
      advices: baseAdvices('a001'),
      risks: baseRisks('a001'),
    },
    assistant: {
      prompts: [
        '这个人群和 a_004 人群有什么差异?',
        '帮我把圈选条件收紧到 200 万以内',
        '这个人群能投短信吗?',
      ],
      replies: [
        {
          id: 'a001-assistant-1',
          question: '这个人群和 a_004 人群有什么差异?',
          answer:
            'a_001 更偏电商成熟复购，规模更大、画像置信度更高，生服 5A 中 A1/A2 占比也明显高于 a_004；a_004 则更偏同城夜场即时消费，周末高峰更集中。',
          chart: true,
        },
        {
          id: 'a001-assistant-2',
          question: '帮我把圈选条件收紧到 200 万以内',
          answer:
            '建议增加“近 30 天支付次数 >= 3”与“近 14 天浏览新品礼盒 >= 2 次”两个条件，预计规模约 196 万，历史 ROI 有机会提升到 3.65。',
        },
        {
          id: 'a001-assistant-3',
          question: '这个人群能投短信吗?',
          answer:
            '可以，但当前渠道权限为黄灯。建议保留站内推荐为主、短信为辅，并先补齐跨渠道频控校验后再执行。',
        },
      ],
    },
  },
  {
    id: 'a_004',
    crowdName: '同城夜场活跃人群',
    crowdCode: 'CROWD-LOCAL-004',
    description: '面向同城夜间消费、即时决策和门店到店转化场景的年轻活跃客群。',
    version: 'v2.4',
    owner: {
      name: '陈昊',
      role: '本地生活运营',
      team: '到店增长组',
    },
    updatedAt: '2026-04-21 21:10',
    status: 'ready',
    scale: 2140000,
    estimatedRevenue: 6240000,
    healthScore: 83,
    kpis: [
      { key: 'size', label: '人群规模', value: '214 万', trend: 'up', changeText: '+4.2%', hint: '近 7 天' },
      { key: 'gmv', label: '预估收益', value: '624 万', trend: 'up', changeText: '+8.7%', hint: '未来 30 天' },
      { key: 'roi', label: '历史 ROI', value: '2.18', trend: 'down', changeText: '-0.11', hint: '近 90 天' },
      { key: 'health', label: '健康度', value: '83', trend: 'down', changeText: '内容红灯', hint: '合规与履约' },
    ],
    portrait: {
      summary:
        '这是一群同城夜间活跃、易受氛围内容影响、对限时券和多人套餐响应快的年轻消费者。他们更看重即时情绪价值和门店体验，适合做夜场活动和周末拉新。',
      confidence: 0.86,
      regeneratedNote: '已重新生成后会补充敏感内容规避建议。',
      sources: [
        { label: '同城视频互动', value: '32%' },
        { label: '门店核销数据', value: '24%' },
        { label: '商圈到店行为', value: '23%' },
        { label: '活动券使用记录', value: '21%' },
      ],
    },
    distributions: [
      {
        system: 'ecommerce',
        title: '电商 8 大人群',
        segments: [
          { key: 'core_repurchase', label: '高价值复购', ratio: 0.08, tgi: 82, samplePath: marketFeaturePathA004('ecommerce:core_repurchase') },
          { key: 'new_high_potential', label: '高潜新客', ratio: 0.17, tgi: 141, samplePath: marketFeaturePathA004('ecommerce:new_high_potential') },
          { key: 'cart_waiting', label: '加购待转化', ratio: 0.09, tgi: 101, samplePath: marketFeaturePathA004('ecommerce:cart_waiting') },
          { key: 'coupon_sensitive', label: '优惠敏感', ratio: 0.18, tgi: 154, samplePath: marketFeaturePathA004('ecommerce:coupon_sensitive') },
          { key: 'category_loyal', label: '品类忠诚', ratio: 0.07, tgi: 93, samplePath: marketFeaturePathA004('ecommerce:category_loyal') },
          { key: 'member_growth', label: '会员成长', ratio: 0.11, tgi: 117, samplePath: marketFeaturePathA004('ecommerce:member_growth') },
          { key: 'price_sensitive', label: '价格敏感', ratio: 0.16, tgi: 148, samplePath: marketFeaturePathA004('ecommerce:price_sensitive') },
          { key: 'silent_recall', label: '沉默召回', ratio: 0.14, tgi: 95, samplePath: marketFeaturePathA004('ecommerce:silent_recall') },
        ],
      },
      {
        system: 'lifestyle',
        title: '生服 5A 人群',
        segments: [
          { key: 'A1', label: 'A1 高活跃', ratio: 0.18, tgi: 138, samplePath: marketFeaturePathA004('lifestyle:A1') },
          { key: 'A2', label: 'A2 可转化', ratio: 0.24, tgi: 152, samplePath: marketFeaturePathA004('lifestyle:A2') },
          { key: 'A3', label: 'A3 需激发', ratio: 0.23, tgi: 134, samplePath: marketFeaturePathA004('lifestyle:A3') },
          { key: 'A4', label: 'A4 弱活跃', ratio: 0.19, tgi: 109, samplePath: marketFeaturePathA004('lifestyle:A4') },
          { key: 'A5', label: 'A5 待召回', ratio: 0.16, tgi: 87, samplePath: marketFeaturePathA004('lifestyle:A5') },
        ],
      },
    ],
    quadrants: [
      { key: 'people', title: '人', summary: '以同城青年和大学城周边用户为主，互动强、决策快。', tags: ['青年', '同城', '即时消费'] },
      { key: 'product', title: '货', summary: '夜场套餐、多人分享和限时券最受欢迎。', tags: ['夜场套餐', '限时券', '多人分享'] },
      { key: 'scene', title: '场', summary: '商圈团购、同城视频和线下联动场景最有效。', tags: ['团购频道', '同城视频', '商圈活动'] },
      { key: 'time', title: '时', summary: '周五到周日 21:00-23:00 活跃与转化双高。', tags: ['周末', '21:00-23:00', '节庆夜场'] },
    ],
    timeHeatmap: {
      days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      hours: Array.from({ length: 24 }, (_, index) => index),
      values: createHeatmap(5),
    },
    consumers: {
      columns: baseColumns,
      rows: a004Consumers,
    },
    topScenes: a004TopScenes,
    revenueTimeline90d: createTimeline('2026-01-24', {
      baseGmv: 52000,
      dailyStep: 320,
      wave: 9800,
      roiBase: 1.92,
      roiWave: 0.28,
      roiStep: 0.025,
    }),
    rule: {
      tree: a004RuleTree,
      sql:
        "SELECT user_id FROM dws_local_scene_tag WHERE local_video_engage_14d >= 3 AND night_store_fav_30d >= 1 AND search_night_weekend = true AND coupon_verify_30d >= 1 AND age >= 18 AND sensitive_complaint_90d = false AND store_capacity_score >= 0.7;",
      naturalLanguage:
        '筛选近 14 天同城视频互动至少 3 次、收藏夜场门店、周末晚间搜索过门店且近 30 天核销过团购券的成年用户，并排除敏感投诉人群和低容量门店覆盖用户。',
      foundryPath: '/factory/pack?base=a_004',
    },
    basisTabs: basisTabsA004,
    lineage: [
      {
        id: 'a004-lineage-1',
        table: 'dws_local_video_interest_14d',
        description: '同城视频兴趣聚合',
        confidence: 0.93,
        coverage: 0.95,
        fields: ['local_video_engage_14d', 'night_store_fav_30d'],
        upstream: ['dwd_local_video_action'],
      },
      {
        id: 'a004-lineage-2',
        table: 'dws_store_visit_intent_30d',
        description: '门店搜索与核销意图',
        confidence: 0.91,
        coverage: 0.9,
        fields: ['search_night_weekend', 'coupon_verify_30d'],
        upstream: ['dwd_local_search_log', 'dwd_coupon_verify_log'],
      },
      {
        id: 'a004-lineage-3',
        table: 'dim_store_capacity_daily',
        description: '门店履约容量与限制',
        confidence: 0.87,
        coverage: 0.84,
        fields: ['store_capacity_score', 'restricted_age_scene'],
        upstream: ['ods_store_capacity_snapshot'],
      },
    ],
    compliance: {
      dimensions: a004Compliance,
      advices: baseAdvices('a004'),
      risks: baseRisks('a004'),
    },
    assistant: {
      prompts: [
        '这个人群和 a_004 人群有什么差异?',
        '帮我把圈选条件收紧到 200 万以内',
        '这个人群能投短信吗?',
      ],
      replies: [
        {
          id: 'a004-assistant-1',
          question: '这个人群和 a_004 人群有什么差异?',
          answer:
            '当前就是 a_004。相对 a_001，它规模更小、置信度略低，但周末夜间的生服场景更集中，A2/A3 占比更高，适合即时消费而非高价值复购。',
          chart: true,
        },
        {
          id: 'a004-assistant-2',
          question: '帮我把圈选条件收紧到 200 万以内',
          answer:
            '建议增加“近 30 天门店核销 >= 2 次”与“排除近 7 天未打开同城视频用户”，预计规模约 192 万，夜场套餐 ROI 有机会回升至 2.06。',
        },
        {
          id: 'a004-assistant-3',
          question: '这个人群能投短信吗?',
          answer:
            '暂不建议直接投。内容维度为红灯，必须先补齐年龄过滤和敏感场景素材分层，否则“立即派发”应保持禁用。',
        },
      ],
    },
  },
];

export const defaultCrowdDetail = mockCrowdDetails[0];

export const crowdDetailsById = mockCrowdDetails.reduce<Record<string, CrowdDetail>>(
  (acc, detail) => {
    acc[detail.id] = detail;
    return acc;
  },
  {},
);

export function getCrowdDetailById(id?: string) {
  if (!id) {
    return defaultCrowdDetail;
  }

  return crowdDetailsById[id] ?? defaultCrowdDetail;
}

mockCrowdDetails.forEach(validateDetail);
