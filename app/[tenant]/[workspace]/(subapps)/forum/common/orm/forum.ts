// ---- CORE IMPORTS ---- //
import {ORDER_BY} from '@/constants';
import {SORT_TYPE} from '@/comments';
import type {Client} from '@/goovee/.generated/client';
import {ID, User} from '@/types';
import type {PageInfo} from '@/types';
import {clone, getPageInfo} from '@/utils';
import {getSkip} from '@/utils/pagination';
import {Workspace} from '@/orm/workspace';
import {filterPrivate} from '@/orm/filter';

// ---- LOCAL IMPORTS ---- //
import {
  addProperties,
  getArchivedFilter,
  filterPrivateQuery,
} from '@/subapps/forum/common/utils';
import {
  Post,
  PostWithMembership,
  RecentlyActivePost,
} from '@/subapps/forum/common/types/forum';

export async function findGroups({
  workspaceURL,
  client,
  user,
  archived = false,
}: {
  workspaceURL: Workspace['url'];
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!workspaceURL) return [];

  const groups = await client.aOSPortalForumGroup.find({
    where: {
      workspace: {
        url: workspaceURL,
      },
      AND: [filterPrivate({user}), getArchivedFilter({archived})],
    },
    select: {
      name: true,
      image: {id: true},
    },
  });

  return groups;
}

export async function findGroupsByMembers({
  id = null,
  searchKey,
  orderBy,
  workspaceID,
  client,
  user,
  archived = false,
}: {
  id: ID | null;
  searchKey?: string;
  orderBy?: Record<string, unknown>;
  workspaceID: Workspace['id'];
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!workspaceID) return [];

  const whereClause = {
    member: {
      AND: [{id}, {id: {ne: null}}],
    },
    forumGroup: {
      workspace: {id: workspaceID},
      AND: [filterPrivate({user}), getArchivedFilter({archived})],
      ...(searchKey ? {name: {like: `%${searchKey}%`}} : {}),
    },
  };

  return await client.aOSPortalForumGroupMember
    .find({
      where: whereClause,
      orderBy,
      select: {
        forumGroup: {
          name: true,
          image: {
            id: true,
          },
        },
        isPin: true,
        notificationSelect: true,
      },
    })
    .then(clone);
}

export async function findUser({
  userId,
  client,
  archived = false,
}: {
  userId: ID | null | undefined;
  client: Client;
  archived?: boolean;
}) {
  if (!userId) {
    return null;
  }

  const archivedFilter = getArchivedFilter({archived});

  const user = await client.aOSPartner.findOne({
    where: {
      id: userId,
      ...archivedFilter,
    },
    select: {
      picture: {
        fileName: true,
        fileType: true,
        fileSize: true,
        filePath: true,
        sizeText: true,
      },
    },
  });
  return user;
}

export async function findPosts({
  sort = null,
  limit,
  page = 1,
  search = '',
  whereClause = {},
  workspaceID,
  groupIDs = [],
  client,
  ids,
  user,
  archived = false,
  memberGroupIDs = [],
}: {
  sort?: string | null;
  limit?: number;
  page?: string | number;
  search?: string | undefined;
  ids?: Array<Post['id']> | undefined;
  whereClause?: Record<string, unknown>;
  workspaceID: Workspace['id'];
  groupIDs?: ID[];
  client: Client;
  user?: User;
  archived?: boolean;
  memberGroupIDs?: Array<string>;
}): Promise<{posts: PostWithMembership[]; pageInfo: PageInfo}> {
  if (!workspaceID) {
    return {
      posts: [],
      pageInfo: getPageInfo({}),
    };
  }

  let orderBy: Record<string, string> | null = null;

  switch (sort) {
    case SORT_TYPE.old:
      orderBy = {postDateT: ORDER_BY.ASC};
      break;
    // MBI: no "popular" sort — an old ?sort=popular URL falls back to recent.
    default:
      orderBy = {postDateT: ORDER_BY.DESC};
  }

  const skip = limit ? getSkip(limit, page) : undefined;

  const archivedFilter = getArchivedFilter({archived});
  const whereClauseWithArchivedFilter = addProperties({
    element: whereClause,
    key: 'AND',
    value: archivedFilter,
  });

  const combinedWhereClause = {
    ...whereClauseWithArchivedFilter,
    forumGroup: {
      workspace: {
        id: workspaceID,
      },
      ...(groupIDs.length ? {id: {in: groupIDs}} : {}),
      ...(whereClause.forumGroup as object | undefined),
      AND: [filterPrivate({user}), archivedFilter],
    },
    ...(search
      ? {
          title: {
            like: `%${search}%`,
          },
        }
      : {}),
    ...(ids?.length ? {id: {in: ids}} : {}),
  };

  /* MBI: the default ("Recent") order of a paginated list is the last activity
   * of each discussion — its latest reply, or its own date when unanswered —
   * so a discussion that just got a reply comes back on top. The ORM cannot
   * order on that, so the matching ids are sorted here and the page is fetched
   * by id. Single-record lookups (by ids / without limit) are left as they are. */
  const orderByActivity = sort !== SORT_TYPE.old && !!limit && !ids?.length;
  let activityPageIds: string[] | null = null;
  let activityCount = 0;

  if (orderByActivity) {
    const matching = (await client.aOSPortalForumPost
      .find({
        where: combinedWhereClause,
        select: {postDateT: true, createdOn: true},
      })
      .catch(error => {
        console.error('error >>>', error);
        return [];
      })) as unknown as Array<{
      id: string | number;
      postDateT?: string | Date | null;
      createdOn?: string | Date | null;
    }>;

    const lastReplyDates = await findLastReplyDates({
      postIds: matching.map(p => p.id),
      client,
    });
    const toTime = (date?: string | Date | null) =>
      date ? new Date(date).getTime() || 0 : 0;
    const activityOf = (p: (typeof matching)[number]) =>
      Math.max(
        toTime(p.postDateT ?? p.createdOn),
        toTime(lastReplyDates[String(p.id)]),
      );

    const sortedIds = [...matching]
      .sort((a, b) => activityOf(b) - activityOf(a))
      .map(p => String(p.id));
    const start = skip ?? 0;
    activityCount = sortedIds.length;
    activityPageIds = sortedIds.slice(start, start + limit);

    if (!activityPageIds.length) {
      return {
        posts: [],
        pageInfo: getPageInfo({count: activityCount, page, limit}),
      };
    }
  }

  const posts = await client.aOSPortalForumPost
    .find({
      where: activityPageIds
        ? {...combinedWhereClause, id: {in: activityPageIds}}
        : combinedWhereClause,
      orderBy,
      ...(activityPageIds ? {} : {take: limit, ...(skip ? {skip} : {})}),
      select: {
        title: true,
        forumGroup: {
          name: true,
          image: {
            fileName: true,
            fileType: true,
            fileSize: true,
            filePath: true,
            sizeText: true,
          },
        },
        postDateT: true,
        content: true,
        attachmentList: {
          select: {
            title: true,
            metaFile: {
              id: true,
              fileType: true,
              fileName: true,
            },
          },
        },
        author: {
          id: true,
          simpleFullName: true,
          picture: {
            fileName: true,
            fileType: true,
            fileSize: true,
            filePath: true,
            sizeText: true,
          },
        },
        bestReply: {id: true},
        statusSelect: true,
        createdOn: true,
      },
    })
    .then(posts => {
      let $posts = (posts as unknown as Post[])?.map(post => ({
        ...post,
        isMember: memberGroupIDs.includes(post.forumGroup?.id ?? ''),
      }));
      if (activityPageIds) {
        const rank = new Map(activityPageIds.map((id, i) => [id, i]));
        $posts = [...$posts].sort(
          (a, b) =>
            (rank.get(String(a.id)) ?? 0) - (rank.get(String(b.id)) ?? 0),
        );
      }
      return clone($posts) as PostWithMembership[];
    })
    .catch(error => {
      console.error('error >>>', error);
      return [] as PostWithMembership[];
    });

  const pageInfo = getPageInfo({
    count: activityPageIds
      ? activityCount
      : (posts?.[0] as {_count?: number} | undefined)?._count,
    page,
    limit,
  });

  return {posts, pageInfo};
}

/**
 * Total post count across the given groups, mirroring findPosts' visibility
 * scoping (workspace + private + archived). Used for the community
 * "Discussions" stat, which must stay a true total independent of the feed's
 * group filter.
 */
export async function countPosts({
  workspaceID,
  groupIDs = [],
  client,
  user,
  archived = false,
}: {
  workspaceID: Workspace['id'];
  groupIDs?: ID[];
  client: Client;
  user?: User;
  archived?: boolean;
}): Promise<number> {
  if (!workspaceID) return 0;

  const archivedFilter = getArchivedFilter({archived});

  const count = await client.aOSPortalForumPost
    .count({
      where: {
        AND: [archivedFilter],
        forumGroup: {
          workspace: {id: workspaceID},
          ...(groupIDs.length ? {id: {in: groupIDs}} : {}),
          AND: [filterPrivate({user}), archivedFilter],
        },
      },
    })
    .catch(() => 0);

  return Number(count) || 0;
}

export async function findPostsByGroupId({
  id,
  workspaceID,
  sort = null,
  limit,
  search = '',
  ids,
  client,
  user,
  memberGroupIDs = [],
}: {
  id: ID;
  workspaceID: string;
  sort?: string | null;
  limit?: number;
  search?: string | undefined;
  ids?: string[];
  client: Client;
  user?: User;
  memberGroupIDs?: Array<string>;
}) {
  const whereClause = {
    forumGroup: {
      id,
    },
  };

  return await findPosts({
    whereClause,
    workspaceID,
    sort,
    limit,
    search,
    ids,
    groupIDs: [id],
    client,
    user,
    memberGroupIDs,
  });
}

export async function findGroupById(
  id: ID,
  workspaceID: ID,
  client: Client,
  user?: User,
  archived = false,
) {
  if (!workspaceID) {
    return null;
  }

  const archivedFilter = getArchivedFilter({archived});

  const group = await client.aOSPortalForumGroup.findOne({
    where: {
      id,
      workspace: {
        id: workspaceID,
      },
      AND: [filterPrivate({user}), archivedFilter],
    },
    select: {
      name: true,
      image: {
        fileName: true,
      },
      thumbnailImage: {
        id: true,
        fileName: true,
      },
    },
  });
  return group;
}

export async function findMemberGroupById({
  id,
  groupID,
  workspaceID,
  client,
  user,
  archived = false,
}: {
  id: ID;
  groupID: ID;
  workspaceID: ID;
  client: Client;
  user?: User;
  archived?: boolean;
}) {
  if (!workspaceID) {
    return null;
  }

  if (!(id || groupID)) {
    return null;
  }

  // A membership can only be operated on by its owner. Without this scope the
  // caller could pass another user's group-member id and pin/leave/reconfigure
  // their membership.
  if (!user?.id) {
    return null;
  }
  const group = await client.aOSPortalForumGroupMember.findOne({
    where: {
      id,
      member: {id: user.id},
      forumGroup: {
        workspace: {
          id: workspaceID,
        },
        id: groupID,
        AND: [filterPrivate({user}), getArchivedFilter({archived})],
      },
    },
    select: {
      forumGroup: {id: true},
    },
  });

  return group;
}

export async function findRecentlyActivePosts({
  workspaceID,
  client,
  user,
  limit = 3,
}: {
  workspaceID: Workspace['id'];
  client: Client;
  user?: User;
  limit?: number;
}): Promise<RecentlyActivePost[]> {
  if (!workspaceID) return [];

  const params: unknown[] = [];
  let idx = 1;

  params.push(workspaceID);
  let whereClause = `WHERE forumGroup.workspace = $${idx++}`;

  const {
    clause: privateClause,
    params: privateParams,
    nextIndex,
  } = await filterPrivateQuery(user, client, idx);
  whereClause += ` ${privateClause}`;
  params.push(...privateParams);
  idx = nextIndex;

  whereClause +=
    ' AND COALESCE(post.archived, false) IS FALSE AND COALESCE(forumGroup.archived, false) IS FALSE';

  params.push(limit);
  const limitIdx = idx++;

  const posts = await client.$raw(
    `
    WITH LatestComment AS (
        SELECT
            m.id AS "commentId",
            m.related_id AS "postId",
            m.note AS "commentNote",
            m.created_on AS "commentDate",
            m.version AS "commentVersion",
            m.created_by AS "commentCreatedById",
            m.partner AS "commentPartnerId",
            ROW_NUMBER() OVER (PARTITION BY m.related_id ORDER BY m.created_on DESC) as rn
        FROM mail_message m
        WHERE m.related_model = 'com.axelor.apps.portal.db.ForumPost'
          AND m.parent_mail_message IS NULL
          AND m.note IS NOT NULL
          AND m.note <> ''
    )
    SELECT
        post.id,
        post.title,
        post.version,
        JSON_BUILD_OBJECT(
            'id', lc."commentId",
            'version', lc."commentVersion",
            'note', lc."commentNote",
            'createdOn', lc."commentDate",
            'partner', JSON_BUILD_OBJECT(
                'id', bp.id,
                'version', bp.version,
                'name', bp.name,
                'simpleFullName', bp.simple_full_name
            ),
            'createdBy', JSON_BUILD_OBJECT(
                'id', au.id,
                'version', au.version,
                'name', au.name,
                'fullName', au.full_name
            )
        ) AS comment,
        JSON_BUILD_OBJECT(
            'id', forumGroup.id,
            'version', forumGroup.version,
            'name', forumGroup.name
        ) AS "forumGroup"
    FROM portal_forum_post post
    JOIN LatestComment lc ON post.id = lc."postId" AND lc.rn = 1
    LEFT JOIN portal_forum_group forumGroup ON post.forum_group = forumGroup.id
    LEFT JOIN base_partner bp ON lc."commentPartnerId" = bp.id
    LEFT JOIN auth_user au ON lc."commentCreatedById" = au.id
    ${whereClause}
    ORDER BY lc."commentDate" DESC
    LIMIT $${limitIdx}
    `,
    ...params,
  );

  return posts as RecentlyActivePost[];
}

/**
 * Reply (comment) counts per post. Comments are mail_message rows related to
 * ForumPost (top-level, non-empty note) — same definition used elsewhere.
 * Returns a map keyed by post id.
 */
export async function findCommentCounts({
  postIds,
  client,
}: {
  postIds: Array<string | number>;
  client: Client;
}): Promise<Record<string, number>> {
  if (!postIds?.length) return {};

  const placeholders = postIds.map((_, i) => `$${i + 1}`).join(', ');

  const rows = (await client
    .$raw(
      `
      SELECT m.related_id AS "postId", COUNT(*)::int AS "count"
      FROM mail_message m
      WHERE m.related_model = 'com.axelor.apps.portal.db.ForumPost'
        AND m.related_id IN (${placeholders})
        AND m.parent_mail_message IS NULL
        AND (m.public_body IS NOT NULL OR m.is_public_note = TRUE)
        AND m.archived IS NOT TRUE
      GROUP BY m.related_id
      `,
      ...postIds.map(id => Number(id)),
    )
    .catch(() => [])) as Array<{postId: string | number; count: number}>;

  const map: Record<string, number> = {};
  (rows || []).forEach(r => {
    map[String(r.postId)] = Number(r.count) || 0;
  });
  return map;
}

/**
 * MBI: a reply shown in a discussion — a public, non-archived, non-empty
 * comment (top-level or nested) on a forum post. Shared by the last-activity
 * order and the last-reply preview so both agree.
 */
const VISIBLE_REPLY_CONDITION = `
  m.related_model = 'com.axelor.apps.portal.db.ForumPost'
  AND m.is_public_note IS TRUE
  AND m.archived IS NOT TRUE
  AND m.note IS NOT NULL
  AND m.note <> ''`;

/**
 * MBI: date of the latest visible reply per post, keyed by post id. Posts
 * without replies are absent from the map.
 */
export async function findLastReplyDates({
  postIds,
  client,
}: {
  postIds: Array<string | number>;
  client: Client;
}): Promise<Record<string, string>> {
  if (!postIds?.length) return {};

  const rows = (await client
    .$raw(
      `
      SELECT m.related_id AS "postId", MAX(m.created_on) AS "lastReplyDate"
      FROM mail_message m
      WHERE ${VISIBLE_REPLY_CONDITION}
        AND m.related_id = ANY($1)
      GROUP BY m.related_id
      `,
      postIds.map(id => Number(id)),
    )
    .catch(() => [])) as Array<{
    postId: string | number;
    lastReplyDate: string;
  }>;

  const map: Record<string, string> = {};
  (rows || []).forEach(r => {
    map[String(r.postId)] = r.lastReplyDate;
  });
  return map;
}

export type LastReply = {
  id: string;
  note: string;
  createdOn: string;
  author: string | null;
};

/**
 * MBI: latest visible reply per post (for the preview on discussion cards),
 * keyed by post id. Posts without replies are absent from the map.
 */
export async function findLastReplies({
  postIds,
  client,
}: {
  postIds: Array<string | number>;
  client: Client;
}): Promise<Record<string, LastReply>> {
  if (!postIds?.length) return {};

  const rows = (await client
    .$raw(
      `
      SELECT DISTINCT ON (m.related_id)
        m.related_id AS "postId",
        m.id AS "id",
        m.note AS "note",
        m.created_on AS "createdOn",
        COALESCE(bp.simple_full_name, bp.name, au.full_name) AS "author"
      FROM mail_message m
      LEFT JOIN base_partner bp ON m.partner = bp.id
      LEFT JOIN auth_user au ON m.created_by = au.id
      WHERE ${VISIBLE_REPLY_CONDITION}
        AND m.related_id = ANY($1)
      ORDER BY m.related_id, m.created_on DESC
      `,
      postIds.map(id => Number(id)),
    )
    .catch(() => [])) as Array<LastReply & {postId: string | number}>;

  const map: Record<string, LastReply> = {};
  (rows || []).forEach(({postId, ...reply}) => {
    map[String(postId)] = {...reply, id: String(reply.id)};
  });
  return map;
}

/**
 * Real member + post counts for a forum group (used in the discussion-detail
 * sidebar group card).
 */
export async function findGroupMeta({
  groupId,
  client,
}: {
  groupId?: ID;
  client: Client;
}): Promise<{memberCount: number; postCount: number}> {
  if (!groupId) return {memberCount: 0, postCount: 0};

  const [memberCount, postCount] = await Promise.all([
    client.aOSPortalForumGroupMember
      .count({where: {forumGroup: {id: groupId}}})
      .catch(() => 0),
    client.aOSPortalForumPost
      .count({
        where: {
          forumGroup: {id: groupId},
          ...getArchivedFilter({archived: false}),
        },
      })
      .catch(() => 0),
  ]);

  return {
    memberCount: Number(memberCount) || 0,
    postCount: Number(postCount) || 0,
  };
}
