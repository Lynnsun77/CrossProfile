import { useEffect, useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { MarketPageShell } from '../../../components/common/MarketPageShell';
import { useBreadcrumb } from '../../../hooks/useBreadcrumb';
import { DEFAULT_DOC_URL } from '../scripts/lark-merchant-insight.script';

/**
 * 智能推荐入口已合并到 `/marketplace?view=consumer` 首页工作台。
 * 此页保留作为兼容容器：读取 `?doc=<lark-url>` 参数后直接重定向到首页，
 * 并透传 doc 参数，令首页 DocInputBar / RecommendChainPanel / RecommendGroupSection
 * 在首页纵向撑开呈现完整交互。
 */
export function RecommendPage() {
  const [sp] = useSearchParams();
  const docFromQuery = sp.get('doc') || DEFAULT_DOC_URL;
  const breadcrumb = useMemo(() => [{ label: '智能推荐', to: '/marketplace' }, { label: '智能推荐' }], []);

  useBreadcrumb(breadcrumb);

  useEffect(() => {
    // 无副作用，仅保留 breadcrumb；真实跳转由下方 <Navigate /> 完成。
  }, []);

  const target = `/marketplace?view=consumer&doc=${encodeURIComponent(docFromQuery)}`;

  return (
    <MarketPageShell title="智能推荐" subtitle="智能推荐已整合到首页工作台，正在为你打开…">
      <Navigate to={target} replace />
    </MarketPageShell>
  );
}

export default RecommendPage;
