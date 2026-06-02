'use client';

import {useState} from 'react';
import type {Cloned} from '@/types/util';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {MdOutlineRefresh} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {Dialog, DialogContent, DialogTitle} from '@/ui/components/dialog';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {SUBAPP_CODES} from '@/constants';
import type {PortalWorkspace} from '@/orm/workspace';
import {useTrack} from '@/lib/analytics/use-track';
import {computeTotal} from '@/utils/cart';

// ---- LOCAL IMPORTS ---- //
import {requestQuotation} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/actions/cart';
import {AddressSelection} from '../../../common/ui/components/address-selection';

export default function Content({
  workspace,
  quotationSubapp,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  quotationSubapp?: boolean;
}) {
  const [requestingQuotation, setRequestingQuotation] = useState(false);

  const {clearCart, cart} = useCart();
  const router = useRouter();
  const {workspaceURI} = useWorkspace();
  const {toast} = useToast();
  const trackEvent = useTrack(SUBAPP_CODES.quotations);

  const invoicingAddress = cart?.invoicingAddress;
  const deliveryAddress = cart?.deliveryAddress;

  const callbackURL = `${workspaceURI}/${SUBAPP_CODES.shop}/cart/request-quotation`;
  const checkoutURL = `${workspaceURI}/${SUBAPP_CODES.shop}/cart`;

  const handleRequestQuotation = async () => {
    if (!(cart?.invoicingAddress && cart?.deliveryAddress)) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          'Kindly add invoicing and delivery address for your profile.',
        ),
      });
      return;
    }

    setRequestingQuotation(true);

    const {total: cartTotal, currency: cartCurrency} = computeTotal({
      cart,
      workspace,
    });
    const trackedValue = Number.isFinite(Number(cartTotal))
      ? Number(cartTotal)
      : cart?.items?.reduce((sum: number, item: any) => {
          const unitPrice = Number(
            item.computedProduct?.price?.ati ??
              item.computedProduct?.price?.wt ??
              item.computedProduct?.product?.salePrice,
          );
          const qty = Number(item.quantity);
          return Number.isFinite(unitPrice) && Number.isFinite(qty)
            ? sum + unitPrice * qty
            : sum;
        }, 0);
    const trackedCurrency =
      cartCurrency?.code ||
      cart?.items?.find((i: any) => i?.computedProduct?.currency?.code)
        ?.computedProduct?.currency?.code;
    trackEvent('request_quote', {
      items_count: cart?.items?.length,
      ...(Number.isFinite(trackedValue) ? {value: trackedValue} : {}),
      ...(trackedCurrency ? {currency: trackedCurrency} : {}),
    });

    const res = await requestQuotation({cart, workspace});

    if (res?.data) {
      toast({
        variant: 'success',
        title: i18n.t('Quotation requested successfully'),
      });
      clearCart();
      const redirectURL = quotationSubapp
        ? `${workspaceURI}/${SUBAPP_CODES.quotations}/${res.data}`
        : `${workspaceURI}/shop`;
      router.replace(redirectURL);
    } else {
      toast({
        variant: 'destructive',
        title: i18n.t('Error requesting quotation, try again !'),
      });
      router.replace(`${workspaceURI}/${SUBAPP_CODES.shop}/cart`);
    }
  };

  return (
    <>
      <Dialog open>
        <DialogTitle></DialogTitle>
        <DialogContent className="space-y-2" hideClose>
          {!requestingQuotation ? (
            <>
              <AddressSelection
                title={i18n.t('Addresses')}
                callbackURL={callbackURL}
              />
              <div className="grid grid-cols-2 items-center gap-2">
                <Link href={checkoutURL}>
                  <Button variant="outline" className="w-full">
                    {i18n.t('Cancel')}
                  </Button>
                </Link>
                <Button
                  variant="success"
                  disabled={!(invoicingAddress && deliveryAddress)}
                  onClick={handleRequestQuotation}>
                  {i18n.t('Request')}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center">
              <MdOutlineRefresh className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
