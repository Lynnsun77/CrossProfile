import { NavLink } from 'react-router-dom';
import type { MyBadgeMap } from '../../api/my';
import { getStageTheme } from './nav.theme';
import type { NavLeaf } from './nav.types';

function formatBadgeValue(value: number) {
  return value >= 100 ? '99+' : String(value);
}

export function NavItem({
  item,
  active,
  badges,
}: {
  item: NavLeaf;
  active: boolean;
  badges: MyBadgeMap;
}) {
  const theme = getStageTheme(item.stage);
  const badgeValue = item.badgeKey ? badges[item.badgeKey] : 0;
  const showBadge = typeof badgeValue === 'number' && badgeValue > 0;

  return (
    <NavLink
      to={item.to}
      className={[
        'relative flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        active ? theme.itemActive : `${theme.itemText} ${theme.itemHover}`,
      ].join(' ')}
    >
      <span className={`absolute left-0 top-1.5 h-[calc(100%-12px)] w-1 rounded-r-full ${active ? theme.itemBar : 'bg-transparent'}`} />
      <span className="truncate pl-2">{item.label}</span>
      {showBadge ? (
        <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${theme.badge}`}>
          {formatBadgeValue(badgeValue as number)}
        </span>
      ) : null}
    </NavLink>
  );
}
