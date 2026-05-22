'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {formatRelativeTime} from '@/locale/formatters';
import {BadgeList, Skeleton} from '@/ui/components';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';

export const NewsList = ({
  news,
  id,
  navigatingPathFrom,
}: {
  news: any;
  id: string;
  navigatingPathFrom: string;
}) => {
  const {publicationDateTime, title, image, categorySet, slug} = news;
  const {workspaceURI} = useWorkspace();

  return (
    <Link
      key={id}
      href={`${workspaceURI}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
      className="group bg-white rounded-xl border border-ink-100 shadow-xs flex gap-4 w-full cursor-pointer p-4 relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md">
      <Image
        width={150}
        height={93}
        alt={image?.fileName || 'News image'}
        className="flex-shrink-0 w-[150px] h-[93px] object-cover rounded-lg bg-ink-50"
        src={
          image?.id
            ? `${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image`
            : NO_IMAGE_URL
        }
      />
      <div className="w-full min-w-0 flex flex-col gap-1.5 justify-between">
        <div className="flex flex-col gap-2">
          <BadgeList
            items={categorySet}
            labelClassName="rounded-full font-semibold text-[10px] px-2 py-0.5"
            rootClassName="gap-1.5"
          />
          <div className="font-bold text-sm text-ink-900 line-clamp-2 leading-snug">
            {title}
          </div>
        </div>
        <div className="font-medium text-[11px] text-ink-400">
          {formatRelativeTime(publicationDateTime)}
        </div>
      </div>
    </Link>
  );
};

export function NewsListSkeleton({
  width,
  count = 3,
}: {
  width?: string;
  count?: number;
}) {
  return (
    <div className={`space-y-4 ${width ? width : ''}`}>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg flex gap-4 w-full p-4">
          <Skeleton className="flex-shrink-0 w-[150px] h-[93px] rounded-lg" />

          <div className="w-full flex flex-col gap-1 justify-between">
            <div>
              <div className="flex gap-2 mb-1">
                <Skeleton className="h-3 w-12 rounded-full" />
                <Skeleton className="h-3 w-10 rounded-full" />
              </div>

              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <Skeleton className="h-3 w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default NewsList;
