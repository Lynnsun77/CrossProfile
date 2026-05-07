import mockTemplatesRaw from '../mock/mockTemplates.json';
import type {
  IntentParsedResult,
  MockTemplates,
  RecommendationCard,
} from '../types';

const templates = mockTemplatesRaw as MockTemplates;

function applyVars(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

export function buildReasonText(
  parsed: IntentParsedResult,
  card: RecommendationCard
): string[] {
  if (card.reasons && card.reasons.length > 0) {
    return card.reasons.slice(0, 3);
  }

  const vars = {
    target: parsed.target,
    scene: parsed.scene,
    objectType: card.objectType,
  };
  const reasons = templates.reasonTemplates.map((tpl) => applyVars(tpl, vars));
  return reasons.slice(0, 3);
}
