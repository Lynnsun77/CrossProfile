import { useEffect, useState } from 'react';
import {
  getCachedMyBadges,
  getMyBadgesApi,
  invalidateMyBadgesCache,
  isMyBadgesCacheExpired,
  MY_BADGES_REFRESH_EVENT,
  type MyBadgeMap,
  type MyBadgeRole,
} from '../../api/my';

export function useMyBadges(role: MyBadgeRole) {
  const [badges, setBadges] = useState<MyBadgeMap>(() => getCachedMyBadges(role)?.badges ?? {});

  useEffect(() => {
    const cached = getCachedMyBadges(role);
    if (cached) {
      setBadges(cached.badges);
    }

    void getMyBadgesApi(role, { force: isMyBadgesCacheExpired(role) }).then((result) => {
      setBadges(result.badges);
    });
  }, [role]);

  useEffect(() => {
    const onRefresh = (event: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as { role?: MyBadgeRole } | undefined) : undefined;
      if (detail?.role && detail.role !== role) return;
      invalidateMyBadgesCache(detail?.role);
      void getMyBadgesApi(role, { force: true }).then((result) => {
        setBadges(result.badges);
      });
    };

    window.addEventListener(MY_BADGES_REFRESH_EVENT, onRefresh as EventListener);
    return () => window.removeEventListener(MY_BADGES_REFRESH_EVENT, onRefresh as EventListener);
  }, [role]);

  return badges;
}
