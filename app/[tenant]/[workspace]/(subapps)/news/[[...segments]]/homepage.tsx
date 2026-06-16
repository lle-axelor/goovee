import type {Cloned} from '@/types/util';

// ---- CORE IMPORTS ----//
import type {Client} from '@/goovee/.generated/client';
import {getSession} from '@/auth';
import {PortalWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {NewsV2Editorial} from '@/subapps/news/common/ui/components';
import {findNews} from '@/subapps/news/common/orm/news';

export async function Homepage({
  workspace,
  client,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
}) {
  const session = await getSession();
  const user = session?.user;

  const newsResult = await findNews({
    workspace,
    client,
    user,
    limit: 9,
    orderBy: {publicationDateTime: 'DESC'},
    params: {
      select: {
        description: true,
        author: {simpleFullName: true},
      },
    },
  }).then(clone);

  const articles = (newsResult as any)?.news || [];

  return <NewsV2Editorial articles={articles} />;
}

export default Homepage;
