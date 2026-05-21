import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {FaChevronRight} from 'react-icons/fa';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {clone} from '@/utils';
import {encodeFilter, getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components';
import {ALL_TICKETS_TITLE} from '../../../../common/constants';
import {
  findMainPartnerContacts,
  findProject,
  findTicketCategories,
  findTicketPriorities,
  findTicketStatuses,
} from '../../../../common/orm/projects';
import {findTicketAccess} from '../../../../common/orm/tickets';
import {ensureAuth} from '../../../../common/utils/auth-helper';
import {EncodedFilter} from '../../../../common/utils/validators';
import {Form} from './client-form';

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'project-id': string;
  }>;
  searchParams: Promise<{
    parentId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const projectId = params['project-id'];
  const {parentId} = searchParams;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);
  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenant);
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.ticketing}/projects/${projectId}/tickets/create?${new URLSearchParams(searchParams).toString()}`,
        workspaceURI,
        tenant,
      }),
    );
  }

  if (error) notFound();
  const {workspace} = auth;

  if (parentId) {
    const parentTicket = await findTicketAccess({
      recordId: parentId,
      select: {project: {id: true}},
      auth,
    });
    if (parentTicket?.project?.id !== projectId) notFound();
  }

  const [project, statuses, categories, priorities, contacts] =
    await Promise.all([
      findProject(projectId, auth),
      findTicketStatuses(projectId, auth.tenant.client),
      findTicketCategories(projectId, auth.tenant.client).then(clone),
      findTicketPriorities(projectId, auth.tenant.client).then(clone),
      findMainPartnerContacts(projectId, auth.tenant.client).then(clone),
    ]);

  if (!project) notFound();

  const ticketsURL = `${workspaceURI}/ticketing/projects/${projectId}/tickets`;
  const status = statuses.filter(s => !s.isCompleted).map(s => s.id);
  const allTicketsURL = `${ticketsURL}?filter=${encodeFilter<EncodedFilter>({status})}&title=${encodeURIComponent(ALL_TICKETS_TITLE)}`;

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container py-6 space-y-5 max-w-4xl">
        <Breadcrumb className="flex-shrink">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer truncate text-sm">
                <Link href={`${workspaceURI}/ticketing`}>
                  {await t('Projects')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <FaChevronRight className="text-ink-300" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer max-w-[8ch] md:max-w-[35ch] truncate text-sm">
                <Link href={`${workspaceURI}/ticketing/projects/${projectId}`}>
                  {project.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <FaChevronRight className="text-ink-300" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer text-sm">
                <Link href={allTicketsURL}>{await t(ALL_TICKETS_TITLE)}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <FaChevronRight className="text-ink-300" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate text-sm text-ink-700 font-medium">
                {await t('Create a ticket')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
            {await t('Support')}
          </p>
          <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
            {await t('Create a ticket')}
          </h1>
          <p className="text-sm text-ink-500 mt-2">
            {await t('Describe your request to open a new support ticket.')}
          </p>
        </header>
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
          <Form
            projectId={projectId}
            categories={categories}
            priorities={priorities}
            contacts={contacts}
            userId={auth.user.id}
            parentId={parentId}
            workspaceURI={workspaceURI}
            formFields={clone(workspace.config.ticketingFormFieldSet)}
          />
        </div>
      </div>
    </div>
  );
}
