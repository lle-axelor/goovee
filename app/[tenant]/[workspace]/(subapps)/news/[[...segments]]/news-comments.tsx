'use client';

import {useCallback} from 'react';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {useTrack} from '@/lib/analytics/use-track';
import {Comments, type CommentsProps} from '@/lib/core/comments';
import type {CreateComment} from '@/lib/core/comments';

type NewsCommentsProps = Omit<CommentsProps, 'createComment'> & {
  createComment: CreateComment;
  newsId: string | number;
};

/**
 * Thin client wrapper around the shared <Comments> component that fires the
 * `comment_news` analytics event after a successful comment creation.
 */
export function NewsComments({
  createComment,
  newsId,
  ...rest
}: NewsCommentsProps) {
  const trackEvent = useTrack(SUBAPP_CODES.news);

  const trackedCreateComment: CreateComment = useCallback(
    async formData => {
      const result = await createComment(formData);
      if (!result?.error) {
        let commentLength = 0;
        try {
          const content = formData.get('content');
          if (typeof content === 'string') {
            const parsed = JSON.parse(content);
            const text = parsed?.data?.text;
            if (typeof text === 'string') {
              commentLength = text.length;
            }
          }
        } catch {
          // ignore — fall back to length 0
        }
        trackEvent('comment_news', {
          news_id: String(newsId),
          comment_length: commentLength,
        });
      }
      return result;
    },
    [createComment, newsId, trackEvent],
  );

  return <Comments {...rest} createComment={trackedCreateComment} />;
}

export default NewsComments;
