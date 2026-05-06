import { fetcher } from '../lib/fetcher';
import { fieldKeys, toolKeys } from '../lib/runtimeTokens';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let cachedData: {
  assets?: any[];
  crowds?: any[];
  features?: any[];
  packs?: any[];
  opps?: any[];
} = {};

async function loadAllData() {
  if (Object.keys(cachedData).length === 5) {
    return;
  }
  const [assets, crowds, features, packs, opps] = await Promise.all([
    fetcher<any[]>('/mock/assets.json'),
    fetcher<any[]>('/mock/crowds.json'),
    fetcher<any[]>('/mock/features.json'),
    fetcher<any[]>('/mock/packs.json'),
    fetcher<any[]>('/mock/opps.json')
  ]);
  cachedData = { assets, crowds, features, packs, opps };
}

function extractKeywords(goal: string) {
  const keywords = ['餐饮', '沉默', '婚庆', '复购', '高消费', '年轻', '新品', '电商', '生服'];
  return keywords.filter(kw => goal.includes(kw));
}

function matchScore(asset: any, keywords: string[]) {
  let score = 0;
  const text = (asset.name + ' ' + asset.description).toLowerCase();
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) {
      score += 20;
    }
  }
  score += asset.health?.score || 0;
  score += asset.subs ? (asset.subs / 100000) : 0;
  return score;
}

export async function invoke(tool: keyof typeof AGENT_TOOLS, input: any) {
  await sleep(600 + Math.random() * 800);
  await loadAllData();
  
  switch (tool) {
    case toolKeys.recommendAsset: {
      const keywords = extractKeywords(input.goal || '');
      const scoredAssets = (cachedData.assets as any[])
        .map(a => ({ asset: a, score: matchScore(a, keywords) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ asset, score }) => ({
          type: 'asset',
          payload: { ...asset, matching_score: score, reason: '匹配目标' }
        }));
      
      return {
        text: `为实现「${input.goal}」，我推荐3个跨域画像资产：`,
        cards: scoredAssets,
        followup: ['再推2个偏高消费的', '只要T+1内的特征']
      };
    }
    case toolKeys.recommendCrowd: {
      const matchedCrowd =
        (cachedData.crowds as any[]).find(c => c.asset_id === input[fieldKeys.assetId]) || (cachedData.crowds as any[])[0];
      return {
        text: '找到推荐的人群：',
        cards: [{ type: 'crowd', payload: matchedCrowd }],
        followup: ['查看人群详情', '配置运营动作']
      };
    }
    case toolKeys.recommendAction: {
      const actions = [
        { type: 'action', payload: {
          crowd_id: input[fieldKeys.crowdId],
          touchpoints: ['push', 'lifestyle_home'],
          subsidy_level: 'mid',
          budget: 500000,
          copywriting_choice: '本周必吃',
          estimated: {
            exposure: '5.2M',
            ctr: '3.2%',
            cvr: '1.8%',
            gmv_lift: '+2.1%'
          }
        }}
      ];
      return {
        text: '推荐运营动作：',
        cards: actions,
        followup: ['调整参数', '立即派发']
      };
    }
    case toolKeys.recommendPack: {
      const recommendedPacks = (cachedData.packs as any[]).slice(0, 3).map(p => ({
        type: 'pack',
        payload: p
      }));
      return {
        text: '推荐特征包：',
        cards: recommendedPacks,
        followup: ['对比特征', '导出配置']
      };
    }
    case toolKeys.evaluateFeature: {
      const feature =
        (cachedData.features as any[]).find(f => f.id === input[fieldKeys.featureId]) || (cachedData.features as any[])[0];
      return {
        text: '特征评估结果：',
        cards: [{ type: 'eval', payload: feature }],
        followup: ['查看趋势', '血缘分析']
      };
    }
    case toolKeys.recommendOpportunity: {
      return {
        text: '发现以下机会：',
        cards: (cachedData.opps as any[]).slice(0, 3).map(o => ({ type: 'opp', payload: o })),
        followup: ['查看详情', '一键派发']
      };
    }
    default:
      return { text: '未知工具' };
  }
}

export const AGENT_TOOLS = {
  [toolKeys.recommendAsset]: { line: 1, inputs: ['goal'] },
  [toolKeys.recommendCrowd]: { line: 1, inputs: [fieldKeys.assetId] },
  [toolKeys.recommendAction]: { line: 1, inputs: [fieldKeys.crowdId] },
  [toolKeys.recommendPack]: { line: 2, inputs: ['algo_domain', 'metric', 'delta'] },
  [toolKeys.evaluateFeature]: { line: 2, inputs: [fieldKeys.featureId] },
  [toolKeys.recommendOpportunity]: { line: 3, inputs: [] }
} as const;
