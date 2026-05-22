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

// ---- LOCAL IMPORTS ---- //
import PasswordForm from '../password/form';
import AddressesContent from '../addresses/content';
import {findQuotation} from '@/subapps/quotations/common/orm/quotations';

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

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow={await t('Security')}
        title={await t('Password')}
        description={await t('Change the password used to sign in.')}
      />
      <PasswordForm />

      <Divider />
      <SectionHeader
        eyebrow={await t('Security')}
        title={await t('Addresses')}
        description={await t(
          'Manage billing and delivery addresses used on orders and quotations.',
        )}
      />
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

function Divider() {
  return <hr className="border-ink-100" />;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
        {eyebrow}
      </p>
      <h2 className="text-xl font-bold text-ink-900 tracking-[-0.01em]">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-ink-500 mt-1">{description}</p>
      )}
    </header>
  );
}
