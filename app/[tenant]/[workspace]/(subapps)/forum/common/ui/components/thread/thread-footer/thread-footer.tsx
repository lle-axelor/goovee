'use client';

import {useCallback, useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled, Comments} from '@/comments';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {PortalWorkspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import {
  COMMENTS_PER_LOAD,
  JOIN_GROUP_TO_COMMENT,
} from '@/subapps/forum/common/constants';
import {
  fetchComments,
  createComment,
} from '@/subapps/forum/common/action/action';
import {PostWithMembership} from '@/subapps/forum/common/types/forum';
import {useTrack} from '@/lib/analytics/use-track';

export const ThreadFooter = ({
  post,
  showCommentsByDefault,
  hideCloseComments = false,
  usePopUpStyles = false,
  workspace,
}: {
  post?: PostWithMembership;
  showCommentsByDefault: boolean;
  hideCloseComments?: boolean;
  usePopUpStyles?: boolean;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) => {
  const isAllowToComment = useMemo(() => post?.isMember, [post]);

  const {workspaceURI} = useWorkspace();
  const trackEvent = useTrack(SUBAPP_CODES.forum);

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.forum,
    workspace: workspace,
  });

  const trackedCreateComment = useCallback(
    async (formData: FormData) => {
      let bodyLength = 0;
      try {
        const content = formData.get('content');
        if (typeof content === 'string') {
          const parsed = JSON.parse(content);
          bodyLength =
            typeof parsed?.data?.text === 'string'
              ? parsed.data.text.length
              : 0;
        }
      } catch {
        // ignore — tracking should never break the action
      }

      const result = await createComment(formData);

      if (!result?.error) {
        trackEvent('reply_forum_post', {
          forum_post_id: String(post?.id),
          ...(post?.forumGroup?.id !== undefined && {
            forum_group_id: String(post.forumGroup.id),
          }),
          body_length: bodyLength,
        });
      }

      return result;
    },
    [post?.id, post?.forumGroup?.id, trackEvent],
  );

  if (!post) return <div />;

  return enableComment ? (
    <Comments
      recordId={post.id}
      subapp={SUBAPP_CODES.forum}
      showCommentsByDefault={showCommentsByDefault}
      hideCloseComments={hideCloseComments}
      usePopUpStyles={usePopUpStyles}
      disabled={!isAllowToComment}
      inputContainerClassName={!usePopUpStyles ? 'px-4' : ''}
      limit={COMMENTS_PER_LOAD}
      trackingField="publicBody"
      commentField="note"
      fetchComments={fetchComments}
      createComment={trackedCreateComment}
      {...(!isAllowToComment && {
        placeholder: JOIN_GROUP_TO_COMMENT,
      })}
      attachmentDownloadUrl={`${workspaceURI}/${SUBAPP_CODES.forum}/api/comments/attachments/${post.id}`}
    />
  ) : (
    <div />
  );
};

export default ThreadFooter;
