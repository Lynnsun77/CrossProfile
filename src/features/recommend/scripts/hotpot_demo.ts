import { hotpotActions, hotpotBundle, hotpotGaps, hotpotRequirement } from '../mocks/hotpot_data';
import { statusFromConfidence } from '../types';
import type { AgentScript } from './types';

/** 川渝火锅 Demo 脚本: Step1 解析 -> Step2 推荐 -> Step3 缺口 -> Step4 收口 */
export const hotpotScript: AgentScript = {
  id: 'hotpot_demo',
  name: '川渝火锅推荐脚本',
  matcher: (input) => {
    const text = `${input.text ?? ''} ${input.docUrl ?? ''}`.toLowerCase();
    return text.includes('火锅') || text.includes('hotpot') || text.includes('larkoffice.com');
  },
  timeline: [
    { delayMs: 500, phase: 'parsing', event: { type: 'thinking_step', payload: { id: 'p1', title: '读取输入与文档', status: 'running', detail: '识别文本诉求、飞书链接与上下文信息。' } } },
    { delayMs: 1100, phase: 'parsing', event: { type: 'thinking_step', payload: { id: 'p1', title: '读取输入与文档', status: 'done', detail: '已抓取 9 段正文并完成 URL 识别。' } } },
    { delayMs: 500, phase: 'parsing', event: { type: 'thinking_step', payload: { id: 'p2', title: '归纳业务目标', status: 'running', detail: '抽取行业、商家、问题人群与动作诉求。' } } },
    { delayMs: 900, phase: 'parsing', event: { type: 'thinking_step', payload: { id: 'p2', title: '归纳业务目标', status: 'done', detail: '识别为川渝火锅拉新与转化双目标。' } } },
    { delayMs: 600, phase: 'parsing', event: { type: 'thinking_step', payload: { id: 'p3', title: '构建需求卡', status: 'running', detail: '写入问题人群、挖掘范围、动作类型与置信度。' } } },
    {
      delayMs: 1200,
      phase: 'parsing',
      event: {
        type: 'parse_result',
        payload: {
          ...hotpotRequirement,
          status: statusFromConfidence(hotpotRequirement.confidence),
        },
      },
    },
    { delayMs: 700, phase: 'recommending', event: { type: 'thinking_step', payload: { id: 'r1', title: '匹配动作矩阵', status: 'running', detail: '按问题人群 x 动作类型匹配候选资产。' } } },
    { delayMs: 1200, phase: 'recommending', event: { type: 'thinking_step', payload: { id: 'r1', title: '匹配动作矩阵', status: 'done', detail: '已命中 5 个非空动作单元格。' } } },
    { delayMs: 800, phase: 'recommending', event: { type: 'actions_ready', payload: hotpotActions } },
    { delayMs: 700, phase: 'recommending', event: { type: 'thinking_step', payload: { id: 'r2', title: '组装特征视角', status: 'running', detail: '组合 3 类人群模块、4 个关键特征和 4 个可执行资产。' } } },
    { delayMs: 1200, phase: 'recommending', event: { type: 'bundle_ready', payload: hotpotBundle } },
    { delayMs: 600, phase: 'recommending', event: { type: 'gap_items', payload: hotpotGaps } },
    { delayMs: 700, phase: 'recommending', event: { type: 'thinking_step', payload: { id: 'r3', title: '生成结果摘要', status: 'done', detail: '输出动作、特征组合与缺口建议。' } } },
    {
      delayMs: 500,
      phase: 'recommending',
      event: {
        type: 'done',
        payload: {
          assets: hotpotBundle.executableAssets.length,
          actions: hotpotActions.length,
          gaps: hotpotGaps.length,
        },
      },
    },
  ],
};
