import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {findCategories} from '@/subapps/shop/common/orm/categories';

// Legacy route — the standalone category page was removed when the shop
// switched to the V3 unified catalog with a sidebar filter. We resolve the
// slug to a category id and redirect into the hub with the right ?cat=.
export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'category-slug': string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId} = params;
  const slug = params['category-slug'];

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client}).then(
    clone,
  );
  if (!workspace) return notFound();

  const categories = await findCategories({workspace, client, user}).then(
    clone,
  );
  const match = (categories as any[])?.find(c => c.slug === slug);

  if (!match) return redirect(`${workspaceURI}/shop`);
  return redirect(`${workspaceURI}/shop?cat=${encodeURIComponent(String(match.id))}`);
}
