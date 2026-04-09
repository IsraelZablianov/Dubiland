import type { ReactNode } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main className="public-layout__content">{children}</main>
      <PublicFooter />

      <style>{`
        .public-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .public-layout__content {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
