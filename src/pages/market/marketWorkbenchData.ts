import type { ActionConfig, DispatchTask } from '../../types';

export type WorkbenchView = 'consumer' | 'producer';
export type WorkbenchDomain = 'crowd' | 'strategy' | 'channel';
export type WorkbenchFocusMetric = 'reach' | 'tasks' | 'gmv' | 'risk';
export type WorkbenchTaskStatus = DispatchTask['status'] | 'all';
export type WorkbenchHealthStatus = 'healthy' | 'warning' | 'risk';

export interface WorkbenchCrowdTemplate {
  id: string;
  name: string;
  summary: string;
  source: string;
  audienceSize: number;
  matchScore: number;
  availableViews: WorkbenchView[];
  domains: WorkbenchDomain[];
  touchpoints: ActionConfig['touchpoints'];
  nodeIds: string[];
  tags: string[];
  preset: ActionConfig;
}

export interface WorkbenchIdMappingStatus {
  channel: ActionConfig['channels'][number];
  sourceId: string;
  targetId: string;
  coverage: number;
  latencyMinutes: number;
  missingFields: string[];
  status: WorkbenchHealthStatus;
  note: string;
}

export interface WorkbenchSlaStage {
  id: string;
  label: string;
  owner: string;
  actualMinutes: number;
  slaMinutes: number;
  status: WorkbenchHealthStatus;
  channel?: ActionConfig['channels'][number];
}

export interface WorkbenchAssistSnapshot {
  diagnosis: string[];
  actions: string[];
  events: string[];
}

export interface WorkbenchNode {
  id: string;
  domain: WorkbenchDomain;
  name: string;
  description: string;
  detail: string;
  owner: string;
  touchpoint: ActionConfig['touchpoints'][number];
  availableViews: WorkbenchView[];
  metrics: {
    reach: number;
    activeTasks: number;
    estGmvLift: number;
    riskCount: number;
    healthScore: number;
  };
  recommendedConfig: ActionConfig;
  signals: string[];
  templateIds: string[];
  mappingStatuses: WorkbenchIdMappingStatus[];
  slaStages: WorkbenchSlaStage[];
  assist: WorkbenchAssistSnapshot;
}

export interface WorkbenchRelation {
  source: string;
  target: string;
  label: string;
}

export interface WorkbenchTask extends DispatchTask {
  nodeId: string;
  domain: WorkbenchDomain;
  touchpoint: ActionConfig['touchpoints'][number];
  view: WorkbenchView;
  priority: 'high' | 'mid' | 'low';
}

export const domainLabels: Record<WorkbenchDomain, string> = {
  crowd: '人群域',
  strategy: '策略域',
  channel: '渠道域',
};

export const focusMetricCopy: Record<
  WorkbenchFocusMetric,
  { label: string; hint: string; emptyHint: string }
> = {
  reach: {
    label: '覆盖可触达人群',
    hint: '按人群覆盖范围查看节点优先级',
    emptyHint: '当前筛选范围内暂无可触达人群节点。',
  },
  tasks: {
    label: '在途联动任务',
    hint: '按排队中和执行中的任务热度查看节点',
    emptyHint: '当前筛选范围内暂无在途任务。',
  },
  gmv: {
    label: '预估 GMV 提升',
    hint: '按节点历史估算 uplift 查看主推链路',
    emptyHint: '当前筛选范围内暂无 GMV 预估数据。',
  },
  risk: {
    label: '待治理节点',
    hint: '按存在风险或缺口的节点查看治理优先级',
    emptyHint: '当前筛选范围内暂无待治理节点。',
  },
};

export const workbenchTemplates: WorkbenchCrowdTemplate[] = [
  {
    id: 'tpl_cross_repurchase_coupon',
    name: '跨域复购加码模板',
    summary: '高潜复购人群与跨域券策略联动，适合快速拉升复购 GMV。',
    source: '人群模板库 / 经营复购专区',
    audienceSize: 1380000,
    matchScore: 96,
    availableViews: ['consumer', 'producer'],
    domains: ['crowd', 'strategy', 'channel'],
    touchpoints: ['push', 'ecommerce_coupon'],
    nodeIds: ['crowd_repurchase', 'strategy_coupon', 'channel_ecom_dmp'],
    tags: ['高复购', '券包联动', 'Push 加码'],
    preset: {
      crowd_id: 'tpl_repurchase_coupon_0427',
      touchpoints: ['push', 'ecommerce_coupon'],
      subsidy_level: 'high',
      budget: 660000,
      copywriting_choice: '跨域满减券 + 复购提醒',
      channels: ['ldmp', 'ecommerce_dmp', 'policy_platform'],
    },
  },
  {
    id: 'tpl_lifecycle_recall',
    name: '生命周期召回模板',
    summary: '面向双域沉默用户的低成本召回模板，强调多触点承接。',
    source: '人群模板库 / 生命周期专区',
    audienceSize: 920000,
    matchScore: 92,
    availableViews: ['consumer', 'producer'],
    domains: ['crowd', 'strategy'],
    touchpoints: ['push', 'lifestyle_home'],
    nodeIds: ['crowd_recall', 'strategy_homefeed'],
    tags: ['沉默召回', '首页承接', '轻补贴'],
    preset: {
      crowd_id: '沉默召回-0427',
      touchpoints: ['push', 'lifestyle_home'],
      subsidy_level: 'mid',
      budget: 360000,
      copywriting_choice: '召回专享福利提醒',
      channels: ['ldmp', 'money_eff'],
    },
  },
  {
    id: 'tpl_policy_priority',
    name: '政策提审白名单模板',
    summary: '适合高优先策略走提审白名单，缩短审核等待时间。',
    source: '人群模板库 / 渠道治理专区',
    audienceSize: 760000,
    matchScore: 90,
    availableViews: ['producer'],
    domains: ['strategy', 'channel'],
    touchpoints: ['ecommerce_coupon', 'push'],
    nodeIds: ['strategy_coupon', 'channel_policy'],
    tags: ['提审优先级', '白名单', '治理视角'],
    preset: {
      crowd_id: 'policy_priority_0427',
      touchpoints: ['push', 'ecommerce_coupon'],
      subsidy_level: 'mid',
      budget: 300000,
      copywriting_choice: '政策平台提审优先级',
      channels: ['policy_platform', 'api'],
    },
  },
  {
    id: 'tpl_dmp_express',
    name: '电商 DMP 快速分发模板',
    summary: '用于稳定高频派发和效果回传，强调通道速度与覆盖率。',
    source: '人群模板库 / 通道稳定专区',
    audienceSize: 1540000,
    matchScore: 94,
    availableViews: ['consumer', 'producer'],
    domains: ['channel', 'strategy'],
    touchpoints: ['push'],
    nodeIds: ['channel_ecom_dmp', 'strategy_coupon'],
    tags: ['高频派发', '回传完整', '通道稳定'],
    preset: {
      crowd_id: 'ecom_dmp_express_0427',
      touchpoints: ['push'],
      subsidy_level: 'mid',
      budget: 380000,
      copywriting_choice: '电商 DMP 加速分发',
      channels: ['ecommerce_dmp', 'policy_platform'],
    },
  },
  {
    id: 'tpl_homefeed_governance',
    name: '首页承接修复模板',
    summary: '聚焦首页承接波动治理，适合供给视角排查 SLA 风险。',
    source: '人群模板库 / 承接治理专区',
    audienceSize: 680000,
    matchScore: 87,
    availableViews: ['producer'],
    domains: ['strategy'],
    touchpoints: ['lifestyle_home'],
    nodeIds: ['strategy_homefeed'],
    tags: ['承接治理', '首页流量', 'SLA 排查'],
    preset: {
      crowd_id: 'homefeed_governance_0427',
      touchpoints: ['lifestyle_home'],
      subsidy_level: 'low',
      budget: 220000,
      copywriting_choice: '首页承接修复补测',
      channels: ['ldmp', 'money_eff'],
    },
  },
];

export const workbenchNodes: WorkbenchNode[] = [
  {
    id: 'crowd_repurchase',
    domain: 'crowd',
    name: '高潜复购人群',
    description: '近 30 天高频浏览且有加购行为，适合促复购和交叉领券。',
    detail: '人群稳定性高，适合作为消费视角下的主推流量入口。',
    owner: '消费运营',
    touchpoint: 'push',
    availableViews: ['consumer', 'producer'],
    metrics: {
      reach: 1860000,
      activeTasks: 3,
      estGmvLift: 0.034,
      riskCount: 1,
      healthScore: 92,
    },
    recommendedConfig: {
      crowd_id: 'crowd_repurchase_01',
      touchpoints: ['push', 'ecommerce_coupon'],
      subsidy_level: 'mid',
      budget: 420000,
      copywriting_choice: '复购加码券 + Push 联动',
      channels: ['ldmp', 'ecommerce_dmp', 'policy_platform'],
    },
    signals: ['高客单复购率', '券后转化稳定', '近 7 天点击率提升'],
    templateIds: ['tpl_cross_repurchase_coupon', 'tpl_dmp_express'],
    mappingStatuses: [
      {
        channel: 'ldmp',
        sourceId: 'user_id',
        targetId: 'crowd_id',
        coverage: 0.982,
        latencyMinutes: 11,
        missingFields: [],
        status: 'healthy',
        note: '复购标签与圈选人群可直接透传。',
      },
      {
        channel: 'ecommerce_dmp',
        sourceId: 'user_id',
        targetId: 'device_id',
        coverage: 0.947,
        latencyMinutes: 18,
        missingFields: ['coupon_level_alias'],
        status: 'warning',
        note: '券档位别名仍需归一，已由模板库提供默认映射。',
      },
      {
        channel: 'policy_platform',
        sourceId: 'crowd_id',
        targetId: 'policy_target_id',
        coverage: 0.971,
        latencyMinutes: 9,
        missingFields: [],
        status: 'healthy',
        note: '提审字段齐备，可直接进入审核队列。',
      },
    ],
    slaStages: [
      { id: 'crowd_repurchase_sync', label: '圈选回填', owner: '人群平台', actualMinutes: 14, slaMinutes: 20, status: 'healthy' },
      {
        id: 'crowd_repurchase_dispatch',
        label: '分发入列',
        owner: '营销引擎',
        actualMinutes: 21,
        slaMinutes: 25,
        status: 'healthy',
        channel: 'ecommerce_dmp',
      },
      {
        id: 'crowd_repurchase_feedback',
        label: '效果回传',
        owner: '归因服务',
        actualMinutes: 39,
        slaMinutes: 45,
        status: 'healthy',
        channel: 'policy_platform',
      },
    ],
    assist: {
      diagnosis: ['复购高潜客群与券补贴策略耦合度高，适合直接派发。', '当前风险主要集中在电商券档位别名归一。'],
      actions: ['优先应用跨域复购加码模板，默认带出高补贴档位。', '若要扩大覆盖，可补充电商 DMP 通道并关注 alias 字段。'],
      events: ['10 分钟前：Push 点击率回升 0.4pct', '25 分钟前：券核销回传成功', '1 小时前：电商 DMP 完成增量同步'],
    },
  },
  {
    id: 'crowd_recall',
    domain: 'crowd',
    name: '流失召回人群',
    description: '生服和电商双域 14 天沉默用户，适合低预算召回。',
    detail: '跨域活跃度下降明显，需要借助低成本触点拉回。',
    owner: '用户增长',
    touchpoint: 'lifestyle_home',
    availableViews: ['consumer', 'producer'],
    metrics: {
      reach: 1240000,
      activeTasks: 2,
      estGmvLift: 0.026,
      riskCount: 2,
      healthScore: 84,
    },
    recommendedConfig: {
      crowd_id: 'crowd_recall_14d',
      touchpoints: ['push', 'lifestyle_home'],
      subsidy_level: 'low',
      budget: 180000,
      copywriting_choice: '回流提醒 + 首页露出',
      channels: ['ldmp', 'money_eff'],
    },
    signals: ['召回成本低', '首页承接更优', '适合轻补贴'],
    templateIds: ['tpl_lifecycle_recall'],
    mappingStatuses: [
      {
        channel: 'ldmp',
        sourceId: 'user_id',
        targetId: 'crowd_id',
        coverage: 0.958,
        latencyMinutes: 15,
        missingFields: [],
        status: 'healthy',
        note: '召回人群主键稳定，可直接进入 DMP。',
      },
      {
        channel: 'money_eff',
        sourceId: 'device_id',
        targetId: 'money_eff_uid',
        coverage: 0.901,
        latencyMinutes: 27,
        missingFields: ['channel_alias'],
        status: 'warning',
        note: '资金效率通道需要补齐别名表，当前使用模板默认值兜底。',
      },
    ],
    slaStages: [
      { id: 'crowd_recall_sync', label: '沉默人群刷新', owner: '用户增长', actualMinutes: 18, slaMinutes: 20, status: 'healthy' },
      {
        id: 'crowd_recall_homefeed',
        label: '首页承接生效',
        owner: '场景运营',
        actualMinutes: 42,
        slaMinutes: 35,
        status: 'warning',
        channel: 'money_eff',
      },
      {
        id: 'crowd_recall_feedback',
        label: '召回效果回传',
        owner: '分析中台',
        actualMinutes: 46,
        slaMinutes: 50,
        status: 'healthy',
        channel: 'ldmp',
      },
    ],
    assist: {
      diagnosis: ['沉默召回适合低预算双触点承接。', '主要波动来自首页资源位上刊延迟。'],
      actions: ['优先应用生命周期召回模板，保留 Push + 首页双触点。', '若筛选到首页触点，先看承接 SLA 再决定是否扩量。'],
      events: ['5 分钟前：首页资源位更新完成', '40 分钟前：召回模板命中率下降 2pct', '2 小时前：资金效率通道别名表重载'],
    },
  },
  {
    id: 'strategy_coupon',
    domain: 'strategy',
    name: '跨域券补贴策略',
    description: '券补贴与权益叠加策略，用于拉升转化和 GMV。',
    detail: '策略域核心节点，能够把人群热度快速转化为可执行动作。',
    owner: '策略平台',
    touchpoint: 'ecommerce_coupon',
    availableViews: ['consumer', 'producer'],
    metrics: {
      reach: 1680000,
      activeTasks: 4,
      estGmvLift: 0.041,
      riskCount: 1,
      healthScore: 88,
    },
    recommendedConfig: {
      crowd_id: 'crowd_repurchase_01',
      touchpoints: ['push', 'ecommerce_coupon'],
      subsidy_level: 'high',
      budget: 560000,
      copywriting_choice: '跨域满减券 + 限时加码',
      channels: ['ecommerce_dmp', 'policy_platform', 'api'],
    },
    signals: ['高转化策略', '与电商券承接强关联', '支持多渠道下发'],
    templateIds: ['tpl_cross_repurchase_coupon', 'tpl_policy_priority', 'tpl_dmp_express'],
    mappingStatuses: [
      {
        channel: 'ecommerce_dmp',
        sourceId: 'crowd_id',
        targetId: 'device_id',
        coverage: 0.953,
        latencyMinutes: 19,
        missingFields: [],
        status: 'healthy',
        note: '策略字段已完成与电商 DMP 的映射归一。',
      },
      {
        channel: 'policy_platform',
        sourceId: 'strategy_id',
        targetId: 'policy_id',
        coverage: 0.935,
        latencyMinutes: 24,
        missingFields: ['experiment_group'],
        status: 'warning',
        note: '实验分组未完全透传，提审后默认使用主策略版本。',
      },
      {
        channel: 'api',
        sourceId: 'strategy_id',
        targetId: 'external_plan_id',
        coverage: 0.886,
        latencyMinutes: 31,
        missingFields: ['copy_variant'],
        status: 'risk',
        note: 'API 链路需要补齐文案别名，否则只能走默认文案。',
      },
    ],
    slaStages: [
      { id: 'strategy_coupon_compile', label: '策略编译', owner: '策略平台', actualMinutes: 12, slaMinutes: 15, status: 'healthy' },
      {
        id: 'strategy_coupon_review',
        label: '提审排队',
        owner: '政策平台',
        actualMinutes: 29,
        slaMinutes: 25,
        status: 'warning',
        channel: 'policy_platform',
      },
      {
        id: 'strategy_coupon_dispatch',
        label: '渠道分发',
        owner: '投放中台',
        actualMinutes: 33,
        slaMinutes: 35,
        status: 'healthy',
        channel: 'ecommerce_dmp',
      },
    ],
    assist: {
      diagnosis: ['跨域券策略是当前 GMV 拉动最强节点。', '提审链路存在轻微拥堵，但整体仍可控。'],
      actions: ['经营视角下优先看跨域复购加码模板。', '若要走治理链路，请切到政策提审白名单模板并关注实验分组字段。'],
      events: ['8 分钟前：策略编译成功', '18 分钟前：政策平台进入复核队列', '45 分钟前：电商 DMP 返回首批投放结果'],
    },
  },
  {
    id: 'strategy_homefeed',
    domain: 'strategy',
    name: '首页承接策略',
    description: '围绕首页推荐位和生服会场的承接链路，偏重场景转化。',
    detail: '偏供给治理视角，关注承接链路和曝光质量。',
    owner: '场景运营',
    touchpoint: 'lifestyle_home',
    availableViews: ['consumer', 'producer'],
    metrics: {
      reach: 980000,
      activeTasks: 1,
      estGmvLift: 0.021,
      riskCount: 3,
      healthScore: 76,
    },
    recommendedConfig: {
      crowd_id: 'crowd_homefeed_focus',
      touchpoints: ['lifestyle_home'],
      subsidy_level: 'mid',
      budget: 260000,
      copywriting_choice: '首页主推坑位联动',
      channels: ['ldmp', 'money_eff'],
    },
    signals: ['承接曝光波动', '需要内容位协同', '适合治理链路排查'],
    templateIds: ['tpl_lifecycle_recall', 'tpl_homefeed_governance'],
    mappingStatuses: [
      {
        channel: 'ldmp',
        sourceId: 'crowd_id',
        targetId: 'scene_id',
        coverage: 0.918,
        latencyMinutes: 21,
        missingFields: [],
        status: 'healthy',
        note: '首页主场景字段已稳定接通。',
      },
      {
        channel: 'money_eff',
        sourceId: 'slot_alias',
        targetId: 'slot_id',
        coverage: 0.842,
        latencyMinutes: 34,
        missingFields: ['slot_alias', 'copy_variant'],
        status: 'risk',
        note: '内容位别名和文案别名仍需人工确认。',
      },
    ],
    slaStages: [
      { id: 'strategy_homefeed_compile', label: '首页策略编排', owner: '场景运营', actualMinutes: 16, slaMinutes: 18, status: 'healthy' },
      {
        id: 'strategy_homefeed_slot',
        label: '资源位上刊',
        owner: '内容运营',
        actualMinutes: 47,
        slaMinutes: 35,
        status: 'risk',
        channel: 'money_eff',
      },
      {
        id: 'strategy_homefeed_feedback',
        label: '承接效果回流',
        owner: '分析中台',
        actualMinutes: 41,
        slaMinutes: 45,
        status: 'healthy',
        channel: 'ldmp',
      },
    ],
    assist: {
      diagnosis: ['首页承接策略适合供给视角治理。', '当前瓶颈在内容位上刊和别名字段缺失。'],
      actions: ['若 focus 在风险，优先应用首页承接修复模板。', '缩小到首页触点时，先处理 slot_alias 再扩量。'],
      events: ['12 分钟前：内容位上刊超时告警', '26 分钟前：首页承接曝光回落 3pct', '1 小时前：LDMP 回流恢复正常'],
    },
  },
  {
    id: 'channel_policy',
    domain: 'channel',
    name: '政策平台通道',
    description: '串联策略平台和渠道分发的稳定通道，决定上线效率。',
    detail: '聚焦 SLA、配置下发和策略审核结果。',
    owner: '渠道中台',
    touchpoint: 'ecommerce_coupon',
    availableViews: ['producer'],
    metrics: {
      reach: 1420000,
      activeTasks: 2,
      estGmvLift: 0.029,
      riskCount: 2,
      healthScore: 81,
    },
    recommendedConfig: {
      crowd_id: 'crowd_policy_priority',
      touchpoints: ['push', 'ecommerce_coupon'],
      subsidy_level: 'mid',
      budget: 320000,
      copywriting_choice: '政策平台提审优先级',
      channels: ['policy_platform', 'api'],
    },
    signals: ['审核链路稳定', '通道路由可控', '适合治理视角排障'],
    templateIds: ['tpl_policy_priority'],
    mappingStatuses: [
      {
        channel: 'policy_platform',
        sourceId: 'strategy_id',
        targetId: 'policy_id',
        coverage: 0.964,
        latencyMinutes: 14,
        missingFields: [],
        status: 'healthy',
        note: '策略主键与提审目标已全量贯通。',
      },
      {
        channel: 'api',
        sourceId: 'device_id',
        targetId: 'merchant_id',
        coverage: 0.878,
        latencyMinutes: 33,
        missingFields: ['merchant_alias', 'experiment_group'],
        status: 'risk',
        note: 'API 侧 merchant_id 回填仍依赖统一 ID Mapping 服务补齐。',
      },
    ],
    slaStages: [
      { id: 'channel_policy_submit', label: '提审提交', owner: '策略平台', actualMinutes: 9, slaMinutes: 12, status: 'healthy', channel: 'policy_platform' },
      {
        id: 'channel_policy_review',
        label: '人工复核',
        owner: '政策审核',
        actualMinutes: 27,
        slaMinutes: 25,
        status: 'warning',
        channel: 'policy_platform',
      },
      {
        id: 'channel_policy_callback',
        label: '审核结果回传',
        owner: '渠道中台',
        actualMinutes: 19,
        slaMinutes: 18,
        status: 'warning',
        channel: 'api',
      },
    ],
    assist: {
      diagnosis: ['政策平台通道是供给视角下的核心治理节点。', '当前风险主要来自 API 侧 merchant_id 与实验分组缺口。'],
      actions: ['应用政策提审白名单模板可缩短提审排队时间。', '若只保留政策平台渠道，SLA 风险可降到可控范围。'],
      events: ['6 分钟前：提审白名单命中 1 条', '17 分钟前：API merchant_id 回填失败告警', '50 分钟前：人工复核队列恢复正常'],
    },
  },
  {
    id: 'channel_ecom_dmp',
    domain: 'channel',
    name: '电商 DMP 通道',
    description: '承接电商分发、回传和效果归因的核心链路。',
    detail: '覆盖面广，适合经营视角直接查看投放承接情况。',
    owner: '投放中台',
    touchpoint: 'push',
    availableViews: ['consumer', 'producer'],
    metrics: {
      reach: 2050000,
      activeTasks: 3,
      estGmvLift: 0.037,
      riskCount: 1,
      healthScore: 90,
    },
    recommendedConfig: {
      crowd_id: 'crowd_ecom_dmp_core',
      touchpoints: ['push'],
      subsidy_level: 'mid',
      budget: 360000,
      copywriting_choice: '电商 DMP 加速分发',
      channels: ['ecommerce_dmp', 'policy_platform'],
    },
    signals: ['回传完整度高', '分发速度稳定', '适合高频任务'],
    templateIds: ['tpl_cross_repurchase_coupon', 'tpl_dmp_express'],
    mappingStatuses: [
      {
        channel: 'ecommerce_dmp',
        sourceId: 'user_id',
        targetId: 'device_id',
        coverage: 0.978,
        latencyMinutes: 10,
        missingFields: [],
        status: 'healthy',
        note: '主通道映射稳定，适合高频派发。',
      },
      {
        channel: 'policy_platform',
        sourceId: 'device_id',
        targetId: 'policy_target_id',
        coverage: 0.931,
        latencyMinutes: 16,
        missingFields: ['copy_variant'],
        status: 'warning',
        note: '文案别名需由模板库兜底，否则提审侧取默认文案。',
      },
    ],
    slaStages: [
      { id: 'channel_ecom_dmp_enqueue', label: '分发入列', owner: '投放中台', actualMinutes: 8, slaMinutes: 12, status: 'healthy', channel: 'ecommerce_dmp' },
      {
        id: 'channel_ecom_dmp_delivery',
        label: '通道下发',
        owner: 'DMP 服务',
        actualMinutes: 18,
        slaMinutes: 20,
        status: 'healthy',
        channel: 'ecommerce_dmp',
      },
      {
        id: 'channel_ecom_dmp_feedback',
        label: '效果回传',
        owner: '归因服务',
        actualMinutes: 28,
        slaMinutes: 30,
        status: 'healthy',
        channel: 'policy_platform',
      },
    ],
    assist: {
      diagnosis: ['电商 DMP 通道适合作为经营视角的默认承接出口。', '整体 SLA 稳定，风险集中在提审侧文案别名。'],
      actions: ['优先应用电商 DMP 快速分发模板。', '如筛选到券触点，补看政策平台回传状态再扩量。'],
      events: ['3 分钟前：DMP 下发成功 2.1 万条', '22 分钟前：政策平台回传延迟 1 分钟', '55 分钟前：设备映射缓存刷新完成'],
    },
  },
];

export const workbenchRelations: WorkbenchRelation[] = [
  { source: 'crowd_repurchase', target: 'strategy_coupon', label: '高价值人群进入券补贴策略' },
  { source: 'crowd_recall', target: 'strategy_homefeed', label: '召回人群进入首页承接策略' },
  { source: 'strategy_coupon', target: 'channel_ecom_dmp', label: '策略下发到电商 DMP' },
  { source: 'strategy_coupon', target: 'channel_policy', label: '高优先券策略需要政策平台审批' },
  { source: 'strategy_homefeed', target: 'channel_policy', label: '首页承接依赖渠道审核与回传' },
];

export const initialWorkbenchTasks: WorkbenchTask[] = [
  {
    id: 'task_workbench_01',
    nodeId: 'strategy_coupon',
    domain: 'strategy',
    touchpoint: 'ecommerce_coupon',
    view: 'consumer',
    priority: 'high',
    crowdId: 'crowd_repurchase_01',
    actionId: 'action_coupon_01',
    title: '高潜复购人群 x 跨域满减券',
    created_at: '2026-04-25 10:30',
    crowd_size: 1240000,
    channels: ['电商 DMP', '政策平台'],
    status: 'queued',
  },
  {
    id: 'task_workbench_02',
    nodeId: 'channel_ecom_dmp',
    domain: 'channel',
    touchpoint: 'push',
    view: 'consumer',
    priority: 'mid',
    crowdId: 'crowd_ecom_dmp_core',
    actionId: 'action_dmp_02',
    title: '电商 DMP 核心通道 x 加速分发',
    created_at: '2026-04-25 09:40',
    crowd_size: 1460000,
    channels: ['电商 DMP', '政策平台'],
    status: 'running',
  },
  {
    id: 'task_workbench_03',
    nodeId: 'crowd_recall',
    domain: 'crowd',
    touchpoint: 'lifestyle_home',
    view: 'consumer',
    priority: 'mid',
    crowdId: 'crowd_recall_14d',
    actionId: 'action_recall_03',
    title: '流失召回人群 x 首页回流提醒',
    created_at: '2026-04-24 16:10',
    crowd_size: 960000,
    channels: ['本地 DMP', '资金效率'],
    status: 'done',
    result: {
      gmv_lift: 0.024,
      mac_change: -0.067,
      cvr: 0.019,
    },
  },
  {
    id: 'task_workbench_04',
    nodeId: 'strategy_homefeed',
    domain: 'strategy',
    touchpoint: 'lifestyle_home',
    view: 'producer',
    priority: 'high',
    crowdId: 'crowd_homefeed_focus',
    actionId: 'action_homefeed_04',
    title: '首页承接策略 x 会场联动',
    created_at: '2026-04-24 11:20',
    crowd_size: 820000,
    channels: ['本地 DMP', '资金效率'],
    status: 'running',
  },
  {
    id: 'task_workbench_05',
    nodeId: 'channel_policy',
    domain: 'channel',
    touchpoint: 'ecommerce_coupon',
    view: 'producer',
    priority: 'high',
    crowdId: 'crowd_policy_priority',
    actionId: 'action_policy_05',
    title: '政策平台通道 x 提审优先级',
    created_at: '2026-04-23 14:05',
    crowd_size: 690000,
    channels: ['政策平台', 'API'],
    status: 'done',
    result: {
      gmv_lift: 0.018,
      mac_change: -0.031,
      cvr: 0.015,
    },
  },
  {
    id: 'task_workbench_06',
    nodeId: 'crowd_repurchase',
    domain: 'crowd',
    touchpoint: 'push',
    view: 'producer',
    priority: 'low',
    crowdId: 'crowd_repurchase_01',
    actionId: 'action_repurchase_06',
    title: '高潜复购人群 x 召回兜底实验',
    created_at: '2026-04-22 18:35',
    crowd_size: 1180000,
    channels: ['本地 DMP'],
    status: 'queued',
  },
];
