import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {i18n} from '@/locale';
import type {User} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import {manager} from '@/lib/core/tenant';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {
  fetchLatestFiles,
  fetchLatestFolders,
} from '@/subapps/resources/common/orm/dms';
import {
  ResourceList,
  CategoriesSkeleton,
  ResourceListSkeleton,
} from '@/subapps/resources/common/ui/components';
import Categories from './categories';
import Hero from './hero';

async function LatestCategories({
  workspace,
  client,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
}) {
  const folders = await fetchLatestFolders({
    workspace,
    client,
    user,
  }).then(clone);

  return <Categories items={folders} />;
}

async function LatestResources({
  workspace,
  client,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
}) {
  const files = await fetchLatestFiles({
    workspace,
    client,
    user,
  }).then(clone);

  return <ResourceList resources={files} />;
}

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

  if (!workspace) {
    return notFound();
  }

  return (
    <div className="bg-ink-25 min-h-full">
      <Hero workspace={workspace} workspaceURI={workspaceURI} />
      <main className="container p-4 mx-auto space-y-8 py-8">
        <section>
          <header className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
              {i18n.t('Browse')}
            </p>
            <h2 className="font-bold text-2xl text-ink-900">
              {i18n.t('Document categories')}
            </h2>
          </header>
          <Suspense fallback={<CategoriesSkeleton />}>
            <LatestCategories
              workspace={workspace}
              client={client}
              user={user}
            />
          </Suspense>
        </section>
        <section>
          <header className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
                {i18n.t('Latest')}
              </p>
              <h2 className="font-bold text-2xl text-ink-900">
                {i18n.t('New Resources')}
              </h2>
            </div>
          </header>
          <Suspense fallback={<ResourceListSkeleton />}>
            <LatestResources
              workspace={workspace}
              client={client}
              user={user}
            />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
