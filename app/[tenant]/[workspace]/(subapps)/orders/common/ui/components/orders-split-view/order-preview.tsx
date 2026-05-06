'use client';

import React from 'react';
import Link from 'next/link';
import {MdArrowForward} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {SUBAPP_CODES} from '@/constants';
import {StatusPill, StatusTimeline, Avatar, AvatarImage} from '@/ui/components';
import {formatDate} from '@/lib/core/locale/formatters';
import {getProductImageURL} from '@/utils/files';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {mapAxelorStatus} from '@/subapps/orders/common/utils/status';
import type {OrderType} from '@/subapps/orders/common/types/orders';

const DELIVERY_STATE_LABEL: Record<number, string> = {
  1: 'Not shipped',
  2: 'In preparation',
  3: 'Delivered',
};

type OrderPreviewProps = {
  order: any;
  orderType: OrderType;
};

export function OrderPreview({order, orderType}: OrderPreviewProps) {
  const {workspaceURI, tenant} = useWorkspace();

  const status = mapAxelorStatus(order);
  const lines = order.saleOrderLineList ?? [];
  const deliveryLabel = DELIVERY_STATE_LABEL[order.deliveryState] ?? '—';
  const detailURL = `${workspaceURI}/${SUBAPP_CODES.orders}/${orderType}/${order.id}`;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-ink-25 px-6 py-7 lg:px-8 lg:pb-10">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">
              {i18n.t('Order preview')}
            </span>
            <h1
              className="m-0 text-[24px] font-bold tracking-[-0.02em] text-ink-900"
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum" 1',
              }}>
              {order.saleOrderSeq}
            </h1>
          </div>
          <Link
            href={detailURL}
            className="inline-flex items-center gap-2 rounded-[10px] bg-ink-900 px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-ink-800">
            {i18n.t('Open')}
            <MdArrowForward className="h-3.5 w-3.5" />
          </Link>
        </div>

        <PreviewStatusCard
          status={status}
          createdOn={order.createdOn}
          deliveryLabel={i18n.t(deliveryLabel)}
        />

        <PreviewProductsCard lines={lines} tenant={tenant} />

        <PreviewTotalsCard
          exTaxTotal={order.exTaxTotal}
          inTaxTotal={order.inTaxTotal}
        />
      </div>
    </div>
  );
}

function PreviewStatusCard({
  status,
  createdOn,
  deliveryLabel,
}: {
  status: ReturnType<typeof mapAxelorStatus>;
  createdOn: string;
  deliveryLabel: string;
}) {
  return (
    <section className="rounded-[14px] border border-ink-100 bg-ink-0 p-5">
      <StatusTimeline current={status} compact />
      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-ink-100 pt-5">
        <Field label={i18n.t('Status')}>
          <StatusPill status={status} size="sm" />
        </Field>
        <Field label={i18n.t('Created on')}>
          <span
            className="text-[13px] font-semibold text-ink-900"
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum" 1',
            }}>
            {formatDate(createdOn)}
          </span>
        </Field>
        <Field label={i18n.t('Delivery')}>
          <span className="text-[13px] font-semibold text-ink-900">
            {deliveryLabel}
          </span>
        </Field>
      </div>
    </section>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function PreviewProductsCard({lines, tenant}: {lines: any[]; tenant: string}) {
  return (
    <section className="rounded-[14px] border border-ink-100 bg-ink-0 p-5">
      <h3 className="m-0 mb-3 text-[14px] font-semibold text-ink-900">
        {i18n.t('Products')}
      </h3>
      {lines.length === 0 ? (
        <p className="m-0 text-[13px] text-ink-500">
          {i18n.t('No products on this order.')}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {lines.map((line: any, idx: number) => {
            const isLast = idx === lines.length - 1;
            return (
              <li
                key={line.id ?? idx}
                className={
                  isLast
                    ? 'flex items-center gap-3 pb-0'
                    : 'flex items-center gap-3 border-b border-dashed border-ink-100 pb-3'
                }>
                <Avatar className="h-[38px] w-[38px] rounded-[8px] bg-ink-50">
                  <AvatarImage
                    src={getProductImageURL(
                      line?.product?.picture?.id,
                      tenant,
                      {
                        noimage: true,
                      },
                    )}
                    alt={line.productName}
                    size={38}
                  />
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[13px] font-semibold text-ink-900">
                    {line.productName}
                  </p>
                  <p className="m-0 text-[12px] text-ink-500">
                    {line.qty} {line.unit?.name} · {line.priceDiscounted}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[13px] font-bold text-ink-900"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum" 1',
                  }}>
                  {line.inTaxTotal}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PreviewTotalsCard({
  exTaxTotal,
  inTaxTotal,
}: {
  exTaxTotal: string;
  inTaxTotal: string;
}) {
  return (
    <section className="rounded-[14px] border border-ink-100 bg-ink-0 p-5">
      <div className="flex flex-col gap-2">
        <Row label={i18n.t('Total WT')} value={exTaxTotal} />
        <Row label={i18n.t('VAT')} value={i18n.t('Included')} muted />
        <div className="mt-2 flex items-baseline justify-between border-t border-ink-100 pt-3">
          <span className="text-[14px] font-bold text-ink-900">
            {i18n.t('Total ATI')}
          </span>
          <span
            className="text-[22px] font-bold tracking-[-0.02em] text-ink-900"
            style={{
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum" 1',
            }}>
            {inTaxTotal}
          </span>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-ink-500">{label}</span>
      <span
        className={muted ? 'text-ink-500' : 'font-semibold text-ink-900'}
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum" 1',
        }}>
        {value}
      </span>
    </div>
  );
}

export default OrderPreview;
