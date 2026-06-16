'use client';

import { cn } from '@/lib/utils';
import { MatchResult } from '@/types';

const formMeta: Record<MatchResult, { label: string; color: string; title: string }> = {
  W: { label: 'W', color: '#22c55e', title: 'Win' },
  L: { label: 'L', color: '#ef4444', title: 'Loss' },
  NR: { label: 'NR', color: '#9ca3af', title: 'No Result' },
};

export function TeamFormIndicator({ form }: { form?: MatchResult[] }) {
  const recentForm = (form || []).slice(0, 5);

  if (recentForm.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Recent Form
        </div>
        <p className="text-sm text-gray-500">No matches played</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Recent Form
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {recentForm.map((result, index) => {
          const meta = formMeta[result];
          return (
            <div key={`${result}-${index}`} className="flex flex-col items-center gap-1">
              <span
                title={meta.title}
                aria-label={meta.title}
                className="inline-flex h-4 w-4 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: meta.color }}
              />
              <span className={cn('text-[11px] font-medium', result === 'W' && 'text-green-600', result === 'L' && 'text-red-600', result === 'NR' && 'text-gray-500')}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
