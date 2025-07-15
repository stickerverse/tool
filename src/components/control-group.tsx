
import type { ReactNode } from 'react';
import { Separator } from './ui/separator';

export function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 pt-6 first:pt-0">
      <div className="space-y-1">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <Separator />
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
