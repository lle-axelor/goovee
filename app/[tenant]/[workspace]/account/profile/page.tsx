import {notFound} from 'next/navigation';
import {uniqBy} from 'lodash-es';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {
  findGooveeUserByEmail,
  isAdminContact,
  PartnerTypeMap,
} from '@/orm/partner';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/lib/core/tenant';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import PersonalForm from '../personal/form';
import PreferencesForm from '../preferences/form';
import DirectoryForm from '../directory/form';
import {Role} from '../common/types';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;
  if (!user) return notFound();

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const [partner, workspace, isAdminContactUser] = await Promise.all([
    findGooveeUserByEmail(user.email, client),
    findWorkspace({user, url: workspaceURL, client}),
    isAdminContact({client, workspaceURL}),
  ]);

  if (!partner || !workspace) return notFound();

  const isPartner = !partner.isContact;
  let role: Role = Role.user;
  const adminContact =
    partner.isContact &&
    partner.contactWorkspaceConfigSet?.find(
      (c: any) =>
        c.portalWorkspace?.url === workspaceURL &&
        c?.partner?.id === user.mainPartnerId,
    )?.isAdmin;
  if (adminContact) role = Role.admin;
  if (isPartner) role = Role.owner;

  const type = Object.entries(PartnerTypeMap).find(
    ([, value]) => value === partner.partnerTypeSelect,
  )?.[0];

  let partners =
    (partner.isContact &&
      partner.contactWorkspaceConfigSet
        ?.map(config => config.partner)
        ?.filter(Boolean)
        ?.map((p: any) => ({
          id: p.id?.toString(),
          name: p.name,
        }))) ||
    [];
  partners = uniqBy(partners, 'id');

  const settings = {
    type,
    companyName: partner.name,
    identificationNumber: partner.registrationCode,
    companyNumber: partner.fixedPhone,
    firstName: partner.firstName,
    name: partner.name,
    email: partner.emailAddress?.address,
    picture: partner.picture?.id,
    fullName: partner.fullName,
    role,
    mainPartner: user.mainPartnerId?.toString(),
    linkedinLink: partner.linkedinLink,
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow={await t('Profile')}
        title={await t('Identity')}
        description={await t(
          'Manage how your profile is displayed across Goovee.',
        )}
      />
      <PersonalForm settings={settings as any} partners={partners} />

      <Divider />
      <SectionHeader
        eyebrow={await t('Profile')}
        title={await t('Preferences')}
        description={await t('Default workspace and locale.')}
      />
      <PreferencesForm />

      <Divider />
      <SectionHeader
        eyebrow={await t('Profile')}
        title={await t('Directory visibility')}
        description={await t(
          'Control what other partners can see about you in the directory.',
        )}
      />
      <DirectoryForm
        partner={partner as any}
        isPartner={isPartner}
        isAdminContact={Boolean(isAdminContactUser)}
      />
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
