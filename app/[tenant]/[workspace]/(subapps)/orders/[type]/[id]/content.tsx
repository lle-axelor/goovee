'use client';

import React from 'react';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {
  OrderHero,
  JourneyTimeline,
  OrderProductsCards,
  OrderTotalsCard,
  OrderAddressesCard,
  SupportCtaCard,
} from '@/subapps/orders/common/ui/components';
import {mapAxelorStatus} from '@/subapps/orders/common/utils/status';
import {OrderType} from '@/subapps/orders/common/types/orders';

const Content = ({order, orderType}: {order: any; orderType: OrderType}) => {
  const {workspaceURI} = useWorkspace();

  const {
    saleOrderSeq,
    exTaxTotal,
    inTaxTotal,
    createdOn,
    statusSelect,
    deliveryState,
    mainInvoicingAddress,
    deliveryAddress,
    saleOrderLineList = [],
    id,
    orderReport,
    company,
    clientPartner,
  } = order;

  const status = mapAxelorStatus({statusSelect, deliveryState});
  const taxRate = pickPrimaryTaxRate(saleOrderLineList);
  const supportURL = `${workspaceURI}/${SUBAPP_CODES.ticketing}`;

  return (
    <div className="font-jakarta bg-ink-25">
      <OrderHero
        saleOrderSeq={saleOrderSeq}
        status={status}
        productsCount={saleOrderLineList.length}
        inTaxTotal={inTaxTotal}
        orderId={id}
        orderType={orderType}
        hasOrderReport={Boolean(orderReport)}
      />

      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-7 px-6 py-8 lg:grid-cols-[1.5fr_1fr] lg:px-8">
        <div className="flex flex-col gap-7">
          <section className="rounded-[14px] border border-ink-100 bg-ink-0 p-6">
            <header className="mb-5 flex flex-col gap-1">
              <h2 className="m-0 text-[18px] font-bold tracking-[-0.01em] text-ink-900">
                {i18n.t('Tracking')}
              </h2>
              <p className="m-0 text-[13px] text-ink-500">
                {i18n.t('Steps of your order')}
              </p>
            </header>
            <JourneyTimeline
              current={status}
              createdOn={createdOn}
              companyName={company?.name}
            />
          </section>

          <OrderProductsCards lines={saleOrderLineList} />
        </div>

        <div className="flex flex-col gap-5">
          <OrderTotalsCard
            exTaxTotal={exTaxTotal}
            inTaxTotal={inTaxTotal}
            taxLabel={taxRate ?? undefined}
          />
          <OrderAddressesCard
            invoicingAddress={mainInvoicingAddress}
            deliveryAddress={deliveryAddress}
            partnerName={clientPartner?.fullName}
          />
          <SupportCtaCard contactURL={supportURL} companyName={company?.name} />
        </div>
      </div>
    </div>
  );
};

function pickPrimaryTaxRate(lines: any[]): string | null {
  for (const line of lines) {
    const tax = line?.taxLineSet?.[0];
    if (tax?.value) return `${tax.value}%`;
  }
  return null;
}

export default Content;
