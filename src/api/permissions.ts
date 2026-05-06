import type { UserPermission, UserRole } from '../types';

const DEFAULT_ROLE: UserRole = 'platform_admin';

const ROLE_PERMISSION_MAP: Record<UserRole, UserPermission> = {
  consumer: {
    userId: 'user_consumer_001',
    userName: '张三',
    teamId: 'team_growth',
    teamName: '增长运营',
    role: 'consumer',
    availableViews: ['consumer'],
    defaultView: 'consumer',
    dataScopeMode: 'self',
    enabledActions: ['asset.subscribe', 'asset.favorite', 'gap.request'],
    maskedConsumerIdentity: true,
  },
  producer: {
    userId: 'user_producer_001',
    userName: '李四',
    teamId: 'team_producer_a',
    teamName: '特征供给一组',
    role: 'producer',
    availableViews: ['consumer', 'producer'],
    defaultView: 'producer',
    dataScopeMode: 'self',
    enabledActions: [
      'feature.create',
      'feature.edit',
      'pipeline.run',
      'quality.backtest.view',
      'quality.backtest.create',
      'quality.self_review.view',
      'quality.self_review.submit',
      'quality.llm_judge.view',
      'quality.llm_judge.create',
      'quality.llm_judge.bad_case.manage',
      'quality.survey.view',
      'quality.survey.dispatch.create',
      'quality.survey.ticket.create',
      'quality.health_score.view',
    ],
    maskedConsumerIdentity: true,
  },
  producer_admin: {
    userId: 'user_producer_admin_001',
    userName: '王五',
    teamId: 'team_producer_admin',
    teamName: '特征供给平台主管',
    role: 'producer_admin',
    availableViews: ['consumer', 'producer'],
    defaultView: 'producer',
    dataScopeMode: 'team',
    enabledActions: [
      'feature.create',
      'feature.edit',
      'feature.review',
      'governance.manage',
      'demand.manage',
      'pipeline.run',
      'quality.backtest.view',
      'quality.backtest.create',
      'quality.self_review.view',
      'quality.self_review.submit',
      'quality.self_review.template.manage',
      'quality.llm_judge.view',
      'quality.llm_judge.create',
      'quality.llm_judge.template.manage',
      'quality.llm_judge.bad_case.manage',
      'quality.llm_judge.schedule.manage',
      'quality.survey.view',
      'quality.survey.dispatch.create',
      'quality.survey.dispatch.manage',
      'quality.survey.ticket.create',
      'quality.health_score.view',
    ],
    maskedConsumerIdentity: true,
  },
  platform_admin: {
    userId: 'user_platform_admin_001',
    userName: '赵六',
    teamId: 'team_platform',
    teamName: '平台治理',
    role: 'platform_admin',
    availableViews: ['consumer', 'producer', 'operator'],
    defaultView: 'consumer',
    dataScopeMode: 'global',
    enabledActions: [
      'asset.subscribe',
      'feature.create',
      'feature.edit',
      'feature.review',
      'pipeline.run',
      'governance.manage',
      'demand.manage',
      'operator.configure',
      'quality.backtest.view',
      'quality.backtest.create',
      'quality.backtest.schedule.manage',
      'quality.self_review.view',
      'quality.self_review.submit',
      'quality.self_review.template.manage',
      'quality.llm_judge.view',
      'quality.llm_judge.create',
      'quality.llm_judge.template.manage',
      'quality.llm_judge.bad_case.manage',
      'quality.llm_judge.schedule.manage',
      'quality.llm_judge.whitelist.manage',
      'quality.survey.view',
      'quality.survey.dispatch.create',
      'quality.survey.dispatch.manage',
      'quality.survey.ticket.create',
      'quality.health_score.view',
      'quality.health_score.weight.manage',
    ],
    maskedConsumerIdentity: true,
  },
};

export function buildUserPermissionsUrl(role?: UserRole) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  const query = params.toString();
  return query ? `/api/v1/auth/permissions?${query}` : '/api/v1/auth/permissions';
}

export async function getUserPermissionsApi(role?: UserRole): Promise<UserPermission> {
  void buildUserPermissionsUrl(role);
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  const resolvedRole = role ?? DEFAULT_ROLE;
  const permission = ROLE_PERMISSION_MAP[resolvedRole];

  return {
    ...permission,
    availableViews: [...permission.availableViews],
    enabledActions: [...permission.enabledActions],
  };
}
