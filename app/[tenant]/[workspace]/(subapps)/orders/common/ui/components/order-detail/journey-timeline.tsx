import * as React from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {formatDate} from '@/lib/core/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import type {OrderStatus} from '@/ui/components';

type JourneyStep = {
  key: 'placed' | 'confirmed' | 'shipped' | 'delivered';
  label: string;
  rank: number;
  date?: string | null;
};

const RANK_FROM_STATUS: Record<OrderStatus, number> = {
  pending: 1,
  cancelled: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
};

type JourneyTimelineProps = {
  current: OrderStatus;
  createdOn?: string | null;
  companyName?: string | null;
};

export function JourneyTimeline({
  current,
  createdOn,
  companyName,
}: JourneyTimelineProps) {
  const currentRank = RANK_FROM_STATUS[current];

  const steps: JourneyStep[] = [
    {
      key: 'placed',
      rank: 1,
      label: i18n.t('Order placed'),
      date: createdOn,
    },
    {
      key: 'confirmed',
      rank: 2,
      label: companyName
        ? `${i18n.t('Confirmed by')} ${companyName}`
        : i18n.t('Confirmed'),
    },
    {
      key: 'shipped',
      rank: 3,
      label: i18n.t('Prepared and shipped'),
    },
    {
      key: 'delivered',
      rank: 4,
      label: i18n.t('Delivered'),
    },
  ];

  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {steps.map((step, idx) => {
        const reached = currentRank >= step.rank;
        const isCurrent = currentRank === step.rank;
        const isLast = idx === steps.length - 1;
        const segmentReached = currentRank > step.rank;

        return (
          <li
            key={step.key}
            className="relative flex gap-4"
            aria-current={isCurrent ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                  reached
                    ? 'bg-mint-500 text-white ring-4 ring-mint-100'
                    : 'border-2 border-ink-150 bg-ink-0 text-ink-400',
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
                    className="h-3.5 w-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.rank
                )}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'my-1 w-0.5 flex-1',
                    segmentReached ? 'bg-mint-500' : 'bg-ink-150',
                  )}
                  style={{minHeight: 28}}
                />
              )}
            </div>
            <div
              className={cn('flex flex-col gap-0.5', isLast ? 'pb-0' : 'pb-6')}>
              <span
                className={cn(
                  'text-[14px] font-semibold',
                  reached ? 'text-ink-900' : 'text-ink-500',
                )}>
                {step.label}
              </span>
              {step.date ? (
                <span
                  className="text-[12px] text-ink-400"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum" 1',
                  }}>
                  {formatDate(step.date)}
                </span>
              ) : (
                <span className="text-[12px] text-ink-400">
                  {reached ? '' : i18n.t('Pending')}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default JourneyTimeline;
