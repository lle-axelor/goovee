import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {findSubappAccess} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';
import {findWorkspace} from '@/orm/workspace';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import MobileMenuCategory from '@/subapps/news/mobile-menu-category';
import {NewsTopNav} from '@/subapps/news/common/ui/components';
import {findCategories} from '@/subapps/news/common/orm/news';

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
  const {workspaceURL} = workspacePathname(params);

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

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) return notFound();

  const allCategories = await findCategories({
    showAllCategories: true,
    workspace,
    client,
    user,
  }).then(clone);

  const topCategories = (allCategories as any[])
    .filter(c => !c?.parentCategory?.id)
    .map(c => ({id: c.id, name: c.name, slug: c.slug}));

  return (
    <div className="h-full flex flex-col">
      <div className="hidden lg:block">
        <NewsTopNav categories={topCategories} />
      </div>
      <div className="flex-1 mb-4 md:mb-10">{children}</div>
      <MobileMenuCategory categories={allCategories} />
    </div>
  );
}
