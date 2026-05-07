import mockTemplatesRaw from '../mock/mockTemplates.json';
import type { GroupedRecommendations, IntentParsedResult, MockTemplates } from '../types';

const templates = mockTemplatesRaw as MockTemplates;

function applyVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export function buildSummaryText(_parsed: IntentParsedResult, grouped: GroupedRecommendations): string {
  const ready = grouped.ready.length;
  const adaptable = grouped.adaptable.length;
  const total = ready + adaptable;

  if (total === 0) {
    return grouped.fallback.show && grouped.fallback.reason ? grouped.fallback.reason : templates.emptySummary;
  }

  return applyVars(templates.summary, {
    total: String(total),
    ready: String(ready),
    adaptable: String(adaptable),
    tail: templates.summaryTail,
  });
}
