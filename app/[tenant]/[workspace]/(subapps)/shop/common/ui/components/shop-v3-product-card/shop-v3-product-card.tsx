'use client';

import Image from 'next/image';
import Link from 'next/link';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {getProductImageURL} from '@/utils/files';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

import {
  getCategoryEmoji,
  getCategoryGradient,
  getCategoryHue,
} from '@/subapps/shop/common/utils/category-style';

export interface ShopV3Category {
  id: string | number;
  name: string | null;
  slug?: string | null;
}

export function ShopV3ProductCard({
  product,
  category,
  inStockLabel,
  outOfStockLabel,
}: {
  product: any;
  category: ShopV3Category | null;
  inStockLabel: string;
  outOfStockLabel: string;
}) {
  const {tenant, workspaceURI} = useWorkspace();
  const p = product?.product ?? product;
  const price = product?.price;
  const outOfStock = p?.outOfStockConfig?.outOfStock ?? false;

  const imageId = p?.thumbnailImage?.id || p?.images?.[0];
  const imageURL = imageId ? getProductImageURL(imageId, tenant) : null;

  const categoryName = category?.name ?? null;
  const hue = getCategoryHue(categoryName);
  const emoji = getCategoryEmoji(categoryName);

  const href = category?.slug
    ? `${workspaceURI}/shop/category/${category.slug}/product/${p.slug}`
    : `${workspaceURI}/shop/product/${p.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        'group bg-white border border-ink-100 rounded-xl overflow-hidden',
        'flex flex-col transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-soft-md',
      )}>
      <div
        className="relative h-[140px] grid place-items-center"
        style={imageURL ? undefined : {background: getCategoryGradient(hue)}}>
        {imageURL ? (
          <Image
            src={imageURL}
            alt={i18n.tattr(p.name)}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <span className="text-[46px] opacity-80">{emoji}</span>
        )}
        {categoryName && (
          <span
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.04em] bg-white/95 text-royal-dark"
            style={{
              color: imageURL ? undefined : `hsl(${hue}, 60%, 25%)`,
            }}>
            {categoryName}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3.5 flex-1">
        <h3 className="m-0 text-[13px] font-bold text-ink-900 leading-[1.3] min-h-[34px] line-clamp-2">
          {i18n.tattr(p.name)}
        </h3>
        {p.code && (
          <div className="text-[10.5px] text-ink-500 font-mono">{p.code}</div>
        )}
        <div className="mt-auto pt-2 border-t border-ink-100 flex items-baseline justify-between">
          <div className="text-base font-extrabold text-ink-900 tabular-nums">
            {price?.displayPrimary ?? '—'}
          </div>
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded',
              outOfStock
                ? 'bg-status-rejected-bg text-status-rejected-fg'
                : 'bg-mint-50 text-mint-700',
            )}>
            {outOfStock ? outOfStockLabel : inStockLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
