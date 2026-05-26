// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import type {Cloned} from '@/types/util';
import type {User} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import {filterPrivate} from '@/orm/filter';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {COLORS, ICONS} from '@/subapps/resources/common/constants';

export async function fetchFolders({
  workspace,
  client,
  params,
  user,
  archived,
}: {
  params?: any;
  client: Client;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  archived?: boolean;
}) {
  if (!workspace) return [];

  const folders = await client.aOSDMSFile.find({
    where: {
      isDirectory: true,
      workspaceSet: {
        id: workspace?.id,
      },
      ...(params?.where || {}),
      AND: [
        await filterPrivate({client, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
        ...(params?.where?.AND || []),
      ],
    },
    select: {
      fileName: true,
      parent: {id: true},
      contentType: true,
      description: true,
      colorSelect: true,
      logoSelect: true,
    },
    orderBy: {
      updatedOn: 'DESC',
    } as any,
    take: params?.take,
  });

  return folders;
}

export async function fetchLatestFolders({
  workspace,
  client,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
}) {
  return fetchFolders({
    workspace,
    client,
    user,
    params: {
      where: {isHomepage: true},
      take: 10,
    },
  });
}

export async function fetchPinnedFoldersWithMeta({
  workspace,
  client,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
}) {
  if (!workspace) return [];

  const folders = await client.aOSDMSFile.find({
    where: {
      isDirectory: true,
      isHomepage: true,
      workspaceSet: {id: workspace?.id},
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      parent: {id: true, fileName: true},
      contentType: true,
      description: true,
      colorSelect: true,
      logoSelect: true,
      updatedOn: true,
    },
    orderBy: {updatedOn: 'DESC'} as any,
    take: 12,
  });

  // For each folder, count its children files (cheap: one extra query per folder)
  const result = await Promise.all(
    folders.map(async folder => {
      const itemCount = await client.aOSDMSFile.find({
        where: {
          isDirectory: {ne: true},
          parent: {id: folder.id},
          AND: [
            await filterPrivate({client, user}),
            {OR: [{archived: false}, {archived: null}]},
          ],
        },
        select: {id: true},
      });
      return {...folder, itemCount: itemCount.length};
    }),
  );

  return result;
}

export async function fetchNewFiles({
  workspace,
  client,
  user,
  sinceDays = 14,
  take = 10,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
  sinceDays?: number;
  take?: number;
}) {
  if (!workspace) return [];

  const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const files = await client.aOSDMSFile.find({
    where: {
      isDirectory: {ne: true},
      workspaceSet: {id: workspace?.id},
      createdOn: {ge: cutoff},
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      parent: {fileName: true},
      createdBy: {name: true, fullName: true},
      createdOn: true,
      metaFile: {
        sizeText: true,
        createdOn: true,
        updatedOn: true,
        fileName: true,
        fileSize: true,
        fileType: true,
      },
    },
    orderBy: {createdOn: 'DESC'} as any,
    take,
  });

  return files;
}

export async function fetchFiles({
  id,
  workspace,
  user,
  client,
  archived,
}: {
  id: string;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  client: Client;
  archived?: boolean;
}) {
  if (!workspace) {
    return [];
  }

  const files = await client.aOSDMSFile.find({
    where: {
      isDirectory: {
        ne: true,
      },
      parent: {
        id,
      },
      AND: [
        await filterPrivate({client, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      createdBy: {name: true, fullName: true},
      createdOn: true,
      metaFile: {
        description: true,
        sizeText: true,
        createdOn: true,
        updatedOn: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        fileType: true,
      },
    },
  });

  return files;
}

export async function fetchLatestFiles({
  workspace,
  client,
  user,
  archived,
  take = 10,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
  archived?: boolean;
  take?: number;
}) {
  if (!workspace) return [];

  const files = await client.aOSDMSFile.find({
    where: {
      isDirectory: {
        ne: true,
      },
      workspaceSet: {
        id: workspace?.id,
      },
      AND: [
        await filterPrivate({client, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      parent: {
        fileName: true,
      },
      createdBy: {name: true, fullName: true},
      createdOn: true,
      metaFile: {
        description: true,
        sizeText: true,
        createdOn: true,
        updatedOn: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        fileType: true,
      },
    },
    orderBy: {
      updatedOn: 'DESC',
    },
    take,
  });

  return files;
}

export async function fetchFile({
  id,
  workspace,
  user,
  client,
  archived,
}: {
  id: string;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  client: Client;
  archived?: boolean;
}) {
  const file = await client.aOSDMSFile.findOne({
    where: {
      id,
      workspaceSet: {
        id: workspace?.id,
      },
      AND: [
        await filterPrivate({client, user}),
        archived
          ? {archived: true}
          : {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      contentType: true,
      content: true,
      createdBy: {name: true, fullName: true},
      createdOn: true,
      metaFile: {
        description: true,
        sizeText: true,
        createdOn: true,
        updatedOn: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        fileType: true,
      },
      permissionSelect: true,
      isPrivate: true,
      partnerSet: {select: {id: true}},
      partnerCategorySet: {select: {id: true}},
      isDirectory: true,
      description: true,
    },
  });

  return file;
}

export async function fetchFolderWithParent({
  id,
  workspace,
  user,
  client,
}: {
  id: string;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  client: Client;
}) {
  if (!workspace) return null;

  const folder = await client.aOSDMSFile.findOne({
    where: {
      id,
      isDirectory: true,
      workspaceSet: {id: workspace?.id},
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      fileName: true,
      description: true,
      colorSelect: true,
      logoSelect: true,
      updatedOn: true,
      parent: {fileName: true, id: true},
    },
  });

  return folder;
}

export async function fetchColors() {
  return COLORS;
}

export async function fetchIcons() {
  return ICONS;
}

export async function fetchExplorerCategories({
  workspace,
  user,
  client,
  archived,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  client: Client;
  archived?: boolean;
}) {
  if (!workspace) return [];

  const categories = await client.aOSDMSFile
    .find({
      where: {
        isDirectory: true,
        workspaceSet: {
          id: workspace.id,
        },
        AND: [
          await filterPrivate({client, user}),
          archived
            ? {archived: true}
            : {OR: [{archived: false}, {archived: null}]},
        ],
      },
      select: {
        parent: {
          id: true,
        },
        fileName: true,
        logoSelect: true,
        colorSelect: true,
      },
    })
    .then(clone);

  const hiearchy = (categories: any) => {
    const map: any = {};
    categories.forEach((category: any) => {
      category.children = [];
      map[category.id] = category;
    });

    categories.forEach((category: any) => {
      const {parent} = category;
      if (parent?.id) {
        map[parent.id]?.children.push(category);
      }
    });

    const _parent = (category: any, parents: any[] = []) => {
      if (!category._parent) {
        category._parent = [...parents];
      }

      category.children.forEach((child: any) => {
        _parent(child, [...parents, category.id]);
      });
    };

    Object.values(map).map(category => _parent(category));

    return Object.values(map);
  };

  return hiearchy(categories);
}
