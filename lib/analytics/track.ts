/**
 * Provider-agnostic analytics emission.
 *
 * Goovee pushes events to `window.dataLayer` with a stable schema; the bridge
 * snippets shipped via the AOS analytics catalogue (PortalAnalyticsScriptTemplate)
 * pick them up and forward them to whatever tracker the workspace has enabled
 * (Google Analytics, Matomo, Plausible, GTM, …).
 *
 * Goovee code MUST NOT reference any provider-specific API (gtag, _paq, …).
 * It only emits events with the names and properties documented in EVENTS.md.
 */

type EventProps = Record<string, unknown>;

type DataLayerObject = {event: string} & EventProps;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Emit an event. Safe to call from server components (no-op) or client code.
 * The event will only be forwarded to a tracker if a bridge is installed
 * on the page (i.e. the workspace has at least one analytics template active).
 *
 * @param event  - one of the event names documented in EVENTS.md
 * @param props  - additional structured properties for that event
 */
export function track(event: string, props: EventProps = {}): void {
  if (typeof window === 'undefined') return;

  const payload: DataLayerObject = {event, ...props};
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}
