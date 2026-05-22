import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findSubapps, findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {isAdminContact, isPartner} from '@/orm/partner';
import {manager} from '@/lib/core/tenant';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import AppsContent from '../apps/content';
import SettingsContent from '../settings/content';
import MembersContent from '../(ee)/members/content';
import {findAvailableSubapps, findMembers} from '../common/orm/members';
import {findInvites} from '../common/orm/invites';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const session = await getSession();
  const user = session?.user;
  if (!user) return notFound();

  const workspace = await findWorkspace({user, url: workspaceURL, client}).then(
    clone,
  );
  if (!workspace) return notFound();

  const isAdmin =
    Boolean(await isPartner()) ||
    Boolean(await isAdminContact({client, workspaceURL}));

  const [subapps, invites, availableApps, members] = await Promise.all([
    findSubapps({url: workspace.url, user, client}),
    isAdmin
      ? findInvites({
          workspaceURL,
          client,
          partnerId: (user.isContact ? user.mainPartnerId : user.id)!,
        })
      : Promise.resolve([]),
    isAdmin
      ? findAvailableSubapps({url: workspaceURL, client})
      : Promise.resolve([]),
    isAdmin
      ? findMembers({
          workspaceURL,
          client,
          partnerId: (user.isContact ? user.mainPartnerId : user.id)!,
        })
      : Promise.resolve({partners: [], contacts: []} as any),
  ]);

  const $members = isAdmin ? [...members.partners, ...members.contacts] : [];

  return (
    <div className="flex flex-col gap-8">
      {isAdmin && (
        <>
          <SectionHeader
            eyebrow={await t('Workspace')}
            title={await t('Members')}
            description={await t(
              'Manage who can access this workspace and their roles.',
            )}
          />
          <MembersContent
            members={$members}
            invites={invites}
            availableApps={availableApps || []}
            canInviteMembers={workspace?.config?.canInviteMembers}
          />
          <Divider />
        </>
      )}

      <SectionHeader
        eyebrow={await t('Workspace')}
        title={await t('Applications')}
        description={await t(
          'Toggle which applications are visible in this workspace.',
        )}
      />
      <AppsContent subapps={subapps} />

      <Divider />
      <SectionHeader
        eyebrow={await t('Workspace')}
        title={await t('Settings')}
        description={await t('Workspace-wide settings.')}
      />
      <SettingsContent workspace={workspace} />
    </div>
  );
}

function Divider() {
  return <hr className="border-ink-100" />;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
        {eyebrow}
      </p>
      <h2 className="text-xl font-bold text-ink-900 tracking-[-0.01em]">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-ink-500 mt-1">{description}</p>
      )}
    </header>
  );
}
