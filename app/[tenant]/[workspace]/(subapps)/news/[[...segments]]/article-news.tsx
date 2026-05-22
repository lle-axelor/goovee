import {notFound} from 'next/navigation';
import type {Cloned} from '@/types/util';
import {Suspense} from 'react';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {PortalWorkspace} from '@/orm/workspace';
import {CommentsSkeleton} from '@/lib/core/comments';

// ---- LOCAL IMPORTS ---- //
import {
  FeedListSkeleton,
  NewsInfoSkeleton,
  SocialMediaSkeleton,
  AttachmentListSkeleton,
  BreadcrumbsSkeleton,
} from '@/subapps/news/common/ui/components';
import {
  AttachmentListWrapper,
  CommentsWrapper,
  NewsInfoWrapper,
  RecommendedNewsWrapper,
  RelatedNewsWrapper,
  SocialMediaWrapper,
  BreadcrumbsWrapper,
} from '@/subapps/news/[[...segments]]/wrappers';
import {findNews} from '@/subapps/news/common/orm/news';

export async function ArticleNews({
  workspace,
  segments,
  client,
  tenantId,
  workspaceURL,
  workspaceURI,
  user,
  slug,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  segments: string[];
  client: Client;
  tenantId: string;
  workspaceURL: string;
  workspaceURI: string;
  user: any;
  slug: string;
}) {
  const {news}: any = await findNews({
    slug,
    workspace,
    client,
    user,
    params: {
      select: {
        content: true,
        author: {
          simpleFullName: true,
          picture: {id: true},
        },
      },
    },
  }).then(clone);

  const [newsObject] = news;

  if (!newsObject) {
    return notFound();
  }

  const slicedSegments = segments.slice(0, -2);
  const categoryIds = newsObject?.categorySet?.map((item: any) => item.id);

  const segmentPath = slicedSegments?.length
    ? `/${slicedSegments.join('/')}`
    : '';

  const navigatingPathFromURL = `${SUBAPP_CODES.news}${segmentPath}`;
  const directRoute = !slicedSegments?.length;

  const isRecommendationEnable =
    workspace.config?.enableRecommendedNews || false;

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container mx-auto grid grid-cols-1 gap-6 py-6">
        {!directRoute && (
          <Suspense fallback={<BreadcrumbsSkeleton />}>
            <BreadcrumbsWrapper
              workspace={workspace}
              client={client}
              segments={slicedSegments}
              newsTitle={newsObject.title}
              user={user}
            />
          </Suspense>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main News Info Section */}
          <article className="lg:col-span-2 bg-white rounded-xl border border-ink-100 shadow-xs overflow-hidden">
            <Suspense fallback={<NewsInfoSkeleton />}>
              <NewsInfoWrapper news={newsObject} workspace={workspace} />
            </Suspense>
          </article>

          <aside className="w-full flex flex-col gap-6 lg:sticky lg:top-6">
            <Suspense fallback={<SocialMediaSkeleton />}>
              <SocialMediaWrapper workspace={workspace} />
            </Suspense>

            <Suspense fallback={<AttachmentListSkeleton />}>
              <AttachmentListWrapper
                workspace={workspace}
                client={client}
                slug={newsObject.slug}
              />
            </Suspense>

            <Suspense fallback={<FeedListSkeleton width="w-full" />}>
              <RelatedNewsWrapper
                workspace={workspace}
                client={client}
                slug={newsObject.slug}
                navigatingPathFrom={navigatingPathFromURL}
              />
            </Suspense>

            <Suspense fallback={<FeedListSkeleton width="w-full" />}>
              <RecommendedNewsWrapper
                isRecommendationEnable={isRecommendationEnable}
                navigatingPathFrom={navigatingPathFromURL}
                workspaceURL={workspaceURL}
                tenantId={tenantId}
                categoryIds={categoryIds}
              />
            </Suspense>
          </aside>
        </div>

        <Suspense fallback={<CommentsSkeleton />}>
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
            <CommentsWrapper
              news={newsObject}
              workspace={workspace}
              user={user}
              workspaceURI={workspaceURI}
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
}

export default ArticleNews;
