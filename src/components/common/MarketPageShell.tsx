import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';

type MarketPageShellProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
};

export function MarketPageShell({ title, subtitle, action, banner, children }: MarketPageShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader title={title} subtitle={subtitle} moduleTone="market" action={action} />
        {banner}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
