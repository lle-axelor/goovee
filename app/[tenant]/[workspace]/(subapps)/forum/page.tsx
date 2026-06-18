import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {findWorkspace} from '@/orm/workspace';
import {User} from '@/types';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {DEFAULT_LIMIT} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {GROUPS_ORDER_BY} from '@/subapps/forum/common/constants';
import {
  findCommentCounts,
  findGroups,
  findGroupsByMembers,
  findPosts,
  findRecentlyActivePosts,
  findUser,
} from '@/subapps/forum/common/orm/forum';
import {
  ForumFeed,
  ForumSidebar,
  GroupControls,
} from '@/subapps/forum/common/ui/components';

export default async function Page(props: {
  params: Promise<{type: string; tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const session = await getSession();
  const user = session?.user as User;
  const userId = user?.id as string;

  const {workspaceURL, tenant: tenantId} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace: any = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const groups = await findGroups({workspace: workspace!, client, user}).then(
    clone,
  );
  const groupIDs = groups.map((group: any) => group.id);

  const memberGroups: any = userId
    ? await findGroupsByMembers({
        id: userId,
        orderBy: GROUPS_ORDER_BY,
        workspaceID: workspace?.id!,
        client,
        user,
      })
    : [];
  const memberGroupIDs = memberGroups.map(
    (group: any) => group?.forumGroup?.id,
  );
  const nonMemberGroups: any = groups.filter(
    (group: any) => !memberGroupIDs.includes(group.id),
  );

  const $user = (await findUser({userId, client}).then(clone)) as User;

  const {posts = [], pageInfo} = await findPosts({
    sort: searchParams?.sort,
    search: searchParams?.search,
    limit: searchParams?.limit ? Number(searchParams.limit) : DEFAULT_LIMIT,
    workspaceID: workspace?.id!,
    groupIDs,
    client,
    user,
    memberGroupIDs,
  }).then(clone);

  const replyCounts = await findCommentCounts({
    postIds: posts.map((p: any) => p.id),
    client,
  });
  const postsWithCounts = posts.map((p: any) => ({
    ...p,
    replyCount: replyCounts[String(p.id)] ?? 0,
  }));

  const recent = await findRecentlyActivePosts({
    workspaceID: workspace?.id!,
    client,
    user,
    limit: 3,
  }).then(clone);

  const stats = {
    discussions: (pageInfo as any)?.count ?? posts.length,
    groups: groups.length,
    myGroups: memberGroups.length,
  };

  return (
    <div className="bg-ink-25 min-h-full">
      <div className="container py-8 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mb-20 lg:mb-0">
        <div className="min-w-0">
          <ForumFeed
            posts={postsWithCounts}
            groups={memberGroups.map((g: any) => g.forumGroup)}
            canPost={Boolean($user?.id)}
          />
        </div>
        <aside className="lg:sticky lg:top-6 flex flex-col gap-5">
          <ForumSidebar
            stats={stats}
            trending={(recent as any[]).map(r => ({id: r.id, title: r.title}))}
          />
          <GroupControls
            memberGroups={memberGroups}
            nonMemberGroups={nonMemberGroups}
            user={$user}
            selectedGroup={null}
          />
        </aside>
      </div>
    </div>
  );
}
