export type RecommendGroupKey = 'ready' | 'adaptable';

export type RecommendationDetailSource = 'hero' | 'platform';

export type PlatformRecommendationTabKey = 'owned_tags' | 'recent_hot';

export type ObjectType = '策略' | '人群' | '标签';

export type MatchLabel = '高匹配' | '中匹配';

export interface TagItem {
  id: string;
  label: string;
  phrase: string;
}

export interface MockTags {
  goals: TagItem[];
  scenes: TagItem[];
  examples: string[];
}

export interface CardMetric {
  label: string;
  value: string;
}

export interface RecommendationCard {
  id: string;
  group: RecommendGroupKey;
  name: string;
  objectType: ObjectType;
  matchScore: number;
  matchLabel: MatchLabel;
  oneLineReason: string;
  hitTags: string[];
  metrics: CardMetric[];
  goals: string[];
  scenes: string[];
  preferenceTags: string[];
  reasons: string[];
}

export interface GroupedRecommendations {
  ready: RecommendationCard[];
  adaptable: RecommendationCard[];
  fallback: {
    show: boolean;
    reason?: string;
  };
}

export type DeployStatus = 'draft' | 'submitted';

export type DetailAnchor = 'top' | 'reason' | 'lineage';

export interface PlatformDetailContext {
  grouped: GroupedRecommendations | null;
  tabKey: PlatformRecommendationTabKey | null;
  tabLabel: string | null;
}

export interface HeroDeployConfig {
  open: boolean;
  cardId: string | null;
  downstream: string | null;
  libraUrl: string;
  status: DeployStatus;
  error: string | null;
}

export interface ParseIntentInput {
  text?: string;
  goalIds?: string[];
  sceneIds?: string[];
}

export interface IntentParsedResult {
  target: string;
  scene: string;
  objectType: string;
  preference: string;
  goalIds: string[];
  sceneIds: string[];
  rawText: string;
}

export interface MockTemplates {
  summary: string;
  summaryTail: string;
  emptySummary: string;
  intentFallback: {
    target: string;
    scene: string;
    objectType: string;
    preference: string;
  };
  reasonTemplates: string[];
}

export type AnalysisPhase = 'idle' | 'analyzing' | 'ready' | 'empty' | 'error';
