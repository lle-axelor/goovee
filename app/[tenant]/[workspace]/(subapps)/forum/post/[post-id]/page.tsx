import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {findWorkspace} from '@/orm/workspace';
import {User} from '@/types';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {GROUPS_ORDER_BY} from '@/subapps/forum/common/constants';
import {
  findCommentCounts,
  findGroupMeta,
  findGroupsByMembers,
  findPosts,
  findRecentlyActivePosts,
  findUser,
} from '@/subapps/forum/common/orm/forum';
import {ForumV2Detail} from '@/subapps/forum/common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'post-id': string}>;
}) {
  const params = await props.params;
  const postId = params['post-id'];

  const session = await getSession();
  const user = session?.user as User;
  const userId = user?.id as string;

  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const workspace: any = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  }).then(clone);
  if (!workspace) return notFound();

  const memberGroups: any = userId
    ? await findGroupsByMembers({
        id: userId,
        orderBy: GROUPS_ORDER_BY,
        workspaceID: workspace?.id!,
        client,
        user,
      })
    : [];
  const memberGroupIDs = memberGroups.map((g: any) => g?.forumGroup?.id);

  const {posts = []} = await findPosts({
    ids: [postId],
    limit: 1,
    workspaceID: workspace?.id!,
    client,
    user,
    memberGroupIDs,
  }).then(clone);

  const post = posts?.[0];
  if (!post) return notFound();

  const [groupMeta, recent, $user] = await Promise.all([
    findGroupMeta({groupId: post.forumGroup?.id, client}),
    findRecentlyActivePosts({
      workspaceID: workspace?.id!,
      client,
      user,
      limit: 5,
    }).then(clone),
    findUser({userId, client}).then(clone),
  ]);

  const related = (recent as any[]).filter(
    r => String(r.id) !== String(postId),
  );
  const relatedCounts = await findCommentCounts({
    postIds: related.map(r => r.id),
    client,
  });
  const relatedWithCounts = related.map(r => ({
    ...r,
    replyCount: relatedCounts[String(r.id)] ?? 0,
  }));

  const replyCount =
    (await findCommentCounts({postIds: [postId], client}))[String(postId)] ?? 0;

  const forumBase = `${workspaceURI}/${SUBAPP_CODES.forum}`;

  return (
    <ForumV2Detail
      post={post}
      replyCount={replyCount}
      groupMeta={groupMeta}
      related={relatedWithCounts}
      currentUser={{
        name: user?.name ?? (user as any)?.simpleFullName,
        pictureId: ($user as any)?.picture?.id,
      }}
      canComment={Boolean(post.isMember)}
      backHref={forumBase}
    />
  );
}
