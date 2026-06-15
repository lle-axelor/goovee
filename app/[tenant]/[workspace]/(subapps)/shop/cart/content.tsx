import type {Cloned} from '@/types/util';
import type {PortalWorkspace} from '@/orm/workspace';

import {ShopV3Cart} from '@/subapps/shop/common/ui/components';
import type {
  ShopV3CartLabels,
  ShopV3QuoteModalLabels,
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
  labels: ShopV3CartLabels;
  modalLabels: ShopV3QuoteModalLabels;
  hideRequestQuotation: boolean;
  hideCheckout: boolean;
  quotationSubapp: boolean;
}) {
  return (
    <ShopV3Cart
      workspace={workspace}
      labels={labels}
      modalLabels={modalLabels}
      hideRequestQuotation={hideRequestQuotation}
      hideCheckout={hideCheckout}
      quotationSubapp={quotationSubapp}
    />
  );
}
