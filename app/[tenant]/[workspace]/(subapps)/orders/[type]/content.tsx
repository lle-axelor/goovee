'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {NavView} from '@/ui/components';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {ORDER_TAB_ITEMS} from '@/subapps/orders/common/constants/orders';
import {OrdersSplitView} from '@/subapps/orders/common/ui/components';
import type {OrderType} from '@/subapps/orders/common/types/orders';

type ContentProps = {
  orders: any[];
  pageInfo?: any;
  orderType: OrderType;
  selectedOrder: any | null;
  selectedId: string | null;
};

const Content = ({
  orders,
  orderType,
  selectedOrder,
  selectedId,
}: ContentProps) => {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const handleTabChange = (e: any) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.orders}/${e.href}`);
  };

  return (
    <div className="font-jakarta">
      <NavView
        items={ORDER_TAB_ITEMS}
        activeTab={ORDER_TAB_ITEMS.find(item => item.href === orderType)!.id}
        onTabChange={handleTabChange}>
        <OrdersSplitView
          orders={orders}
          orderType={orderType}
          selectedOrder={selectedOrder}
          selectedId={selectedId}
        />
      </NavView>
    </div>
  );
};

export default Content;
