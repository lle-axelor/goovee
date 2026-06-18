import type {Cloned} from '@/types/util';

// ---- CORE IMPORTS ----//
import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {PortalWorkspace} from '@/orm/workspace';
import {t} from '@/locale/server';
import {getSession} from '@/auth';

// ---- LOCAL IMPORTS ---- //
import {
  findCategoryTitleBySlugName,
  findNewsAttachments,
  findNewsRelatedNews,
} from '@/subapps/news/common/orm/news';
import {
  FeedList,
  SocialMedia,
  AttachmentList,
  Breadcrumbs,
} from '@/subapps/news/common/ui/components';
import {
  RECOMMENDED_NEWS,
  RELATED_FILES,
  RELATED_NEWS,
} from '@/subapps/news/common/constants';
import {
  Comments,
  COMMENTS,
  isCommentEnabled,
  SORT_TYPE,
} from '@/lib/core/comments';
import {
  createComment,
  fetchComments,
  findRecommendedNews,
} from '@/subapps/news/common/actions/action';

interface CategorySegment {
  slug: string;
}

export async function BreadcrumbsWrapper({
  workspace,
  client,
  segments,
  newsTitle,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  segments: string[];
  newsTitle: string;
  user: any;
}) {
  async function getBreadcrumbs() {
    const results = segments?.map(async (segment: string, index: number) => {
      const categorySegment: CategorySegment = {slug: segment};

      try {
        const categoryTitle = await findCategoryTitleBySlugName({
          slug: categorySegment,
          workspace,
          client,
          user,
        });
        if (!categoryTitle) {
          return '';
        }
        return {id: index + 1, title: categoryTitle, slug: segment};
      } catch (error) {
        console.error(error);
        return '';
      }
    });

    return await Promise.all(results);
  }

  const breadcrumbs = await getBreadcrumbs();

  return <Breadcrumbs items={breadcrumbs} title={newsTitle} />;
}

export async function SocialMediaWrapper({
  workspace,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const enableSocialMediaSharing = workspace.config?.enableSocialMediaSharing;
  const availableSocials = workspace.config?.socialMediaSelect;

  /**
   * Temporarly Disabled the rendering of Social Media Icons
   */
  if (true) {
    return;
  }
  if (!enableSocialMediaSharing) {
    return null;
  }

  return <SocialMedia availableSocials={availableSocials} />;
}

export async function AttachmentListWrapper({
  workspace,
  client,
  slug,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const attachmentList = await findNewsAttachments({
    workspace,
    client,
    slug,
    user,
  });

  if (!attachmentList?.length) {
    return null;
  }

  const title = await t(RELATED_FILES);

  return (
    <AttachmentList
      slug={slug}
      title={title}
      items={attachmentList}
      width="w-full"
    />
  );
}

export async function RelatedNewsWrapper({
  workspace,
  client,
  slug,
  navigatingPathFrom,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  navigatingPathFrom: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const relatedNewsSet = await findNewsRelatedNews({
    workspace,
    client,
    slug,
    user,
  });

  if (!relatedNewsSet?.length) {
    return null;
  }

  const title = await t(RELATED_NEWS);
  return (
    <FeedList
      title={title}
      items={relatedNewsSet}
      width="w-full"
      navigatingPathFrom={navigatingPathFrom}
    />
  );
}

export async function RecommendedNewsWrapper({
  navigatingPathFrom,
  isRecommendationEnable,
  workspaceURL,
  tenantId,
  categoryIds,
}: {
  navigatingPathFrom: string;
  isRecommendationEnable: boolean;
  workspaceURL: string;
  tenantId: string;
  categoryIds: any;
}) {
  if (!isRecommendationEnable) {
    return;
  }

  const news = await findRecommendedNews({
    workspaceURL,
    tenantId,
    categoryIds,
  });
  const title = await t(RECOMMENDED_NEWS);

  if (!news?.length) {
    return null;
  }

  return (
    <FeedList
      title={title}
      items={news}
      width="w-full"
      navigatingPathFrom={navigatingPathFrom}
    />
  );
}

export async function CommentsWrapper({
  workspace,
  user,
  news,
  workspaceURI,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user: any;
  news: any;
  workspaceURI: string;
}) {
  const title = await t(COMMENTS);

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.news,
    workspace,
  });
  const isDisabled = !user ? true : false;

  if (!enableComment) {
    return null;
  }

  return (
    <div className="w-full mb-24 lg:mb-4">
      <div className="p-4 bg-white flex flex-col gap-4 rounded-lg">
        <div>
          <div className="text-xl font-semibold">{title}</div>
        </div>

        <Comments
          recordId={news.id}
          subapp={SUBAPP_CODES.news}
          disabled={isDisabled}
          inputPosition="bottom"
          sortBy={SORT_TYPE.old}
          showCommentsByDefault
          hideCommentsHeader
          hideSortBy
          hideTopBorder
          hideCloseComments
          showRepliesInMainThread
          trackingField="publicBody"
          commentField="note"
          createComment={createComment}
          fetchComments={fetchComments}
          attachmentDownloadUrl={`${workspaceURI}/${SUBAPP_CODES.news}/api/comments/attachments/${news.id}`}
        />
      </div>
    </div>
  );
}
