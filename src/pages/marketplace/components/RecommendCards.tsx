import { AssetCard } from '../../../components/common/AssetCard';
import type { Asset, RecommendMeta, Role } from '../../../types';

type RecommendCardsProps = {
  assets: Asset[];
  role: Role;
  sceneLabel: string;
  goalLabel: string;
};

export function RecommendCards({ assets, role, sceneLabel, goalLabel }: RecommendCardsProps) {
  if (assets.length === 0) return null;

  return (
    <section aria-label="AI 推荐卡片区域" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-text-1">AI 推荐</div>
          <div className="text-sm text-text-3">仅在工作台完成后展示，不预留空白占位。</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[1024px]:grid-cols-2 min-[1440px]:grid-cols-3">
        {assets.slice(0, 3).map((asset, index) => {
          const meta: RecommendMeta = {
            sceneSimilarity: Math.max(0.82, 0.94 - index * 0.04),
            goalLift: Math.max(0.08, 0.18 - index * 0.03),
            scene: sceneLabel,
            goal: goalLabel,
          };

          return (
            <div
              key={asset.id}
              className="animate-market-fade-in-up"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <AssetCard asset={asset} role={role} recommendMeta={meta} isAIRecommended />
            </div>
          );
        })}
      </div>
    </section>
  );
}
