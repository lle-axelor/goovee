import * as React from 'react';
import {MdReceiptLong, MdLocalShipping} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

type Address = {
  zip?: string | null;
  addressl4?: string | null;
  addressl6?: string | null;
  country?: {name?: string | null} | null;
} | null;

type OrderAddressesCardProps = {
  invoicingAddress: Address;
  deliveryAddress: Address;
  partnerName?: string | null;
};

export function OrderAddressesCard({
  invoicingAddress,
  deliveryAddress,
  partnerName,
}: OrderAddressesCardProps) {
  return (
    <section className="rounded-[14px] border border-ink-100 bg-ink-0 p-5">
      <h3 className="m-0 mb-4 text-[14px] font-semibold uppercase tracking-[0.04em] text-ink-500">
        {i18n.t('Addresses')}
      </h3>
      <div className="flex flex-col gap-4">
        <AddressBlock
          icon={<MdReceiptLong className="h-3.5 w-3.5" />}
          title={i18n.t('Billing')}
          address={invoicingAddress}
          partnerName={partnerName}
        />
        <AddressBlock
          icon={<MdLocalShipping className="h-3.5 w-3.5" />}
          title={i18n.t('Delivery')}
          address={deliveryAddress}
          partnerName={partnerName}
        />
      </div>
    </section>
  );
}

function AddressBlock({
  icon,
  title,
  address,
  partnerName,
}: {
  icon: React.ReactNode;
  title: string;
  address: Address;
  partnerName?: string | null;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[6px] bg-mint-50 text-mint-600">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-500">
          {title}
        </span>
        {address ? (
          <address className="not-italic text-[13px] leading-[1.5] text-ink-800">
            {partnerName ? (
              <span className="block font-bold text-ink-900">
                {partnerName}
              </span>
            ) : null}
            {address.addressl4 ? (
              <span className="block">{address.addressl4}</span>
            ) : null}
            {address.addressl6 ? (
              <span className="block">{address.addressl6}</span>
            ) : null}
            {address.country?.name ? (
              <span className="block text-ink-500">{address.country.name}</span>
            ) : null}
          </address>
        ) : (
          <span className="text-[13px] text-ink-500">
            {i18n.t('No address provided.')}
          </span>
        )}
      </div>
    </div>
  );
}

export default OrderAddressesCard;
