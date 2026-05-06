import { useLayoutEffect, useMemo } from 'react';
import { useGlobalState, type BreadcrumbItem } from '../store/globalState';

function signatureOf(items: BreadcrumbItem[]) {
  return items.map((it) => `${it.label}|${it.to ?? ''}`).join('>');
}

/**
 * Register breadcrumb for current page.
 * - Clears breadcrumb on unmount
 * - Clamps to max 3 items (keep the last 3)
 */
export function useBreadcrumb(items: BreadcrumbItem[] | null | undefined) {
  const setBreadcrumb = useGlobalState((s) => s.setBreadcrumb);
  const clearBreadcrumb = useGlobalState((s) => s.clearBreadcrumb);

  const normalized = useMemo(() => (items ?? []).slice(-3), [items]);
  const sig = useMemo(() => signatureOf(normalized), [normalized]);

  useLayoutEffect(() => {
    setBreadcrumb(normalized);
    return () => {
      clearBreadcrumb();
    };
  }, [clearBreadcrumb, setBreadcrumb, sig]);
}
