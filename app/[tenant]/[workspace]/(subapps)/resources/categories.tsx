'use client';

import {useRouter} from 'next/navigation';
import {Swiper, SwiperSlide} from 'swiper/react';
import {FreeMode, Pagination} from 'swiper/modules';
import {MdOutlineCategory} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {DynamicIcon} from '@/ui/components';

export default function Categories({items}: any) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const handleRedirection = (id: string) => () => {
    router.push(`${workspaceURI}/resources/categories?id=${id}`);
  };

  return (
    <Swiper
      slidesPerView={'auto'}
      spaceBetween={30}
      modules={[FreeMode, Pagination]}
      className="space-y-6"
      wrapperClass="flex gap-4"
      pagination={{
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
      }}>
      {items.map(
        ({
          fileName,
          description,
          id,
          colorSelect: color,
          logoSelect: icon,
        }: any) => (
          <SwiperSlide
            key={id}
            className="!mr-0 !w-[281px] cursor-pointer"
            onClick={handleRedirection(id)}>
            <article className="group h-full bg-white rounded-xl border border-ink-100 shadow-xs hover:shadow-soft-md transition-shadow overflow-hidden">
              <div
                className="h-[160px] flex justify-center items-center"
                style={{
                  background: color
                    ? `linear-gradient(135deg, ${color}22, ${color}11)`
                    : 'hsl(var(--ink-50))',
                }}>
                {icon ? (
                  <DynamicIcon
                    className="h-14 w-14"
                    fill={color || 'hsl(var(--royal))'}
                    icon={icon}
                  />
                ) : (
                  <MdOutlineCategory
                    className="h-14 w-14"
                    style={{color: color || 'hsl(var(--royal))'}}
                  />
                )}
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="font-bold text-sm text-ink-900 leading-snug line-clamp-1">
                  {fileName}
                </h3>
                {description && (
                  <p
                    className="text-xs text-ink-500 leading-snug line-clamp-2"
                    title={description}>
                    {description}
                  </p>
                )}
              </div>
            </article>
          </SwiperSlide>
        ),
      )}
      <div className={'swiper-pagination !relative'}></div>
    </Swiper>
  );
}
