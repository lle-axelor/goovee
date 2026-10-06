'use client';

// ---- CORE IMPORTS ---- //
import {Banner} from '@/ui/components';
import {VariantProps} from 'class-variance-authority';
import {BannerVariants} from '../banner';

type HearoSerchTypes = {
  groupImg?: string;
  title: string;
  description?: string;
  image: any;
  renderSearch?: any;
  className?: string;
  groupImgClassName?: string;
  groupClassName?: string;
  groupImgSizes?: string;
  groupHref?: string;
  groupAlt?: string;
} & VariantProps<BannerVariants>;

export const HeroSearch = ({
  groupImg,
  title = '',
  description = '',
  image,
  renderSearch,
  background,
  blendMode,
  className,
  groupImgClassName,
  groupClassName,
  groupImgSizes,
  groupHref,
  groupAlt,
}: HearoSerchTypes) => {
  return (
    <>
      <Banner
        groupImg={groupImg}
        title={title}
        description={description}
        image={image}
        renderSearch={renderSearch}
        background={background}
        blendMode={blendMode}
        className={className}
        groupImgClassName={groupImgClassName}
        groupClassName={groupClassName}
        groupImgSizes={groupImgSizes}
        groupHref={groupHref}
        groupAlt={groupAlt}
      />
    </>
  );
};

export default HeroSearch;
