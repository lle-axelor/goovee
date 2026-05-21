'use client';

import {Fragment} from 'react';
import {useRouter} from 'next/navigation';
import {MdEast} from 'react-icons/md';

import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {Product, Category, ComputedProduct} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {Link, ProductCard} from '@/subapps/shop/common/ui/components';

export function FeaturedCategories({
  categories,
  workspace,
  hidePriceAndPurchase,
}: any) {
  const router = useRouter();

  const {workspaceURI} = useWorkspace();
  const {cart, addItem} = useCart();
  const {toast} = useToast();

  const handleAddProduct = async (computedProduct: ComputedProduct) => {
    const {product} = computedProduct;

    await addItem({
      productId: product?.id,
      quantity: 1,
      images: product?.images?.map(String) || [],
      computedProduct: computedProduct,
    });

    toast({
      title: i18n.t('Added to cart'),
    });
  };

  return categories?.map((category: any) =>
    category?.products?.length ? (
      <Fragment key={category.id}>
        <div className="flex justify-between items-end mt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
              {i18n.t('Category')}
            </p>
            <h3 className="text-2xl font-bold text-ink-900 leading-tight">
              {category.name}
            </h3>
          </div>
          <Link href={`${workspaceURI}/shop/category/${category.slug}`}>
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-royal hover:bg-royal-pale transition-colors">
              {i18n.t('See All')}
              <MdEast className="w-4 h-4" />
            </span>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {category.products.map((computedProduct: ComputedProduct) => {
            const quantity = cart?.items?.find(
              (i: any) =>
                Number(i.product) === Number(computedProduct?.product.id),
            )?.quantity;

            return (
              <ProductCard
                hidePriceAndPurchase={hidePriceAndPurchase}
                key={computedProduct.product.id}
                product={computedProduct}
                quantity={quantity}
                onAdd={handleAddProduct}
                category={category}
                displayPrices={workspace?.config?.displayPrices}
              />
            );
          })}
        </div>
      </Fragment>
    ) : null,
  );
}

export default FeaturedCategories;
