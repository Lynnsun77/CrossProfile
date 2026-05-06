import { useMemo, useState } from 'react';
import type { MyBadgeMap } from '../../api/my';
import { NavItem } from './NavItem';
import { getStageTheme } from './nav.theme';
import type { NavCollapsible } from './nav.types';

export function CollapsibleItem({
  item,
  activeItemId,
  badges,
}: {
  item: NavCollapsible;
  activeItemId: string | null;
  badges: MyBadgeMap;
}) {
  const activeChild = useMemo(() => item.children.find((child) => child.id === activeItemId) ?? null, [activeItemId, item.children]);
  const [expanded, setExpanded] = useState(Boolean(activeChild));
  const theme = getStageTheme(item.stage);

  const isExpanded = expanded || Boolean(activeChild);
  const isActive = Boolean(activeChild);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={[
          'relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors',
          isActive ? theme.itemActive : `${theme.itemText} ${theme.itemHover}`,
        ].join(' ')}
      >
        <span className={`absolute left-0 top-1.5 h-[calc(100%-12px)] w-1 rounded-r-full ${isActive ? theme.itemBar : 'bg-transparent'}`} />
        <span className="truncate pl-2">{item.label}</span>
        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {isExpanded ? (
        <div className="ml-5 space-y-1 border-l border-border pl-3">
          {item.children.map((child) => (
            <NavItem key={child.id} item={child} active={child.id === activeItemId} badges={badges} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
