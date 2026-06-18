import {Suspense} from 'react';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/tenant';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {CheckoutSkeleton} from '@/subapps/shop/common/ui/components';
import type {ShopCheckoutLabels} from '@/subapps/shop/common/ui/components';

async function Checkout({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client, config} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace?.config?.confirmOrder) {
    redirect(`${workspaceURI}/shop/cart`);
  }

  const [orderSubapp, hidePriceAndPurchase, labels] = await Promise.all([
    findSubappAccess({
      code: SUBAPP_CODES.orders,
      user,
      url: workspaceURL,
      client,
    }),
    shouldHidePricesAndPurchase({user, workspace, client}),
    buildLabels(),
  ]);

  if (hidePriceAndPurchase) notFound();

  return (
    <Content
      workspace={workspace}
      orderSubapp={orderSubapp}
      tenant={tenantId}
      labels={labels}
    />
  );
}

async function buildLabels(): Promise<ShopCheckoutLabels> {
  const [
    backToCart,
    step1,
    step2,
    step3,
    pageTitle,
    addressCardTitle,
    addressDefaultBadge,
    addressNewAction,
    addressNoneTitle,
    addressLoading,
    shippingCardTitle,
    shippingRegular,
    shippingRegularSubtitle,
    shippingFast,
    shippingFastSubtitle,
    paymentCardTitle,
    summaryTitle,
    qtyPrefix,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    totalLabel,
    secureNotice,
    emptyCartTitle,
    loading,
  ] = await Promise.all([
    t('Back to cart'),
    t('1. Cart'),
    t('2. Shipping & payment'),
    t('3. Confirmation'),
    t('Finalise your order'),
    t('Delivery address'),
    t('Default'),
    t('New address'),
    t('No address on file — add one in your profile first.'),
    t('Loading addresses'),
    t('Shipping method'),
    t('Regular shipping'),
    t('5–10 business days'),
    t('Express shipping'),
    t('2–3 business days'),
    t('Payment'),
    t('Your order'),
    t('Qty'),
    t('Subtotal (excl. tax)'),
    t('VAT (20%)'),
    t('Shipping'),
    t('Total (incl. tax)'),
    t('Secure payment. By confirming, you accept the General Terms.'),
    t('Your cart is empty.'),
    t('Loading'),
  ]);

  return {
    backToCart,
    step1,
    step2,
    step3,
    pageTitle,
    addressCardTitle,
    addressDefaultBadge,
    addressNewAction,
    addressNoneTitle,
    addressLoading,
    shippingCardTitle,
    shippingRegular,
    shippingRegularSubtitle,
    shippingFast,
    shippingFastSubtitle,
    paymentCardTitle,
    summaryTitle,
    qtyPrefix,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    totalLabel,
    secureNotice,
    emptyCartTitle,
    loading,
  };
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <Checkout params={params} />
    </Suspense>
  );
}
