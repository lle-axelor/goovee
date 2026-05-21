'use client';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {Cloned} from '@/types/util';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {authClient} from '@/lib/auth-client';
import {LuChevronLeft} from 'react-icons/lu';
import {MdDeleteOutline} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Label,
  Button,
  Separator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  BackgroundImage,
  Quantity,
  Textarea,
} from '@/ui/components';
import {useQuantity, useToast} from '@/ui/hooks';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {computeTotal} from '@/utils/cart';
import {getProductImageURL} from '@/utils/files';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {SEARCH_PARAMS} from '@/constants';
import type {Cart, Product, ComputedProduct} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {findProduct} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/actions/cart';

function CartItem({item, disabled, handleRemove, displayPrices}: any) {
  const [updating, setUpdating] = useState(false);
  const {updateQuantity, getProductNote, setProductNote} = useCart();
  const {workspaceURI, tenant} = useWorkspace();
  const [note, setNote] = useState('');
  const {toast} = useToast();

  // Hooks should always be called unconditionally
  const {quantity, increment, decrement, setQuantity} = useQuantity({
    initialValue: item?.computedProduct ? Number(item.quantity) : 0,
  });

  const handleUpdateQuantity = useCallback(
    async ({
      productId,
      quantity,
      computedProduct,
    }: {
      productId: Product['id'];
      quantity: number;
      computedProduct: ComputedProduct;
    }) => {
      if (quantity > 0) {
        setUpdating(true);
        await updateQuantity({
          productId,
          quantity,
          computedProduct,
          images: computedProduct?.product?.images?.map(String) || [],
        });
        setUpdating(false);
      }
    },
    [updateQuantity],
  );

  useEffect(() => {
    if (item?.computedProduct && Number(quantity) !== Number(item.quantity)) {
      handleUpdateQuantity({
        productId: item.computedProduct?.product?.id,
        quantity,
        computedProduct: item.computedProduct,
      });
    }
  }, [quantity, item, handleUpdateQuantity]);

  useEffect(() => {
    (async () => {
      if (!item?.computedProduct?.product) return;
      const note = await getProductNote(item.computedProduct.product.id);
      setNote(note);
    })();
  }, [getProductNote, item?.computedProduct?.product]);

  const handleChangeNote = async (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const {value} = event.target;
    setNote(value);
    await setProductNote(item.computedProduct.product.id, value);
  };
  const handleChange = (newValue: string | number) => {
    if (Number(newValue) < 1) {
      toast({
        variant: 'destructive',
        description: i18n.t('Enter valid quantity'),
      });
    }
    setQuantity(Number(newValue));
  };

  if (!item.computedProduct) return null;

  const {product, price, errorMessage} = item.computedProduct;

  return (
    <article
      key={item.id}
      className="flex-col md:flex-row flex items-start gap-5 bg-white border border-ink-100 shadow-xs p-4 rounded-xl">
      <Link
        href={`${workspaceURI}/shop/product/${encodeURIComponent(product.slug)}`}
        className="shrink-0">
        <BackgroundImage
          className="rounded-lg h-32 md:w-32 w-full min-w-32 bg-ink-50"
          style={{backgroundSize: 'cover'}}
          src={getProductImageURL(
            product?.thumbnailImage?.id || product?.images?.[0],
            tenant,
          )}
        />
      </Link>
      <div className="flex-col md:flex-row flex gap-4 items-start justify-between w-full h-full">
        <div className="flex flex-col items-start gap-3 w-full h-full flex-1">
          <Link
            className="no-underline text-inherit"
            href={`${workspaceURI}/shop/product/${encodeURIComponent(
              product.slug,
            )}`}>
            <h3 className="font-semibold text-base text-ink-900 leading-snug">
              {i18n.tattr(product.name)}
            </h3>
          </Link>
          {errorMessage && (
            <p className="text-xs font-semibold text-status-overdue-fg">
              {i18n.t('Price may be incorrect')}
            </p>
          )}
          {product.allowCustomNote && (
            <div className="w-full flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
                {i18n.t('Note')}
              </Label>
              <Textarea
                className="border border-ink-150 rounded-lg text-sm"
                value={note}
                onChange={handleChangeNote}
              />
            </div>
          )}
          <div className="flex items-center gap-3 mt-auto">
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-400">
              {i18n.t('Quantity')}
            </span>
            <Quantity
              value={quantity}
              disabled={updating}
              onIncrement={increment}
              onDecrement={decrement}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {displayPrices && (
            <>
              <p className="text-lg font-bold text-ink-900 tabular-nums">
                {price.displayPrimary}
              </p>
              {price.displaySecondary && (
                <p className="text-xs text-ink-500 tabular-nums">
                  {price.displaySecondary}
                </p>
              )}
            </>
          )}
          <button
            type="button"
            disabled={disabled || updating}
            onClick={handleRemove(product)}
            aria-label={i18n.t('Remove')}
            className="mt-auto w-8 h-8 grid place-items-center rounded-md text-status-overdue-fg hover:bg-status-overdue-bg transition-colors disabled:opacity-40">
            <MdDeleteOutline className="text-xl" />
          </button>
        </div>
      </div>
    </article>
  );
}

function CartItems({
  cart,
  disabled,
  onRemove,
  workspace,
}: {
  cart: Cart;
  disabled?: boolean;
  onRemove: (product: Product) => Promise<void>;
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const handleRemove =
    (product: Product) => (event: React.MouseEvent<HTMLElement>) => {
      onRemove(product);
    };

  return (
    <div className="flex flex-col gap-6">
      {cart?.items?.map((item: any) => (
        <CartItem
          key={item?.computedProduct?.product?.id}
          item={item}
          disabled={disabled}
          handleRemove={handleRemove}
          displayPrices={workspace?.config?.displayPrices}
        />
      ))}
    </div>
  );
}

function CartSummary({
  cart,
  onRequestQuotation,
  hideRequestQuotation,
  hideCheckout,
  workspace,
}: {
  cart: Cart;
  onRequestQuotation: any;
  hideRequestQuotation?: boolean;
  hideCheckout?: boolean;
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const noitem = !cart?.items?.length;
  const {displayTotal} = computeTotal({cart, workspace});
  const {workspaceURI, tenant} = useWorkspace();
  const {data: session} = authClient.useSession();
  const authenticated = session?.user?.id;

  return (
    <aside className="col-span-12 xl:col-span-3 xl:sticky xl:top-6 h-fit">
      <div className="p-6 bg-white rounded-xl border border-ink-100 shadow-xs flex flex-col gap-4">
        {workspace?.config?.displayPrices && (
          <>
            <h3 className="text-lg font-bold text-ink-900">
              {i18n.t('Total')}
            </h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">{i18n.t('Products')}</dt>
                <dd className="font-semibold text-ink-900 tabular-nums">
                  {displayTotal}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">{i18n.t('Shipping')}</dt>
                <dd className="text-xs text-ink-400">
                  {i18n.t('To be determined')}
                </dd>
              </div>
            </dl>
            <Separator className="bg-ink-100" />
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-ink-700">
                {i18n.t('Total Price')}
              </span>
              <span className="text-2xl font-bold text-ink-900 tabular-nums">
                {displayTotal}
              </span>
            </div>
          </>
        )}
        {authenticated ? (
          <div className="flex flex-col gap-2">
            {!hideCheckout && (
              <Button
                variant="dark"
                className="w-full"
                disabled={noitem}
                onClick={() =>
                  router.push(`${workspaceURI}/shop/cart/checkout`)
                }>
                {i18n.t('Checkout')}
              </Button>
            )}
            {!hideRequestQuotation && (
              <Button
                variant="ink-outline"
                className="w-full"
                disabled={noitem}
                onClick={onRequestQuotation}>
                {i18n.t('Request Quotation')}
              </Button>
            )}
          </div>
        ) : (
          <Button asChild variant="royal" className="w-full">
            <Link
              href={`/auth/login?callbackurl=${encodeURIComponent(
                pathname,
              )}&workspaceURI=${encodeURIComponent(workspaceURI)}&${SEARCH_PARAMS.TENANT_ID}=${encodeURIComponent(tenant)}`}>
              {i18n.t('Login for checkout')}
            </Link>
          </Button>
        )}
        <Button asChild variant="royal-ghost" className="w-full gap-1.5">
          <Link href={`${workspaceURI}/shop`}>
            <LuChevronLeft className="text-base" />
            {i18n.t('Continue Shopping')}
          </Link>
        </Button>
      </div>
    </aside>
  );
}

export default function Content({
  workspace,
  tenant,
}: {
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
  tenant: string;
}) {
  const {data: session} = authClient.useSession();
  const user = session?.user;
  const userId = user?.id;

  const {cart, removeItem} = useCart();
  const {workspaceURI} = useWorkspace();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [computedProducts, setComputedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmationDialog, setConfirmationDialog] = useState<any>(null);

  const handleRemoveProduct = async (product: Product) => {
    setUpdating(true);
    await removeItem(product.id);
    setUpdating(false);
  };

  const openConfirmation = (confirmationDialog: {
    title: string;
    onContinue: any;
  }) => {
    setConfirmationDialog(confirmationDialog);
  };

  const closeConfirmation = () => {
    setConfirmationDialog(null);
  };

  const openProductConfirmation = async (product: Product) => {
    openConfirmation({
      title: `${i18n.t('Do you want to remove')} ${product?.name}?`,
      onContinue: () => handleRemoveProduct(product),
    });
  };

  const openQuotationConfirmation = () => {
    openConfirmation({
      title: i18n.t('Do you want to request quotation?'),
      onContinue: handleRequestQuotation,
    });
  };

  const handleRequestQuotation = async () => {
    closeConfirmation();
    router.replace(`${workspaceURI}/shop/cart/request-quotation`);
  };

  useEffect(() => {
    const init = async () => {
      const computedProductIDs = computedProducts
        .map(cp => cp?.product?.id)
        .filter(Boolean);

      const cartItemIDs = cart?.items?.map((i: any) => i.product);

      const diff = cartItemIDs?.filter(
        (id: string) => !computedProductIDs.includes(id),
      );

      if (diff?.length) {
        await Promise.all(
          cart.items.map((i: any) =>
            findProduct({
              id: i.product,
              workspace,
            }),
          ),
        )
          .then(computedProducts => {
            if (computedProducts) {
              const computedItemIds = computedProducts.map(
                cp => cp?.product?.id,
              );

              const unavailableProductIds = cartItemIDs.filter(
                (i: string | number) => !computedItemIds.includes(i),
              );

              unavailableProductIds?.forEach(removeItem);

              setComputedProducts(computedProducts);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    };
    init();
  }, [cart, computedProducts, workspace, userId, tenant, removeItem]);

  const $cart = useMemo(
    () => ({
      ...cart,
      items: [
        ...(cart?.items ?? []).map((i: any) => ({
          ...i,
          computedProduct: computedProducts.find(
            cp => Number(cp?.product?.id) === Number(i.product),
          ),
        })),
      ],
    }),
    [cart, computedProducts],
  );

  if (loading) {
    return <p>{i18n.t('Loading')}...</p>;
  }

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container flex flex-col gap-6 mx-auto py-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
            {i18n.t('Shop')}
          </p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
            {i18n.t('Cart')}
          </h1>
          {cart?.items?.length ? (
            <p className="text-sm text-ink-500 mt-1 tabular-nums">
              {cart.items.length}{' '}
              {i18n.t(cart.items.length > 1 ? 'items' : 'item')}
            </p>
          ) : null}
        </header>
        <div className="grid mb-[5rem] lg:mb-0 grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="col-span-12 xl:col-span-9">
            {cart?.items?.length ? (
              <CartItems
                cart={$cart}
                onRemove={openProductConfirmation}
                disabled={updating}
                workspace={workspace}
              />
            ) : (
              <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-12 text-center">
                <p className="text-base font-semibold text-ink-700">
                  {i18n.t('Your cart is empty.')}
                </p>
                <Link
                  href={`${workspaceURI}/shop`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-royal font-semibold hover:underline">
                  <LuChevronLeft className="text-base" />
                  {i18n.t('Continue Shopping')}
                </Link>
              </div>
            )}
          </div>
          <CartSummary
            cart={$cart}
            onRequestQuotation={openQuotationConfirmation}
            workspace={workspace}
            hideRequestQuotation={!workspace?.config?.requestQuotation}
            hideCheckout={!workspace?.config?.confirmOrder}
          />
          <AlertDialog open={Boolean(confirmationDialog)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmationDialog?.title}</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={closeConfirmation}>
                  {i18n.t('Cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    confirmationDialog?.onContinue();
                    closeConfirmation();
                  }}>
                  {i18n.t('Continue')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
