import {notFound} from 'next/navigation';
import React from 'react';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {t} from '@/locale/server';
import {SUBAPP_CODES} from '@/constants';
import {fetchFile, fetchFiles} from '@/subapps/resources/common/orm/dms';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import HTMLViewer from './html-viewer';
import ImageViewer from './image-viewer';
import PDFViewer from './pdf-viewer';
import {
  DocsViewerShell,
  type DocsViewerShellLabels,
} from '@/subapps/resources/common/ui/components';

const NEW_CUTOFF_MS = 14 * 24 * 60 * 60 * 1000;

function computeIsNew(createdOn: any, cutoffMs: number): boolean {
  if (!createdOn) return false;
  const ts = new Date(createdOn).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < cutoffMs;
}

const viewer: Record<string, React.JSXElementConstructor<any>> = {
  'application/pdf': PDFViewer,
  'image/jpeg': ImageViewer,
  'image/jpg': ImageViewer,
  'image/png': ImageViewer,
  'image/vnd.microsoft.icon': ImageViewer,
  'text/html': HTMLViewer,
  html: HTMLViewer,
};

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; id: string}>;
}) {
  const params = await props.params;
  const {id, tenant: tenantId} = params;
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  const file = await fetchFile({id, client, workspace, user}).then(clone);
  if (!file) return notFound();

  // Siblings: other files in the same parent folder
  const parentId = (file as any).parent?.id;
  const siblings = parentId
    ? await fetchFiles({id: parentId, client, workspace, user}).then(clone)
    : [];

  const labels = await buildLabels();

  let Viewer = viewer[file?.metaFile?.fileType || file?.contentType || ''];
  if (!Viewer) {
    // eslint-disable-next-line react/display-name
    Viewer = async () => (
      <div className="p-8 text-center text-sm text-ink-500">
        {await t('No viewer available for this file type.')}
      </div>
    );
  }

  const backHref = parentId
    ? `${workspaceURI}/${SUBAPP_CODES.resources}/folder/${parentId}`
    : `${workspaceURI}/${SUBAPP_CODES.resources}`;

  // Download URL (existing route handler)
  const fileMetaId = (file as any)?.metaFile?.id ?? null;
  const downloadHref = fileMetaId
    ? `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${fileMetaId}`
    : null;

  const isNew = computeIsNew((file as any).createdOn, NEW_CUTOFF_MS);

  return (
    <DocsViewerShell
      file={file as any}
      workspaceURI={workspaceURI}
      backHref={backHref}
      downloadHref={downloadHref}
      siblings={(siblings as any[]) ?? []}
      isNew={isNew}
      labels={labels}>
      <Viewer record={file} />
    </DocsViewerShell>
  );
}

async function buildLabels(): Promise<DocsViewerShellLabels> {
  const [
    backLabel,
    newBadge,
    printLabel,
    shareLabel,
    downloadLabel,
    detailsTitle,
    authorLabel,
    categoryLabel,
    folderLabel,
    formatLabel,
    sizeLabel,
    publishedLabel,
    copyLinkLabel,
    copiedLabel,
    sendEmailLabel,
    followUpdatesLabel,
    sameFolderTitle,
    sameFolderEmpty,
  ] = await Promise.all([
    t('Back'),
    t('New'),
    t('Print'),
    t('Share'),
    t('Download'),
    t('Details'),
    t('Author'),
    t('Category'),
    t('Folder'),
    t('Format'),
    t('Size'),
    t('Published on'),
    t('Copy link'),
    t('Copied!'),
    t('Send by email'),
    t('Follow updates'),
    t('In the same folder'),
    t('No other documents here yet.'),
  ]);

  return {
    backLabel,
    newBadge,
    printLabel,
    shareLabel,
    downloadLabel,
    detailsTitle,
    authorLabel,
    categoryLabel,
    folderLabel,
    formatLabel,
    sizeLabel,
    publishedLabel,
    copyLinkLabel,
    copiedLabel,
    sendEmailLabel,
    followUpdatesLabel,
    sameFolderTitle,
    sameFolderEmpty,
  };
}
