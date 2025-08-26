'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ----//
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/middleware';
import {findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {validate, withSubapp} from '@/subapps/events/common/actions/validation';
import {findEvent} from '@/subapps/events/common/orm/event';
import {error} from '@/subapps/events/common/utils';

export const fetchEvent = async ({
  slug,
  workspaceURL,
}: {
  slug: string;
  workspaceURL: string;
}) => {
  if (!slug) return error(await t('Missing event slug'));
  if (!workspaceURL) return error(await t('Workspace URL is missing'));

  const tenantId = headers().get(TENANT_HEADER);
  if (!tenantId) return error(await t('Tenant ID is missing!'));

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});
  if (!workspace) return error(await t('Invalid workspace'));

  const subappValidation = await validate([
    withSubapp(SUBAPP_CODES.events, workspaceURL, tenantId),
  ]);
  if (subappValidation.error) return subappValidation;

  const event = await findEvent({
    slug,
    workspace,
    tenantId,
    user,
  });
  if (!event) return error(await t('Record not found'));

  return {success: true, data: clone(event)};
};
