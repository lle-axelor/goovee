import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {isAdminContact, isPartner} from '@/orm/partner';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import LayoutContent from './layout-content';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;

  const {children} = props;

  const session = await getSession();
  if (!session) return notFound();

  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const isAdmin =
    Boolean(await isPartner()) ||
    Boolean(
      await isAdminContact({
        client,
        workspaceURL,
      }),
    );

  return (
    <div className="flex-1 min-h-0 flex flex-col mb-20 lg:mb-0">
      <LayoutContent isAdmin={isAdmin}>{children}</LayoutContent>
    </div>
  );
}
