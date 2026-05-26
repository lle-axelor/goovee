import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {manager} from '@/lib/core/tenant';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import {
  fetchFiles,
  fetchFolderWithParent,
} from '@/subapps/resources/common/orm/dms';
import {
  DocsFolderView,
  type DocsFolderViewLabels,
} from '@/subapps/resources/common/ui/components';

const NEW_CUTOFF_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; id: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId, id} = params;

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

  const [folder, files, labels] = await Promise.all([
    fetchFolderWithParent({id, workspace, client, user}).then(clone),
    fetchFiles({id, workspace, client, user}).then(clone),
    buildLabels(),
  ]);

  if (!folder) return notFound();

  return (
    <DocsFolderView
      folder={folder as any}
      files={(files as any[]) ?? []}
      workspaceURI={workspaceURI}
      labels={labels}
    />
  );
}

async function buildLabels(): Promise<DocsFolderViewLabels> {
  const [
    rootCrumb,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
    columnDocument,
    columnAuthor,
    columnDate,
    columnSize,
    newBadge,
    emptyTitle,
    emptySubtitle,
  ] = await Promise.all([
    t('Documents'),
    t('documents'),
    t('document'),
    t('Last updated'),
    t('Document'),
    t('Author'),
    t('Date'),
    t('Size'),
    t('New'),
    t('No documents yet'),
    t('This folder is empty for now.'),
  ]);

  return {
    rootCrumb,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
    columnDocument,
    columnAuthor,
    columnDate,
    columnSize,
    newBadge,
    newCutoffMs: NEW_CUTOFF_MS,
    emptyTitle,
    emptySubtitle,
  };
}
