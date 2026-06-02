'use client';

import Link from 'next/link';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {useTrack} from '@/lib/analytics/use-track';
import {Avatar, AvatarImage} from '@/ui/components/avatar';
import {i18n} from '@/locale';
import {Skeleton} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  SHARE_ON_SOCIAL_MEDIA,
  SOCIAL_ICONS,
} from '@/subapps/news/common/constants';
import {getSocialURL} from '../../../utils';

type SocialMediaProps = {
  availableSocials?: string | null;
  newsId?: string | number;
};

export const SocialMedia = ({
  availableSocials: availableSocialsProps,
  newsId,
}: SocialMediaProps) => {
  const trackEvent = useTrack(SUBAPP_CODES.news);
  const availableSocials = SOCIAL_ICONS.filter(icon =>
    availableSocialsProps?.includes(icon.name),
  );

  if (!availableSocials.length) {
    return;
  }

  return (
    <div className="bg-white rounded-lg p-4 flex flex-col gap-4">
      <div className="text-xl font-semibold text-black">
        {i18n.t(SHARE_ON_SOCIAL_MEDIA)}
      </div>

      <div className="flex gap-6">
        {availableSocials.map(({key, name, color, image}) => {
          const redirectUrl = getSocialURL(name);
          return (
            <Link
              key={key}
              href={redirectUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
              onClick={() => {
                if (newsId === undefined) return;
                trackEvent('share_news', {
                  news_id: String(newsId),
                  social_channel: name,
                });
              }}>
              <Avatar
                className={`w-8 h-8 bg-[${color}] p-1 rounded cursor-pointer`}>
                <AvatarImage
                  src={image}
                  alt={`Visit ${redirectUrl}`}
                  size={32}
                />
              </Avatar>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const SocialMediaSkeleton = () => {
  return (
    <div className="bg-white rounded-lg p-4 flex flex-col gap-4">
      <Skeleton className="h-6 w-2/3 rounded" />

      <div className="flex gap-6">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="w-8 h-8 rounded-full" />
        ))}
      </div>
    </div>
  );
};

export default SocialMedia;
