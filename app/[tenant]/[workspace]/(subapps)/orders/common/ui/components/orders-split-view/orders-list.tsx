'use client';

import React from 'react';
import {MdAdd, MdSearch} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {StatusPill} from '@/ui/components';
import {formatDate} from '@/lib/core/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import {mapAxelorStatus} from '@/subapps/orders/common/utils/status';

type OrdersListProps = {
  orders: any[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate?: () => void;
};

export function OrdersList({
  orders,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
  onCreate,
}: OrdersListProps) {
  return (
    <div className="flex h-full w-full flex-col bg-ink-0 md:w-[380px] md:border-r md:border-ink-100">
      <div className="sticky top-0 z-10 border-b border-ink-100 bg-ink-0 px-5 pb-3 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-[17px] font-bold text-ink-900">
            {i18n.t('Orders')}{' '}
            <span className="font-medium text-ink-400">({orders.length})</span>
          </h2>
          {onCreate ? (
            <button
              type="button"
              onClick={onCreate}
              aria-label={i18n.t('New order')}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-mint-500 text-white transition-colors hover:bg-mint-600">
              <MdAdd className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-[10px] bg-ink-50 px-3 py-2">
          <MdSearch className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={i18n.t('Search by order number')}
            className="w-full bg-transparent text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none"
            aria-label={i18n.t('Search orders')}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-5 pt-2">
        {orders.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-ink-500">
            {i18n.t('No order matches your search.')}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {orders.map(order => {
              const id = String(order.id);
              const isSelected = selectedId === id;
              const status = mapAxelorStatus(order);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelect(id)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={cn(
                      'flex w-full flex-col gap-1.5 rounded-[10px] border p-3.5 text-left transition-colors',
                      isSelected
                        ? 'border-mint-200 bg-mint-50'
                        : 'border-transparent hover:bg-ink-25',
                    )}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-ink-900">
                        {order.saleOrderSeq}
                      </span>
                      <StatusPill status={status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-ink-500">
                        {formatDate(order.createdOn)}
                      </span>
                      <span
                        className="font-bold text-ink-900"
                        style={{
                          fontVariantNumeric: 'tabular-nums',
                          fontFeatureSettings: '"tnum" 1',
                        }}>
                        {order.inTaxTotal}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default OrdersList;
