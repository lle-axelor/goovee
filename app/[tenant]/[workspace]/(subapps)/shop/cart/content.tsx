import type {Cloned} from '@/types/util';
import type {PortalWorkspace} from '@/orm/workspace';

import {ShopCart} from '@/subapps/shop/common/ui/components';
import type {
  ShopCartLabels,
  ShopQuoteModalLabels,
} from '@/subapps/shop/common/ui/components';

export default function Content({
  workspace,
  labels,
  modalLabels,
  hideRequestQuotation,
  hideCheckout,
  quotationSubapp,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  tenant: string;
  labels: ShopCartLabels;
  modalLabels: ShopQuoteModalLabels;
  hideRequestQuotation: boolean;
  hideCheckout: boolean;
  quotationSubapp: boolean;
}) {
  return (
    <ShopCart
      workspace={workspace}
      labels={labels}
      modalLabels={modalLabels}
      hideRequestQuotation={hideRequestQuotation}
      hideCheckout={hideCheckout}
      quotationSubapp={quotationSubapp}
    />
  );
}
