import * as React from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

import type {OrderStatus} from '@/ui/components/status-pill';

const STEPS: {key: OrderStatus; label: string}[] = [
  {key: 'confirmed', label: 'Confirmed'},
  {key: 'shipped', label: 'Shipped'},
  {key: 'delivered', label: 'Delivered'},
];

const RANK: Record<OrderStatus, number> = {
  pending: 0,
  cancelled: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
};

export interface StatusTimelineProps
  extends React.HTMLAttributes<HTMLDivElement> {
  current: OrderStatus;
  compact?: boolean;
}

export function StatusTimeline({
  current,
  compact = false,
  className,
  ...rest
}: StatusTimelineProps) {
  const currentRank = RANK[current];
  const circle = compact ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]';
  const checkSize = compact ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <div
      className={cn('flex items-center', className)}
      role="list"
      aria-label={i18n.t('Order progress')}
      {...rest}>
      {STEPS.map((step, idx) => {
        const stepRank = idx + 1;
        const reached = currentRank >= stepRank;
        const isCurrent = currentRank === stepRank;
        const isLast = idx === STEPS.length - 1;
        const segmentReached = currentRank > stepRank;

        return (
          <React.Fragment key={step.key}>
            <div
              role="listitem"
              className="flex items-center gap-2"
              aria-current={isCurrent ? 'step' : undefined}>
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
                  circle,
                  reached
                    ? 'bg-mint-500 text-white'
                    : 'bg-ink-100 text-ink-400',
                  isCurrent && 'ring-4 ring-mint-100',
                )}>
                {reached ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={checkSize}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepRank
                )}
              </span>
              <span
                className={cn(
                  'text-[12px] font-medium',
                  reached ? 'text-ink-900' : 'text-ink-500',
                )}>
                {i18n.t(step.label)}
              </span>
            </div>
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-3 h-0.5 flex-1',
                  segmentReached ? 'bg-mint-500' : 'bg-ink-100',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default StatusTimeline;
