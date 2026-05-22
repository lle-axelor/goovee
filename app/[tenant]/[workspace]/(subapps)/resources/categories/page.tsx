export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type {Cloned} from '@/types/util';
import {notFound} from 'next/navigation';
import {MdAdd} from 'react-icons/md';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import type {User} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import {manager} from '@/lib/core/tenant';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {
  CategoryExplorer,
  ResourceList,
  ExplorerSkeleton,
  ResourceListSkeleton,
} from '@/subapps/resources/common/ui/components';
import {
  fetchExplorerCategories,
  fetchFile,
  fetchFiles,
  fetchLatestFiles,
} from '@/subapps/resources/common/orm/dms';
import {ACTION} from '../common/constants';

async function Categories({
  workspace,
  client,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
}) {
  const categories = await fetchExplorerCategories({
    workspace,
    user,
    client,
  }).then(clone);

  return <CategoryExplorer categories={categories} />;
}

async function Resources({
  workspace,
  client,
  user,
  category,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
  category?: string;
}) {
  let files;

  if (category) {
    files = await fetchFiles({
      id: category,
      workspace,
      user,
      client,
    }).then(clone);
  } else {
    files = await fetchLatestFiles({
      workspace,
      user,
      client,
    }).then(clone);
  }

  return <ResourceList resources={files} />;
}

export default async function Page(props: {
  searchParams: Promise<{id: string}>;
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const {tenant: tenantId} = params;
  const {id} = searchParams;

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

  let file;

  if (id) {
    file = await fetchFile({
      id,
      workspace,
      user,
      client,
    });
  }
  const permissionSelect = file?.permissionSelect;
  const canWrite = permissionSelect && permissionSelect === ACTION.WRITE;
  const canUpload = permissionSelect && permissionSelect === ACTION.UPLOAD;

  return (
    <div className="bg-ink-25 min-h-full">
      <main className="container p-4 mx-auto space-y-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
              {await t('Documents')}
            </p>
            <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
              {file?.fileName ?? (await t('Resource Category'))}
            </h1>
            {file?.description && (
              <p className="text-sm text-ink-500 mt-2 max-w-2xl">
                {file.description}
              </p>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2 shrink-0">
              {canWrite && (
                <Button
                  asChild
                  variant="ink-outline"
                  className="flex items-center gap-1.5">
                  <Link
                    href={`${workspaceURI}/resources/categories/create?id=${id}`}>
                    <MdAdd className="size-5" />
                    <span>{await t('New Category')}</span>
                  </Link>
                </Button>
              )}
              {(canWrite || canUpload) && (
                <Button
                  asChild
                  variant="royal"
                  className="flex items-center gap-1.5">
                  <Link href={`${workspaceURI}/resources/create?id=${id}`}>
                    <MdAdd className="size-5" />
                    <span>{await t('New Resource')}</span>
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-4 gap-5 items-start">
          <aside className="bg-white rounded-xl border border-ink-100 shadow-xs py-4 px-2">
            <Suspense fallback={<ExplorerSkeleton />}>
              <Categories workspace={workspace} client={client} user={user} />
            </Suspense>
          </aside>
          <div className="sm:col-span-3 overflow-auto">
            <Suspense fallback={<ResourceListSkeleton />}>
              <Resources
                workspace={workspace}
                client={client}
                user={user}
                category={id}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
