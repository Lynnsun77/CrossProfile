import type { RecommendScript } from '../types';
import { larkMerchantInsightScript } from './lark-merchant-insight.script';

export const scripts: RecommendScript[] = [larkMerchantInsightScript];
export const DEFAULT_SCRIPT_ID = larkMerchantInsightScript.id;

export function matchScript(): RecommendScript {
  return larkMerchantInsightScript;
}

export function getScript(scriptId: string = DEFAULT_SCRIPT_ID): RecommendScript {
  if (scriptId === 'hotpot_demo') {
    return larkMerchantInsightScript;
  }
  return scripts.find((item) => item.id === scriptId) ?? larkMerchantInsightScript;
}

export { larkMerchantInsightScript };
