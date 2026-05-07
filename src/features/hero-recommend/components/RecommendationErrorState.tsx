import { useHeroRecommendStore } from '../store/useHeroRecommendStore';

export function RecommendationErrorState() {
  const retryHero = useHeroRecommendStore((s) => s.retryHero);

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
      <div className="text-base font-medium text-red-700 mb-3">本次推荐生成失败，请稍后重试。</div>
      <button
        type="button"
        onClick={() => retryHero()}
        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm font-medium"
      >
        重新生成
      </button>
    </div>
  );
}
