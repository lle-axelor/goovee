'use client';

import {useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {MdArrowForward} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks/use-toast';
import type {Cloned} from '@/types/util';
import {PortalWorkspace} from '@/orm/workspace';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {
  register,
  isValidParticipant,
} from '@/subapps/events/common/actions/actions';
import {
  SUCCESS_REGISTER_MESSAGE,
} from '@/subapps/events/common/constants';
import {getPartnerAddress} from '@/subapps/events/common/utils';

interface FormState {
  name: string;
  surname: string;
  company: string;
  emailAddress: string;
  phone: string;
  address: string;
}

interface FormErrors {
  name?: string;
  surname?: string;
  company?: string;
  emailAddress?: string;
  phone?: string;
  address?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getInitials(name: string, surname: string): string {
  const a = name?.trim()?.[0] ?? '';
  const b = surname?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export function RegistrationFormV2({
  eventDetails,
  workspace,
  user,
}: {
  eventDetails: any;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user: any;
}) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();
  const {toast} = useToast();

  const isCompanyOrAddressRequired =
    (workspace as any)?.config?.isCompanyOrAddressRequired ?? false;
  const isLoggedIn = !!user?.emailAddress;

  const [values, setValues] = useState<FormState>({
    name: user?.firstName ?? '',
    surname: user?.name ?? '',
    company: getPartnerAddress(user) ?? '',
    emailAddress: user?.emailAddress?.address ?? '',
    phone: user?.mobilePhone ?? '',
    address: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues(v => ({...v, [field]: e.target.value}));
    if (errors[field]) setErrors(e => ({...e, [field]: undefined}));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.name.trim()) next.name = i18n.t('Required');
    if (!values.surname.trim()) next.surname = i18n.t('Required');
    if (!values.emailAddress.trim()) next.emailAddress = i18n.t('Required');
    else if (!EMAIL_RE.test(values.emailAddress.trim()))
      next.emailAddress = i18n.t('Invalid email');
    if (!values.phone.trim()) next.phone = i18n.t('Required');
    if (isCompanyOrAddressRequired && !values.company.trim())
      next.company = i18n.t('Required');
    return next;
  };

  const eventDetailHref = `${workspaceURI}/${SUBAPP_CODES.events}/${eventDetails?.slug}`;
  const isFormValid = useMemo(() => {
    return (
      values.name.trim() &&
      values.surname.trim() &&
      values.emailAddress.trim() &&
      EMAIL_RE.test(values.emailAddress.trim()) &&
      values.phone.trim() &&
      (!isCompanyOrAddressRequired || values.company.trim())
    );
  }, [values, isCompanyOrAddressRequired]);
  const canSubmit = isFormValid && !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      // Email uniqueness check
      const validation = await isValidParticipant({
        email: values.emailAddress.trim(),
        eventId: eventDetails.id,
        workspaceURL: workspace.url,
      });
      if (!validation.success) {
        setErrors(prev => ({
          ...prev,
          emailAddress: i18n.t(validation.message),
        }));
        setSubmitting(false);
        return;
      }

      const response = await register({
        eventId: eventDetails.id,
        values: {
          name: values.name.trim(),
          surname: values.surname.trim(),
          company: values.company.trim() || null,
          emailAddress: values.emailAddress.trim(),
          phone: values.phone.trim(),
          address: values.address.trim() || null,
          sequence: 0,
          otherPeople: [],
        },
        workspace: {url: workspace.url},
      });

      if (response.success) {
        toast({
          variant: 'success',
          title: i18n.t(SUCCESS_REGISTER_MESSAGE),
        });
        router.push(
          `${workspaceURI}/${SUBAPP_CODES.events}/${eventDetails.slug}/${SUBAPP_PAGE.register}/${SUBAPP_PAGE.confirmation}`,
        );
      } else {
        toast({
          variant: 'destructive',
          title: i18n.t(response.message),
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: i18n.t('Error while register to event'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const initials = getInitials(values.name, values.surname);
  const userDisplayName =
    [values.name, values.surname].filter(Boolean).join(' ') ||
    i18n.t('this participant');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[18px]">
      {/* Card: Vos informations */}
      <SectionCard
        title={i18n.t('Your information')}
        subtitle={i18n.t('These details will appear on your badge.')}>
        {isLoggedIn && (
          <div className="flex items-center gap-3.5 px-3.5 py-3.5 mb-5 rounded-xl bg-mint-50 border border-mint-200">
            <div
              className="w-[38px] h-[38px] rounded-full grid place-items-center text-white font-bold text-xs shrink-0"
              style={{
                background: 'linear-gradient(135deg, #ffd58a, #ff9b6b)',
              }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-ink-900">
                {i18n.t('Registering as')} {userDisplayName}
              </div>
              {values.company && (
                <div className="text-xs text-mint-700">
                  {i18n.t('Signed in')} · {values.company}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={i18n.t('First name')}
            required
            error={errors.name}>
            <input
              type="text"
              value={values.name}
              onChange={handleChange('name')}
              className={inputClasses}
            />
          </Field>
          <Field
            label={i18n.t('Last name')}
            required
            error={errors.surname}>
            <input
              type="text"
              value={values.surname}
              onChange={handleChange('surname')}
              className={inputClasses}
            />
          </Field>
          <Field
            label={i18n.t('Company')}
            required={isCompanyOrAddressRequired}
            error={errors.company}>
            <input
              type="text"
              value={values.company}
              onChange={handleChange('company')}
              className={inputClasses}
            />
          </Field>
          <Field
            label={i18n.t('Email')}
            required
            error={errors.emailAddress}>
            <input
              type="email"
              value={values.emailAddress}
              onChange={handleChange('emailAddress')}
              className={inputClasses}
            />
          </Field>
          <Field
            label={i18n.t('Mobile phone')}
            required
            error={errors.phone}>
            <input
              type="tel"
              value={values.phone}
              onChange={handleChange('phone')}
              className={inputClasses}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label={i18n.t('Postal address')} error={errors.address}>
              <textarea
                rows={3}
                value={values.address}
                onChange={handleChange('address')}
                className={cn(inputClasses, 'resize-y min-h-[80px] font-sans')}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* CTA row */}
      <div className="flex justify-end gap-2.5 mt-2">
        <Link
          href={eventDetailHref}
          className="inline-flex items-center px-5 py-3 rounded-[10px] bg-white text-ink-700 border border-ink-150 text-sm font-semibold hover:bg-ink-25">
          {i18n.t('Cancel')}
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-bold text-white transition-colors',
            canSubmit
              ? 'bg-mint-500 hover:bg-mint-600 cursor-pointer'
              : 'bg-ink-200 cursor-not-allowed',
          )}
          style={
            canSubmit
              ? {
                  boxShadow:
                    '0 1px 2px rgba(46,163,107,0.3), 0 6px 14px rgba(46,163,107,0.18)',
                }
              : undefined
          }>
          {submitting
            ? i18n.t('Submitting…')
            : i18n.t('Confirm registration')}
          <MdArrowForward className="text-sm" />
        </button>
      </div>
    </form>
  );
}

// ---- Building blocks ---- //

const inputClasses =
  'w-full px-3.5 py-2.5 rounded-[10px] border border-ink-150 bg-white text-[13.5px] text-ink-800 outline-none focus:border-royal focus:ring-2 focus:ring-royal-pale transition-colors';

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-ink-100 shadow-xs p-[22px]">
      <div className="mb-4">
        <h3 className="m-0 text-base font-bold text-ink-900 tracking-[-0.01em]">
          {title}
        </h3>
        {subtitle && (
          <p className="m-0 mt-0.5 text-[12.5px] text-ink-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-semibold text-ink-700">
        {label}
        {required && (
          <span className="text-status-cancelled-fg ml-0.5">*</span>
        )}
      </label>
      {children}
      {error && (
        <span className="text-[11.5px] text-status-cancelled-fg">{error}</span>
      )}
    </div>
  );
}
