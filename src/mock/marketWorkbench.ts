import type { ActionConfig } from '../types';

export type WorkbenchDomainKey = 'strategy' | 'insight' | 'feedback';
export type WorkbenchCardStatus = 'ready' | 'draft' | 'syncing';
export type WorkbenchDrawerMode = 'dispatch' | 'detail' | 'mapping';
export type WorkbenchMappingStatus = 'stable' | 'review' | 'missing';

export interface WorkbenchMetric {
  label: string;
  value: string;
  tone?: 'positive' | 'neutral' | 'attention';
}

export interface WorkbenchMappingRow {
  sourceField: string;
  targetField: string;
  rule: string;
  status: WorkbenchMappingStatus;
}

export interface WorkbenchPreviewBox {
  id: string;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
  highlight?: boolean;
}

export interface WorkbenchStrategyPreview {
  title: string;
  caption: string;
  surfaceLabel: string;
  boxes: WorkbenchPreviewBox[];
}

export interface WorkbenchAgentContextPackage {
  summary: string;
  goal: string;
  timeWindow: string;
  prompt: string;
  sources: string[];
  signals: string[];
}

export interface WorkbenchMatrixCard {
  id: string;
  domain: WorkbenchDomainKey;
  title: string;
  subtitle: string;
  owner: string;
  status: WorkbenchCardStatus;
  summary: string;
  tags: string[];
  metrics: WorkbenchMetric[];
  dispatchPreset: Partial<ActionConfig>;
  dispatchNotes: string[];
  detailHighlights: string[];
  mappingRows: WorkbenchMappingRow[];
  strategyPreview?: WorkbenchStrategyPreview;
  agentContextPackage?: WorkbenchAgentContextPackage;
}

export interface WorkbenchDomainGroup {
  key: WorkbenchDomainKey;
  title: string;
  description: string;
  helper: string;
  cards: WorkbenchMatrixCard[];
}

export const WORKBENCH_DOMAIN_META: Record<
  WorkbenchDomainKey,
  { title: string; description: string; helper: string; accent: string }
> = {
  strategy: {
    title: '营销策略',
    description: '聚合可直接派发的策略组件、圈选模版和触点编排。',
    helper: '适合做策略编排、预算下发和渠道联动。',
    accent: 'from-module-market/10 to-module-market/0',
  },
  insight: {
    title: '分析洞察',
    description: '聚合 Agent 洞察、分析包与实验结论，支撑策略判断。',
    helper: '适合查看上下文、ROI 证据和归因解释。',
    accent: 'from-violet-500/10 to-violet-500/0',
  },
  feedback: {
    title: '体验反馈',
    description: '沉淀使用反馈、回访结论和字段回流状态。',
    helper: '适合梳理使用体验、映射缺口和改造优先级。',
    accent: 'from-emerald-500/10 to-emerald-500/0',
  },
};

export const marketWorkbenchDomainGroups: WorkbenchDomainGroup[] = [
  {
    key: 'strategy',
    title: WORKBENCH_DOMAIN_META.strategy.title,
    description: WORKBENCH_DOMAIN_META.strategy.description,
    helper: WORKBENCH_DOMAIN_META.strategy.helper,
    cards: [
      {
        id: 'strategy_coupon_zone',
        domain: 'strategy',
        title: '跨域领券圈选组件',
        subtitle: '外卖高潜复购圈选 + 券包编排',
        owner: '营销平台 / 增长策略',
        status: 'ready',
        summary: '支持从圈选区域直接下发到 DMP 和政策平台，已沉淀近 30 天复购 uplift。',
        tags: ['圈选预览', '高复购', '券包联动'],
        metrics: [
          { label: '预估覆盖', value: '128 万', tone: 'neutral' },
          { label: 'GMV uplift', value: '+2.8%', tone: 'positive' },
          { label: '回流时延', value: 'T+1', tone: 'neutral' },
        ],
        dispatchPreset: {
          crowd_id: '圈选-复购高潜-0427',
          touchpoints: ['push', 'ecommerce_coupon'],
          subsidy_level: 'high',
          budget: 680000,
          copywriting_choice: '跨域领券立减 + 复购加码提醒',
          channels: ['ldmp', 'policy_platform', 'ecommerce_dmp'],
        },
        dispatchNotes: [
          '自动带入圈选人群与高补贴档位，适合直接派发到券场景。',
          '派发后默认进入任务监控，并同步预估曝光与 GMV uplift。',
        ],
        detailHighlights: [
          '基于近 14 天下单频次、券敏感度与跨域回流信号生成圈选区域。',
          '支持按触点拆分消息节奏，并对不同渠道下发不同券模板。',
        ],
        mappingRows: [
          { sourceField: '圈选人群ID', targetField: 'crowd_id', rule: '直接透传', status: 'stable' },
          { sourceField: '券档位', targetField: 'subsidy_level', rule: '高价值圈选映射到 high', status: 'stable' },
          { sourceField: '触点编排', targetField: 'touchpoints', rule: '按区域配置转数组', status: 'review' },
        ],
        strategyPreview: {
          title: '圈选组件预览',
          caption: '用于预览策略组件在营销运营画布上的圈选区域与触达挂点。',
          surfaceLabel: '营销运营画布',
          boxes: [
            {
              id: 'hot-zone',
              label: '高潜复购圈',
              top: '16%',
              left: '10%',
              width: '35%',
              height: '28%',
              highlight: true,
            },
            {
              id: 'coupon-slot',
              label: '券包挂点',
              top: '52%',
              left: '18%',
              width: '24%',
              height: '18%',
            },
            {
              id: 'message-slot',
              label: 'Push 触达位',
              top: '30%',
              left: '58%',
              width: '26%',
              height: '20%',
            },
          ],
        },
      },
      {
        id: 'strategy_lifecycle_recall',
        domain: 'strategy',
        title: '生命周期召回剧本',
        subtitle: '沉默用户召回策略模板',
        owner: '用户运营 / 生命周期团队',
        status: 'draft',
        summary: '沉淀了多触点召回剧本，但字段回填尚在联调，适合先查看详情和映射。',
        tags: ['召回', '多触点', '生命周期'],
        metrics: [
          { label: '触点数', value: '3', tone: 'neutral' },
          { label: '预计 CTR', value: '3.2%', tone: 'positive' },
          { label: '映射准备度', value: '联调中', tone: 'attention' },
        ],
        dispatchPreset: {
          crowd_id: '沉默召回-0427',
          touchpoints: ['push', 'lifestyle_home'],
          subsidy_level: 'mid',
          budget: 360000,
          copywriting_choice: '召回专享福利提醒',
          channels: ['ldmp', 'money_eff'],
        },
        dispatchNotes: [
          '默认启用 Push + 生服首页双触点。',
          '建议先查看字段映射，确认渠道别名是否需要人工补齐。',
        ],
        detailHighlights: [
          '按沉默天数与历史客单拆分优先级，支持不同召回剧本。',
          '目前政策平台字段尚未接通，派发时默认不带该渠道。',
        ],
        mappingRows: [
          { sourceField: '召回优先级', targetField: 'copywriting_choice', rule: '映射剧本文案', status: 'stable' },
          { sourceField: '渠道别名', targetField: 'channels', rule: '需要人工确认 money_eff', status: 'review' },
          { sourceField: '试验分层', targetField: 'action_id', rule: '当前未接入', status: 'missing' },
        ],
      },
    ],
  },
  {
    key: 'insight',
    title: WORKBENCH_DOMAIN_META.insight.title,
    description: WORKBENCH_DOMAIN_META.insight.description,
    helper: WORKBENCH_DOMAIN_META.insight.helper,
    cards: [
      {
        id: 'insight_agent_roi',
        domain: 'insight',
        title: 'ROI Agent 洞察包',
        subtitle: '促复购策略上下文包',
        owner: '增长分析 / Agent 编排',
        status: 'ready',
        summary: '把目标、证据来源和 uplift 线索整理为上下文包，可直接作为策略派发依据。',
        tags: ['Agent', '上下文包', 'ROI'],
        metrics: [
          { label: '洞察来源', value: '6 项', tone: 'neutral' },
          { label: '置信度', value: '88%', tone: 'positive' },
          { label: '更新时间', value: '10 分钟前', tone: 'neutral' },
        ],
        dispatchPreset: {
          crowd_id: 'agent-context-复购高潜',
          touchpoints: ['push', 'ecommerce_coupon'],
          subsidy_level: 'mid',
          budget: 420000,
          copywriting_choice: '按 Agent 洞察生成复购提醒',
          channels: ['ldmp', 'api'],
        },
        dispatchNotes: [
          '可把 Agent 识别出的目标和渠道建议直接写入配置区。',
          '适合作为策略域派发前的证据包查看入口。',
        ],
        detailHighlights: [
          '整合了近 30 天促复购实验、渠道承接能力与券敏感标签。',
          '结论建议优先走券 + Push 联动策略，并控制补贴成本。',
        ],
        mappingRows: [
          { sourceField: 'strategy_goal', targetField: 'copywriting_choice', rule: '语义归一后写入', status: 'stable' },
          { sourceField: 'recommended_channels', targetField: 'channels', rule: '数组透传', status: 'stable' },
          { sourceField: 'uplift_confidence', targetField: 'estimatedGmv', rule: '人工复核后换算', status: 'review' },
        ],
        agentContextPackage: {
          summary: 'Agent 已识别该场景的核心目标是提升高潜复购转化，同时压缩补贴成本。',
          goal: '促复购 / 控制 MAC',
          timeWindow: '近 30 天交易 + 近 7 天触达日志',
          prompt:
            '结合圈选组件、触点承接能力和历史实验 uplift，给出优先级最高的复购策略，并说明预算与渠道建议。',
          sources: ['近 30 天交易流水', '触达点击日志', '券核销明细', '渠道承接 SLA', '历史 A/B 结果', '召回标签画像'],
          signals: ['券敏感高', '跨域回流明显', 'Push 次日转化高', '政策平台承接稳定'],
        },
      },
      {
        id: 'insight_segment_diagnosis',
        domain: 'insight',
        title: '细分客群诊断卡',
        subtitle: '拆解高价值客群结构变化',
        owner: '用户研究 / 数据科学',
        status: 'syncing',
        summary: '展示近 7 天细分客群结构变化，Agent 结论正在重新同步到推荐包。',
        tags: ['客群拆解', '实验诊断', '同步中'],
        metrics: [
          { label: '细分层级', value: '4 层', tone: 'neutral' },
          { label: '异常波动', value: '2 处', tone: 'attention' },
          { label: '同步状态', value: '处理中', tone: 'attention' },
        ],
        dispatchPreset: {
          crowd_id: '细分诊断-高价值客群',
          touchpoints: ['push'],
          subsidy_level: 'low',
          budget: 180000,
          copywriting_choice: '诊断后轻量触达',
          channels: ['api'],
        },
        dispatchNotes: [
          '当前更适合查看详情，确认异常分层是否影响正式派发。',
          '同步完成后可将细分结论带回策略配置。',
        ],
        detailHighlights: [
          '最近 7 天高价值客群中低频用户占比上升，可能影响券转化。',
          'Agent 正在重算上下文包，建议稍后复看后再派发。',
        ],
        mappingRows: [
          { sourceField: 'segment_code', targetField: 'crowd_id', rule: '需等待同步完成', status: 'review' },
          { sourceField: 'diagnosis_owner', targetField: 'action_id', rule: '当前未映射', status: 'missing' },
          { sourceField: 'touch_suggestion', targetField: 'touchpoints', rule: '单值转数组', status: 'stable' },
        ],
      },
    ],
  },
  {
    key: 'feedback',
    title: WORKBENCH_DOMAIN_META.feedback.title,
    description: WORKBENCH_DOMAIN_META.feedback.description,
    helper: WORKBENCH_DOMAIN_META.feedback.helper,
    cards: [
      {
        id: 'feedback_dispatch_review',
        domain: 'feedback',
        title: '派发体验回访',
        subtitle: '运营使用后反馈汇总',
        owner: '营销运营 / 体验研究',
        status: 'ready',
        summary: '汇总了运营同学对派发流程和字段理解的回访结果，可用于回填字段映射优化。',
        tags: ['体验回访', '字段回流', 'NPS'],
        metrics: [
          { label: '回访数', value: '18', tone: 'neutral' },
          { label: 'NPS', value: '+36', tone: 'positive' },
          { label: '阻塞项', value: '1', tone: 'attention' },
        ],
        dispatchPreset: {
          crowd_id: 'feedback-loop-运营回访',
          touchpoints: ['lifestyle_home'],
          subsidy_level: 'low',
          budget: 120000,
          copywriting_choice: '回访补测消息',
          channels: ['money_eff'],
        },
        dispatchNotes: [
          '更适合先查看字段映射与详情，识别派发理解偏差。',
          '若要补测回访消息，可直接把生服首页触点带入配置。',
        ],
        detailHighlights: [
          '主要反馈集中在渠道命名不一致和圈选结果缺少可视化说明。',
          '建议对字段映射补充别名和示例值，降低人工确认成本。',
        ],
        mappingRows: [
          { sourceField: '回访问卷渠道', targetField: 'channels', rule: '别名映射为 money_eff', status: 'review' },
          { sourceField: '反馈批次', targetField: 'crowd_id', rule: '按批次号拼接', status: 'stable' },
          { sourceField: '备注文本', targetField: 'copywriting_choice', rule: '当前不自动映射', status: 'missing' },
        ],
      },
      {
        id: 'feedback_field_backflow',
        domain: 'feedback',
        title: '字段回流缺口单',
        subtitle: '派发链路字段缺失跟踪',
        owner: '数据接入 / 平台治理',
        status: 'syncing',
        summary: '持续跟踪字段回流缺口，帮助确认哪些卡片可以直接派发、哪些仍需人工处理。',
        tags: ['字段映射', '回流缺口', '治理'],
        metrics: [
          { label: '缺口字段', value: '5', tone: 'attention' },
          { label: '已补齐', value: '3', tone: 'positive' },
          { label: '同步频率', value: '每小时', tone: 'neutral' },
        ],
        dispatchPreset: {
          crowd_id: '字段回流补齐',
          touchpoints: ['push'],
          subsidy_level: 'low',
          budget: 80000,
          copywriting_choice: '字段回流补齐验证',
          channels: ['api'],
        },
        dispatchNotes: [
          '适合作为映射治理入口，不建议直接用于正式大盘派发。',
          '优先查看缺失字段并确认是否需要人工兜底。',
        ],
        detailHighlights: [
          '渠道、实验分组和文案别名是当前最主要的三类缺口。',
          '适合联合策略域与分析域一起查看，确认字段复用方式。',
        ],
        mappingRows: [
          { sourceField: 'channel_alias', targetField: 'channels', rule: '别名表归一', status: 'review' },
          { sourceField: 'experiment_group', targetField: 'action_id', rule: '当前未接入派发任务', status: 'missing' },
          { sourceField: 'copy_variant', targetField: 'copywriting_choice', rule: '优先取默认文案', status: 'stable' },
        ],
      },
    ],
  },
];
