'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import Menubar from './menubar';

export default function LayoutContent({
  children,
  isAdmin,
  companyName,
  role,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  companyName?: string;
  role?: string;
}) {
  const {searchParams} = useSearchParams();
  const quotation = searchParams.get('quotation') || '';
  const checkout = searchParams.get('checkout') || '';

  // Checkout / quotation address confirmation: full-width, no rail.
  if (quotation || checkout) {
    return (
      <div className="bg-ink-25 min-h-full">
        <div className="container py-8 space-y-6">
          {quotation && (
            <header>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
                {i18n.t('Account')}
              </p>
              <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
                {i18n.t(`Quotation number ${quotation}`)}
              </h1>
            </header>
          )}
          {checkout && (
            <header>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
                {i18n.t('Account')}
              </p>
              <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
                {i18n.t('Confirm cart')}
              </h1>
            </header>
          )}
          <div className="overflow-auto flex flex-col gap-6">{children}</div>
        </div>
      </div>
    );
  }

  // Grouped lateral rail + capped content pane.
  return (
    <div className="bg-ink-25 min-h-full flex flex-col lg:flex-row lg:items-stretch">
      <div className="lg:sticky lg:top-0 lg:self-start p-4 lg:p-6">
        <Menubar isAdmin={isAdmin} companyName={companyName} role={role} />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-2 lg:px-6 lg:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
