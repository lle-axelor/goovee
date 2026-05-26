import Link from 'next/link';
import {
  MdArrowForward,
  MdAutoAwesome,
  MdFiberNew,
  MdStar,
} from 'react-icons/md';

import {SUBAPP_CODES} from '@/constants';
import {formatDateTime} from '@/lib/core/locale/formatters';
import {cn} from '@/utils/css';

import {DocFileIcon, FolderIcon} from '../doc-file-icon';

export interface DocsHomeViewLabels {
  greeting: string;
  subtitle: string;
  pinnedTitle: string;
  pinnedSubtitle: string;
  pinnedEmptyTitle: string;
  pinnedEmptySubtitle: string;
  recentsTitle: string;
  recentsEmpty: string;
  newTitle: string;
  newSubtitle: string;
  newEmpty: string;
  documentsLabel: string;
  documentsLabelOne: string;
  updatedLabel: string;
  newBadge: string;
  inFolder: string;
}

export function DocsHomeView({
  pinnedFolders,
  recentFiles,
  newFiles,
  workspaceURI,
  labels,
}: {
  pinnedFolders: any[];
  recentFiles: any[];
  newFiles: any[];
  workspaceURI: string;
  labels: DocsHomeViewLabels;
}) {
  return (
    <div className="px-6 md:px-9 py-8 max-w-[1280px] mx-auto">
      {/* Greeting */}
      <header className="mb-7">
        <h1 className="text-[28px] font-extrabold text-ink-900 tracking-[-0.025em] leading-tight">
          {labels.greeting}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{labels.subtitle}</p>
      </header>

      {/* Pinned folders */}
      <section className="mb-9">
        <header className="flex items-center gap-2 mb-4">
          <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-palette-orange-light text-palette-orange-dark">
            <MdStar className="text-base" />
          </span>
          <h2 className="m-0 text-lg font-bold text-ink-900 tracking-[-0.015em]">
            {labels.pinnedTitle}
          </h2>
          {pinnedFolders.length > 0 && (
            <span className="text-xs font-semibold text-ink-500 tabular-nums">
              · {pinnedFolders.length}
            </span>
          )}
        </header>

        {pinnedFolders.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-2xl px-6 py-10 text-center">
            <p className="text-[15px] font-semibold text-ink-700">
              {labels.pinnedEmptyTitle}
            </p>
            <p className="mt-1 text-[13px] text-ink-500">
              {labels.pinnedEmptySubtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pinnedFolders.map(folder => (
              <PinnedFolderCard
                key={folder.id}
                folder={folder}
                workspaceURI={workspaceURI}
                labels={labels}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recents + News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section id="recents" className="bg-white border border-ink-100 rounded-2xl shadow-xs overflow-hidden scroll-mt-6">
          <header className="px-5 py-4 border-b border-ink-100 flex items-center gap-2">
            <MdAutoAwesome className="text-royal text-base" />
            <h2 className="m-0 text-[15px] font-bold text-ink-900">
              {labels.recentsTitle}
            </h2>
          </header>
          {recentFiles.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-ink-500">
              {labels.recentsEmpty}
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {recentFiles.slice(0, 5).map(file => (
                <li key={file.id}>
                  <Link
                    href={`${workspaceURI}/${SUBAPP_CODES.resources}/${file.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-ink-25 transition-colors">
                    <DocFileIcon
                      fileType={file.metaFile?.fileType}
                      fileName={file.fileName}
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink-900 truncate">
                        {file.fileName}
                      </div>
                      <div className="text-[11.5px] text-ink-500 truncate">
                        {file.parent?.fileName && (
                          <>
                            {labels.inFolder}{' '}
                            <span className="text-ink-700">
                              {file.parent.fileName}
                            </span>{' '}
                            ·{' '}
                          </>
                        )}
                        {file.metaFile?.updatedOn &&
                          formatDateTime(file.metaFile.updatedOn, {
                            dateFormat: 'MMM D YYYY',
                          })}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="new" className="bg-white border border-ink-100 rounded-2xl shadow-xs overflow-hidden scroll-mt-6">
          <header className="px-5 py-4 border-b border-ink-100 flex items-center gap-2">
            <MdFiberNew className="text-mint-500 text-base" />
            <h2 className="m-0 text-[15px] font-bold text-ink-900">
              {labels.newTitle}
            </h2>
            {newFiles.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-mint-100 text-mint-700 text-[11px] font-extrabold tabular-nums">
                {newFiles.length}
              </span>
            )}
          </header>
          {newFiles.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-ink-500">
              {labels.newEmpty}
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {newFiles.slice(0, 5).map(file => (
                <li key={file.id}>
                  <Link
                    href={`${workspaceURI}/${SUBAPP_CODES.resources}/${file.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-ink-25 transition-colors">
                    <DocFileIcon
                      fileType={file.metaFile?.fileType}
                      fileName={file.fileName}
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink-900 truncate">
                          {file.fileName}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-px rounded-full bg-mint-50 text-mint-700 text-[10px] font-extrabold uppercase tracking-[0.04em] shrink-0">
                          {labels.newBadge}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-ink-500 truncate">
                        {file.parent?.fileName && (
                          <>
                            {labels.inFolder}{' '}
                            <span className="text-ink-700">
                              {file.parent.fileName}
                            </span>{' '}
                            ·{' '}
                          </>
                        )}
                        {file.createdOn &&
                          formatDateTime(file.createdOn, {
                            dateFormat: 'MMM D YYYY',
                          })}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function PinnedFolderCard({
  folder,
  workspaceURI,
  labels,
}: {
  folder: any;
  workspaceURI: string;
  labels: DocsHomeViewLabels;
}) {
  const parentName = folder.parent?.fileName;
  const itemCount: number = folder.itemCount ?? 0;
  const updatedOn = folder.updatedOn;

  return (
    <Link
      href={`${workspaceURI}/${SUBAPP_CODES.resources}/folder/${folder.id}`}
      className={cn(
        'group bg-white border border-ink-100 rounded-2xl p-5 shadow-xs',
        'flex flex-col gap-3.5 transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-soft-md',
      )}>
      <div className="flex items-start gap-3">
        <FolderIcon colorSelect={folder.colorSelect} size={44} />
        <div className="flex-1 min-w-0">
          {parentName && (
            <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink-500 mb-1 truncate">
              {parentName}
            </div>
          )}
          <h3 className="m-0 text-base font-bold text-ink-900 tracking-[-0.01em] line-clamp-2 leading-snug">
            {folder.fileName}
          </h3>
        </div>
        <MdArrowForward className="text-ink-300 text-sm shrink-0 group-hover:text-royal transition-colors mt-1" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-ink-100 text-[12px] text-ink-500">
        <span className="tabular-nums">
          {itemCount}{' '}
          {itemCount === 1 ? labels.documentsLabelOne : labels.documentsLabel}
        </span>
        {updatedOn && (
          <span>
            {labels.updatedLabel}{' '}
            {formatDateTime(updatedOn, {dateFormat: 'MMM D'})}
          </span>
        )}
      </div>
    </Link>
  );
}
