import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavRecentVisit } from './nav.types';

const STORAGE_KEY = 'cp_recent_visits_v1';
const RECENT_VISITS_EVENT = 'cp:recent-visits';
const MAX_RECENT_VISITS = 3;

type RecentVisitMap = Record<string, NavRecentVisit[]>;

function isBrowser() {
  return typeof window !== 'undefined';
}

function readVisitMap(): RecentVisitMap {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RecentVisitMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeVisitMap(next: RecentVisitMap) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

function emitRecentVisits(bucket: string) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(RECENT_VISITS_EVENT, { detail: { bucket } }));
}

function normalizeVisit(entry: Omit<NavRecentVisit, 'visitedAt'> & { visitedAt?: number }): NavRecentVisit {
  return {
    ...entry,
    visitedAt: entry.visitedAt ?? Date.now(),
  };
}

export function getRecentVisits(bucket: string) {
  return readVisitMap()[bucket] ?? [];
}

export function recordVisit(bucket: string, entry: Omit<NavRecentVisit, 'visitedAt'> & { visitedAt?: number }) {
  const nextEntry = normalizeVisit(entry);
  const visitMap = readVisitMap();
  const current = visitMap[bucket] ?? [];
  const deduped = current.filter((item) => item.id !== nextEntry.id && item.to !== nextEntry.to);
  visitMap[bucket] = [nextEntry, ...deduped].slice(0, MAX_RECENT_VISITS);
  writeVisitMap(visitMap);
  emitRecentVisits(bucket);
  return visitMap[bucket];
}

export function useRecentVisits(bucket: string) {
  const [visits, setVisits] = useState<NavRecentVisit[]>(() => getRecentVisits(bucket));

  useEffect(() => {
    setVisits(getRecentVisits(bucket));

    const handleRefresh = (event: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as { bucket?: string } | undefined) : undefined;
      if (detail?.bucket && detail.bucket !== bucket) return;
      setVisits(getRecentVisits(bucket));
    };

    window.addEventListener(RECENT_VISITS_EVENT, handleRefresh as EventListener);
    return () => window.removeEventListener(RECENT_VISITS_EVENT, handleRefresh as EventListener);
  }, [bucket]);

  const record = useCallback(
    (entry: Omit<NavRecentVisit, 'visitedAt'> & { visitedAt?: number }) => {
      const nextVisits = recordVisit(bucket, entry);
      setVisits(nextVisits);
      return nextVisits;
    },
    [bucket],
  );

  return useMemo(
    () => ({
      visits,
      recordVisit: record,
    }),
    [record, visits],
  );
}
