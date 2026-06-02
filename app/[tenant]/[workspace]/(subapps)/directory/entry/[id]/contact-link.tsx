'use client';

import Link from 'next/link';
import {ReactNode} from 'react';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {useTrack} from '@/lib/analytics/use-track';

type ContactLinkProps = {
  entryId: string | number;
  channel: 'email' | 'phone';
  href: string;
  className?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
};

export function ContactLink({
  entryId,
  channel,
  href,
  className,
  target,
  rel,
  children,
}: ContactLinkProps) {
  const trackEvent = useTrack(SUBAPP_CODES.directory);

  const handleClick = () => {
    trackEvent('contact_directory_entry', {
      target_partner_id: String(entryId),
      channel,
    });
  };

  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}>
      {children}
    </Link>
  );
}

export default ContactLink;
