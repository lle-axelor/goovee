import * as React from 'react';
import Link from 'next/link';
import {MdOutlineSupportAgent} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

type SupportCtaCardProps = {
  contactURL: string;
  companyName?: string | null;
};

export function SupportCtaCard({contactURL, companyName}: SupportCtaCardProps) {
  return (
    <section className="rounded-[16px] bg-ink-900 p-5 text-white">
      <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-white/60">
        {companyName
          ? `${i18n.t('Customer service')} ${companyName}`
          : i18n.t('Customer service')}
      </span>
      <p className="mb-4 mt-2 text-[14px] leading-[1.5]">
        {i18n.t('A question on this order? Our team is here to help.')}
      </p>
      <Link
        href={contactURL}
        className="inline-flex items-center gap-2 rounded-[10px] bg-mint-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-mint-600">
        <MdOutlineSupportAgent className="h-4 w-4" />
        {i18n.t('Contact support')}
      </Link>
    </section>
  );
}

export default SupportCtaCard;
