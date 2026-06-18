import type {Cloned} from '@/types/util';
import type {PortalWorkspace} from '@/orm/workspace';

import {ShopCheckout} from '@/subapps/shop/common/ui/components';
import type {ShopCheckoutLabels} from '@/subapps/shop/common/ui/components';

export default function Content({
  workspace,
  orderSubapp,
  labels,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  orderSubapp?: any;
  tenant: string;
  labels: ShopCheckoutLabels;
}) {
  return (
    <ShopCheckout
      workspace={workspace}
      orderSubapp={orderSubapp}
      labels={labels}
    />
  );
}
