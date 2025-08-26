// ---- CORE IMPORTS ---- //
import {type Tenant} from '@/tenant';
import {
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_PAGE,
  ORDER_BY,
} from '@/constants';
import {getPageInfo, getSkipInfo} from '@/utils';
import type {ID, PortalWorkspace} from '@/types';
import {manager} from '@/tenant';
import {formatDate, formatNumber} from '@/locale/server/formatters';
import {and} from '@/utils/orm';

// ---- LOCAL IMPORTS ---- //
import {QUOTATION_STATUS} from '@/subapps/quotations/common/constants/quotations';

export const fetchQuotations = async ({
  params = {},
  tenantId,
  workspaceURL,
}: {
  archived?: boolean;
  params?: {
    where?: object & {
      clientPartner?: {
        id: ID;
      };
    };
    limit?: string | number;
    page?: string | number;
  };
  tenantId: Tenant['id'];
  workspaceURL: PortalWorkspace['url'];
}) => {
  const {page = DEFAULT_PAGE, limit, where = {}} = params;
  const {id: clientPartnerId} = where.clientPartner || {};

  if (!(clientPartnerId && tenantId && workspaceURL))
    return {quotations: [], pageInfo: {}};

  const client = await manager.getClient(tenantId);
  const skip = getSkipInfo(limit, page);

  const whereClause: any = and<any>([
    where,
    {
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

  const quotations = await client.aOSOrder
    .find({
      where: whereClause,
      take: limit as any,
      ...(skip ? {skip} : {}),
      orderBy: {createdOn: ORDER_BY.DESC} as any,
      select: {
        saleOrderSeq: true,
        statusSelect: true,
        deliveryState: true,
        createdOn: true,
        externalReference: true,
      },
    })
    .catch((err: any) => {
      return [];
    });

  const pageInfo = getPageInfo({
    count: quotations?.[0]?._count,
    page,
    limit,
  });

  const $quotations: any = [];

  for (const quotation of quotations) {
    const $quotation = {
      ...quotation,
      createdOn: await formatDate(quotation?.createdOn!),
    };
    $quotations.push($quotation);
  }

  return {
    quotations: $quotations,
    pageInfo,
  };
};
