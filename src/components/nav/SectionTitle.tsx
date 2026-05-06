import type { NavSectionTitle } from './nav.types';

export function SectionTitle({ item }: { item: NavSectionTitle }) {
  return <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-3">{item.label}</div>;
}
