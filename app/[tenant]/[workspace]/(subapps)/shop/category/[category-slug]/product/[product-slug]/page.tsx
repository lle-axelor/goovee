import {Suspense} from 'react';
import {notFound, redirect} from 'next/navigation';
import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {clone, htmlToNormalString} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {
  ShopV3ProductDetail,
  type ShopV3Category,
} from '@/subapps/shop/common/ui/components';
import {
  findProductBySlug,
  findProducts,
} from '@/subapps/shop/common/orm/product';
import {findCategories} from '@/subapps/shop/common/orm/categories';
import {buildProductDetailLabels} from '@/subapps/shop/common/utils/product-detail-labels';

const CATALOG_LIMIT = 500;
const RELATED_LIMIT = 4;

export async function generateMetadata(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'category-slug': string;
    'product-slug': string;
  }>;
}): Promise<Metadata | null> {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const productSlug = params['product-slug'];

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return null;
  const {client} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client}).then(
    clone,
  );
  if (!workspace) return null;

  const computed = await findProductBySlug({
    slug: productSlug,
    workspace,
    user,
    client,
  });
  if (!computed?.product) return null;

  return {
    title: computed.product?.name,
    description: htmlToNormalString(computed.product?.description),
  };
}

async function Detail({
  params,
}: {
  params: {
    tenant: string;
    workspace: string;
    'category-slug': string;
    'product-slug': string;
  };
}) {
  const {tenant: tenantId} = params;
  const session = await getSession();
  const user = session?.user;

  const productSlug = params['product-slug'];
  const categorySlug = params['category-slug'];
  const {workspaceURL, workspaceURI} = workspacePathname(params);

  if (!(productSlug && categorySlug)) {
    return redirect(`${workspaceURI}/shop`);
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client, config} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client}).then(
    clone,
  );
  if (!workspace) return notFound();

  const [computed, allCategoriesRaw, allProductsRes, labels] =
    await Promise.all([
      findProductBySlug({slug: productSlug, workspace, user, client, config}),
      findCategories({workspace, client, user}).then(clone),
      findProducts({
        workspace,
        client,
        user,
        config,
        page: 1,
        limit: CATALOG_LIMIT,
      }).then(clone),
      buildProductDetailLabels(),
    ]);

  if (!computed?.product) return redirect(`${workspaceURI}/shop`);

  const allProducts: any[] = Array.isArray(allProductsRes)
    ? allProductsRes
    : ((allProductsRes as any)?.products ?? []);

  const categoriesWithProducts = new Set<string>();
  const countsByCat: Record<string, number> = {};
  for (const p of allProducts) {
    const portal = p?.product?.portalCategorySet ?? [];
    const seen = new Set<string>();
    for (const c of portal) {
      const id = String(c?.id ?? '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      categoriesWithProducts.add(id);
      countsByCat[id] = (countsByCat[id] ?? 0) + 1;
    }
  }

  const allCategories = (allCategoriesRaw as any[]) ?? [];
  const categories: ShopV3Category[] = allCategories
    .filter(c => categoriesWithProducts.has(String(c.id)))
    .map(c => ({id: c.id, name: c.name, slug: c.slug}));

  const currentPortalIds: string[] = (
    computed.product?.portalCategorySet ?? []
  )
    .map((c: any) => String(c?.id ?? ''))
    .filter(Boolean);
  const related = currentPortalIds.length
    ? allProducts
        .filter(p => {
          if (p?.product?.id === computed.product?.id) return false;
          const portal = p?.product?.portalCategorySet ?? [];
          return portal.some((c: any) =>
            currentPortalIds.includes(String(c?.id)),
          );
        })
        .slice(0, RELATED_LIMIT)
    : [];

  return (
    <ShopV3ProductDetail
      product={clone(computed)}
      categories={categories}
      countsByCat={countsByCat}
      totalCount={allProducts.length}
      relatedProducts={clone(related)}
      labels={labels}
    />
  );
}

function DetailSkeleton() {
  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      <div className="w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5" />
      <div className="flex-1 px-8 py-6">
        <div className="h-4 w-64 bg-ink-100 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[380px] rounded-[16px] bg-ink-100 animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-3/4 bg-ink-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-ink-100 rounded animate-pulse" />
            <div className="h-40 bg-ink-100 rounded-[14px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{
    tenant: string;
    workspace: string;
    'product-slug': string;
    'category-slug': string;
  }>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Detail params={params} />
    </Suspense>
  );
}
