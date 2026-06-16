'use client';

import {MdOutlineForum} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {formatRelativeTime} from '@/locale/formatters';

function highlight(text: string, query?: string) {
  const t = text || '';
  const q = (query || '').trim();
  if (!q) return t;
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return t;
  return (
    <>
      {t.slice(0, i)}
      <mark className="bg-[#fff1c2] text-inherit rounded-[2px] p-0">
        {t.slice(i, i + q.length)}
      </mark>
      {t.slice(i + q.length)}
    </>
  );
}

export function SearchItem({
  result,
  onClick,
  query,
}: {
  result: any;
  onClick: (result: {id: string; title: string}) => void;
  query?: string;
}) {
  const {title, forumGroup, postDateT, createdOn} = result;
  const date = postDateT || createdOn;

  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => onClick(result)}>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-royal-pale text-royal">
        <MdOutlineForum className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink-900 leading-snug line-clamp-2">
          {highlight(title, query)}
        </div>
        {date && (
          <div className="text-[11px] text-ink-400 mt-0.5">
            {formatRelativeTime(date)}
          </div>
        )}
      </div>
      {forumGroup?.name && (
        <span className="shrink-0 px-2 py-0.5 rounded-md bg-royal-pale text-royal-dark text-[10px] font-bold">
          {forumGroup.name}
        </span>
      )}
    </div>
  );
}

export default SearchItem;
