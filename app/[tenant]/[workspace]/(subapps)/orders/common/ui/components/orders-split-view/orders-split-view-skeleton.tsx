import * as React from 'react';

// ---- CORE IMPORTS ---- //
import {Skeleton} from '@/ui/components';

const VIEW_HEIGHT = 'h-[calc(100dvh-260px)] min-h-[560px]';

export function OrdersSplitViewSkeleton() {
  return (
    <div
      className={`flex ${VIEW_HEIGHT} overflow-hidden rounded-[14px] border border-ink-100 bg-ink-0`}>
      <div className="hidden h-full w-[380px] shrink-0 flex-col border-r border-ink-100 bg-ink-0 md:flex">
        <div className="border-b border-ink-100 px-5 pb-3 pt-5">
          <Skeleton className="mb-3 h-6 w-32" />
          <Skeleton className="h-9 w-full rounded-[10px]" />
        </div>
        <div className="flex flex-col gap-1 p-2">
          {Array.from({length: 6}).map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-[10px]" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 bg-ink-25 px-8 py-7">
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-7 w-44" />
            </div>
            <Skeleton className="h-9 w-24 rounded-[10px]" />
          </div>
          <Skeleton className="h-40 w-full rounded-[14px]" />
          <Skeleton className="h-48 w-full rounded-[14px]" />
          <Skeleton className="h-32 w-full rounded-[14px]" />
        </div>
      </div>
    </div>
  );
}

export default OrdersSplitViewSkeleton;
