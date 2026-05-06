import type { CrowdDiagnosisData } from '../types';

export const crowdDiagnosisMock: CrowdDiagnosisData = {
  id: 'crowd-001',
  name: '高价值复购人群',
  version: 'v2.1',
  industry: '餐饮',
  updatedAt: '2024-04-20 14:30',
  dsl: 'SELECT * FROM users WHERE recency <= 7 AND frequency >= 3 AND monetary >= 500',
  scale: 12800000,
  overlap: 0.68,
  historyRoi: 2.0,
  roiDelta: 0.15,
  channels: [
    { name: '本地推', available: true },
    { name: '优惠券', available: true },
    { name: '营销触达', available: true },
    { name: 'DMP', available: false }
  ],
  scaleSparkline: [120, 125, 118, 130, 128, 135, 140],
  
  sceneMatches: [
    {
      scene: '新品上市',
      matchLevel: 'high',
      score: 0.88,
      reasons: ['历史对新品偏好高', '近期活跃度高', '客单价提升空间大'],
      expectedLift: { gmv: 0.22, roi: 0.18 }
    },
    {
      scene: '复购激励',
      matchLevel: 'high',
      score: 0.85,
      reasons: ['复购行为稳定', '对优惠券敏感', '营销响应率高'],
      expectedLift: { gmv: 0.18, roi: 0.25 }
    },
    {
      scene: '会员升级',
      matchLevel: 'mid',
      score: 0.72,
      reasons: ['会员等级较低', '消费潜力大', '品牌忠诚度高'],
      expectedLift: { gmv: 0.15, roi: 0.12 }
    }
  ],
  
  coreMetrics: [
    { name: 'GMV', current: 12500000, benchmark: 10000000, delta: 0.25 },
    { name: '客单价', current: 156, benchmark: 128, delta: 0.22 },
    { name: '转化率', current: 0.12, benchmark: 0.08, delta: 0.5 },
    { name: '复购率', current: 0.45, benchmark: 0.32, delta: 0.41 },
    { name: '留存率', current: 0.68, benchmark: 0.52, delta: 0.31 }
  ],
  
  structure5a: [
    { name: 'A1', value: 0.85, benchmark: 0.72 },
    { name: 'A2', value: 0.72, benchmark: 0.65 },
    { name: 'A3', value: 0.58, benchmark: 0.48 },
    { name: 'A4', value: 0.42, benchmark: 0.35 },
    { name: 'A5', value: 0.28, benchmark: 0.22 }
  ],
  
  structure6c: [
    { name: 'C1', value: 0.88, benchmark: 0.75 },
    { name: 'C2', value: 0.75, benchmark: 0.68 },
    { name: 'C3', value: 0.62, benchmark: 0.55 },
    { name: 'C4', value: 0.48, benchmark: 0.40 },
    { name: 'C5', value: 0.35, benchmark: 0.28 },
    { name: 'C6', value: 0.22, benchmark: 0.18 }
  ],
  
  efficiencyKpis: [
    { name: 'A1A2 增长率', value: 18.5, vsMarket: 12.3, vsIndustry: 8.7 },
    { name: 'A3 流转率', value: 45.2, vsMarket: 18.5, vsIndustry: 12.2 },
    { name: '交易流转率', value: 32.8, vsMarket: 15.2, vsIndustry: 9.8 },
    { name: '复购流转率', value: 28.5, vsMarket: 12.5, vsIndustry: 7.2 },
    { name: '召回率', value: 68.2, vsMarket: 22.5, vsIndustry: 15.8 }
  ],
  
  dualRadar: {
    ecommerce: [0.75, 0.68, 0.82, 0.58, 0.72],
    lifestyle: [0.62, 0.75, 0.55, 0.85, 0.68],
    indicators: ['消费力', '活跃度', '品类偏好', '营销敏感', '生命周期']
  },
  
  signalDomains: [
    {
      name: '基础属性',
      coverage: 0.95,
      lift: 2.1,
      features: [
        { name: '年龄 25-35', value: 0.75, weight: 0.25 },
        { name: '女性', value: 0.68, weight: 0.20 },
        { name: '一线城市', value: 0.58, weight: 0.18 }
      ]
    },
    {
      name: '交易行为',
      coverage: 0.88,
      lift: 2.5,
      features: [
        { name: '近7天活跃', value: 0.82, weight: 0.30 },
        { name: '客单价 ≥500', value: 0.75, weight: 0.25 },
        { name: '复购 ≥3次', value: 0.68, weight: 0.22 }
      ]
    },
    {
      name: '营销响应',
      coverage: 0.72,
      lift: 1.8,
      features: [
        { name: '打开率 ≥40%', value: 0.72, weight: 0.28 },
        { name: '点击率 ≥25%', value: 0.65, weight: 0.25 },
        { name: '优惠券使用率 ≥60%', value: 0.58, weight: 0.22 }
      ]
    },
    {
      name: '品类偏好',
      coverage: 0.65,
      lift: 2.2,
      features: [
        { name: '奶茶偏好', value: 0.78, weight: 0.28 },
        { name: '快餐偏好', value: 0.72, weight: 0.25 },
        { name: '轻食偏好', value: 0.62, weight: 0.22 }
      ]
    },
    {
      name: '生命周期',
      coverage: 0.58,
      lift: 1.6,
      features: [
        { name: '成熟期用户', value: 0.72, weight: 0.32 },
        { name: '成长期用户', value: 0.55, weight: 0.25 },
        { name: '引入期用户', value: 0.38, weight: 0.18 }
      ]
    },
    {
      name: '设备信息',
      coverage: 0.45,
      lift: 1.4,
      features: [
        { name: 'iOS 用户', value: 0.58, weight: 0.22 },
        { name: '高端机型', value: 0.52, weight: 0.20 },
        { name: 'WiFi 环境', value: 0.48, weight: 0.18 }
      ]
    },
    {
      name: '时空分布',
      coverage: 0.52,
      lift: 1.7,
      heatmap: Array(7).fill(0).map(() => Array(24).fill(0).map(() => Math.random()))
    }
  ],
  
  matchingSuggestions: [
    {
      type: '货品',
      title: '网红奶茶推荐',
      details: [
        { label: '推荐商品', value: '芝芝莓莓、杨枝甘露、多肉葡萄' },
        { label: '预估转化率', value: '18.5%' },
        { label: '建议定价', value: '¥19-29' },
        { label: '适配时段', value: '13-17点' }
      ]
    },
    {
      type: '优惠券',
      title: '复购激励券包',
      details: [
        { label: '券组合', value: '满30减5、满60减12、满100减25' },
        { label: '预估使用', value: '62.5%' },
        { label: '优惠力度', value: '12-25%' },
        { label: '有效期', value: '7天' }
      ]
    },
    {
      type: '场域',
      title: '午餐场触达',
      details: [
        { label: '推荐渠道', value: '公众号、企业微信、短信' },
        { label: '触达时段', value: '11-13点' },
        { label: '触达频次', value: '每周2次' },
        { label: '曝光位置', value: '首页Banner' }
      ]
    },
    {
      type: '组合',
      title: '下午茶套餐',
      details: [
        { label: '套餐内容', value: '奶茶+小食组合' },
        { label: '预估客单', value: '¥38-48' },
        { label: '优惠方式', value: '套餐价8折' },
        { label: '活动周期', value: '14天' }
      ]
    }
  ],
  
  lookalike: [
    { tier: '1%', scale: 128000, roi: 2.8, roiDelta: 0.40 },
    { tier: '3%', scale: 384000, roi: 2.5, roiDelta: 0.25 },
    { tier: '5%', scale: 640000, roi: 2.2, roiDelta: 0.10 },
    { tier: '10%', scale: 1280000, roi: 1.9, roiDelta: -0.05 }
  ],
  
  similarCrowds: [
    { id: 'crowd-002', name: '年轻白领人群', scale: 2560000, overlap: 0.35, lift: 0.28 },
    { id: 'crowd-003', name: '奶茶爱好者', scale: 1890000, overlap: 0.42, lift: 0.22 },
    { id: 'crowd-004', name: '周末活跃人群', scale: 3120000, overlap: 0.28, lift: 0.18 }
  ],
  
  overlapMatrix: [
    { crowdA: '本人群', crowdB: '年轻白领人群', value: 0.35 },
    { crowdA: '本人群', crowdB: '奶茶爱好者', value: 0.42 },
    { crowdA: '本人群', crowdB: '周末活跃人群', value: 0.28 },
    { crowdA: '年轻白领人群', crowdB: '奶茶爱好者', value: 0.52 },
    { crowdA: '年轻白领人群', crowdB: '周末活跃人群', value: 0.38 },
    { crowdA: '奶茶爱好者', crowdB: '周末活跃人群', value: 0.45 }
  ],
  
  effectReview: {
    usage: [
      { id: 'usage-001', date: '2024-04-15', scene: '新品上市', gmv: 520000, roi: 2.5, reach: 128000 },
      { id: 'usage-002', date: '2024-04-08', scene: '复购激励', gmv: 480000, roi: 2.2, reach: 98000 },
      { id: 'usage-003', date: '2024-03-28', scene: '会员日', gmv: 620000, roi: 2.8, reach: 156000 }
    ],
    holdout: {
      test: { gmv: 520000, conversion: 0.125 },
      control: { gmv: 380000, conversion: 0.085 },
      delta: { gmv: 0.368, conversion: 0.471 }
    },
    attribution: {
      nodes: [
        { id: 'impression', name: '曝光', value: 256000 },
        { id: 'click', name: '点击', value: 64000 },
        { id: 'cart', name: '加购', value: 25600 },
        { id: 'order', name: '下单', value: 12800 },
        { id: 'pay', name: '支付', value: 10240 }
      ],
      links: [
        { source: 'impression', target: 'click', value: 64000 },
        { source: 'click', target: 'cart', value: 25600 },
        { source: 'cart', target: 'order', value: 12800 },
        { source: 'order', target: 'pay', value: 10240 }
      ]
    }
  },
  
  lineage: {
    sources: [
      { table: 'user_base', fields: ['age', 'gender', 'city'], confidence: 0.95, coverage: 0.98 },
      { table: 'transaction_history', fields: ['amount', 'frequency', 'recency'], confidence: 0.92, coverage: 0.88 },
      { table: 'marketing_response', fields: ['open_rate', 'click_rate'], confidence: 0.85, coverage: 0.72 },
      { table: 'category_preference', fields: ['category_score'], confidence: 0.78, coverage: 0.65 }
    ],
    confidence: 0.92,
    coverage: 0.88,
    forbiddenScenes: ['金融服务', '医疗健康', '教育招生']
  }
};
