import type { DerivedAsset } from '../../../../api/assets';
import type {
  AssetDetailCompareRow,
  AssetDetailCoverageGapAlert,
  AssetDetailCoverageStage,
  AssetDetailChangelogItem,
  AssetDetailDefinition,
  AssetDetailDrilldownPayload,
  AssetDetailBoundaryCase,
  AssetDetailBaselineCompareRow,
  AssetDetailDistributionMini,
  AssetDetailGranularityHint,
  AssetDetailGlossaryTerm,
  AssetDetailIsIsNot,
  AssetDetailKnownIssue,
  AssetDetailLineageEdge,
  AssetDetailLineageNode,
  AssetDetailMockData,
  AssetDetailPeerUsage,
  AssetDetailPersonalSample,
  AssetDetailPreflightCheckItem,
  AssetDetailQueryState,
  AssetDetailQualityBadge,
  AssetDetailQuantMetric,
  AssetDetailReasonItem,
  AssetDetailRoiEstimatorScenario,
  AssetDetailSamplePreview,
  AssetDetailScopeSelector,
  AssetDetailSliceDistribution,
  AssetDetailSourceAwareness,
  AssetDetailStabilityPoint,
  AssetDetailSubscribeCta,
  AssetDetailSubscribeImpact,
  AssetDetailSupplierPanel,
  AssetDetailTryRunPreset,
  AssetDetailTryRunResult,
  AssetDetailUseCaseOption,
  AssetDetailUseCaseVerdict,
  AssetDetailVerdictBanner,
} from '../types';

const useCaseOptions: AssetDetailUseCaseOption[] = [
  { key: 'marketing', label: '营销触达', description: '评估营销拉活、券投放、复购激励等场景的适配性。' },
  { key: 'recommendation', label: '推荐排序', description: '评估推荐召回、粗排、精排等链路的适配性。' },
  { key: 'retention', label: '流失挽回', description: '评估 CRM、召回、再营销等留存场景的适配性。' },
];

const glossary: Record<string, AssetDetailGlossaryTerm> = {
  fit_score: {
    term: '适配度',
    definition: '综合对象定义、适用品类、消费历史和范围覆盖后得到的场景匹配分。',
    formula: '0.35 * 定义匹配 + 0.35 * 消费效果 + 0.30 * 覆盖稳定性',
    source: '诊断详情 mock 口径',
  },
  coverage_rate: {
    term: '覆盖率',
    definition: '在当前范围内可被该资产稳定识别并成功命中的目标对象占比。',
    formula: '命中目标对象数 / 范围总对象数',
    source: '质量评测 mock 口径',
  },
  health_score: {
    term: '健康度',
    definition: '综合准确率、覆盖率、新鲜度与稳定性后的总体质量分。',
    formula: '0.4 * 准确率 + 0.25 * 覆盖率 + 0.2 * 新鲜度 + 0.15 * 稳定性',
    source: '资产健康度 mock 口径',
  },
  incremental_gain: {
    term: '增益',
    definition: '使用该资产后，相对未使用基线在目标 KPI 上获得的额外提升。',
    formula: '(实验组 KPI - 对照组 KPI) / 对照组 KPI',
    source: 'AB 收益 mock 口径',
  },
};

const drilldowns: Record<string, AssetDetailDrilldownPayload> = {
  fit_segments: {
    title: '适配度分层下钻',
    columns: ['分层', '对象量级', '适配度', '说明'],
    rows: [
      ['高匹配', '128 万', '91', '复购和券敏感信号同时命中'],
      ['中匹配', '76 万', '78', '近 30 天消费信号稳定'],
      ['低匹配', '32 万', '63', '跨域行为弱，需谨慎投放'],
    ],
  },
  coverage_breakdown: {
    title: '覆盖瀑布下钻',
    columns: ['阶段', '覆盖率', '变化', '原因'],
    rows: [
      ['原始供给', '93%', '-', '资产基础覆盖'],
      ['范围过滤后', '81%', '-12pp', '当前 scope 排除了非餐饮交易人群'],
      ['口径对齐后', '74%', '-7pp', '只保留近 30 天券触达人群'],
      ['质量红线后', '71%', '-3pp', '剔除了新鲜度不足的样本'],
    ],
  },
  issue_log: {
    title: '已知问题日志',
    columns: ['时间', '问题', '严重度', '动作'],
    rows: [
      ['04-10', '生服侧近 7 天行为延迟', 'high', '触发告警并限流'],
      ['04-16', '跨域映射覆盖回落', 'medium', '补齐 DID 映射'],
      ['04-22', '推荐链路样本漂移', 'low', '已纳入下一轮评测'],
    ],
  },
};

function resolveUseCaseKey(query: AssetDetailQueryState) {
  if (query.useCase && useCaseOptions.some((item) => item.key === query.useCase)) {
    return query.useCase;
  }
  return 'marketing';
}

function buildDefinition(asset: DerivedAsset): AssetDetailDefinition {
  return {
    oneLiner: `${asset.nameBiz || asset.name} 用于识别高券敏感、高复购潜力的跨域目标对象。`,
    longText:
      '该资产聚合电商与生服两侧近 30 天的券领取、核销、下单与复购行为，输出可用于营销触达、推荐排序和召回策略的高价值目标对象集合。',
    tooltipTermIds: ['fit_score', 'coverage_rate', 'health_score'],
  };
}

function buildIsIsNot(): AssetDetailIsIsNot {
  return {
    isItems: ['高券敏感人群识别器', '跨域营销触达用的稳定人群资产', '支持推荐与 CRM 联动的中上游供给'],
    isNotItems: ['实时竞价特征', '适用于冷启动全量拉新的通用标签', '完全免人工评审的零风险资产'],
  };
}

function buildQuantSummary(asset: DerivedAsset): AssetDetailQuantMetric[] {
  return [
    {
      key: 'fit',
      label: '适配度',
      value: '91',
      hint: '当前范围下场景匹配较高',
      trend: 'up',
      drilldownId: 'fit_segments',
      tooltipTermId: 'fit_score',
    },
    {
      key: 'coverage',
      label: '可用覆盖',
      value: '71%',
      hint: '经范围与质量红线过滤后',
      trend: 'down',
      drilldownId: 'coverage_breakdown',
      tooltipTermId: 'coverage_rate',
    },
    {
      key: 'health',
      label: '健康度',
      value: String(asset.health.score),
      hint: '综合质量分',
      trend: 'flat',
      tooltipTermId: 'health_score',
    },
    {
      key: 'gain',
      label: '预估增益',
      value: asset.roi_hint || '+12%',
      hint: '近似 AB 收益表现',
      trend: 'up',
      tooltipTermId: 'incremental_gain',
    },
  ];
}

function buildRecommendReason(asset: DerivedAsset): { confidence: number; summary: string; items: AssetDetailReasonItem[] } {
  return {
    confidence: 0.86,
    summary: `${asset.nameBiz || asset.name} 在当前 scope 下同时满足“覆盖足够、质量可控、收益可解释”三个条件。`,
    items: [
      { label: '消费历史', value: '3 个团队持续订阅', evidence: '近 90 天在营销与用增链路稳定使用' },
      { label: '质量红线', value: '准确率 88% / 覆盖 71%', evidence: '低于广告场景红线，但满足营销触达要求' },
      { label: '收益表现', value: asset.roi_hint || '+18%', evidence: '历史 AB 显示 GMV 提升与 ROI 提升均为正' },
    ],
  };
}

function buildVerdictBanner(useCaseKey: string): AssetDetailVerdictBanner {
  if (useCaseKey === 'recommendation') {
    return {
      level: 'conditional',
      title: '条件推荐',
      summary: '推荐排序链路可试用，但需先确认稳定性波动与样本延迟影响。',
      primaryAction: '先试算',
      secondaryAction: '查看已知问题',
      reasons: ['覆盖率仍可接受', '稳定性短期波动需要监控'],
    };
  }
  if (useCaseKey === 'retention') {
    return {
      level: 'recommended',
      title: '推荐订阅',
      summary: '流失挽回场景下，资产定义和消费历史表现良好，适合直接进入试算。',
      primaryAction: '进入试算',
      secondaryAction: '查看对比',
      reasons: ['与挽回人群高度匹配', '历史 ROI 表现稳定'],
    };
  }
  return {
    level: 'recommended',
    title: '推荐订阅',
    summary: '营销触达场景下综合收益与覆盖表现较优，可直接进入试算和订阅决策。',
    primaryAction: '开始试算',
    secondaryAction: '查看推荐理由',
    reasons: ['适配度高', '覆盖可解释', '历史增益明确'],
  };
}

function buildScopeSelector(query: AssetDetailQueryState): AssetDetailScopeSelector {
  return {
    editable: true,
    scopeLabel: query.scope || '跨域餐饮活跃用户',
    dimensions: [
      { label: '域', value: '跨域' },
      { label: '品类', value: '餐饮 / 促销敏感' },
      { label: '时间窗', value: '近 30 天' },
      { label: '对象层级', value: 'UID + DID' },
    ],
  };
}

function buildCoverageWaterfall(): AssetDetailCoverageStage[] {
  return [
    { key: 'raw', label: '原始供给', coverage: 93, delta: 0, reason: '基础资产覆盖充足', drilldownId: 'coverage_breakdown' },
    { key: 'scope', label: '范围过滤', coverage: 81, delta: -12, reason: '过滤到当前业务范围' },
    { key: 'caliber', label: '口径对齐', coverage: 74, delta: -7, reason: '按券敏感口径对齐' },
    { key: 'quality', label: '质量红线', coverage: 71, delta: -3, reason: '剔除时效不足样本' },
  ];
}

function buildQualityVerdict(): AssetDetailUseCaseVerdict[] {
  return [
    { useCaseKey: 'marketing', label: '营销触达', verdict: 'recommended', summary: '覆盖与收益表现都满足最低要求。', blockedBy: [] },
    { useCaseKey: 'recommendation', label: '推荐排序', verdict: 'conditional', summary: '稳定性波动需继续观测。', blockedBy: ['稳定性近 7 天波动偏大'] },
    { useCaseKey: 'retention', label: '流失挽回', verdict: 'recommended', summary: '定义契合挽回场景，适合优先试算。', blockedBy: [] },
  ];
}

function buildQualityBadges(): AssetDetailQualityBadge[] {
  return [
    { key: 'accuracy', label: '准确率', score: 88, percentile: 78, description: '高于同域 78% 资产' },
    { key: 'coverage', label: '覆盖率', score: 71, percentile: 62, description: '范围过滤后仍具可用覆盖' },
    { key: 'freshness', label: '新鲜度', score: 82, percentile: 69, description: '近 24h 更新稳定' },
    { key: 'stability', label: '稳定性', score: 74, percentile: 58, description: '近 7 天有轻微抖动' },
  ];
}

function buildKnownIssues(): AssetDetailKnownIssue[] {
  return [
    {
      id: 'issue-001',
      title: '生服行为数据偶发延迟',
      severity: 'high',
      summary: '近 7 天内存在 1 次 6 小时级延迟，影响部分样本新鲜度。',
      impact: '推荐排序场景风险较高',
      suggestion: '试算时先锁定营销触达链路',
    },
    {
      id: 'issue-002',
      title: '跨域映射覆盖短期回落',
      severity: 'medium',
      summary: 'DID 对齐覆盖较上周下降 3pp。',
      impact: '可用覆盖被进一步压缩',
      suggestion: '订阅前确认当前 scope 是否需要 DID 级联',
    },
  ];
}

function buildStabilityCurve(): AssetDetailStabilityPoint[] {
  return [
    { date: '04-18', score: 79, baseline: 80 },
    { date: '04-19', score: 81, baseline: 80 },
    { date: '04-20', score: 77, baseline: 80 },
    { date: '04-21', score: 74, baseline: 80 },
    { date: '04-22', score: 76, baseline: 80 },
    { date: '04-23', score: 78, baseline: 80 },
    { date: '04-24', score: 80, baseline: 80 },
  ];
}

function buildSubscribeImpact(asset: DerivedAsset): AssetDetailSubscribeImpact {
  return {
    highlights: [
      '订阅后可直接在营销触达链路复用当前人群定义',
      '近 90 天已有 3 个团队消费过相似资产',
      '若进入推荐排序，建议先结合稳定性告警一起看',
    ],
    metrics: [
      { label: '预估触达量', value: '128 万', hint: '基于当前 scope 的去重估算' },
      { label: '预估增益', value: asset.roi_hint || '+18%', hint: '历史 AB 表现区间中位数' },
      { label: '接入成本', value: '低', hint: '已有现成分发渠道与订阅模板' },
    ],
  };
}

function buildTryRunPresets(): AssetDetailTryRunPreset[] {
  return [
    { id: 'preset-marketing', label: '营销促活', scenario: '券投放 + Push 联动', expectedReach: 1280000, expectedLift: 0.18 },
    { id: 'preset-reco', label: '推荐排序', scenario: '召回链路候选增强', expectedReach: 860000, expectedLift: 0.09 },
    { id: 'preset-retention', label: '流失挽回', scenario: 'CRM 召回人群包', expectedReach: 540000, expectedLift: 0.13 },
  ];
}

function buildTryRunResult(selectedPresetId: string): AssetDetailTryRunResult {
  if (selectedPresetId === 'preset-reco') {
    return {
      selectedPresetId,
      expectedReach: 860000,
      expectedLift: 0.09,
      expectedRisk: '稳定性波动需持续观测',
      latencyMs: 2180,
    };
  }
  if (selectedPresetId === 'preset-retention') {
    return {
      selectedPresetId,
      expectedReach: 540000,
      expectedLift: 0.13,
      expectedRisk: '风险可控',
      latencyMs: 1960,
    };
  }
  return {
    selectedPresetId,
    expectedReach: 1280000,
    expectedLift: 0.18,
    expectedRisk: '覆盖过滤后可控',
    latencyMs: 1840,
  };
}

function buildCompareTable(baseAsset: DerivedAsset, compareAssets: DerivedAsset[]): AssetDetailCompareRow[] {
  const rows: AssetDetailCompareRow[] = [
    {
      assetId: baseAsset.id,
      name: baseAsset.nameBiz || baseAsset.name,
      fitScore: 91,
      qualityScore: baseAsset.health.score,
      coverage: 71,
      timeliness: 'T+1',
      subscriptionHeat: baseAsset.subs,
      recommended: true,
    },
  ];

  compareAssets.forEach((asset, index) => {
    rows.push({
      assetId: asset.id,
      name: asset.nameBiz || asset.name,
      fitScore: index === 0 ? 83 : 78,
      qualityScore: asset.health.score,
      coverage: index === 0 ? 66 : 61,
      timeliness: index === 0 ? 'T+1' : 'T+7',
      subscriptionHeat: asset.subs,
      recommended: false,
    });
  });

  return rows;
}

function buildSubscribeCta(): AssetDetailSubscribeCta {
  return {
    title: '先试算，再订阅',
    subtitle: '建议先用营销触达 preset 完成试算，确认收益后再正式订阅。',
    primaryAction: '立即试算',
    secondaryAction: '加入待选',
  };
}

function buildSourceAwareness(query: AssetDetailQueryState): AssetDetailSourceAwareness {
  if (query.source === 'alert') {
    return {
      title: '来自告警流',
      description: '本次进入由稳定性异常触发，系统优先展开证伪与问题排查信息。',
      defaultLayer: 'layer2',
    };
  }
  if (query.source === 'compare') {
    return {
      title: '来自横向对比',
      description: '本次进入是为了和候选资产做订阅决策，系统优先展开决策层信息。',
      defaultLayer: 'layer3',
    };
  }
  if (query.source === 'recommender') {
    return {
      title: '来自推荐入口',
      description: '系统优先呈现推荐理由、用途与覆盖差异，帮助你快速判断是否值得继续。',
      defaultLayer: 'layer1',
    };
  }
  return {
    title: '直接进入详情',
    description: '当前为标准诊断详情视图，可从定义、覆盖、证伪和决策四层逐步查看。',
    defaultLayer: 'layer0',
  };
}

function buildUseCaseTags(asset: DerivedAsset) {
  return [...(asset.scenarios || []), '跨域营销', '券敏感识别'].slice(0, 4);
}

function buildSamplePreview(): AssetDetailSamplePreview[] {
  return [
    { id: 'sample-1', title: '高频领券 + 近 7 天复购', subtitle: '券敏感高价值样本', tags: ['餐饮', '复购', '高活跃'] },
    { id: 'sample-2', title: '跨域下单 + 夜间活跃', subtitle: '推荐排序易增益样本', tags: ['夜间', '跨域', '排序'] },
    { id: 'sample-3', title: '流失边缘 + 优惠召回响应', subtitle: '挽回场景高适配样本', tags: ['召回', '优惠', '流失边缘'] },
  ];
}

function buildDistributionMini(): AssetDetailDistributionMini {
  return {
    title: '样本分布形状',
    average: 71,
    benchmark: 65,
    bins: [
      { label: '0-20', value: 8 },
      { label: '20-40', value: 16 },
      { label: '40-60', value: 27 },
      { label: '60-80', value: 31 },
      { label: '80-100', value: 18 },
    ],
  };
}

function buildSupplierPanel(): AssetDetailSupplierPanel {
  return {
    title: '供给方补充信息',
    summary: '供给方视角下可额外看到当前供给风险、工单状态和下游影响摘要。',
    bullets: ['近 7 天 1 次稳定性预警', '已有 2 个下游团队订阅', '当前未触发强制下线规则'],
  };
}

function buildCoverageGapAlert(): AssetDetailCoverageGapAlert {
  return {
    level: 'warning',
    title: '当前范围仍有 9% 覆盖缺口',
    description: '主要集中在 DID 对齐不足和近 7 天新增样本延迟，同类资产中属于可优化区间。',
  };
}

function buildGranularityHint(): AssetDetailGranularityHint {
  return {
    title: '粒度对齐提示',
    summary: '当前资产以 UID + DID 为主，若只需要 UID 级群体，可进一步压缩范围并降低误差。',
    suggestions: ['只保留 UID 级对象时，预计覆盖下降 5pp 但稳定性提升 4pp', '广告场景建议补充设备级对齐后再使用'],
  };
}

function buildPersonalSamples(): AssetDetailPersonalSample[] {
  return [
    { id: 'ps-1', label: '跨域餐饮高活跃', description: '近 30 天核销 3 次以上且连续 2 周活跃', scopeTag: '当前 scope 命中' },
    { id: 'ps-2', label: '优惠触达高响应', description: 'Push + 券投放联动转化表现稳定', scopeTag: '可继续放量' },
    { id: 'ps-3', label: '夜间消费偏好', description: '晚高峰到夜宵时段表现更优', scopeTag: '推荐排序可参考' },
  ];
}

function buildPeerUsage(): AssetDetailPeerUsage[] {
  return [
    { team: '生服增长', scenario: '券投放', status: 'active', note: '持续订阅 3 周，ROI 稳定' },
    { team: '推荐算法', scenario: '召回增强', status: 'trial', note: '正在小流量试用' },
    { team: 'CRM 团队', scenario: '流失挽回', status: 'active', note: '已形成固定周更人群包' },
  ];
}

function buildSliceDistribution(): AssetDetailSliceDistribution[] {
  return [
    { slice: '高券敏感', ratio: 38, trend: 'up' },
    { slice: '中券敏感', ratio: 44, trend: 'flat' },
    { slice: '低券敏感', ratio: 18, trend: 'down' },
  ];
}

function buildBoundaryCases(): AssetDetailBoundaryCase[] {
  return [
    { id: 'bc-1', title: '超低频但高客单样本', outcome: 'fail', reason: '定义覆盖不足，容易漏召' },
    { id: 'bc-2', title: '近 3 天新客 + 夜间高响应', outcome: 'pass', reason: '营销触达增益明显' },
    { id: 'bc-3', title: '广告排序冷启动流量', outcome: 'fail', reason: '推荐场景稳定性不足' },
  ];
}

function buildDefinitionChangelog(): AssetDetailChangelogItem[] {
  return [
    { date: '2026-04-21', change: '补充生服券核销行为', impact: '覆盖提升约 4pp' },
    { date: '2026-04-12', change: '调整 DID 对齐口径', impact: '误召下降但覆盖回落 2pp' },
    { date: '2026-03-30', change: '引入近 30 天复购信号', impact: '营销场景适配度明显提升' },
  ];
}

function buildLineageDiagram(): { nodes: AssetDetailLineageNode[]; edges: AssetDetailLineageEdge[] } {
  return {
    nodes: [
      { id: 'source-ecom', label: '电商 BTM', type: 'source' },
      { id: 'source-life', label: '生服 BTM+', type: 'source' },
      { id: 'process-map', label: 'ID Mapping', type: 'process' },
      { id: 'process-score', label: '券敏感评分', type: 'process' },
      { id: 'output-asset', label: '诊断资产输出', type: 'output' },
    ],
    edges: [
      { from: 'source-ecom', to: 'process-map' },
      { from: 'source-life', to: 'process-map' },
      { from: 'process-map', to: 'process-score' },
      { from: 'process-score', to: 'output-asset' },
    ],
  };
}

function buildBaselineCompare(): AssetDetailBaselineCompareRow[] {
  return [
    { scenario: '营销触达', baseline: 85, actual: 88, passed: true },
    { scenario: '推荐排序', baseline: 80, actual: 78, passed: false },
    { scenario: '流失挽回', baseline: 82, actual: 86, passed: true },
  ];
}

function buildRoiEstimator(): AssetDetailRoiEstimatorScenario[] {
  return [
    { key: 'marketing', label: '营销触达', estimatedRevenue: 560000, estimatedCost: 180000, roi: 3.1 },
    { key: 'recommendation', label: '推荐排序', estimatedRevenue: 240000, estimatedCost: 120000, roi: 2.0 },
    { key: 'retention', label: '流失挽回', estimatedRevenue: 360000, estimatedCost: 130000, roi: 2.8 },
  ];
}

function buildPreflightCheck(): AssetDetailPreflightCheckItem[] {
  return [
    { label: '定义口径清晰', status: 'pass', detail: '术语、口径和范围都有对应说明' },
    { label: '稳定性可接受', status: 'warn', detail: '近 7 天有一次波动，需要继续观测' },
    { label: '分发通道已就绪', status: 'pass', detail: '已有可复用订阅链路' },
    { label: '广告场景可直接使用', status: 'fail', detail: '当前不建议直接用于广告排序' },
  ];
}

export function buildAssetDetailFixture(
  asset: DerivedAsset,
  query: AssetDetailQueryState,
  compareAssets: DerivedAsset[],
): Omit<AssetDetailMockData, 'asset' | 'identity' | 'query'> {
  const selectedUseCase = resolveUseCaseKey(query);
  const presets = buildTryRunPresets();
  const selectedPresetId =
    selectedUseCase === 'recommendation'
      ? 'preset-reco'
      : selectedUseCase === 'retention'
        ? 'preset-retention'
        : 'preset-marketing';

  return {
    definition: buildDefinition(asset),
    isIsNot: buildIsIsNot(),
    quantSummary: buildQuantSummary(asset),
    recommendReason: buildRecommendReason(asset),
    verdictBanner: buildVerdictBanner(selectedUseCase),
    scopeSelector: buildScopeSelector(query),
    coverageWaterfall: buildCoverageWaterfall(),
    usageSelector: {
      selectedKey: selectedUseCase,
      options: useCaseOptions,
    },
    qualityVerdict: buildQualityVerdict(),
    qualityBadges: buildQualityBadges(),
    knownIssues: buildKnownIssues(),
    stabilityCurve: buildStabilityCurve(),
    subscribeImpact: buildSubscribeImpact(asset),
    tryRun: {
      presets,
      result: buildTryRunResult(selectedPresetId),
    },
    compareTable: buildCompareTable(asset, compareAssets),
    subscribeCta: buildSubscribeCta(),
    drilldowns,
    glossary,
    useCaseTags: buildUseCaseTags(asset),
    samplePreview: buildSamplePreview(),
    distributionMini: buildDistributionMini(),
    sourceAwareness: buildSourceAwareness(query),
    supplierPanel: buildSupplierPanel(),
    coverageGapAlert: buildCoverageGapAlert(),
    granularityHint: buildGranularityHint(),
    personalSamples: buildPersonalSamples(),
    peerUsage: buildPeerUsage(),
    sliceDistribution: buildSliceDistribution(),
    boundaryCases: buildBoundaryCases(),
    definitionChangelog: buildDefinitionChangelog(),
    lineageDiagram: buildLineageDiagram(),
    baselineCompare: buildBaselineCompare(),
    roiEstimator: buildRoiEstimator(),
    preflightCheck: buildPreflightCheck(),
  };
}
