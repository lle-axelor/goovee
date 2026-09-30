'use client';

import {MdReply} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatRelativeTime} from '@/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import type {LastReply} from '@/subapps/forum/common/orm/forum';
import {isNewReply, NewReplyBadge} from '../new-reply-badge';

function stripHtml(html?: string | null) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * MBI: latest reply of a discussion, shown on its card in the feed and group
 * lists so replies are visible without opening the discussion.
 */
export function LastReplyPreview({reply}: {reply?: LastReply | null}) {
  const text = stripHtml(reply?.note);
  if (!reply || !text) return null;

  return (
    <div className="mt-3 border-l-2 border-royal-border pl-3 text-[12.5px] text-ink-600">
      <div className="flex items-center gap-1.5 flex-wrap text-ink-500">
        <MdReply className="size-3.5 -scale-x-100 text-royal" />
        <span className="font-semibold text-ink-700">
          {i18n.t('Last reply')}
        </span>
        {reply.author && <span>· {reply.author}</span>}
        {reply.createdOn && (
          <span>· {formatRelativeTime(reply.createdOn)}</span>
        )}
        {isNewReply(reply.createdOn) && <NewReplyBadge />}
      </div>
      <p className="mt-1 leading-relaxed line-clamp-2">{text}</p>
    </div>
  );
}
