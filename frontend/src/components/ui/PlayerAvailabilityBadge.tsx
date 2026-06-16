'use client';

import { cn } from '@/lib/utils';
import { Badge } from './Badge';
import { getAvailabilityMeta } from '@/lib/playerAvailability';

export function PlayerAvailabilityBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const meta = getAvailabilityMeta(status);
  const Icon = meta.icon;

  return (
    <Badge
      variant={meta.variant}
      className={cn('gap-1 whitespace-nowrap', className)}
      title={meta.tooltip}
    >
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </Badge>
  );
}
