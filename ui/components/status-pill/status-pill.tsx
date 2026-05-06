import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const pillVariants = cva(
  'inline-flex items-center rounded-full font-medium whitespace-nowrap',
  {
    variants: {
      status: {
        pending: 'bg-status-pending-bg text-status-pending-fg',
        confirmed: 'bg-status-confirmed-bg text-status-confirmed-fg',
        shipped: 'bg-status-shipped-bg text-status-shipped-fg',
        delivered: 'bg-status-delivered-bg text-status-delivered-fg',
        cancelled: 'bg-status-cancelled-bg text-status-cancelled-fg',
      },
      size: {
        sm: 'gap-1.5 px-2 py-[3px] text-[11px]',
        md: 'gap-1.5 pl-2 pr-2.5 py-1 text-xs',
        lg: 'gap-1.5 pl-2.5 pr-3 py-1.5 text-[13px]',
      },
    },
    defaultVariants: {
      status: 'pending',
      size: 'md',
    },
  },
);

const dotClasses: Record<OrderStatus, string> = {
  pending: 'bg-status-pending-dot',
  confirmed: 'bg-status-confirmed-dot',
  shipped: 'bg-status-shipped-dot',
  delivered: 'bg-status-delivered-dot',
  cancelled: 'bg-status-cancelled-dot',
};

const dotSize = {
  sm: 'h-1.5 w-1.5',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

export interface StatusPillProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof pillVariants> {
  status: OrderStatus;
  /** Override the default localized label. */
  label?: string;
}

export function StatusPill({
  status,
  size,
  label,
  className,
  ...rest
}: StatusPillProps) {
  const resolvedSize = size ?? 'md';
  return (
    <span
      className={cn(pillVariants({status, size: resolvedSize}), className)}
      {...rest}>
      <span
        aria-hidden="true"
        className={cn(
          'rounded-full',
          dotClasses[status],
          dotSize[resolvedSize],
        )}
      />
      {label ?? i18n.t(STATUS_LABELS[status])}
    </span>
  );
}

export default StatusPill;
