'use client';

import React from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {OrdersList} from './orders-list';
import {OrderPreview} from './order-preview';
import type {OrderType} from '@/subapps/orders/common/types/orders';

// Available height = viewport - (header ~64) - (NavView tabs+gap ~80)
// - (footer on lg ~40) - (mobile bottom menu ~80, scoped via -mb-20)
// - (page padding ~32). dvh handles mobile browser UI shrink.
const VIEW_HEIGHT = 'h-[calc(100dvh-260px)] min-h-[560px]';

type OrdersSplitViewProps = {
  orders: any[];
  orderType: OrderType;
  selectedOrder: any | null;
  selectedId: string | null;
};

export function OrdersSplitView({
  orders,
  orderType,
  selectedOrder,
  selectedId,
}: OrdersSplitViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [activePane, setActivePane] = React.useState<'list' | 'preview'>(
    'list',
  );

  const filteredOrders = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o: any) =>
      String(o.saleOrderSeq ?? '')
        .toLowerCase()
        .includes(q),
    );
  }, [orders, searchQuery]);

  const handleSelect = React.useCallback(
    (id: string) => {
      const sp = new URLSearchParams(searchParams?.toString() ?? '');
      sp.set('selectedId', id);
      router.replace(`${pathname}?${sp.toString()}`, {scroll: false});
      setActivePane('preview');
    },
    [pathname, router, searchParams],
  );

  if (orders.length === 0) {
    return (
      <div
        className={`flex ${VIEW_HEIGHT} items-center justify-center rounded-[14px] border border-ink-100 bg-ink-0`}>
        <p className="text-[14px] text-ink-500">{i18n.t('No orders yet.')}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex ${VIEW_HEIGHT} overflow-hidden rounded-[14px] border border-ink-100 bg-ink-0`}>
      <div
        className={`${activePane === 'list' ? 'flex' : 'hidden'} h-full w-full md:flex md:w-auto md:shrink-0`}>
        <OrdersList
          orders={filteredOrders}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={handleSelect}
        />
      </div>

      <div
        className={`${activePane === 'preview' ? 'flex' : 'hidden'} h-full w-full md:flex md:flex-1`}>
        {selectedOrder ? (
          <div className="flex h-full w-full flex-col">
            <button
              type="button"
              onClick={() => setActivePane('list')}
              className="border-b border-ink-100 bg-ink-0 px-5 py-3 text-left text-[13px] text-ink-500 md:hidden">
              ← {i18n.t('Back to list')}
            </button>
            <OrderPreview order={selectedOrder} orderType={orderType} />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink-25">
            <p className="text-[13px] text-ink-500">
              {i18n.t('Select an order to preview it.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersSplitView;
