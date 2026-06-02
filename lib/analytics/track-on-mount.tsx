'use client';

import {useEffect} from 'react';
import {useTrack} from './use-track';

type Props = {
  /** Event name from EVENTS.md */
  event: string;
  /** Subapp code where this event originates */
  subapp?: string;
  /** Event-specific properties */
  props?: Record<string, unknown>;
  /**
   * Re-fires the event whenever this key changes. Useful when the same component
   * is reused across different resources (e.g. navigating between news articles
   * keeps `<TrackOnMount>` mounted but the underlying entity changes).
   * Defaults to firing once on mount.
   */
  fireKey?: string | number;
};

/**
 * Server-component-friendly analytics emission.
 *
 * Drop this as a child of any server (or client) component to fire an analytics
 * event when the component mounts:
 *
 *   <TrackOnMount
 *     event="view_news"
 *     subapp="news"
 *     props={{news_id: newsObject.id, news_slug: newsObject.slug}}
 *     fireKey={newsObject.id}
 *   />
 *
 * Renders nothing; works alongside any visible UI.
 */
export default function TrackOnMount({event, subapp, props, fireKey}: Props) {
  const trackEvent = useTrack(subapp);

  useEffect(() => {
    trackEvent(event, props ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, fireKey]);

  return null;
}
