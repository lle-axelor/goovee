'use client';

import React, {useEffect, useState} from 'react';
import type {Cloned} from '@/types/util';
import {useRouter} from 'next/navigation';
import {MdOutlineShoppingBasket} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Quantity,
  ThumbsCarousel,
  Label,
  Button,
  Breadcrumbs,
  NavbarCategoryMenu,
  Textarea,
  InnerHTML,
} from '@/ui/components';
import {useQuantity, useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {getProductImageURL} from '@/utils/files';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import type {Category, ComputedProduct} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {ProductMetaFieldView} from '@/subapps/shop/common/ui/components/product-meta-field-view';

export function ProductView({
  product: computedProduct,
  workspace,
  breadcrumbs,
  categories,
  metaFields,
  hidePriceAndPurchase,
}: {
  hidePriceAndPurchase: boolean;
  categories?: any;
  product: ComputedProduct;
  workspace?: PortalWorkspace | Cloned<PortalWorkspace>;
  breadcrumbs: any;
  metaFields: any;
}) {
  const router = useRouter();
  const {workspaceURI, tenant} = useWorkspace();
  const {product, price, errorMessage} = computedProduct;
  const [updating, setUpdating] = useState(false);
  const {quantity, increment, decrement, setQuantity} = useQuantity();
  const {updateQuantity, getProductQuantity, getProductNote, setProductNote} =
    useCart();
  const [cartQuantity, setCartQuantity] = useState(0);
  const [note, setNote] = useState('');
  const {toast} = useToast();

  const {outOfStockConfig} = product;
  const isOutOfStock = outOfStockConfig?.outOfStock;
  const showMessage = outOfStockConfig?.showMessage;
  const canBuy = outOfStockConfig?.canBuy && !hidePriceAndPurchase;

  const handleAddToCart = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (quantity < 1) {
      toast({
        variant: 'destructive',
        description: i18n.t('Enter valid quantity'),
      });
      return;
    }
    setUpdating(true);
    setCartQuantity(quantity);
    await updateQuantity({
      productId: product.id,
      quantity,
      computedProduct,
      images: product.images?.map(String) ?? [],
    });
    toast({title: i18n.t('Added to cart')});
    setUpdating(false);
  };

  const handleChangeNote = async (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const {value} = event.target;
    setNote(value);
    await setProductNote(product.id, value);
  };

  const handleCategoryClick = ({category}: {category: Category}) => {
    router.push(`${workspaceURI}/shop/category/${category.slug}`);
  };

  const handleBreadCrumbClick = (category: any) => {
    handleCategoryClick({category});
  };

  useEffect(() => {
    (async () => {
      if (!product) return;
      const quantity = await getProductQuantity(product.id);
      setCartQuantity(quantity);
      setQuantity(quantity || 1);
      const note = await getProductNote(product.id);
      setNote(note);
    })();
  }, [getProductNote, getProductQuantity, product, setQuantity]);

  const showPrices = workspace?.config?.displayPrices && !hidePriceAndPurchase;

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="relative">
        <NavbarCategoryMenu
          categories={categories}
          onClick={handleCategoryClick}
        />
      </div>
      <div className="container py-8">
        <div className="mb-6">
          <Breadcrumbs
            breadcrumbs={breadcrumbs}
            onClick={handleBreadCrumbClick}
          />
        </div>
        <div className="grid md:grid-cols-[minmax(0,40%)_1fr] grid-cols-1 gap-8">
          {/* Gallery */}
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-3 overflow-hidden">
            <ThumbsCarousel
              images={
                product.images?.length
                  ? product.images.map(i => ({
                      id: String(i),
                      url: getProductImageURL(String(i), tenant),
                    }))
                  : [
                      {
                        id: '1',
                        url: getProductImageURL('', tenant, {noimage: true}),
                      },
                    ]
              }
            />
          </div>

          {/* Info card */}
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-6 flex flex-col gap-6">
            <header>
              <div className="flex items-center gap-2 mb-2">
                {showMessage && isOutOfStock ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-status-overdue-bg text-status-overdue-fg text-[11px] font-semibold">
                    {i18n.t('Out of stock')}
                  </span>
                ) : (
                  showPrices && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-mint-50 text-mint-700 text-[11px] font-semibold">
                      {i18n.t('In stock')}
                    </span>
                  )
                )}
              </div>
              <h1 className="text-2xl font-bold text-ink-900 leading-tight">
                {i18n.tattr(product.name)}
              </h1>
            </header>

            {showPrices && (
              <div>
                <p className="text-[32px] font-bold leading-none text-ink-900 tabular-nums">
                  {price.displayPrimary}
                </p>
                {price.displayTwoPrices && (
                  <p className="text-sm text-ink-500 tabular-nums mt-1">
                    {price.displaySecondary}
                  </p>
                )}
                {errorMessage && (
                  <p className="mt-2 text-xs font-semibold text-status-overdue-fg">
                    {i18n.t('Price may be incorrect')}
                  </p>
                )}
              </div>
            )}

            <div>
              <ProductMetaFieldView
                productId={product.id}
                fields={metaFields}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-400 mb-2">
                {i18n.t('Product description')}
              </p>
              <InnerHTML
                as="div"
                className="text-sm text-ink-700 leading-relaxed [&_p]:mb-2"
                content={product.description}
              />
            </div>

            {Boolean(cartQuantity) && product.allowCustomNote && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-400">
                  {i18n.t('Note')}
                </Label>
                <Textarea
                  className="border-ink-150 rounded-lg"
                  value={note}
                  onChange={handleChangeNote}
                />
              </div>
            )}

            {canBuy && (
              <div className="flex flex-col gap-3 mt-auto pt-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-400">
                    {i18n.t('Quantity')}
                  </span>
                  <Quantity
                    value={quantity}
                    onIncrement={increment}
                    onDecrement={decrement}
                    onChange={newValue => setQuantity(Number(newValue))}
                    disabled={updating}
                  />
                </div>
                <Button
                  onClick={handleAddToCart}
                  variant="dark"
                  className="w-full gap-2">
                  <MdOutlineShoppingBasket className="text-lg" />
                  {i18n.t('Add to cart')}
                </Button>
              </div>
            )}

            {!canBuy && isOutOfStock && (
              <Button variant="royal" className="w-full mt-auto">
                {i18n.t('Notify me')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductView;
