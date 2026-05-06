import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {findWorkspace, findSubapp} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {DEFAULT_LIMIT, SUBAPP_CODES} from '@/constants';
import {manager} from '@/tenant';
import {clone} from '@/utils';
import {PartnerKey, User} from '@/types';
import {getWhereClauseForEntity} from '@/utils/filters';

// ---- LOCAL IMPORTS ---- //
import Content from '@/subapps/orders/[type]/content';
import {findOrder, findOrders} from '@/subapps/orders/common/orm/orders';
import {ORDER} from '@/subapps/orders/common/constants/orders';
import {OrderType} from '@/subapps/orders/common/types/orders';
import {OrdersSplitViewSkeleton} from '@/subapps/orders/common/ui/components';

async function Orders({
  params,
  searchParams,
}: {
  params: {type: OrderType; tenant: string; workspace: string};
  searchParams: {[key: string]: string | undefined};
}) {
  const {type, tenant: tenantId} = params;

  const {limit, page, selectedId} = searchParams;

  const session = await getSession();
  const user = session?.user as User;

  if (!user) {
    return notFound();
  }

  const {workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  const app = await findSubapp({
    code: SUBAPP_CODES.orders,
    url: workspace.url,
    user: session?.user,
    client,
  });

  if (!app?.isInstalled) {
    return notFound();
  }

  const {role, isContactAdmin} = app;

  const where = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const invoicesWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.PARTNER,
  });

  const isCompleted = type === ORDER.COMPLETED ? true : false;

  const result = await findOrders({
    isCompleted,
    params: {
      where,
      page,
      limit: limit ? Number(limit) : DEFAULT_LIMIT,
    },
    client,
    workspaceURL,
  });

  if (!result) {
    return notFound();
  }

  const {orders, pageInfo} = result;

  const resolvedSelectedId =
    (selectedId && orders.some((o: any) => String(o.id) === selectedId)
      ? selectedId
      : orders[0]?.id && String(orders[0].id)) ?? null;

  const selectedOrder = resolvedSelectedId
    ? await findOrder({
        id: resolvedSelectedId,
        client,
        params: {where},
        workspaceURL,
        isCompleted,
        invoicesParams: {where: invoicesWhereClause},
      })
    : null;

  return (
    <Content
      orders={clone(orders)}
      pageInfo={pageInfo}
      orderType={type}
      selectedOrder={selectedOrder ? clone(selectedOrder) : null}
      selectedId={resolvedSelectedId}
    />
  );
}

export default async function Page(props: {
  params: Promise<{type: OrderType; tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <Suspense fallback={<OrdersSplitViewSkeleton />}>
      <Orders params={params} searchParams={searchParams} />
    </Suspense>
  );
}
