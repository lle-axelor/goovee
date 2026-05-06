// ---- CORE IMPORTS ---- //
import {Skeleton} from '@/ui/components/skeleton';

export function OrderSkeleton() {
  return (
    <div className="font-jakarta -mb-20 min-h-[calc(100vh-128px)] bg-ink-25 md:-mb-0">
      <header
        className="border-b border-ink-100 px-6 pb-10 pt-6 lg:px-8"
        style={{
          background: 'linear-gradient(135deg, #f0fbf5 0%, var(--ink-25) 60%)',
        }}>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-[10px]" />
              <Skeleton className="h-9 w-32 rounded-[10px]" />
              <Skeleton className="h-9 w-32 rounded-[10px]" />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-7 px-6 py-8 lg:grid-cols-[1.5fr_1fr] lg:px-8">
        <div className="flex flex-col gap-7">
          <Skeleton className="h-72 w-full rounded-[14px]" />
          <Skeleton className="h-80 w-full rounded-[14px]" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-48 w-full rounded-[14px]" />
          <Skeleton className="h-44 w-full rounded-[14px]" />
          <Skeleton className="h-36 w-full rounded-[16px]" />
        </div>
      </div>
    </div>
  );
}
