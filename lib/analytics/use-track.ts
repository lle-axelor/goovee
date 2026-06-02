'use client';

import {useCallback} from 'react';
import {authClient} from '@/lib/auth-client';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {track} from './track';

/**
 * React hook that returns a `track()` function pre-bound to the current
 * workspace, tenant, and logged-in user.
 *
 * Use this in any client component under /[tenant]/[workspace]/* — call sites
 * only need to supply the event-specific props.
 *
 *   const trackEvent = useTrack('shop');
 *   trackEvent('add_to_cart', { product_id, quantity, value, currency });
 *
 * @param subapp - the subapp code where this event originates
 *                 ('shop', 'news', 'forum', 'resources', 'events',
 *                 'quotations', 'orders', 'invoices', 'ticketing', 'directory').
 *                 Omit for cross-cutting events.
 */
export function useTrack(subapp?: string) {
  const {data: session} = authClient.useSession();
  const {workspace, tenant} = useWorkspace();
  const partnerId = session?.user?.id;
  const locale = session?.user?.locale ?? undefined;

  return useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      track(event, {
        ...(subapp !== undefined ? {subapp} : {}),
        workspace,
        tenant,
        ...(partnerId !== undefined ? {partner_id: partnerId} : {}),
        ...(locale ? {locale} : {}),
        ...props,
      });
    },
    [subapp, workspace, tenant, partnerId, locale],
  );
}
