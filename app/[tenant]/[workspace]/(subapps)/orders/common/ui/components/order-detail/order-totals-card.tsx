import * as React from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

type OrderTotalsCardProps = {
  exTaxTotal: string;
  inTaxTotal: string;
  taxLabel?: string;
};

export function OrderTotalsCard({
  exTaxTotal,
  inTaxTotal,
  taxLabel,
}: OrderTotalsCardProps) {
  return (
    <section className="rounded-[14px] border border-ink-100 bg-ink-0 p-5">
      <h3 className="m-0 mb-3 text-[14px] font-semibold uppercase tracking-[0.04em] text-ink-500">
        {i18n.t('Total')}
      </h3>
      <div className="flex flex-col gap-2.5">
        <Row label={i18n.t('Total WT')} value={exTaxTotal} />
        <Row
          label={taxLabel ? `${i18n.t('VAT')} (${taxLabel})` : i18n.t('VAT')}
          value={i18n.t('Included')}
          muted
        />
        <Row label={i18n.t('Shipping')} value={i18n.t('Included')} muted />
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-4">
        <span className="text-[14px] font-bold text-ink-900">
          {i18n.t('Total ATI')}
        </span>
        <span
          className="text-[26px] font-bold tracking-[-0.02em] text-ink-900"
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"tnum" 1',
          }}>
          {inTaxTotal}
        </span>
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

export default OrderTotalsCard;
