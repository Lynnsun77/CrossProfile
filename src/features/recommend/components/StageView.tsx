import { useRecommendStore } from '../hooks/useRecommendStore';
import { StageResult } from './StageResult';
import { Step0Entry } from './Step0Entry';

export function StageView({ mode }: { mode: 'embedded' | 'page' }) {
  const step = useRecommendStore((s) => s.step);

  if (step === 'entry') {
    return <Step0Entry variant={mode === 'page' ? 'page' : 'embedded'} />;
  }

  return <StageResult />;
}
