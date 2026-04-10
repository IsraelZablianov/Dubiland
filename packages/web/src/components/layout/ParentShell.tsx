import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface ParentShellProps {
  children: ReactNode;
}

export function ParentShell({ children }: ParentShellProps) {
  return (
    <div className="parent-shell">
      <AppHeader />
      <main className="parent-shell__content">{children}</main>

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
