// ---- CORE IMPORTS ---- //
import {type Tenant} from '@/tenant';
import {
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
} from '@/constants';
import type {PortalWorkspace} from '@/types';
import {manager} from '@/tenant';
import {formatDate, formatNumber} from '@/locale/server/formatters';
import {and} from '@/utils/orm';

// ---- LOCAL IMPORTS ---- //
import {QUOTATION_STATUS} from '@/subapps/quotations/common/constants/quotations';

export async function findQuotation({
  id,
  tenantId,
  params,
  workspaceURL,
}: {
  id: any;
  tenantId: Tenant['id'];
  params?: any;
  workspaceURL: PortalWorkspace['url'];
}) {
  if (!(tenantId && workspaceURL)) return null;

  const client = await manager.getClient(tenantId);

  const whereClause: any = and<any>([
    params?.where,
    {
      id,
      template: false,
      portalWorkspace: {
        url: workspaceURL,
      },
    },
    {OR: [{archived: false}, {archived: null}]},
    {
      OR: [
        {statusSelect: {lt: QUOTATION_STATUS.CONFIRMED}},
        {statusSelect: {eq: QUOTATION_STATUS.CANCELED_QUOTATION}},
      ],
    },
  ]);

  const quotation: any = await client.aOSOrder.findOne({
    where: whereClause,
    select: {
      saleOrderSeq: true,
      endOfValidityDate: true,
      exTaxTotal: true,
      statusSelect: true,
      inTaxTotal: true,
      mainInvoicingAddress: {
        zip: true,
        addressl4: true,
        addressl6: true,
        country: {
          name: true,
        },
        fullName: true,
        formattedFullName: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
      clientPartner: {
        fullName: true,
      },
      company: {
        name: true,
      },
      deliveryAddress: {
        zip: true,
        addressl4: true,
        addressl6: true,
        country: {
          name: true,
        },
        fullName: true,
        formattedFullName: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
      saleOrderLineList: {
        select: {
          productName: true,
          qty: true,
          unit: {
            name: true,
          },
          priceDiscounted: true,
          exTaxTotal: true,
          taxLineSet: {
            select: {name: true, value: true},
          },
          discountAmount: true,
          inTaxTotal: true,
          product: {
            picture: {
              id: true,
            },
          },
        },
      },
      currency: {
        code: true,
        numberOfDecimals: true,
        symbol: true,
      },
    },
  });

  if (!quotation) {
    return null;
  }

  const {currency, saleOrderLineList, exTaxTotal, inTaxTotal} = quotation;
  const currencySymbol = currency.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = currency.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

  const totalDiscountAmount = saleOrderLineList.reduce(
    (total: number, {exTaxTotal, discountAmount}: any) => {
      const exTax = parseFloat(exTaxTotal);
      const discountPercent = parseFloat(discountAmount);
      const discountValue = (exTax * discountPercent) / 100;
      return total + discountValue;
    },
    0,
  );

  const totalExTax = saleOrderLineList.reduce(
    (total: number, {exTaxTotal}: any) => {
      return total + parseFloat(exTaxTotal);
    },
    0,
  );

  const totalDiscountPercent =
    totalExTax === 0
      ? 0
      : ((totalDiscountAmount / totalExTax) * 100).toFixed(scale);
  const $saleOrderLineList: any = [];

  for (const list of saleOrderLineList || []) {
    const line = {
      ...list,
      qty: await formatNumber(list.qty, {scale, type: 'DECIMAL'}),
      priceDiscounted: await formatNumber(list.priceDiscounted, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      exTaxTotal: await formatNumber(list.exTaxTotal, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
      discountAmount: await formatNumber(list.discountAmount, {
        scale,
        type: 'DECIMAL',
      }),
      inTaxTotal: await formatNumber(list.inTaxTotal, {
        scale,
        currency: currencySymbol,
        type: 'DECIMAL',
      }),
    };
    $saleOrderLineList.push(line);
  }

  return {
    ...quotation,
    endOfValidityDate: await formatDate(quotation?.endOfValidityDate),
    displayExTaxTotal: await formatNumber(exTaxTotal, {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    displayInTaxTotal: await formatNumber(inTaxTotal, {
      scale,
      currency: currencySymbol,
      type: 'DECIMAL',
    }),
    saleOrderLineList: $saleOrderLineList,
    totalDiscount: totalDiscountPercent,
  };
}
