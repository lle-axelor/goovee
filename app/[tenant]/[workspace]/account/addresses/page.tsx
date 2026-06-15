import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone, getPartnerId} from '@/utils';
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findSubappAccess} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {PartnerKey} from '@/types';
import {findDeliveryAddresses, findInvoicingAddresses} from '@/orm/address';
import {getWhereClauseForEntity} from '@/utils/filters';
import {manager} from '@/tenant';
import {t} from '@/lib/core/locale/server';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';

// ---- LOCAL IMPORTS ---- //
import AddressesContent from './content';
import {SectionHeader} from '../common/ui/components';

interface PageParams {
  params: Promise<{id: string; tenant: string; workspace: string}>;
  searchParams: Promise<{
    quotation?: string;
    checkout?: boolean;
    callbackURL?: string;
  }>;
}

export default async function Page(props: PageParams) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {tenant: tenantId} = params;
  const {
    quotation: quotationId = null,
    checkout = false,
    callbackURL,
  } = searchParams || {};

  const session = await getSession();
  const user = session?.user;
  if (!user) return notFound();

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const {workspaceURL} = workspacePathname(params);
  const userId = getPartnerId(user);

  let data = {
    recordId: null as any,
    address: {invoicingAddress: null, deliveryAddress: null},
  };

  if (quotationId) {
    const subapp = await findSubappAccess({
      code: SUBAPP_CODES.quotations,
      user,
      url: workspaceURL,
      client,
    });
    if (subapp) {
      const {role, isContactAdmin} = subapp;
      const where = getWhereClauseForEntity({
        user,
        role,
        isContactAdmin,
        partnerKey: PartnerKey.CLIENT_PARTNER,
      });
      const quotation: any = await findQuotation({
        id: quotationId,
        client,
        params: {where},
        workspaceURL,
      }).then(clone);
      if (quotation) {
        data = {
          recordId: quotation.id,
          address: {
            invoicingAddress: quotation.mainInvoicingAddress,
            deliveryAddress: quotation.deliveryAddress,
          },
        };
      }
    }
  }

  const [deliveryAddresses, invoicingAddresses] = await Promise.all([
    findDeliveryAddresses(userId, client).then(clone),
    findInvoicingAddresses(userId, client).then(clone),
  ]);

  const fromQuotation = !!quotationId;
  const fromCheckout = !!checkout;
  const standalone = !fromQuotation && !fromCheckout;

  return (
    <div className="flex flex-col gap-6">
      {standalone && (
        <SectionHeader
          eyebrow={await t('Security')}
          title={await t('Addresses')}
          description={await t(
            'Manage billing and delivery addresses used on orders and quotations.',
          )}
        />
      )}
      <AddressesContent
        quotation={{
          id: data.recordId,
          ...data.address,
        }}
        invoicingAddresses={invoicingAddresses}
        deliveryAddresses={deliveryAddresses}
        fromQuotation={fromQuotation}
        fromCheckout={fromCheckout}
        callbackURL={callbackURL}
      />
    </div>
  );
}
