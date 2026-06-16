import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { PlayerAvailabilityStatus } from '@/types';

export const PLAYER_AVAILABILITY_STATUSES: PlayerAvailabilityStatus[] = [
  'AVAILABLE',
  'PENDING',
  'INJURED',
  'SUSPENDED',
  'UNAVAILABLE',
];

const BLOCKED_SELECTION_STATUSES: PlayerAvailabilityStatus[] = ['INJURED', 'SUSPENDED', 'UNAVAILABLE'];

const availabilityMeta: Record<
  PlayerAvailabilityStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info'; icon: LucideIcon; tooltip: string }
> = {
  AVAILABLE: {
    label: 'Available',
    variant: 'success',
    icon: CheckCircle2,
    tooltip: 'Available for team and match selection',
  },
  PENDING: {
    label: 'Pending',
    variant: 'warning',
    icon: Clock3,
    tooltip: 'Pending review or final confirmation',
  },
  INJURED: {
    label: 'Injured',
    variant: 'danger',
    icon: AlertTriangle,
    tooltip: 'Injured players cannot be selected',
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'neutral',
    icon: Ban,
    tooltip: 'Suspended players cannot be selected',
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    variant: 'info',
    icon: UserX,
    tooltip: 'Unavailable players cannot be selected',
  },
};

export const normalizeAvailabilityStatus = (status?: string | null): PlayerAvailabilityStatus =>
  PLAYER_AVAILABILITY_STATUSES.includes(status?.trim().toUpperCase() as PlayerAvailabilityStatus)
    ? (status!.trim().toUpperCase() as PlayerAvailabilityStatus)
    : 'AVAILABLE';

export const getAvailabilityMeta = (status?: string | null) =>
  availabilityMeta[normalizeAvailabilityStatus(status)];

export const isBlockedAvailabilityStatus = (status?: string | null) =>
  BLOCKED_SELECTION_STATUSES.includes(normalizeAvailabilityStatus(status));
