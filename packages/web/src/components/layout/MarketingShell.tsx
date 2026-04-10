import type { ReactNode } from 'react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

interface MarketingShellProps {
  children: ReactNode;
}

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="marketing-shell">
      <PublicHeader />
      <main className="marketing-shell__content">{children}</main>
      <PublicFooter />

      <style>{`
        .marketing-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .marketing-shell__content {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
