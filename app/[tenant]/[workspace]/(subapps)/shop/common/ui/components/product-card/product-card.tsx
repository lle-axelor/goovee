'use client';

import React from 'react';
import {MdAdd} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {BackgroundImage, Button} from '@/ui/components';
import {getProductImageURL} from '@/utils/files';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {Category, ComputedProduct, ID} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {Link} from '@/subapps/shop/common/ui/components';

export type ProductCardProps = {
  product: ComputedProduct;
  quantity?: string | number;
  onAdd: (product: ComputedProduct) => Promise<void>;
  displayPrices?: boolean;
  category: Category;
  hidePriceAndPurchase: boolean;
};

export function ProductCard({
  product: computedProduct,
  quantity = 0,
  onAdd,
  category,
  displayPrices,
  hidePriceAndPurchase,
}: ProductCardProps) {
  const {product, price, errorMessage} = computedProduct;
  const {displayTwoPrices, displayPrimary, displaySecondary} = price;
  const {tenant, workspaceURI} = useWorkspace();

  const {outOfStockConfig} = product;
  const isOutOfStock = outOfStockConfig?.outOfStock;
  const showMessage = outOfStockConfig?.showMessage;
  const canBuy = outOfStockConfig?.canBuy && !hidePriceAndPurchase;

  const handleAdd = () => {
    onAdd(computedProduct);
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col bg-white rounded-xl border border-ink-100 shadow-xs',
        'transition-shadow hover:shadow-soft-md',
        'overflow-hidden',
      )}>
      <Link
        href={`${workspaceURI}/shop/category/${category.slug}/product/${product.slug}`}
        className="block">
        <BackgroundImage
          className="bg-cover relative aspect-[4/3] bg-ink-50"
          src={getProductImageURL(
            product.thumbnailImage?.id || (product.images?.[0] as ID),
            tenant,
          )}>
          {Boolean(quantity) && (
            <span
              className={cn(
                'absolute top-3 right-3',
                'min-w-7 h-7 px-2 rounded-full',
                'bg-mint-500 text-white text-xs font-bold tabular-nums',
                'inline-flex items-center justify-center shadow-soft-sm',
              )}>
              {quantity}
            </span>
          )}
          {showMessage && isOutOfStock && (
            <span
              className={cn(
                'absolute top-3 left-3',
                'px-2 py-0.5 rounded-full',
                'bg-white/95 text-status-overdue-fg text-[11px] font-semibold',
                'shadow-xs',
              )}>
              {i18n.t('Out of stock')}
            </span>
          )}
        </BackgroundImage>
      </Link>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <Link
          href={`${workspaceURI}/shop/category/${category.slug}/product/${product.slug}`}>
          <h3 className="font-semibold text-sm text-ink-900 line-clamp-2 leading-snug min-h-[2.5rem]">
            {i18n.tattr(product.name)}
          </h3>
        </Link>

        {displayPrices && !hidePriceAndPurchase ? (
          <div className="mt-auto">
            <p className="text-lg font-bold text-ink-900 tabular-nums">
              {displayPrimary}
            </p>
            {displayTwoPrices && (
              <p className="text-xs text-ink-500 tabular-nums">
                {displaySecondary}
              </p>
            )}
            {errorMessage && (
              <p className="mt-1 text-[11px] font-semibold text-status-overdue-fg">
                {i18n.t('Price may be incorrect')}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {canBuy && (
        <div className="px-4 pb-4 -mt-2">
          <Button
            type="button"
            onClick={handleAdd}
            variant="dark"
            className="w-full gap-2"
            aria-label={i18n.t('Add to cart')}>
            <MdAdd className="text-base" />
            {i18n.t('Add to cart')}
          </Button>
        </div>
      )}
    </article>
  );
}
export default ProductCard;
