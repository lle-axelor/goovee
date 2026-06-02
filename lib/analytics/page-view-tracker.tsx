'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {useTrack} from './use-track';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

/**
 * Auto-fires a `page_view` event on every workspace-level navigation.
 *
 * Mount once in the workspace layout. The component reads {@code usePathname()}
 * and re-fires whenever the route changes (Next.js client-side navigations
 * included).
 *
 * The {@code subapp} property of the event is derived from the URL: the first
 * path segment after the workspace URI ({@code /[tenant]/[workspace]}) is the
 * subapp code ({@code shop}, {@code news}, {@code forum}, …). The workspace
 * home itself emits a page_view without a subapp.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const {workspaceURI} = useWorkspace();
  const trackEvent = useTrack();

  useEffect(() => {
    if (!pathname) return;

    let subapp: string | undefined;
    if (workspaceURI && pathname.startsWith(workspaceURI)) {
      const rest = pathname.slice(workspaceURI.length).replace(/^\//, '');
      const firstSegment = rest.split('/')[0];
      subapp = firstSegment || undefined;
    }

    trackEvent('page_view', {
      subapp,
      path: pathname,
    });
  }, [pathname, workspaceURI, trackEvent]);

  return null;
}
