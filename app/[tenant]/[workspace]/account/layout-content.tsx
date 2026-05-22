'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import Menubar from './menubar';

export default function LayoutContent({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const {searchParams} = useSearchParams();
  const quotation = searchParams.get('quotation') || '';
  const checkout = searchParams.get('checkout') || '';

  return (
    <div className="bg-ink-25 min-h-full">
      {quotation || checkout ? (
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
      ) : (
        <div className="container py-8 space-y-6">
          <header className="hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
              {i18n.t('Account')}
            </p>
            <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
              {i18n.t('Profile Settings')}
            </h1>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            <aside className="lg:sticky lg:top-6">
              <Menubar isAdmin={isAdmin} />
            </aside>
            <div className="overflow-auto bg-white rounded-xl border border-ink-100 shadow-xs p-6">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
