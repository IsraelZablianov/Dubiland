import type { ReactNode } from 'react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

interface ParentShellProps {
  children: ReactNode;
}

export function ParentShell({ children }: ParentShellProps) {
  return (
    <div className="parent-shell">
      <PublicHeader />
      <main className="parent-shell__content">{children}</main>
      <PublicFooter />

      <style>{`
        .parent-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-theme-bg);
        }

        .parent-shell__content {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
