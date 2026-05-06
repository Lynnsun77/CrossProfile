import type {
  AlertType,
  BacktestJob,
  ConsumptionRecord,
  FeatureDomain,
  FeatureType,
  GovernanceSeverity,
  GovernanceTicket,
  GovernanceTicketComment,
  GovernanceTicketDetail,
  HealthScoreBreakdown,
  HealthScoreTrendPoint,
  GovernanceTicketType,
  LLMJudgeBadCase,
  LLMJudgeBadCaseAction,
  LLMJudgePromptTemplate,
  LLMJudgeRun,
  QualityAlert,
  QualityAlertOverview,
  QualityAlertRule,
  QualityAlertStatus,
  QualityAttributionKpi,
  QualityDegradationEvent,
  QualityExportEntry,
  QualityExportFormat,
  QualityFeatureAttributionDetail,
  QualityHealthHeatmapPoint,
  QualityHealthListItem,
  QualityHealthReport,
  QualityHealthStatus,
  QualityPlaceholderEntry,
  QualityTrendPoint,
  QualityValueRankingItem,
  SelfReviewRecord,
  SelfReviewTemplate,
  SurveyDispatch,
  SurveyResponse,
  SurveySummary,
  SurveyTemplate,
  SurveyWordCloudItem,
} from '../types';
import {
  appendGovernanceTicketComment,
  createLLMJudgePromptTemplate,
  createLLMJudgeRun,
  createSurveyDispatch,
  createSurveyLowScoreTicket,
  deleteLLMJudgePromptTemplate,
  getBacktestJobDetail,
  getBacktestJobs,
  getBacktestOverview,
  getGovernanceTicketComments,
  getGovernanceTicketDetail,
  getGovernanceTickets,
  getHealthScoreBreakdown,
  getHealthScoreTrend,
  getLLMJudgeBadCases,
  getLLMJudgeOverview,
  getLLMJudgePromptTemplate,
  getLLMJudgePromptTemplates,
  getLLMJudgeRunDetail,
  getLLMJudgeRuns,
  getLLMJudgeScoreDistribution,
  getQualityAlertOverview,
  getQualityAlertRules,
  getQualityAlerts,
  getQualityAttributionKpis,
  getQualityConsumptionRecords,
  getQualityDegradationEvents,
  getQualityExportEntry,
  getQualityFeatureAttributionDetail,
  getQualityHealthList,
  getQualityHealthReport,
  getQualityHeatmapPoints,
  getQualityMeta,
  getQualityPlaceholderEntries,
  getQualityTrend,
  getQualityValueRanking,
  getSurveyDispatches,
  getSurveyResponses,
  getSurveySummaries,
  getSurveySummary,
  getSurveyTemplates,
  getSurveyWordCloud,
  getSelfReviewAiSuggestions,
  getSelfReviewRecords,
  getSelfReviewTemplateByFeatureType,
  getSelfReviewTemplates,
  rollbackLLMJudgePromptTemplate,
  updateGovernanceTicketStatus,
  updateLLMJudgeBadCaseAction,
  updateLLMJudgePromptTemplate,
} from '../mock/quality';
import { MY_ASSIGNEE_FILTER, MY_ASSIGNEE_TEAM_ID } from './my';

export type QualityHealthListRequest = {
  status?: 'all' | QualityHealthStatus;
  domain?: 'all' | FeatureDomain;
  keyword?: string;
};

export type QualityTrendRequest = {
  featureId: string;
  windowDays?: 30 | 60 | 90;
};

export type BacktestJobsRequest = {
  status?: 'all' | BacktestJob['status'];
  scenario?: 'all' | BacktestJob['scenario'];
  featureType?: 'all' | FeatureType;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

export type SelfReviewTemplatesRequest = {
  featureType?: 'all' | FeatureType;
};

export type SelfReviewRecordsRequest = {
  featureId?: string;
};

export type QualityAlertsRequest = {
  status?: 'all' | QualityAlertStatus;
  healthStatus?: 'all' | QualityHealthStatus;
  alertType?: 'all' | AlertType;
};

export type GovernanceTicketsRequest = {
  status?: 'all' | GovernanceTicket['status'];
  type?: 'all' | GovernanceTicketType;
  severity?: 'all' | GovernanceSeverity;
  assigneeTeamId?: 'all' | string;
  assignee?: 'me' | string;
};

export type LLMJudgeRunsRequest = {
  featureType?: 'all' | FeatureType;
  status?: 'all' | LLMJudgeRun['status'];
  keyword?: string;
};

export type LLMJudgePromptTemplatesRequest = {
  featureType?: 'all' | FeatureType;
};

export type LLMJudgeBadCasesRequest = {
  runId?: string;
  featureType?: 'all' | FeatureType;
  status?: 'all' | LLMJudgeBadCase['status'];
  keyword?: string;
};

export type LLMJudgeRunCreateInput = {
  featureId: string;
  templateId: string;
  judgeModel: string;
  sampleSize: number;
  triggerMode: LLMJudgeRun['triggerMode'];
};

export type LLMJudgePromptTemplateSaveInput = {
  name?: string;
  featureType?: FeatureType;
  featureDomain?: FeatureDomain;
  description?: string;
  judgeModel?: string;
  prompt: string;
  rubric: string[];
  fewShots: LLMJudgePromptTemplate['fewShots'];
  tags?: string[];
  operator: string;
  changeNote: string;
};

export type SurveyTemplatesRequest = {
  scenario?: 'all' | SurveyTemplate['scenario'];
};

export type SurveyDispatchesRequest = {
  status?: 'all' | SurveyDispatch['status'];
  templateId?: string;
  featureId?: string;
};

export type SurveyResponsesRequest = {
  featureId?: string;
  dispatchId?: string;
  keyword?: string;
};

export type SurveySummariesRequest = {
  featureType?: 'all' | FeatureType;
  keyword?: string;
};

export type SurveyDispatchCreateInput = {
  templateId: string;
  featureId: string;
  channel: SurveyDispatch['channel'];
  sampleSize: number;
  scheduledAt: string;
  autoCreateTicket: boolean;
};

export type SurveyLowScoreTicketCreateInput = {
  featureId: string;
  reporterUserId: string;
  reporterUserName: string;
  reporterTeamName: string;
  summary?: string;
};

export type QualityValueRankingRequest = {
  limit?: number;
};

export type QualityExportRequest = {
  scope: 'governance' | 'tickets' | 'attribution';
  format?: QualityExportFormat;
};

export type TicketCommentInput = {
  authorUserId: string;
  authorUserName: string;
  authorTeamName: string;
  content: string;
};

export type TicketStatusUpdateInput = {
  status: GovernanceTicket['status'];
  operatorUserId: string;
  operatorUserName: string;
  operatorTeamName: string;
};

export type QualityHealthListResponse = {
  items: QualityHealthListItem[];
  total: number;
};

export type QualityHealthHeatmapResponse = {
  items: QualityHealthHeatmapPoint[];
  total: number;
};

export type QualityTrendResponse = {
  items: QualityTrendPoint[];
  total: number;
  featureId: string;
  windowDays: 30 | 60 | 90;
};

export type QualityAlertsResponse = {
  items: QualityAlert[];
  total: number;
};

export type LLMJudgeOverviewResponse = ReturnType<typeof getLLMJudgeOverview>;
export type LLMJudgeScoreDistributionResponse = ReturnType<typeof getLLMJudgeScoreDistribution>;

export type LLMJudgeRunsResponse = {
  items: LLMJudgeRun[];
  total: number;
};

export type LLMJudgeBadCasesResponse = {
  items: LLMJudgeBadCase[];
  total: number;
};

export type LLMJudgePromptTemplatesResponse = {
  items: LLMJudgePromptTemplate[];
  total: number;
};

export type BacktestOverviewResponse = ReturnType<typeof getBacktestOverview>;

export type BacktestJobsResponse = {
  items: BacktestJob[];
  total: number;
  page: number;
  pageSize: number;
};

export type GovernanceTicketsResponse = {
  items: GovernanceTicket[];
  total: number;
};

export type GovernanceTicketCommentsResponse = {
  items: GovernanceTicketComment[];
  total: number;
};

export type QualityValueRankingResponse = {
  items: QualityValueRankingItem[];
  total: number;
};

export type SelfReviewTemplatesResponse = {
  items: SelfReviewTemplate[];
  total: number;
};

export type SelfReviewRecordsResponse = {
  items: SelfReviewRecord[];
  total: number;
};

export type SurveyTemplatesResponse = {
  items: SurveyTemplate[];
  total: number;
};

export type SurveyDispatchesResponse = {
  items: SurveyDispatch[];
  total: number;
};

export type SurveyResponsesResponse = {
  items: SurveyResponse[];
  total: number;
};

export type SurveySummariesResponse = {
  items: SurveySummary[];
  total: number;
};

export type QualityBootstrapMetaResponse = ReturnType<typeof getQualityMeta>;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withQuery(pathname: string, entries: Array<[string, string | undefined]>) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value != null && value !== '' && value !== 'all') {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildQualityAlertOverviewUrl() {
  return '/api/quality/alert-overview';
}

export async function getQualityAlertOverviewApi(): Promise<QualityAlertOverview> {
  void buildQualityAlertOverviewUrl();
  await delay(120);
  return getQualityAlertOverview();
}

export function buildQualityHealthListUrl(req: QualityHealthListRequest = {}) {
  return withQuery('/api/quality/health-list', [
    ['status', req.status],
    ['domain', req.domain],
    ['keyword', req.keyword?.trim()],
  ]);
}

export async function getQualityHealthListApi(req: QualityHealthListRequest = {}): Promise<QualityHealthListResponse> {
  void buildQualityHealthListUrl(req);
  await delay(140);

  const keyword = req.keyword?.trim().toLowerCase() ?? '';
  const items = getQualityHealthList().filter((item) => {
    const matchesStatus = req.status && req.status !== 'all' ? item.status === req.status : true;
    const matchesDomain = req.domain && req.domain !== 'all' ? item.featureDomain === req.domain : true;
    const matchesKeyword = keyword
      ? [item.featureId, item.featureName, item.ownerTeamName].some((text) => text.toLowerCase().includes(keyword))
      : true;
    return matchesStatus && matchesDomain && matchesKeyword;
  });

  return {
    items,
    total: items.length,
  };
}

export function buildQualityHeatmapUrl(req: QualityHealthListRequest = {}) {
  return withQuery('/api/quality/health-heatmap', [
    ['status', req.status],
    ['domain', req.domain],
    ['keyword', req.keyword?.trim()],
  ]);
}

export async function getQualityHeatmapApi(req: QualityHealthListRequest = {}): Promise<QualityHealthHeatmapResponse> {
  void buildQualityHeatmapUrl(req);
  await delay(140);

  const keyword = req.keyword?.trim().toLowerCase() ?? '';
  const items = getQualityHeatmapPoints().filter((item) => {
    const matchesStatus = req.status && req.status !== 'all' ? item.status === req.status : true;
    const matchesDomain = req.domain && req.domain !== 'all' ? item.featureDomain === req.domain : true;
    const matchesKeyword = keyword
      ? [item.featureId, item.featureName, item.ownerTeamName].some((text) => text.toLowerCase().includes(keyword))
      : true;
    return matchesStatus && matchesDomain && matchesKeyword;
  });

  return {
    items,
    total: items.length,
  };
}

export function buildQualityTrendUrl(req: QualityTrendRequest) {
  return withQuery(`/api/quality/features/${encodeURIComponent(req.featureId)}/trend`, [
    ['windowDays', req.windowDays ? String(req.windowDays) : undefined],
  ]);
}

export async function getQualityTrendApi(req: QualityTrendRequest): Promise<QualityTrendResponse> {
  void buildQualityTrendUrl(req);
  await delay(120);
  const windowDays = req.windowDays ?? 30;
  const items = getQualityTrend(req.featureId, windowDays);
  return {
    items,
    total: items.length,
    featureId: req.featureId,
    windowDays,
  };
}

export function buildBacktestOverviewUrl() {
  return '/api/quality/auto-backtest/overview';
}

export async function getBacktestOverviewApi(): Promise<BacktestOverviewResponse> {
  void buildBacktestOverviewUrl();
  await delay(100);
  return getBacktestOverview();
}

export function buildBacktestJobsUrl(req: BacktestJobsRequest = {}) {
  return withQuery('/api/quality/auto-backtest/jobs', [
    ['status', req.status],
    ['scenario', req.scenario],
    ['featureType', req.featureType],
    ['keyword', req.keyword?.trim()],
    ['page', req.page ? String(req.page) : undefined],
    ['pageSize', req.pageSize ? String(req.pageSize) : undefined],
  ]);
}

export async function getBacktestJobsApi(req: BacktestJobsRequest = {}): Promise<BacktestJobsResponse> {
  void buildBacktestJobsUrl(req);
  await delay(140);

  const keyword = req.keyword?.trim().toLowerCase() ?? '';
  const page = Math.max(req.page ?? 1, 1);
  const pageSize = Math.max(req.pageSize ?? 10, 1);
  const filtered = getBacktestJobs().filter((item) => {
    const matchesStatus = req.status && req.status !== 'all' ? item.status === req.status : true;
    const matchesScenario = req.scenario && req.scenario !== 'all' ? item.scenario === req.scenario : true;
    const matchesFeatureType = req.featureType && req.featureType !== 'all' ? item.featureType === req.featureType : true;
    const matchesKeyword = keyword
      ? [item.id, item.featureId, item.featureName, item.ownerTeamName].some((text) => text.toLowerCase().includes(keyword))
      : true;
    return matchesStatus && matchesScenario && matchesFeatureType && matchesKeyword;
  });
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export function buildBacktestJobDetailUrl(jobId: string) {
  return `/api/quality/auto-backtest/jobs/${encodeURIComponent(jobId)}`;
}

export async function getBacktestJobDetailApi(jobId: string): Promise<BacktestJob | null> {
  void buildBacktestJobDetailUrl(jobId);
  await delay(110);
  return getBacktestJobDetail(jobId);
}

export function buildSelfReviewTemplatesUrl(req: SelfReviewTemplatesRequest = {}) {
  return withQuery('/api/quality/self-review/templates', [['featureType', req.featureType]]);
}

export async function getSelfReviewTemplatesApi(
  req: SelfReviewTemplatesRequest = {},
): Promise<SelfReviewTemplatesResponse> {
  void buildSelfReviewTemplatesUrl(req);
  await delay(110);
  const items = req.featureType && req.featureType !== 'all' ? getSelfReviewTemplates(req.featureType) : getSelfReviewTemplates();
  return {
    items,
    total: items.length,
  };
}

export function buildSelfReviewTemplateByFeatureTypeUrl(featureType: FeatureType) {
  return `/api/quality/self-review/templates/${encodeURIComponent(featureType)}`;
}

export async function getSelfReviewTemplateByFeatureTypeApi(featureType: FeatureType): Promise<SelfReviewTemplate | null> {
  void buildSelfReviewTemplateByFeatureTypeUrl(featureType);
  await delay(100);
  return getSelfReviewTemplateByFeatureType(featureType);
}

export function buildSelfReviewRecordsUrl(req: SelfReviewRecordsRequest = {}) {
  return withQuery('/api/quality/self-review/records', [['featureId', req.featureId]]);
}

export async function getSelfReviewRecordsApi(req: SelfReviewRecordsRequest = {}): Promise<SelfReviewRecordsResponse> {
  void buildSelfReviewRecordsUrl(req);
  await delay(120);
  const items = getSelfReviewRecords(req.featureId);
  return {
    items,
    total: items.length,
  };
}

export function buildSelfReviewAiSuggestionsUrl(featureId: string) {
  return `/api/quality/self-review/${encodeURIComponent(featureId)}/ai-suggestions`;
}

export async function getSelfReviewAiSuggestionsApi(featureId: string): Promise<string[]> {
  void buildSelfReviewAiSuggestionsUrl(featureId);
  await delay(80);
  return getSelfReviewAiSuggestions(featureId);
}

export function buildLLMJudgeOverviewUrl() {
  return '/api/quality/llm-judge/overview';
}

export async function getLLMJudgeOverviewApi(): Promise<LLMJudgeOverviewResponse> {
  void buildLLMJudgeOverviewUrl();
  await delay(100);
  return getLLMJudgeOverview();
}

export function buildLLMJudgeRunsUrl(req: LLMJudgeRunsRequest = {}) {
  return withQuery('/api/quality/llm-judge/runs', [
    ['featureType', req.featureType],
    ['status', req.status],
    ['keyword', req.keyword?.trim()],
  ]);
}

export async function getLLMJudgeRunsApi(req: LLMJudgeRunsRequest = {}): Promise<LLMJudgeRunsResponse> {
  void buildLLMJudgeRunsUrl(req);
  await delay(120);
  const keyword = req.keyword?.trim().toLowerCase() ?? '';
  const items = getLLMJudgeRuns(
    req.featureType && req.featureType !== 'all' ? req.featureType : undefined,
    req.status && req.status !== 'all' ? req.status : undefined,
  ).filter((item) =>
    keyword
      ? [item.id, item.featureId, item.featureName, item.templateName, item.ownerTeamName].some((text) =>
          text.toLowerCase().includes(keyword),
        )
      : true,
  );
  return { items, total: items.length };
}

export function buildLLMJudgeRunDetailUrl(runId: string) {
  return `/api/quality/llm-judge/runs/${encodeURIComponent(runId)}`;
}

export async function getLLMJudgeRunDetailApi(runId: string): Promise<LLMJudgeRun | null> {
  void buildLLMJudgeRunDetailUrl(runId);
  await delay(100);
  return getLLMJudgeRunDetail(runId);
}

export async function postLLMJudgeRunApi(input: LLMJudgeRunCreateInput): Promise<LLMJudgeRun | null> {
  void buildLLMJudgeRunsUrl();
  await delay(130);
  return createLLMJudgeRun(input);
}

export function buildLLMJudgeDistributionUrl(featureType?: FeatureType) {
  return withQuery('/api/quality/llm-judge/distribution', [['featureType', featureType]]);
}

export async function getLLMJudgeDistributionApi(featureType?: FeatureType): Promise<LLMJudgeScoreDistributionResponse> {
  void buildLLMJudgeDistributionUrl(featureType);
  await delay(90);
  return getLLMJudgeScoreDistribution(featureType);
}

export function buildLLMJudgePromptTemplatesUrl(req: LLMJudgePromptTemplatesRequest = {}) {
  return withQuery('/api/quality/llm-judge/templates', [['featureType', req.featureType]]);
}

export async function getLLMJudgePromptTemplatesApi(
  req: LLMJudgePromptTemplatesRequest = {},
): Promise<LLMJudgePromptTemplatesResponse> {
  void buildLLMJudgePromptTemplatesUrl(req);
  await delay(110);
  const items =
    req.featureType && req.featureType !== 'all'
      ? getLLMJudgePromptTemplates(req.featureType)
      : getLLMJudgePromptTemplates();
  return { items, total: items.length };
}

export function buildLLMJudgePromptTemplateDetailUrl(templateId: string) {
  return `/api/quality/llm-judge/templates/${encodeURIComponent(templateId)}`;
}

export async function getLLMJudgePromptTemplateApi(templateId: string): Promise<LLMJudgePromptTemplate | null> {
  void buildLLMJudgePromptTemplateDetailUrl(templateId);
  await delay(100);
  return getLLMJudgePromptTemplate(templateId);
}

export async function postLLMJudgePromptTemplateApi(
  input: Required<Pick<LLMJudgePromptTemplateSaveInput, 'prompt' | 'rubric' | 'fewShots' | 'operator' | 'changeNote'>> &
    Pick<LLMJudgePromptTemplateSaveInput, 'name' | 'featureType' | 'featureDomain' | 'description' | 'judgeModel' | 'tags'>,
): Promise<LLMJudgePromptTemplate> {
  void buildLLMJudgePromptTemplatesUrl();
  await delay(140);
  return createLLMJudgePromptTemplate(input);
}

export async function putLLMJudgePromptTemplateApi(
  templateId: string,
  input: LLMJudgePromptTemplateSaveInput,
): Promise<LLMJudgePromptTemplate | null> {
  void buildLLMJudgePromptTemplateDetailUrl(templateId);
  await delay(140);
  return updateLLMJudgePromptTemplate(templateId, input);
}

export async function rollbackLLMJudgePromptTemplateApi(
  templateId: string,
  version: string,
  operator: string,
): Promise<LLMJudgePromptTemplate | null> {
  void buildLLMJudgePromptTemplateDetailUrl(templateId);
  await delay(120);
  return rollbackLLMJudgePromptTemplate(templateId, version, operator);
}

export async function deleteLLMJudgePromptTemplateApi(templateId: string): Promise<boolean> {
  void buildLLMJudgePromptTemplateDetailUrl(templateId);
  await delay(100);
  return deleteLLMJudgePromptTemplate(templateId);
}

export function buildLLMJudgeBadCasesUrl(req: LLMJudgeBadCasesRequest = {}) {
  return withQuery('/api/quality/llm-judge/bad-cases', [
    ['runId', req.runId],
    ['featureType', req.featureType],
    ['status', req.status],
    ['keyword', req.keyword?.trim()],
  ]);
}

export async function getLLMJudgeBadCasesApi(req: LLMJudgeBadCasesRequest = {}): Promise<LLMJudgeBadCasesResponse> {
  void buildLLMJudgeBadCasesUrl(req);
  await delay(120);
  const keyword = req.keyword?.trim().toLowerCase() ?? '';
  const items = getLLMJudgeBadCases({
    runId: req.runId,
    featureType: req.featureType && req.featureType !== 'all' ? req.featureType : undefined,
    status: req.status && req.status !== 'all' ? req.status : undefined,
  }).filter((item) =>
    keyword
      ? [item.id, item.featureId, item.featureName, item.reason, item.question].some((text) =>
          text.toLowerCase().includes(keyword),
        )
      : true,
  );
  return { items, total: items.length };
}

export async function updateLLMJudgeBadCaseActionApi(
  caseId: string,
  action: LLMJudgeBadCaseAction,
): Promise<LLMJudgeBadCase | null> {
  void buildLLMJudgeBadCasesUrl();
  await delay(110);
  return updateLLMJudgeBadCaseAction(caseId, action);
}

export function buildSurveyTemplatesUrl(req: SurveyTemplatesRequest = {}) {
  return withQuery('/api/quality/survey/templates', [['scenario', req.scenario]]);
}

export async function getSurveyTemplatesApi(req: SurveyTemplatesRequest = {}): Promise<SurveyTemplatesResponse> {
  void buildSurveyTemplatesUrl(req);
  await delay(100);
  const items = req.scenario && req.scenario !== 'all' ? getSurveyTemplates(req.scenario) : getSurveyTemplates();
  return { items, total: items.length };
}

export function buildSurveyDispatchesUrl(req: SurveyDispatchesRequest = {}) {
  return withQuery('/api/quality/survey/dispatches', [
    ['status', req.status],
    ['templateId', req.templateId],
    ['featureId', req.featureId],
  ]);
}

export async function getSurveyDispatchesApi(req: SurveyDispatchesRequest = {}): Promise<SurveyDispatchesResponse> {
  void buildSurveyDispatchesUrl(req);
  await delay(120);
  const items = getSurveyDispatches({
    status: req.status && req.status !== 'all' ? req.status : undefined,
    templateId: req.templateId,
    featureId: req.featureId,
  });
  return { items, total: items.length };
}

export async function postSurveyDispatchApi(input: SurveyDispatchCreateInput): Promise<SurveyDispatch | null> {
  void buildSurveyDispatchesUrl();
  await delay(130);
  return createSurveyDispatch(input);
}

export function buildSurveyResponsesUrl(req: SurveyResponsesRequest = {}) {
  return withQuery('/api/quality/survey/responses', [
    ['featureId', req.featureId],
    ['dispatchId', req.dispatchId],
    ['keyword', req.keyword?.trim()],
  ]);
}

export async function getSurveyResponsesApi(req: SurveyResponsesRequest = {}): Promise<SurveyResponsesResponse> {
  void buildSurveyResponsesUrl(req);
  await delay(120);
  const keyword = req.keyword?.trim().toLowerCase() ?? '';
  const items = getSurveyResponses({
    featureId: req.featureId,
    dispatchId: req.dispatchId,
  }).filter((item) =>
    keyword
      ? [item.featureName, item.respondentTeamName, item.comment].some((text) => text.toLowerCase().includes(keyword))
      : true,
  );
  return { items, total: items.length };
}

export function buildSurveySummariesUrl(req: SurveySummariesRequest = {}) {
  return withQuery('/api/quality/survey/summaries', [
    ['featureType', req.featureType],
    ['keyword', req.keyword?.trim()],
  ]);
}

export async function getSurveySummariesApi(req: SurveySummariesRequest = {}): Promise<SurveySummariesResponse> {
  void buildSurveySummariesUrl(req);
  await delay(120);
  const keyword = req.keyword?.trim().toLowerCase() ?? '';
  const items = (
    req.featureType && req.featureType !== 'all' ? getSurveySummaries(req.featureType) : getSurveySummaries()
  ).filter((item) =>
    keyword
      ? [item.featureId, item.featureName, item.ownerTeamName, item.summary, ...item.topIssues].some((text) =>
          text.toLowerCase().includes(keyword),
        )
      : true,
  );
  return { items, total: items.length };
}

export function buildSurveySummaryDetailUrl(featureId: string) {
  return `/api/quality/survey/summaries/${encodeURIComponent(featureId)}`;
}

export async function getSurveySummaryApi(featureId: string): Promise<SurveySummary | null> {
  void buildSurveySummaryDetailUrl(featureId);
  await delay(100);
  return getSurveySummary(featureId);
}

export function buildSurveyWordCloudUrl(featureId?: string) {
  return withQuery('/api/quality/survey/wordcloud', [['featureId', featureId]]);
}

export async function getSurveyWordCloudApi(featureId?: string): Promise<SurveyWordCloudItem[]> {
  void buildSurveyWordCloudUrl(featureId);
  await delay(90);
  return getSurveyWordCloud(featureId);
}

export async function postSurveyLowScoreTicketApi(
  input: SurveyLowScoreTicketCreateInput,
): Promise<GovernanceTicket | null> {
  void buildSurveySummariesUrl();
  await delay(130);
  return createSurveyLowScoreTicket(input);
}

export function buildHealthScoreBreakdownUrl(featureId: string) {
  return `/api/quality/health-score/${encodeURIComponent(featureId)}`;
}

export async function getHealthScoreBreakdownApi(featureId: string): Promise<HealthScoreBreakdown | null> {
  void buildHealthScoreBreakdownUrl(featureId);
  await delay(110);
  return getHealthScoreBreakdown(featureId);
}

export function buildHealthScoreTrendUrl(featureId: string) {
  return `/api/quality/health-score/${encodeURIComponent(featureId)}/trend`;
}

export async function getHealthScoreTrendApi(featureId: string): Promise<HealthScoreTrendPoint[]> {
  void buildHealthScoreTrendUrl(featureId);
  await delay(100);
  return getHealthScoreTrend(featureId);
}

export function buildQualityDegradationEventsUrl(featureId?: string) {
  return withQuery('/api/quality/health-score/degradation-events', [['featureId', featureId]]);
}

export async function getQualityDegradationEventsApi(featureId?: string): Promise<QualityDegradationEvent[]> {
  void buildQualityDegradationEventsUrl(featureId);
  await delay(110);
  return getQualityDegradationEvents(featureId);
}

export function buildQualityPlaceholderEntriesUrl() {
  return '/api/quality/placeholders';
}

export async function getQualityPlaceholderEntriesApi(): Promise<QualityPlaceholderEntry[]> {
  void buildQualityPlaceholderEntriesUrl();
  await delay(60);
  return getQualityPlaceholderEntries();
}

export function buildQualityAlertsUrl(req: QualityAlertsRequest = {}) {
  return withQuery('/api/quality/alerts', [
    ['status', req.status],
    ['healthStatus', req.healthStatus],
    ['alertType', req.alertType],
  ]);
}

export async function getQualityAlertsApi(req: QualityAlertsRequest = {}): Promise<QualityAlertsResponse> {
  void buildQualityAlertsUrl(req);
  await delay(150);
  const items = getQualityAlerts().filter((item) => {
    const matchesStatus = req.status && req.status !== 'all' ? item.status === req.status : true;
    const matchesHealthStatus = req.healthStatus && req.healthStatus !== 'all' ? item.healthStatus === req.healthStatus : true;
    const matchesAlertType = req.alertType && req.alertType !== 'all' ? item.alertType === req.alertType : true;
    return matchesStatus && matchesHealthStatus && matchesAlertType;
  });

  return {
    items,
    total: items.length,
  };
}

export function buildQualityAlertRulesUrl() {
  return '/api/quality/alert-rules';
}

export async function getQualityAlertRulesApi(): Promise<QualityAlertRule[]> {
  void buildQualityAlertRulesUrl();
  await delay(120);
  return getQualityAlertRules();
}

export function buildQualityHealthReportUrl() {
  return '/api/quality/health-report';
}

export async function getQualityHealthReportApi(): Promise<QualityHealthReport> {
  void buildQualityHealthReportUrl();
  await delay(110);
  return getQualityHealthReport();
}

export function buildGovernanceTicketsUrl(req: GovernanceTicketsRequest = {}) {
  return withQuery('/api/quality/tickets', [
    ['status', req.status],
    ['type', req.type],
    ['severity', req.severity],
    ['assigneeTeamId', req.assigneeTeamId],
    ['assignee', req.assignee],
  ]);
}

export async function getGovernanceTicketsApi(req: GovernanceTicketsRequest = {}): Promise<GovernanceTicketsResponse> {
  void buildGovernanceTicketsUrl(req);
  await delay(150);
  const items = getGovernanceTickets().filter((item) => {
    const matchesStatus = req.status && req.status !== 'all' ? item.status === req.status : true;
    const matchesType = req.type && req.type !== 'all' ? item.type === req.type : true;
    const matchesSeverity = req.severity && req.severity !== 'all' ? item.severity === req.severity : true;
    const matchesAssigneeTeam =
      req.assigneeTeamId && req.assigneeTeamId !== 'all' ? item.assigneeTeamId === req.assigneeTeamId : true;
    const matchesAssignee =
      req.assignee === MY_ASSIGNEE_FILTER
        ? item.assigneeTeamId === MY_ASSIGNEE_TEAM_ID
        : req.assignee
          ? item.assigneeUserId === req.assignee
          : true;
    return matchesStatus && matchesType && matchesSeverity && matchesAssigneeTeam && matchesAssignee;
  });

  return {
    items,
    total: items.length,
  };
}

export function buildGovernanceTicketDetailUrl(ticketId: string) {
  return `/api/quality/tickets/${encodeURIComponent(ticketId)}`;
}

export async function getGovernanceTicketDetailApi(ticketId: string): Promise<GovernanceTicketDetail | null> {
  void buildGovernanceTicketDetailUrl(ticketId);
  await delay(120);
  return getGovernanceTicketDetail(ticketId);
}

export function buildGovernanceTicketCommentsUrl(ticketId: string) {
  return `/api/quality/tickets/${encodeURIComponent(ticketId)}/comments`;
}

export async function getGovernanceTicketCommentsApi(ticketId: string): Promise<GovernanceTicketCommentsResponse> {
  void buildGovernanceTicketCommentsUrl(ticketId);
  await delay(100);
  const items = getGovernanceTicketComments(ticketId);
  return {
    items,
    total: items.length,
  };
}

export async function postGovernanceTicketCommentApi(
  ticketId: string,
  input: TicketCommentInput,
): Promise<GovernanceTicketComment | null> {
  void buildGovernanceTicketCommentsUrl(ticketId);
  await delay(130);
  return appendGovernanceTicketComment(ticketId, input);
}

export async function updateGovernanceTicketStatusApi(
  ticketId: string,
  input: TicketStatusUpdateInput,
): Promise<GovernanceTicket | null> {
  void buildGovernanceTicketDetailUrl(ticketId);
  await delay(120);
  return updateGovernanceTicketStatus(ticketId, input);
}

export function buildQualityAttributionKpiUrl() {
  return '/api/quality/attribution/kpis';
}

export async function getQualityAttributionKpisApi(): Promise<QualityAttributionKpi[]> {
  void buildQualityAttributionKpiUrl();
  await delay(110);
  return getQualityAttributionKpis();
}

export function buildQualityValueRankingUrl(req: QualityValueRankingRequest = {}) {
  return withQuery('/api/quality/attribution/ranking', [
    ['limit', req.limit ? String(req.limit) : undefined],
  ]);
}

export async function getQualityValueRankingApi(
  req: QualityValueRankingRequest = {},
): Promise<QualityValueRankingResponse> {
  void buildQualityValueRankingUrl(req);
  await delay(130);
  const limit = req.limit ?? 10;
  const items = getQualityValueRanking().slice(0, limit);
  return {
    items,
    total: items.length,
  };
}

export function buildQualityFeatureAttributionUrl(featureId: string) {
  return `/api/quality/attribution/${encodeURIComponent(featureId)}`;
}

export async function getQualityFeatureAttributionApi(featureId: string): Promise<QualityFeatureAttributionDetail | null> {
  void buildQualityFeatureAttributionUrl(featureId);
  await delay(120);
  return getQualityFeatureAttributionDetail(featureId);
}

export function buildQualityConsumptionUrl(featureId: string) {
  return `/api/quality/attribution/${encodeURIComponent(featureId)}/consumers`;
}

export async function getQualityConsumptionApi(featureId: string): Promise<ConsumptionRecord[]> {
  void buildQualityConsumptionUrl(featureId);
  await delay(110);
  return getQualityConsumptionRecords(featureId);
}

export function buildQualityExportUrl(req: QualityExportRequest) {
  return withQuery('/api/quality/export', [
    ['scope', req.scope],
    ['format', req.format],
  ]);
}

export async function getQualityExportApi(req: QualityExportRequest): Promise<QualityExportEntry> {
  void buildQualityExportUrl(req);
  await delay(80);
  return getQualityExportEntry(req.scope, req.format);
}

export function buildQualityBootstrapMetaUrl() {
  return '/api/quality/meta';
}

export async function getQualityBootstrapMetaApi(): Promise<QualityBootstrapMetaResponse> {
  void buildQualityBootstrapMetaUrl();
  await delay(60);
  return getQualityMeta();
}
