import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {manager} from '@/lib/core/tenant';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import {NEW_FILE_CUTOFF_DAYS} from '@/subapps/resources/common/constants';
import {
  fetchLatestFiles,
  fetchNewFiles,
  fetchPinnedFoldersWithMeta,
} from '@/subapps/resources/common/orm/dms';
import {
  DocsHomeView,
  type DocsHomeViewLabels,
} from '@/subapps/resources/common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
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
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent
        workspace={workspace}
        client={client}
        user={user}
        workspaceURI={workspaceURI}
      />
    </Suspense>
  );
}

async function HomeContent({
  workspace,
  client,
  user,
  workspaceURI,
}: {
  workspace: any;
  client: any;
  user: any;
  workspaceURI: string;
}) {
  const [pinnedFolders, recentFiles, newFiles, labels] = await Promise.all([
    fetchPinnedFoldersWithMeta({workspace, client, user}).then(clone),
    fetchLatestFiles({workspace, client, user, take: 5}).then(clone),
    fetchNewFiles({
      workspace,
      client,
      user,
      sinceDays: NEW_FILE_CUTOFF_DAYS,
      take: 5,
    }).then(clone),
    buildLabels(),
  ]);

  return (
    <DocsHomeView
      pinnedFolders={(pinnedFolders as any[]) ?? []}
      recentFiles={(recentFiles as any[]) ?? []}
      newFiles={(newFiles as any[]) ?? []}
      workspaceURI={workspaceURI}
      labels={labels}
    />
  );
}

async function buildLabels(): Promise<DocsHomeViewLabels> {
  const [
    pinnedTitle,
    pinnedSubtitle,
    pinnedEmptyTitle,
    pinnedEmptySubtitle,
    recentsTitle,
    recentsEmpty,
    newTitle,
    newSubtitle,
    newEmpty,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
    newBadge,
    inFolder,
  ] = await Promise.all([
    t('Featured folders'),
    t('Curated by your admin'),
    t('No pinned folders yet'),
    t('Your admin will pin folders here for quick access.'),
    t('Recently viewed'),
    t('No recent activity'),
    t('What’s new'),
    t('Documents added in the last 24 hours'),
    t('Nothing new to show'),
    t('documents'),
    t('document'),
    t('Updated'),
    t('New'),
    t('in'),
  ]);

  return {
    pinnedTitle,
    pinnedSubtitle,
    pinnedEmptyTitle,
    pinnedEmptySubtitle,
    recentsTitle,
    recentsEmpty,
    newTitle,
    newSubtitle,
    newEmpty,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
    newBadge,
    inFolder,
  };
}

function HomeSkeleton() {
  return (
    <div className="px-9 py-8 max-w-[1280px] mx-auto animate-pulse">
      <div className="h-8 w-64 bg-ink-100 rounded mb-2" />
      <div className="h-4 w-96 bg-ink-100 rounded mb-7" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-9">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-ink-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 bg-white rounded-2xl border border-ink-100" />
        <div className="h-80 bg-white rounded-2xl border border-ink-100" />
      </div>
    </div>
  );
}
