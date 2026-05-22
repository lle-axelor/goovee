import {Role} from '../types';

export const ROUTES = {
  // Legacy routes — kept for backwards compatibility; each redirects
  // to its new consolidated route.
  personal: 'personal',
  prefrences: 'preferences',
  password: 'password',
  addresses: 'addresses',
  members: 'members',
  notifications: 'notifications',
  apps: 'apps',
  settings: 'settings',
  directory: 'directory',

  // New consolidated routes (4-tab fusion)
  profile: 'profile',
  security: 'security',
  workspace: 'workspace',
};

// ---- Legacy 9-item menus (kept for now; superseded visually by ACCOUNT_TABS) ----

export const GLOBAL_MENU = [
  {
    label: 'Personal settings',
    route: ROUTES.personal,
  },
  {
    label: 'Preferences',
    route: ROUTES.prefrences,
  },
  {
    label: 'Password',
    route: ROUTES.password,
  },

  {
    label: 'Addresses',
    route: ROUTES.addresses,
  },
  {
    label: 'Directory settings',
    route: ROUTES.directory,
  },
];

export const WORKSPACE_MENU = [
  {
    label: 'Notifications',
    route: ROUTES.notifications,
  },
  {
    label: 'My apps',
    route: ROUTES.apps,
  },
  {
    label: 'Settings',
    route: ROUTES.settings,
  },
];

export const ADMIN_WORKSPACE_MENU = [
  {
    label: 'Members',
    route: ROUTES.members,
  },
  ...WORKSPACE_MENU,
];

// ---- New 4-tab grouping (visual layer over the 9 routes) ----

export type AccountTab = {
  key: 'profile' | 'security' | 'notifications' | 'workspace';
  label: string;
  subtitle: string;
  routes: string[];
  adminOnly?: boolean;
};

export const ACCOUNT_TABS: AccountTab[] = [
  {
    key: 'profile',
    label: 'Profile',
    subtitle: 'Identity, preferences, directory visibility',
    routes: [
      ROUTES.profile,
      ROUTES.personal,
      ROUTES.prefrences,
      ROUTES.directory,
    ],
  },
  {
    key: 'security',
    label: 'Security',
    subtitle: 'Password and addresses',
    routes: [ROUTES.security, ROUTES.password, ROUTES.addresses],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    subtitle: 'Push and e-mail preferences',
    routes: [ROUTES.notifications],
  },
  {
    key: 'workspace',
    label: 'Workspace',
    subtitle: 'Members, applications and space settings',
    routes: [ROUTES.workspace, ROUTES.members, ROUTES.apps, ROUTES.settings],
  },
];

export const RoleLabel = {
  [Role.admin]: 'Admin',
  [Role.user]: 'User',
  [Role.owner]: 'Owner',
};
