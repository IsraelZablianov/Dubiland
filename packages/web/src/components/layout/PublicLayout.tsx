import type { ReactNode } from 'react';
import { MarketingShell } from './MarketingShell';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return <MarketingShell>{children}</MarketingShell>;
}
