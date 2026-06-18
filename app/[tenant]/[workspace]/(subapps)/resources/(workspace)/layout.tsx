import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {manager} from '@/lib/core/tenant';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import {fetchExplorerCategories} from '@/subapps/resources/common/orm/dms';
import {
  DocsSidebar,
  type DocsSidebarCategory,
} from '@/subapps/resources/common/ui/components';

export default async function Layout({
  params: paramsPromise,
  children,
}: {
  params: Promise<{tenant: string; workspace: string}>;
  children: React.ReactNode;
}) {
  const params = await paramsPromise;
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

  const [
    categoriesTree,
    searchPlaceholder,
    homeLabel,
    categoriesLabel,
  ] = await Promise.all([
    fetchExplorerCategories({workspace, client, user}).then(clone),
    t('Search…'),
    t('Home'),
    t('Categories'),
  ]);

  // Build the visible tree roots: entries whose parent is null OR whose parent
  // is not part of the fetched set (treat orphans as visible roots, since the
  // parent may live outside the current workspace's DMS scope).
  const allCats = (categoriesTree as any[]) ?? [];
  const allIds = new Set(allCats.map(c => c.id));
  const topLevel = allCats.filter(
    c => !c.parent || !c.parent.id || !allIds.has(c.parent.id),
  ) as DocsSidebarCategory[];

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      <DocsSidebar
        categories={topLevel}
        workspaceURI={workspaceURI}
        searchPlaceholder={searchPlaceholder}
        homeLabel={homeLabel}
        categoriesLabel={categoriesLabel}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
