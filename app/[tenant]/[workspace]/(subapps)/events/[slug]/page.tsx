import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {manager} from '@/lib/core/tenant/manager';
import {findEvent} from '@/subapps/events/common/orm/event';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {getSession} from '@/auth';
import TrackOnMount from '@/lib/analytics/track-on-mount';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {EventDetails} from '@/subapps/events/common/ui/components';

export default async function Page(props: {
  params: Promise<{slug: string; tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {slug, tenant: tenantId} = params;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) notFound();
  const {client, config} = tenant;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const eventDetails = await findEvent({
    slug,
    workspaceURL,
    client,
    config,
    user,
  }).then(clone);

  if (!eventDetails) {
    return notFound();
  }

  return (
    <>
      <TrackOnMount
        event="view_event"
        subapp={SUBAPP_CODES.events}
        props={{
          portal_event_id: String(eventDetails.id),
          event_slug: eventDetails.slug,
          event_status: eventDetails.statusSelect ?? 'upcoming',
        }}
        fireKey={eventDetails.id}
      />
      <EventDetails eventDetails={eventDetails} workspace={workspace} />
    </>
  );
}
