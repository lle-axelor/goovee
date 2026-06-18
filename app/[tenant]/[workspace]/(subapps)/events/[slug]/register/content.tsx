'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  MdHelpOutline,
  MdOutlineCalendarToday,
  MdOutlinePlace,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {formatDateTime} from '@/lib/core/locale/formatters';
import type {Cloned} from '@/types/util';
import {PortalWorkspace} from '@/orm/workspace';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {RegistrationForm} from '@/subapps/events/common/ui/components';

const STEPS = ['Your information', 'Confirmation', 'Payment'] as const;

const Content = ({
  eventDetails,
  metaFields,
  workspace,
  user,
}: {
  eventDetails: any;
  metaFields: any;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user: any;
}) => {
  const {workspaceURI} = useWorkspace();
  const isFree = !eventDetails?.defaultPrice || Number(eventDetails?.defaultPrice) === 0;
  const isPaid = !!eventDetails?.defaultPrice && Number(eventDetails?.defaultPrice) > 0;
  const currentStep = isPaid ? 1 : 1; // visual only, sequence is single-page
  const totalSteps = isPaid ? 3 : 2;

  const eventsRootHref = `${workspaceURI}/${SUBAPP_CODES.events}`;
  const eventDetailHref = `${eventsRootHref}/${eventDetails?.slug}`;

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container mx-auto max-w-[1280px] px-4 md:px-8 py-6 pb-24 lg:pb-14">
        <Link
          href={eventDetailHref}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-700 mb-4">
          ← {i18n.t('Back to event')}
        </Link>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {STEPS.slice(0, totalSteps).map((step, i) => {
            const stepNum = i + 1;
            const active = stepNum === currentStep;
            return (
              <span
                key={step}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-bold',
                  active
                    ? 'bg-royal text-white'
                    : 'bg-ink-50 text-ink-600',
                )}>
                <span className="tabular-nums">{stepNum}.</span> {i18n.t(step)}
              </span>
            );
          })}
        </div>

        <h1 className="text-[28px] font-extrabold text-ink-900 tracking-[-0.025em] leading-tight mb-6">
          {i18n.t('Register to event')}
        </h1>

        {/* 2-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
          {/* Left: form */}
          <div className="min-w-0">
            <RegistrationForm
              eventDetails={eventDetails}
              workspace={workspace}
              user={user}
            />
          </div>

          {/* Right: sticky summary */}
          <aside className="lg:sticky lg:top-5 flex flex-col gap-3.5">
            <EventSummaryCard
              eventDetails={eventDetails}
              workspaceURI={workspaceURI}
            />
            <PricingCard eventDetails={eventDetails} isFree={isFree} />
            <HelpCard />
          </aside>
        </div>
      </div>
    </div>
  );
};

function EventSummaryCard({
  eventDetails,
  workspaceURI,
}: {
  eventDetails: any;
  workspaceURI: string;
}) {
  const category = eventDetails.eventCategorySet?.[0];
  const heroImageURL = eventDetails.eventImage?.id
    ? `${workspaceURI}/${SUBAPP_CODES.events}/api/event/${eventDetails.slug}/image`
    : NO_IMAGE_URL;

  return (
    <section className="bg-white rounded-2xl border border-ink-100 shadow-xs overflow-hidden">
      <div className="relative h-[140px] bg-ink-50">
        <Image
          src={heroImageURL}
          alt={eventDetails.eventTitle ?? ''}
          fill
          className="object-cover"
          sizes="360px"
        />
        {category && (
          <span
            className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.04em]"
            style={{
              backgroundColor: `var(--palette-${category.color ?? 'blue'}-dark)`,
            }}>
            {category.name}
          </span>
        )}
      </div>
      <div className="p-[18px]">
        <h3 className="m-0 text-base font-bold text-ink-900 tracking-[-0.01em] leading-snug line-clamp-2">
          {eventDetails.eventTitle}
        </h3>
        <div className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-ink-700">
          {eventDetails.eventStartDateTime && (
            <div className="flex items-center gap-1.5">
              <MdOutlineCalendarToday className="text-royal text-sm" />
              {formatDateTime(eventDetails.eventStartDateTime, {
                dateFormat: 'MMMM D YYYY',
                timeFormat: ' · h:mmA',
              })}
            </div>
          )}
          {eventDetails.eventPlace && (
            <div className="flex items-center gap-1.5">
              <MdOutlinePlace className="text-royal text-sm" />
              {eventDetails.eventPlace}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  eventDetails,
  isFree,
}: {
  eventDetails: any;
  isFree: boolean;
}) {
  const {
    formattedDefaultPrice,
    formattedDefaultPriceAti,
  } = eventDetails || {};

  return (
    <section className="bg-white rounded-2xl border border-ink-100 shadow-xs p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-500 mb-3">
        {i18n.t('Summary')}
      </div>

      {isFree ? (
        <div className="bg-mint-50 border border-mint-200 rounded-xl px-4 py-3.5 flex items-center gap-2">
          <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-mint-500 text-white text-xs font-extrabold">
            ✓
          </span>
          <div className="text-[13px] text-mint-700 font-semibold leading-snug">
            {i18n.t('Free event · No payment required')}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 text-sm">
          {formattedDefaultPrice && (
            <div className="flex justify-between items-center text-ink-600">
              <span>{i18n.t('Price (excl. tax)')}</span>
              <span className="tabular-nums font-medium">
                {formattedDefaultPrice}
              </span>
            </div>
          )}
          {formattedDefaultPriceAti && (
            <div className="flex justify-between items-center pt-2.5 mt-1 border-t border-ink-100">
              <span className="text-[15px] font-bold text-ink-900">
                {i18n.t('Total (incl. tax)')}
              </span>
              <span className="text-[22px] font-extrabold text-ink-900 tabular-nums tracking-[-0.01em]">
                {formattedDefaultPriceAti}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function HelpCard() {
  return (
    <section
      className="rounded-2xl p-5 text-white"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--royal-dark)) 0%, hsl(var(--royal)) 100%)',
      }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/15 grid place-items-center shrink-0">
          <MdHelpOutline className="text-base" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] opacity-85">
            {i18n.t('A question?')}
          </div>
          <p className="m-0 mt-1.5 text-[13px] text-white/90 leading-snug">
            {i18n.t(
              'Our team is here to help with any question about this event.',
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

export default Content;
