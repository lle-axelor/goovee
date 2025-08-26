// ---- CORE IMPORTS ---- //
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey, User} from '@/types';

// ---- LOCAL IMPORT ---- //
import {findQuotation} from '@/orm/quotations';

export async function getQuotationRecord({
  id,
  user,
  tenantId,
  workspaceURL,
  subapp,
}: {
  id: string;
  user: User;
  tenantId: string;
  workspaceURL: string;
  subapp: {
    role: string;
    isContactAdmin: boolean;
  };
}) {
  const {role, isContactAdmin} = subapp;
  const quotationWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  return await findQuotation({
    id,
    tenantId,
    params: {where: quotationWhereClause},
    workspaceURL,
  });
}
