'use client';

import {useCallback, useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {Comments, SORT_TYPE} from '@/comments';
import type {CreateComment, FetchComments} from '@/comments';
import {SUBAPP_CODES} from '@/constants';
import {useTrack} from '@/lib/analytics/use-track';
import type {ID} from '@/types';
import {unpackFromFormData} from '@/utils/formdata';

type Props = {
  ticketId: ID;
  attachmentDownloadUrl: string;
  createComment: CreateComment;
  fetchComments: FetchComments;
};

/**
 * Thin wrapper around <Comments> that fires the `comment_ticket` analytics event
 * after a comment is successfully created on a ticket (ProjectTask).
 */
export function TicketComments({
  ticketId,
  attachmentDownloadUrl,
  createComment,
  fetchComments,
}: Props) {
  const trackEvent = useTrack(SUBAPP_CODES.ticketing);

  const trackedCreateComment = useCallback<CreateComment>(
    async (formData: FormData) => {
      const result = await createComment(formData);
      if (!result.error) {
        let commentLength = 0;
        try {
          const payload = unpackFromFormData(formData) as {
            data?: {text?: string};
          } | null;
          commentLength = payload?.data?.text?.length ?? 0;
        } catch {
          // ignore — tracking should never break the user flow
        }
        trackEvent('comment_ticket', {
          project_task_id: String(ticketId),
          comment_length: commentLength,
        });
      }
      return result;
    },
    [createComment, trackEvent, ticketId],
  );

  // Force a fresh subtree per ticket id, mirroring the previous key={Math.random()}.
  const remountKey = useMemo(() => String(ticketId), [ticketId]);

  return (
    <Comments
      key={remountKey}
      recordId={ticketId}
      subapp={SUBAPP_CODES.ticketing}
      sortBy={SORT_TYPE.new}
      showCommentsByDefault
      hideTopBorder
      hideSortBy
      hideCloseComments
      hideCommentsHeader
      showRepliesInMainThread
      trackingField="publicBody"
      commentField="note"
      createComment={trackedCreateComment}
      fetchComments={fetchComments}
      attachmentDownloadUrl={attachmentDownloadUrl}
    />
  );
}
