import mockTemplatesRaw from '../mock/mockTemplates.json';
import type {
  GroupedRecommendations,
  IntentParsedResult,
  MockTemplates,
} from '../types';

const templates = mockTemplatesRaw as MockTemplates;

function applyVars(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export function buildSummaryText(
  _parsed: IntentParsedResult,
  grouped: GroupedRecommendations
): string {
  const priority = grouped.priority.length;
  const expandable = grouped.expandable.length;
  const similar = grouped.similar.length;
  const total = priority + expandable + similar;

  if (total === 0) {
    return templates.emptySummary;
  }

  return applyVars(templates.summary, {
    total: String(total),
    priority: String(priority),
    expandable: String(expandable),
    similar: String(similar),
    tail: templates.summaryTail,
  });
}
