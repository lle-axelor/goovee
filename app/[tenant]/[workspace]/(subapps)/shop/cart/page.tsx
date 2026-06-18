import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {manager} from '@/tenant';
import {t} from '@/locale/server';
import {shouldHidePricesAndPurchase} from '@/orm/product';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {CartSkeleton} from '@/subapps/shop/common/ui/components';
import type {
  ShopCartLabels,
  ShopQuoteModalLabels,
} from '@/subapps/shop/common/ui/components';

async function CartView({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {tenant: tenantId} = params;
  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  const [hidePriceAndPurchase, quotationSubapp, labels, modalLabels] =
    await Promise.all([
      shouldHidePricesAndPurchase({user, workspace, client}),
      findSubappAccess({
        code: SUBAPP_CODES.quotations,
        user,
        url: workspaceURL,
        client,
      }),
      buildLabels(),
      buildModalLabels(),
    ]);

  if (hidePriceAndPurchase) notFound();

  return (
    <Content
      workspace={workspace}
      tenant={tenantId}
      labels={labels}
      modalLabels={modalLabels}
      hideRequestQuotation={!workspace?.config?.requestQuotation}
      hideCheckout={!workspace?.config?.confirmOrder}
      quotationSubapp={Boolean(quotationSubapp)}
    />
  );
}

async function buildLabels(): Promise<ShopCartLabels> {
  const [
    breadcrumbRoot,
    breadcrumbCurrent,
    pageTitle,
    itemsLabelOne,
    itemsLabel,
    unitSuffix,
    emptyTitle,
    emptyCta,
    summaryTitle,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    shippingTbdValue,
    totalLabel,
    proceedToCheckout,
    continueShopping,
    quoteBannerTitle,
    quoteBannerCta,
    removeLabel,
    loginToCheckout,
    loading,
  ] = await Promise.all([
    t('Catalogue'),
    t('Cart'),
    t('My cart'),
    t('item'),
    t('items'),
    t('/ u.'),
    t('Your cart is empty'),
    t('Browse the catalogue'),
    t('Summary'),
    t('Subtotal (excl. tax)'),
    t('VAT (20%)'),
    t('Shipping'),
    t('Calculated at next step'),
    t('Total (incl. tax)'),
    t('Proceed to checkout'),
    t('Continue shopping'),
    t('Need a tailored offer?'),
    t('Request a quote'),
    t('Remove'),
    t('Login to checkout'),
    t('Loading'),
  ]);

  return {
    breadcrumbRoot,
    breadcrumbCurrent,
    pageTitle,
    itemsLabelOne,
    itemsLabel,
    unitSuffix,
    emptyTitle,
    emptyCta,
    summaryTitle,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    shippingTbdValue,
    totalLabel,
    proceedToCheckout,
    continueShopping,
    quoteBannerTitle,
    quoteBannerCta,
    removeLabel,
    loginToCheckout,
    loading,
  };
}

async function buildModalLabels(): Promise<ShopQuoteModalLabels> {
  const [
    headerTitle,
    headerSubtitle,
    itemsTitle,
    moreItemsPrefix,
    moreItemsSuffix,
    estimatedTotalLabel,
    htSuffix,
    addressTitle,
    addressDefaultBadge,
    addressChooseAnother,
    addressNoneTitle,
    addressLoading,
    precisionsTitle,
    precisionsHint,
    deadlineLabel,
    deadlinePlaceholder,
    notesPlaceholder,
    cancel,
    submit,
    closeLabel,
    addressMissing,
    successTitle,
    errorTitle,
    submitting,
  ] = await Promise.all([
    t('Request a quote'),
    t('Reply within 24 business hours'),
    t('Items in your request'),
    t('+'),
    t('more item(s)'),
    t('Estimated total'),
    t('excl. tax'),
    t('Billing & delivery address'),
    t('Default'),
    t('Choose another'),
    t('No address on file — add one in your profile first.'),
    t('Loading addresses'),
    t('Additional details'),
    t('Optional — share constraints, volume discount, etc.'),
    t('Deadline'),
    t('e.g. by end of month'),
    t('Quantities to confirm, technical constraints, volume discount expected…'),
    t('Cancel'),
    t('Send quote request'),
    t('Close'),
    t('Add an invoicing and delivery address to your profile first.'),
    t('Quotation requested successfully'),
    t('Error requesting quotation, try again!'),
    t('Sending…'),
  ]);

  return {
    headerTitle,
    headerSubtitle,
    itemsTitle,
    moreItemsPrefix,
    moreItemsSuffix,
    estimatedTotalLabel,
    htSuffix,
    addressTitle,
    addressDefaultBadge,
    addressChooseAnother,
    addressNoneTitle,
    addressLoading,
    precisionsTitle,
    precisionsHint,
    deadlineLabel,
    deadlinePlaceholder,
    notesPlaceholder,
    cancel,
    submit,
    closeLabel,
    addressMissing,
    successTitle,
    errorTitle,
    submitting,
  };
}

export default async function Cart(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartView params={params} />
    </Suspense>
  );
}
