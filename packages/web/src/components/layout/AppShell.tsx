import type { ReactNode } from 'react';
import { DevClientDiagnosticsStrip } from '@/components/DevClientDiagnosticsStrip';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const devPad = import.meta.env.DEV ? 'min(30vh, 140px)' : undefined;

  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="app-shell__content" style={{ paddingBlockEnd: devPad }}>
        {children}
      </main>
      <PublicFooter />
      <DevClientDiagnosticsStrip />

      <style>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-theme-bg);
        }

        .app-shell__content {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
