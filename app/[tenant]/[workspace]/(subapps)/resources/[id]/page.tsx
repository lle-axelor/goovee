import {notFound} from 'next/navigation';
import React from 'react';
import {MdHistory, MdWeb} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {t} from '@/locale/server';
import {fetchFile} from '@/subapps/resources/common/orm/dms';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import DownloadIcon from './download-icon';
import HTMLViewer from './html-viewer';
import ImageViewer from './image-viewer';
import PDFViewer from './pdf-viewer';
import {PostedBy} from '@/subapps/resources/common/ui/components';

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
  const {workspaceURL} = workspacePathname(params);

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

  if (!workspace) {
    return notFound();
  }

  const file = await fetchFile({
    id,
    client,
    workspace,
    user,
  }).then(clone);

  if (!file) {
    return notFound();
  }

  let Viewer = viewer[file?.metaFile?.fileType || file?.contentType || ''];

  if (!Viewer) {
    // eslint-disable-next-line react/display-name
    Viewer = async () => (
      <p>{await t('No viewer available for this file type.')}</p>
    );
  }

  const name = file?.fileName || '--';
  const date = file?.createdOn! || '--';
  const author = file?.createdBy?.name || '--';
  const size = file?.metaFile?.sizeText || '--';

  return (
    <div className="bg-ink-25 min-h-full flex-1 flex flex-col">
      <main className="container p-4 mx-auto space-y-5 py-6 flex-1 flex flex-col min-h-0">
        <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
          <div className="flex items-start gap-4">
            <div className="grow min-w-0 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <MdWeb className="h-7 w-7 text-royal shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
                    {await t('Document')}
                  </p>
                  <h1 className="font-bold text-2xl text-ink-900 leading-tight tracking-[-0.01em] break-words">
                    {name}
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500 leading-tight">
                <PostedBy date={date} author={author} />
                <span className="tabular-nums">
                  <span className="font-semibold text-ink-700">
                    {await t('Size')}:
                  </span>{' '}
                  {size}
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <MdHistory className="hidden h-10 w-10 text-ink-400 cursor-pointer" />
              <DownloadIcon record={file} />
            </div>
          </div>
        </section>
        <section className="bg-white rounded-xl border border-ink-100 shadow-xs flex-1 min-h-0 overflow-auto">
          <Viewer record={file} />
        </section>
      </main>
    </div>
  );
}
