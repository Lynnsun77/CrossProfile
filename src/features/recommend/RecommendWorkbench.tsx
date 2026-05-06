import { useEffect } from 'react';
import { useScriptPlayer } from './hooks/useScriptPlayer';
import { StageView } from './components/StageView';

export function RecommendWorkbench({
  mode,
}: {
  mode: 'embedded' | 'page';
  /** @deprecated 保留以兼容旧调用方，已无效果：工作台始终展开 */
  defaultExpanded?: boolean;
}) {
  // Side-effect: start playing scripts when step changes.
  const { cancel } = useScriptPlayer('hotpot_demo');

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return (
    <section id="recommend-workbench" tabIndex={-1}>
      <StageView mode={mode} />
    </section>
  );
}
