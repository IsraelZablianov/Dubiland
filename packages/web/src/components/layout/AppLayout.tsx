import type { ReactNode } from 'react';
import { ChildPlayShell } from './ChildPlayShell';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return <ChildPlayShell>{children}</ChildPlayShell>;
}
