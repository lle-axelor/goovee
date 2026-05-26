import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {ORDER_BY} from '@/constants';
import {t} from '@/lib/core/locale/server';
import type {PortalWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {EVENT_TYPE} from '@/subapps/events/common/constants';
import {findEvents} from '@/subapps/events/common/orm/event';
import {findEventCategories} from '@/subapps/events/common/orm/event-category';
import {
  MagazineHub,
  type MagazineHubLabels,
} from '@/subapps/events/common/ui/components';

const MAGAZINE_LIMIT = 13; // 1 featured + 12 in the grid (max)

export default async function Page(context: any) {
  const params = await context?.params;
  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);
  if (!workspace) return notFound();

  return (
    <main className="bg-ink-25 w-full flex-1 min-h-0 flex flex-col">
      <Suspense fallback={<MagazineSkeleton />}>
        <Magazine
          workspace={workspace}
          user={user}
          client={client}
          workspaceURI={workspaceURI}
        />
      </Suspense>
    </main>
  );
}

async function Magazine({
  workspace,
  user,
  client,
  workspaceURI,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user: any;
  client: any;
  workspaceURI: string;
}) {
  const [activeResult, pastResult, categories]: [any, any, any] =
    await Promise.all([
      findEvents({
        limit: MAGAZINE_LIMIT,
        page: 1,
        categoryids: [],
        eventType: EVENT_TYPE.ACTIVE,
        workspace,
        client,
        user,
        orderBy: {eventStartDateTime: ORDER_BY.ASC},
      }).then(clone),
      findEvents({
        limit: MAGAZINE_LIMIT,
        page: 1,
        categoryids: [],
        eventType: EVENT_TYPE.PAST,
        workspace,
        client,
        user,
        orderBy: {eventStartDateTime: ORDER_BY.DESC},
      }).then(clone),
      findEventCategories({workspace, client, user}).then(clone),
    ]);

  const activeEvents: any[] = activeResult?.events ?? [];
  const pastEvents: any[] = pastResult?.events ?? [];

  const [
    title,
    upcomingDates,
    upcomingDate,
    pastCount,
    registerNow,
    daysLabel,
    upcomingHeading,
    emptyActive,
    emptyPast,
    seeLabel,
    freeLabel,
    calendarView,
    filtersLabel,
    activeTab,
    pastTab,
    featuredBadge,
    replayBadge,
    replayCta,
    replayHeading,
    replayLink,
    categoryLabel,
    clearAllLabel,
  ] = await Promise.all([
    t('Events & training'),
    t('upcoming dates'),
    t('upcoming date'),
    t('past'),
    t('Register now'),
    t('days'),
    t('Upcoming'),
    t('No upcoming events'),
    t('No past events'),
    t('See'),
    t('Free'),
    t('Calendar view'),
    t('Filters'),
    t('Active events'),
    t('Past events'),
    t('Featured'),
    t('Replay available'),
    t('Watch replay'),
    t('Other replays'),
    t('Replay'),
    t('Category'),
    t('Clear all'),
  ]);

  const labels: MagazineHubLabels = {
    title,
    upcomingDates,
    upcomingDate,
    pastCount,
    registerNow,
    daysLabel,
    upcomingHeading,
    emptyActive,
    emptyPast,
    seeLabel,
    freeLabel,
    calendarView,
    filtersLabel,
    activeTab,
    pastTab,
    featuredBadge,
    replayBadge,
    replayCta,
    replayHeading,
    replayLink,
    categoryLabel,
    clearAllLabel,
  };

  return (
    <MagazineHub
      activeEvents={activeEvents}
      pastEvents={pastEvents}
      categories={categories ?? []}
      workspaceURI={workspaceURI}
      labels={labels}
    />
  );
}

function MagazineSkeleton() {
  return (
    <div className="py-8 container mx-auto max-w-[1280px]">
      <div className="h-9 w-72 bg-ink-100 rounded mb-2 animate-pulse" />
      <div className="h-4 w-96 bg-ink-100 rounded mb-6 animate-pulse" />
      <div className="h-[380px] bg-ink-100 rounded-[20px] animate-pulse" />
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-[380px] bg-ink-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
