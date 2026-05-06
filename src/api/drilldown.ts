import type {
  DrilldownQualityAttributionAnalysis,
  FusionEvaluationResult,
  FusionEvaluationRun,
  FusionGraphData,
  FusionQualityCompareRow,
} from '../types';
import {
  getDrilldownQualityAttributionAnalysis,
  getFusionEvaluationResult,
  getFusionGraph,
  getFusionQualityComparison,
  runFusionEvaluation,
} from '../mock/producerInsights';

export type FusionEvaluationRequest = {
  comparedFeatureIds?: string[];
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withQuery(pathname: string, entries: Array<[string, string | undefined]>) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value != null && value !== '') {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildDrilldownQualityAttributionUrl(featureId: string) {
  return `/api/drilldown/features/${encodeURIComponent(featureId)}/quality-attribution`;
}

export async function getDrilldownQualityAttributionApi(
  featureId: string,
): Promise<DrilldownQualityAttributionAnalysis | null> {
  void buildDrilldownQualityAttributionUrl(featureId);
  await delay(120);
  return getDrilldownQualityAttributionAnalysis(featureId);
}

export function buildDrilldownFusionGraphUrl(featureId: string) {
  return `/api/drilldown/features/${encodeURIComponent(featureId)}/fusion-graph`;
}

export async function getDrilldownFusionGraphApi(featureId: string): Promise<FusionGraphData | null> {
  void buildDrilldownFusionGraphUrl(featureId);
  await delay(110);
  return getFusionGraph(featureId);
}

export function buildDrilldownFusionComparisonUrl(featureId: string) {
  return `/api/drilldown/features/${encodeURIComponent(featureId)}/fusion-comparison`;
}

export async function getDrilldownFusionComparisonApi(featureId: string): Promise<FusionQualityCompareRow[]> {
  void buildDrilldownFusionComparisonUrl(featureId);
  await delay(110);
  return getFusionQualityComparison(featureId);
}

export function buildDrilldownFusionEvaluationRunUrl(featureId: string, req: FusionEvaluationRequest = {}) {
  return withQuery(`/api/drilldown/features/${encodeURIComponent(featureId)}/fusion-evaluation`, [
    ['comparedFeatureIds', req.comparedFeatureIds?.join(',')],
  ]);
}

export async function runDrilldownFusionEvaluationApi(
  featureId: string,
  req: FusionEvaluationRequest = {},
): Promise<FusionEvaluationRun | null> {
  void buildDrilldownFusionEvaluationRunUrl(featureId, req);
  await delay(140);
  return runFusionEvaluation(featureId, req.comparedFeatureIds ?? []);
}

export function buildDrilldownFusionEvaluationResultUrl(evalRunId: string) {
  return `/api/drilldown/fusion-evaluations/${encodeURIComponent(evalRunId)}`;
}

export async function getDrilldownFusionEvaluationResultApi(evalRunId: string): Promise<FusionEvaluationResult | null> {
  void buildDrilldownFusionEvaluationResultUrl(evalRunId);
  await delay(90);
  return getFusionEvaluationResult(evalRunId);
}
