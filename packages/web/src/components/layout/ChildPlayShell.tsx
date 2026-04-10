import type { ReactNode } from 'react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

interface ChildPlayShellProps {
  children: ReactNode;
}

export function ChildPlayShell({ children }: ChildPlayShellProps) {
  return (
    <div className="child-play-shell">
      <PublicHeader />
      <main className="child-play-shell__content">{children}</main>
      <PublicFooter />

      <style>{`
        .child-play-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-theme-bg);
        }

        .child-play-shell__content {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
