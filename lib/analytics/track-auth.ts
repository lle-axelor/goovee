'use client';

import {track} from './track';

type AuthEvent =
  | 'login'
  | 'login_failed'
  | 'login_initiated'
  | 'register'
  | 'logout';

type AuthEventParams = {
  workspace?: string | null;
  tenant?: string | null;
  partnerId?: string | number | null;
  provider?: string;
  locale?: string | null;
  reason?: string;
};

export function trackAuth(event: AuthEvent, params: AuthEventParams): void {
  const {workspace, tenant, partnerId, provider, locale, reason} = params;
  const ws = workspace?.replace(/^\//, '') || undefined;
  if (!ws) return;
  track(event, {
    workspace: ws,
    ...(tenant ? {tenant} : {}),
    ...(partnerId != null ? {partner_id: String(partnerId)} : {}),
    ...(provider ? {provider} : {}),
    ...(locale ? {locale} : {}),
    ...(reason ? {reason} : {}),
  });
}
