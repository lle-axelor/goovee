'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import type {Cloned} from '@/types/util';
import {authClient} from '@/lib/auth-client';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  Separator,
  Label,
  RadioGroup,
  RadioGroupItem,
  BackgroundImage,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/ui/components';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {scale} from '@/utils';
import {computeTotal} from '@/utils/cart';
import {getProductImageURL} from '@/utils/files';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {type PortalWorkspace} from '@/orm/workspace';
import {formatNumber} from '@/locale/formatters';
import {calculateAdvanceAmount} from '@/utils/payment';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {findProduct} from '@/subapps/shop/common/actions/cart';
import {AddressSelection} from '@/subapps/shop/common/ui/components/address-selection';
import {SHIPPING_TYPE} from '@/subapps/shop/common/constants/index';
import {ShopPayments} from '@/subapps/shop/common/ui/components';
import styles from './content.module.scss';

const SHIPPING_TYPE_COST = {
  [SHIPPING_TYPE.REGULAR]: 2,
  [SHIPPING_TYPE.FAST]: 5,
};

function Summary({cart}: any) {
  const {tenant} = useWorkspace();
  return (
    <section className="bg-white p-6 rounded-xl border border-ink-100 shadow-xs">
      <h3 className="text-lg font-bold text-ink-900 mb-4">
        {i18n.t('Summary')}
      </h3>
      <ul className="flex flex-col divide-y divide-ink-100">
        {cart.items.map(
          ({
            computedProduct: {product, price} = {} as any,
            quantity,
            note,
          }: any = {}) => (
            <li
              key={product?.id}
              className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <BackgroundImage
                src={getProductImageURL(
                  product?.thumbnailImage?.id || product?.images?.[0],
                  tenant,
                )}
                className="rounded-lg w-16 h-16 bg-cover bg-ink-50 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900 line-clamp-1">
                  {i18n.tattr(product?.name)}
                </p>
                <p className="text-xs text-ink-500 tabular-nums mt-0.5">
                  {i18n.t('Quantity')}:{' '}
                  <span className="font-medium">{quantity}</span>
                </p>
                {note && (
                  <p className="text-xs text-ink-500 mt-1">
                    <span className="font-semibold">{i18n.t('Note')}:</span>{' '}
                    {note}
                  </p>
                )}
              </div>
              <p className="text-sm font-bold text-ink-900 tabular-nums shrink-0 self-start">
                {price?.displayPrimary}
              </p>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
function Total({cart, shippingType, workspace}: any) {
  const {
    total,
    displayTotal,
    scale: {currency: currencyScale},
    currency: {symbol: currencySymbol},
  } = computeTotal({cart, workspace});

  const payInAdvance = workspace.config?.payInAdvance;
  const advancePaymentPercentage = workspace.config?.advancePaymentPercentage;

  const shipping = Number(
    scale(SHIPPING_TYPE_COST[shippingType], currencyScale),
  ) as number;

  const totalAmount = Number(total) + Number(shipping);

  const totalWithShipping = formatNumber(totalAmount, {
    currency: currencySymbol,
    scale: currencyScale,
    type: 'DECIMAL',
  });

  const advanceAmount = calculateAdvanceAmount({
    amount: Number(total),
    percentage: advancePaymentPercentage,
    payInAdvance,
  });

  return (
    <section className="rounded-xl p-6 bg-white border border-ink-100 shadow-xs flex flex-col gap-3">
      <h3 className="text-lg font-bold text-ink-900">{i18n.t('Total')}</h3>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">{i18n.t('Products')}</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">
            {displayTotal}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">{i18n.t('Shipping')}</dt>
          <dd className="text-ink-700 tabular-nums">
            {formatNumber(shipping, {
              scale: currencyScale,
              currency: currencySymbol,
              type: 'DECIMAL',
            })}
          </dd>
        </div>
      </dl>
      <Separator className="bg-ink-100" />
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-ink-700">
          {i18n.t('Total price')}
        </span>
        <span className="text-2xl font-bold text-ink-900 tabular-nums">
          {totalWithShipping}
        </span>
      </div>
      {payInAdvance && advanceAmount && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg p-4 bg-royal-pale border border-royal-border">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-royal mb-0.5">
              {i18n.t('Advance Amount Due')}
            </p>
            <p className="text-xs text-ink-500">
              {i18n.t('Required to confirm the order')}
            </p>
          </div>
          <p className="text-lg font-bold text-ink-900 tabular-nums">
            {formatNumber(advanceAmount, {
              currency: currencySymbol,
              scale: currencyScale,
              type: 'DECIMAL',
            })}
          </p>
        </div>
      )}
    </section>
  );
}

function Shipping({value, onChange}: {value: string; onChange: any}) {
  const options = [
    {
      id: SHIPPING_TYPE.REGULAR,
      label: i18n.t('Regular Shipping'),
      caption: `5-10 ${i18n.t('Business Days')}`,
      price: '2.00 €',
    },
    {
      id: SHIPPING_TYPE.FAST,
      label: i18n.t('Fast Shipping'),
      caption: `2-3 ${i18n.t('Business Days')}`,
      price: '5.00 €',
    },
  ];
  return (
    <section className="bg-white p-6 rounded-xl border border-ink-100 shadow-xs">
      <h3 className="text-lg font-bold text-ink-900 mb-4">
        {i18n.t('Shipping method')}
      </h3>
      <RadioGroup
        name="shipping"
        defaultValue={value}
        className="flex flex-col gap-3">
        {options.map(opt => {
          const isActive = value === opt.id;
          return (
            <label
              key={opt.id}
              htmlFor={`ship-${opt.id}`}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all',
                isActive
                  ? 'border-[1.5px] border-royal bg-royal-pale/60'
                  : 'border border-ink-150 hover:border-ink-300',
              )}>
              <RadioGroupItem
                value={opt.id}
                className={`${styles.radio}`}
                onClick={onChange}
                id={`ship-${opt.id}`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink-900">
                  {opt.label}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">{opt.caption}</p>
              </div>
              <p className="text-sm font-bold text-ink-900 tabular-nums">
                {opt.price}
              </p>
            </label>
          );
        })}
      </RadioGroup>
    </section>
  );
}

export default function Content({
  workspace,
  orderSubapp,
  tenant,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  orderSubapp?: any;
  tenant: string;
}) {
  const {data: session} = authClient.useSession();
  const user = session?.user;
  const userId = user?.id;

  const [shippingType, setShippingType] = useState<string>(
    SHIPPING_TYPE.REGULAR,
  );

  const router = useRouter();
  const {workspaceURI} = useWorkspace();
  const {cart} = useCart();
  const [computedProducts, setComputedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmationDialog, setConfirmationDialog] = useState(false);

  const confirmOrder = workspace?.config?.confirmOrder;

  const closeConfirmation = () => {
    setConfirmationDialog(false);
  };

  const handleConfirmOrder = () => {
    closeConfirmation();
    router.replace(`${workspaceURI}/shop/cart/checkout/request-order`);
  };

  const handleChangeShippingType = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setShippingType(event.target.value);
  };

  useEffect(() => {
    const init = async () => {
      if (!computedProducts?.length && cart) {
        await Promise.all(
          cart.items.map((i: any) =>
            findProduct({
              id: i.product,
              workspace: workspace,
            }),
          ),
        )
          .then(computedProducts => {
            setComputedProducts(computedProducts);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };
    init();
  }, [cart, computedProducts, workspace, userId, tenant]);

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
    return (
      <div className="bg-ink-25 min-h-full p-8">
        <p className="text-sm text-ink-500">{i18n.t('Loading')}...</p>
      </div>
    );
  }
  if (!cart?.items?.length) {
    return (
      <div className="bg-ink-25 min-h-full">
        <div className="container py-8">
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-12 text-center">
            <p className="text-base font-semibold text-ink-700">
              {i18n.t('Your cart is empty.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container py-8">
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
            {i18n.t('Shop')}
          </p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
            {i18n.t('Confirm Cart')}
          </h1>
        </header>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="col-span-12 xl:col-span-8">
            <div className="flex flex-col gap-6">
              <AddressSelection />
              <Shipping
                value={shippingType}
                onChange={handleChangeShippingType}
              />
            </div>
          </div>
          <div className="col-span-12 xl:col-span-4 xl:sticky xl:top-6">
            <div className="flex flex-col gap-6">
              <Summary cart={$cart} />
              <Total
                cart={$cart}
                shippingType={shippingType}
                workspace={workspace}
              />
              {confirmOrder ? (
                <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
                  <ShopPayments
                    workspace={workspace}
                    orderSubapp={orderSubapp}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <AlertDialog open={Boolean(confirmationDialog)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Do you want to confirm order?')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmation}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOrder}>
              {i18n.t('Continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
