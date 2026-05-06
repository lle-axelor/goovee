// ---- CORE IMPORTS ---- //
import type {OrderStatus} from '@/ui/components/status-pill';

// ---- LOCAL IMPORTS ---- //
import {
  ORDER_DELIVERY_STATUS,
  ORDER_STATUS,
} from '@/subapps/orders/common/constants/orders';

const SALE_ORDER_CANCELLED = 5;

/**
 * Maps Axelor sale order state to the canonical 5-status model used by
 * StatusPill / StatusTimeline.
 *
 *   statusSelect = 1|2 (draft/finalized) → pending
 *   statusSelect = 3 (confirmed) + deliveryState = 1     → confirmed
 *   statusSelect = 3 (confirmed) + deliveryState = 2     → shipped (in prep)
 *   statusSelect = 3 (confirmed) + deliveryState = 3     → delivered
 *   statusSelect = 4 (closed)                            → delivered
 *   statusSelect = 5 (cancelled)                         → cancelled
 */
export function mapAxelorStatus(order: {
  statusSelect?: number | null;
  deliveryState?: number | null;
}): OrderStatus {
  const status = order?.statusSelect ?? 0;
  const delivery = order?.deliveryState ?? 0;

  if (status === SALE_ORDER_CANCELLED) return 'cancelled';
  if (status === ORDER_STATUS.CLOSED) return 'delivered';
  if (status === ORDER_STATUS.CONFIRMED) {
    if (delivery === ORDER_DELIVERY_STATUS.DELIVERED) return 'delivered';
    if (delivery === 2) return 'shipped';
    return 'confirmed';
  }
  return 'pending';
}
