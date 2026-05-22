'use client';

import {useRouter} from 'next/navigation';
import React from 'react';
import {MdOutlineFileDownload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {download} from '@/utils/files';
import {formatDate} from '@/locale/formatters';

import {SUBAPP_CODES} from '@/constants';
// ---- LOCAL IMPORTS ---- //
import {FileIcon} from '@/ui/components/file-icon';

export function ResourceList({resources}: any) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const handleRedirection = (resource: any) => () => {
    router.push(`${workspaceURI}/resources/${resource.id}`);
  };

  const handleDownload = (record: any) => (event: React.MouseEvent) => {
    event.stopPropagation();
    const href = `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${record?.id}`;
    download(record, href);
  };

  return (
    <div className="rounded-xl bg-white border border-ink-100 shadow-xs overflow-hidden">
      {resources?.length ? (
        <ul className="divide-y divide-ink-100">
          {resources?.map((resource: any) => {
            const author = resource.createdBy?.name || '--';
            const date = formatDate(resource?.createdOn) || '--';
            const size = resource?.metaFile?.sizeText || '--';
            const parent = resource?.parent?.fileName || '--';

            return (
              <li
                className={cn(
                  'py-3 px-4 cursor-pointer transition-colors hover:bg-ink-25',
                )}
                key={resource.id}
                onClick={handleRedirection(resource)}>
                <div className="leading-5 text-sm space-y-1.5">
                  <div className="grid grid-cols-[1fr_36px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,80px)_36px] items-center gap-x-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon
                        fileType={resource.metaFile?.fileType}
                        className={'h-7 w-7 shrink-0'}
                      />
                      <h3 className="font-semibold text-ink-900 truncate min-w-0 flex-1">
                        {resource.fileName}
                      </h3>
                    </div>
                    <p className="hidden lg:inline-block truncate whitespace-nowrap min-w-0 text-ink-500 text-xs">
                      {parent}
                    </p>
                    <p className="hidden lg:inline-block whitespace-nowrap text-ink-500 text-xs">
                      {author}
                    </p>
                    <p className="hidden lg:inline-block whitespace-nowrap text-ink-500 text-xs tabular-nums">
                      {date}
                    </p>
                    <p className="hidden lg:inline-block whitespace-nowrap text-ink-500 text-xs tabular-nums text-end">
                      {size}
                    </p>
                    <button
                      type="button"
                      aria-label={i18n.t('Download')}
                      className="ms-auto lg:ms-0 grid place-items-center h-9 w-9 rounded-lg bg-royal-pale text-royal hover:bg-royal hover:text-white transition-colors"
                      onClick={handleDownload(resource)}>
                      <MdOutlineFileDownload className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="lg:hidden flex gap-3 items-center justify-between text-xs text-ink-500">
                    <p className="truncate whitespace-nowrap">{parent}</p>
                    <p className="whitespace-nowrap">{author}</p>
                    <p className="whitespace-nowrap tabular-nums">{date}</p>
                    <p className="whitespace-nowrap tabular-nums">{size}</p>
                  </div>
                  {resource?.metaFile?.description && (
                    <p className="leading-snug text-xs text-ink-500 line-clamp-2 mt-1">
                      <span className="font-semibold">
                        {i18n.t('Description')}:
                      </span>{' '}
                      {resource?.metaFile?.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-6 px-4 text-center text-sm text-ink-400">
          {i18n.t('No resources available.')}
        </p>
      )}
    </div>
  );
}

export default ResourceList;
