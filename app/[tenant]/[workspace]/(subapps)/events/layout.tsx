import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {clone} from '@/utils';
import {findWorkspace, findSubappAccess} from '@/orm/workspace';
import {manager} from '@/tenant';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
import {
  EventsTabsT2,
  MobileMenuCategory,
} from '@/subapps/events/common/ui/components';

export default async function Layout(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
  }>;
  children: React.ReactNode;
}) {
  const params = await props.params;

  const {children} = props;

  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user: session?.user,
    url: workspaceURL,
    client,
  });

  if (!subapp) return notFound();

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const [categories, registeredResult, allTabLabel, mineTabLabel]: [
    any,
    any,
    string,
    string,
  ] = await Promise.all([
    findEventCategories({
      workspace,
      client,
      user,
    }).then(clone),
    user
      ? findEvents({
          limit: 200,
          page: 1,
          categoryids: [],
          eventType: EVENT_TYPE.UPCOMING,
          workspace,
          client,
          user,
          onlyRegisteredEvent: true,
        }).then(clone)
      : Promise.resolve({events: []}),
    t('All events'),
    t('My registrations'),
  ]);

  const registeredCount = (registeredResult?.events ?? []).length;

  const allHref = `${workspaceURI}/${SUBAPP_CODES.events}`;
  const mineHref = `${workspaceURI}/${SUBAPP_CODES.events}/my-registrations`;

  return (
    <>
      <div className="border-b border-ink-100 bg-white shrink-0">
        <div className="max-w-[1280px] mx-auto px-8">
          <EventsTabsT2
            allHref={allHref}
            mineHref={mineHref}
            allLabel={allTabLabel}
            mineLabel={mineTabLabel}
            registeredCount={user ? registeredCount : undefined}
          />
        </div>
      </div>
      {children}
      <MobileMenuCategory categories={categories} user={user} />
    </>
  );
}
