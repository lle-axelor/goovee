import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import {t} from '@/locale/server';
import type {Client} from '@/goovee/.generated/client';
import type {User} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {findProducts} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/product';
import {findCategories} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/orm/categories';
import {
  OrderAlert,
  ShopCatalog,
  type ShopCategory,
  type ShopLabels,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/ui/components';

const CATALOG_LIMIT = 500;

async function Catalog({
  workspace,
  client,
  user,
  config,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user: User | undefined;
  config: any;
}) {
  const [productsRes, categoriesRes, labels] = await Promise.all([
    findProducts({
      workspace,
      client,
      user,
      config,
      page: 1,
      limit: CATALOG_LIMIT,
    }).then(clone),
    findCategories({workspace, client, user}).then(clone),
    buildLabels(),
  ]);

  const products: any[] = Array.isArray(productsRes)
    ? productsRes
    : ((productsRes as any)?.products ?? []);

  const allCategories = (categoriesRes as any[]) ?? [];
  // Keep only leaf categories that actually contain products in the portal —
  // the ORM filter clauses pivot through portalCategorySet (many-to-many),
  // not productCategory (the product's primary business category). Using
  // productCategory here would surface categories that look populated but
  // resolve to 0 products when clicked.
  const categoriesWithProducts = new Set<string>();
  for (const p of products) {
    const portal = p?.product?.portalCategorySet ?? [];
    for (const c of portal) {
      if (c?.id) categoriesWithProducts.add(String(c.id));
    }
  }
  const categories: ShopCategory[] = allCategories
    .filter(c => categoriesWithProducts.has(String(c.id)))
    .map(c => ({id: c.id, name: c.name, slug: c.slug}));

  return (
    <ShopCatalog
      categories={categories}
      products={products}
      labels={labels}
    />
  );
}

async function buildLabels(): Promise<ShopLabels> {
  const [
    categoriesTitle,
    allProducts,
    availabilityTitle,
    inStockOnly,
    defaultPageTitle,
    productsLabel,
    productLabel,
    searchPlaceholder,
    sortRelevance,
    sortPriceAsc,
    sortPriceDesc,
    sortName,
    inStockBadge,
    outOfStockBadge,
    addToCartLabel,
    addedLabel,
    emptyTitle,
    emptySubtitle,
  ] = await Promise.all([
    t('Categories'),
    t('All products'),
    t('Availability'),
    t('In stock only'),
    t('Catalogue'),
    t('products'),
    t('product'),
    t('Search…'),
    t('Relevance'),
    t('Price ascending'),
    t('Price descending'),
    t('Name A-Z'),
    t('In stock'),
    t('Out of stock'),
    t('Add to cart'),
    t('Added'),
    t('No product matches your filters'),
    t('Try adjusting the category, search or availability filters.'),
  ]);

  return {
    categoriesTitle,
    allProducts,
    availabilityTitle,
    inStockOnly,
    defaultPageTitle,
    productsLabel,
    productLabel,
    searchPlaceholder,
    sortRelevance,
    sortPriceAsc,
    sortPriceDesc,
    sortName,
    inStockBadge,
    outOfStockBadge,
    addToCartLabel,
    addedLabel,
    emptyTitle,
    emptySubtitle,
  };
}

function CatalogSkeleton() {
  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      <div className="w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5" />
      <div className="flex-1 px-8 py-7">
        <div className="h-8 w-64 bg-ink-100 rounded mb-2 animate-pulse" />
        <div className="h-4 w-32 bg-ink-100 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-[260px] bg-white rounded-xl border border-ink-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId} = params;

  const session = await getSession();
  const user = session?.user;

  const {workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client, config} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  return (
    <>
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog
          workspace={workspace}
          client={client}
          user={user}
          config={config}
        />
      </Suspense>
      <OrderAlert />
    </>
  );
}
