'use client';

import React from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Avatar, AvatarImage} from '@/ui/components';
import {getProductImageURL} from '@/utils/files';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

type OrderProductsCardsProps = {
  lines: any[];
};

export function OrderProductsCards({lines}: OrderProductsCardsProps) {
  const {tenant} = useWorkspace();
  const taxRate = pickPrimaryTaxRate(lines);

  return (
    <section className="rounded-[14px] border border-ink-100 bg-ink-0 p-6">
      <header className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-[18px] font-bold tracking-[-0.01em] text-ink-900">
          {i18n.t('Products')}
        </h2>
        <span className="text-[13px] text-ink-500">
          {lines.length} {i18n.t(lines.length > 1 ? 'references' : 'reference')}
        </span>
      </header>
      {lines.length === 0 ? (
        <p className="m-0 text-[13px] text-ink-500">
          {i18n.t('No products on this order.')}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {lines.map((line: any, idx: number) => (
            <li
              key={line.id ?? idx}
              className="flex items-center gap-3 rounded-[10px] bg-ink-25 p-3">
              <Avatar className="h-14 w-14 rounded-[12px] bg-mint-50">
                <AvatarImage
                  src={getProductImageURL(line?.product?.picture?.id, tenant, {
                    noimage: true,
                  })}
                  alt={line.productName}
                  size={56}
                />
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[14px] font-bold text-ink-900">
                  {line.productName}
                </p>
                <p className="m-0 text-[12px] text-ink-500">
                  {taxRate
                    ? `${i18n.t('VAT')} ${taxRate}`
                    : i18n.t('Reference')}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span
                  className="text-[13px] text-ink-500"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum" 1',
                  }}>
                  {line.qty} × {line.priceDiscounted}
                </span>
                <span
                  className="text-[16px] font-bold tracking-[-0.01em] text-ink-900"
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum" 1',
                  }}>
                  {line.inTaxTotal}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function pickPrimaryTaxRate(lines: any[]): string | null {
  for (const line of lines) {
    const tax = line?.taxLineSet?.[0];
    if (tax?.value) return `${tax.value}%`;
  }
  return null;
}

export default OrderProductsCards;
