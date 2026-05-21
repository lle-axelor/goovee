'use client';

import {Swiper, SwiperSlide} from 'swiper/react';
import {Pagination} from 'swiper/modules';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {Button} from '@/ui/components/button';
import {i18n} from '@/locale';

export function HomeCarousel({images}: any) {
  const {workspaceURI} = useWorkspace();

  return images?.length ? (
    <div className="container mx-auto px-4 my-6">
      <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-soft-md bg-white">
        <Swiper
          modules={[Pagination]}
          pagination={{
            type: 'bullets',
            clickable: true,
            bulletActiveClass: '[&>div]:bg-royal [&>div]:scale-100',
            horizontalClass: '!bottom-6',
            renderBullet: (_index, className) =>
              `<div class="${className} !mx-1 h-2 w-2 rounded-full inline-flex items-center justify-center">
                <div class="h-2 w-2 rounded-full bg-ink-300 scale-75 transition-all"></div>
              </div>`,
          }}>
          {images.map((item: any, i: number) => (
            <SwiperSlide key={i} className="max-w-full">
              <div
                className="flex items-center relative bg-center bg-no-repeat bg-cover h-[460px] md:h-[560px] p-6 md:p-16"
                style={{
                  backgroundImage: `url("${workspaceURI}/${SUBAPP_CODES.shop}/api/carousel/${item.id}/image")`,
                }}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent" />
                <div className="relative z-10 max-w-md flex flex-col gap-5">
                  <h2 className="font-bold text-3xl md:text-4xl text-ink-900 leading-tight tracking-[-0.01em]">
                    {item.title}
                  </h2>
                  {item.subTitle && (
                    <p className="text-base md:text-lg text-ink-600 leading-relaxed">
                      {item.subTitle}
                    </p>
                  )}
                  <Button asChild variant="dark" className="self-start gap-2">
                    <a
                      href={item.href || '#'}
                      target="_blank"
                      rel="noopener noreferrer">
                      {i18n.t(item?.buttonLabel || 'Shop products')}
                    </a>
                  </Button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  ) : null;
}

export default HomeCarousel;
