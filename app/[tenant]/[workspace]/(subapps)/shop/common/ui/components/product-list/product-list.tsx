'use client';

import React, {Fragment, useState} from 'react';
import type {Cloned} from '@/types/util';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {BiSearch} from 'react-icons/bi';
import {MdOutlineFilterAlt} from 'react-icons/md';
import {LuChevronRight} from 'react-icons/lu';
import {MdGridView} from 'react-icons/md';
import {MdOutlineList} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Breadcrumbs,
  NavbarCategoryMenu,
  Pagination,
  TextField,
} from '@/ui/components';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import type {ComputedProduct, Product, Category} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {MobileSortBy, SortBy, ProductCard, ProductListItem} from '..';
import styles from './product-list.module.scss';

const VIEW = {
  GRID: 'grid',
  LIST: 'list',
};
function MobileFilters() {
  return (
    <div className="flex items-center gap-2 text-foreground">
      {/* <MdOutlineFilterAlt className="text-xl" /> */}
      {/* <p className="mb-0 font-bold">{i18n.t('Filters')}</p> */}
    </div>
  );
}
export function ProductList({
  products = [],
  categories,
  category,
  pageInfo = {page: 1, pages: 1},
  workspace,
  breadcrumbs,
  productPath,
  defaultSort,
  hidePriceAndPurchase,
}: {
  breadcrumbs?: any;
  products: ComputedProduct[];
  categories?: any;
  category?: any;
  pageInfo?: any;
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
  productPath?: string;
  defaultSort?: string;
  hidePriceAndPurchase: boolean;
}) {
  const {cart, addItem} = useCart();
  const {workspaceURI} = useWorkspace();
  const {page, pages} = pageInfo;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get('sort');
  const view = searchParams.get('view') || VIEW.GRID;
  const [searching, setSearching] = useState<string>('');
  const {toast} = useToast();

  const updateSearchParams = (
    values: Array<{
      key: string;
      value?: string | number;
    }>,
  ) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    values.forEach(({key, value = ''}: any) => {
      value = value && String(value)?.trim();
      if (!value) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  const handleAdd = async (computedProduct: ComputedProduct) => {
    const {product} = computedProduct;

    await addItem({
      productId: product?.id,
      quantity: 1,
      images: product?.images?.map(String) ?? [],
      computedProduct: computedProduct,
    });

    toast({
      title: i18n.t('Added to cart'),
    });
  };

  const handleChangeSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    updateSearchParams([
      {key: 'page'},
      {key: 'search', value: formData.get('search') as string},
    ]);
  };

  const handleChangeSortBy = ({value}: any) => {
    updateSearchParams([{key: 'sort', value}]);
  };

  const handleChangeView = (type: string) => {
    updateSearchParams([{key: 'view', value: type}]);
  };

  const handlePreviousPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    const {page, hasPrev} = pageInfo;
    if (!hasPrev) return;
    updateSearchParams([{key: 'page', value: Math.max(Number(page) - 1, 1)}]);
  };

  const handleNextPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    const {page, hasNext} = pageInfo;
    if (!hasNext) return;
    updateSearchParams([{key: 'page', value: Number(page) + 1}]);
  };

  const handlePage = (page: string | number) => {
    updateSearchParams([{key: 'page', value: page}]);
  };

  const handleCategoryClick = ({category}: {category: Category}) => {
    router.push(`${workspaceURI}/shop/category/${category.slug}`);
  };

  const handleProductClick = (product: Product) => {
    router.push(`${productPath}/${product.slug}`);
  };

  const handleBreadCrumbClick = (category: any) => {
    handleCategoryClick({category});
  };

  const isGridView = view === VIEW.GRID;
  const isListView = view === VIEW.LIST;

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="flex items-center justify-between bg-white relative border-b border-ink-100">
        <div className="w-0 md:w-[80%] overflow-hidden">
          <NavbarCategoryMenu
            categories={categories}
            onClick={handleCategoryClick}
          />
        </div>
        <div className="w-full sm:!w-[18.75rem] px-4 py-3">
          <form
            onSubmit={handleChangeSearch}
            className={`${styles.wrapper} w-full`}>
            <TextField
              name="search"
              placeholder={i18n.t('Search here')}
              value={searching}
              onChange={e => setSearching(e.target.value)}
              className="pl-12 rounded-full mb-0 bg-ink-25 border-ink-150"
            />
            <div className={`${styles.icons} top-[0.625rem] !pt-0 text-royal`}>
              <BiSearch className="text-xl" />
            </div>
          </form>
        </div>
      </div>
      <div className="container portal-container py-6">
        <div className="mb-5 text-ink-600">
          <Breadcrumbs
            breadcrumbs={breadcrumbs}
            onClick={handleBreadCrumbClick}
          />
        </div>
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
              {i18n.t('Category')}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900 leading-tight">
              {category && category?.name}
            </h1>
            <p className="text-sm text-ink-500 mt-1 tabular-nums">
              {products.length}{' '}
              {i18n.t(products.length > 1 ? 'products' : 'product')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SortBy
              workspace={workspace}
              onChange={handleChangeSortBy}
              value={sort || defaultSort}
              className="flex-grow-0! basis-auto min-w-[180px]"
            />
            <div className="hidden md:flex items-center bg-white border border-ink-150 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => handleChangeView(VIEW.GRID)}
                className={cn(
                  'w-8 h-8 grid place-items-center rounded-md transition-colors',
                  isGridView
                    ? 'bg-royal text-white'
                    : 'text-ink-500 hover:bg-ink-50',
                )}
                aria-label={i18n.t('Grid view')}>
                <MdGridView className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => handleChangeView(VIEW.LIST)}
                className={cn(
                  'w-8 h-8 grid place-items-center rounded-md transition-colors',
                  isListView
                    ? 'bg-royal text-white'
                    : 'text-ink-500 hover:bg-ink-50',
                )}
                aria-label={i18n.t('List view')}>
                <MdOutlineList className="text-base" />
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs mb-4 grid md:hidden grid-cols-2 gap-2 p-2">
          <MobileSortBy
            active={sort || defaultSort}
            workspace={workspace}
            onChange={handleChangeSortBy}
          />
          <MobileFilters />
        </div>

        <div className="grid gap-5 lg:grid-cols-[17.3125rem_1fr] grid-cols-1">
          <div className="flex flex-col gap-6">
            {/* <ProductListColorFilter /> */}
            {/* <ProductListBrandFilter /> */}
          </div>
          <div
            className={cn(
              'grid gap-5',
              isListView
                ? 'grid-cols-1'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            )}>
            {products?.length ? (
              products.map(computedProduct => {
                const quantity = cart?.items?.find(
                  (i: any) =>
                    Number(i.product) === Number(computedProduct?.product.id),
                )?.quantity;
                const Component = isListView ? ProductListItem : ProductCard;

                return (
                  <Component
                    key={computedProduct?.product?.id}
                    product={computedProduct}
                    quantity={quantity}
                    onAdd={handleAdd}
                    displayPrices={workspace?.config?.displayPrices ?? false}
                    hidePriceAndPurchase={hidePriceAndPurchase}
                    category={category}
                  />
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-sm text-ink-400">
                {i18n.t('No product available.')}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 mb-4 flex items-center justify-center">
          {products.length ? (
            <Pagination
              page={page}
              pages={pages}
              disablePrev={!pageInfo?.hasPrev}
              disableNext={!pageInfo?.hasNext}
              onPrev={handlePreviousPage}
              onNext={handleNextPage}
              onPage={handlePage}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
export default ProductList;
