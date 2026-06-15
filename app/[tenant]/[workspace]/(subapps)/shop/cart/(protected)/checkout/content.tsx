import type {Cloned} from '@/types/util';
import type {PortalWorkspace} from '@/orm/workspace';

import {ShopV3Checkout} from '@/subapps/shop/common/ui/components';
import type {ShopV3CheckoutLabels} from '@/subapps/shop/common/ui/components';

export default function Content({
  workspace,
  orderSubapp,
  labels,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  orderSubapp?: any;
  tenant: string;
  labels: ShopV3CheckoutLabels;
}) {
  return (
    <ShopV3Checkout
      workspace={workspace}
      orderSubapp={orderSubapp}
      labels={labels}
    />
  );
}
