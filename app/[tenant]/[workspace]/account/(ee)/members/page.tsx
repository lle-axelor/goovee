import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {isAdminContact, isPartner} from '@/orm/partner';
import {manager} from '@/lib/core/tenant';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findAvailableSubapps, findMembers} from '../../common/orm/members';
import {findInvites} from '../../common/orm/invites';
import {SectionHeader} from '../../common/ui/components';

export default async function Page(props: {
  params: Promise<{workspace: string; tenant: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;

  const session = await getSession();
  const user = session?.user!;

  const isAdmin =
    Boolean(await isPartner()) ||
    Boolean(await isAdminContact({client, workspaceURL}));

  if (!isAdmin) {
    return notFound();
  }

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    client,
  });

  if (!workspace) {
    return notFound();
  }

  const partnerId = (user?.isContact ? user.mainPartnerId : user.id)!;

  const invites = await findInvites({
    workspaceURL,
    client,
    partnerId,
  });

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    client,
  });

  const members: any = await findMembers({
    workspaceURL,
    client,
    partnerId,
  });

  const $members = [...members?.partners, ...members?.contacts];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow={await t('Team')}
        title={await t('Members')}
        description={await t(
          'Manage who can access this workspace and their roles.',
        )}
      />
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-6">
        <Content
          members={$members}
          invites={invites}
          availableApps={availableApps || []}
          canInviteMembers={workspace?.config?.canInviteMembers}
        />
      </div>
    </div>
  );
}
