'use client';

import React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {MdArrowBack, MdPrint, MdFileDownload, MdRefresh} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {SUBAPP_CODES} from '@/constants';
import {StatusPill} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import type {OrderStatus} from '@/ui/components';
import type {OrderType} from '@/subapps/orders/common/types/orders';

const HERO_GRADIENT = 'linear-gradient(135deg, #f0fbf5 0%, var(--ink-25) 60%)';

type OrderHeroProps = {
  saleOrderSeq: string;
  status: OrderStatus;
  productsCount: number;
  inTaxTotal: string;
  orderId: string | number;
  orderType: OrderType;
  hasOrderReport: boolean;
};

export function OrderHero({
  saleOrderSeq,
  status,
  productsCount,
  inTaxTotal,
  orderId,
  orderType,
  hasOrderReport,
}: OrderHeroProps) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <header
      className="border-b border-ink-100 px-6 pb-10 pt-6 lg:px-8"
      style={{background: HERO_GRADIENT}}>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
        <button
          type="button"
          onClick={() =>
            router.push(`${workspaceURI}/${SUBAPP_CODES.orders}/${orderType}`)
          }
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-ink-500 transition-colors hover:text-ink-800">
          <MdArrowBack className="h-3.5 w-3.5" />
          {i18n.t('Back')}
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-mint-700">
                {i18n.t('Order')}
              </span>
              <StatusPill status={status} size="md" />
            </div>
            <h1
              className="m-0 text-[36px] font-bold leading-none tracking-[-0.03em] text-ink-900 md:text-[44px]"
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum" 1',
              }}>
              {saleOrderSeq}
            </h1>
            <p
              className="m-0 text-[14px] text-ink-600"
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum" 1',
              }}>
              {productsCount}{' '}
              {i18n.t(productsCount > 1 ? 'products' : 'product')} ·{' '}
              {i18n.t('Total')}{' '}
              <span className="font-bold text-ink-900">{inTaxTotal}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-ink-150 bg-ink-0 px-3.5 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-ink-25">
              <MdPrint className="h-3.5 w-3.5" />
              {i18n.t('Print')}
            </button>
            {hasOrderReport ? (
              <Link
                href={`${workspaceURI}/${SUBAPP_CODES.orders}/api/order/${orderType}/${orderId}/attachment`}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-ink-150 bg-ink-0 px-3.5 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-ink-25">
                <MdFileDownload className="h-3.5 w-3.5" />
                {i18n.t('Invoice PDF')}
              </Link>
            ) : null}
            <Link
              href={`${workspaceURI}/${SUBAPP_CODES.shop}`}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-ink-900 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-ink-800">
              <MdRefresh className="h-3.5 w-3.5" />
              {i18n.t('Reorder')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default OrderHero;
