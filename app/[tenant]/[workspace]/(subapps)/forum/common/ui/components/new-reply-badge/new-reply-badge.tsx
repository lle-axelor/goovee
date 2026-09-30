'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

// MBI: replies posted less than 24 hours ago are flagged with a "New" badge.
const NEW_REPLY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isNewReply(createdOn?: string | Date | null): boolean {
  if (!createdOn) return false;
  const time = new Date(createdOn).getTime();
  return !Number.isNaN(time) && Date.now() - time < NEW_REPLY_MAX_AGE_MS;
}

export function NewReplyBadge() {
  return (
    <span className="shrink-0 text-[10px] font-bold px-1.5 py-px rounded-full bg-mint-500 text-white uppercase tracking-wide">
      {i18n.t('New')}
    </span>
  );
}
