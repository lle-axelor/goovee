'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
  MdOutlinePerson,
  MdOutlineLock,
  MdOutlineNotificationsActive,
  MdOutlineWorkspaces,
} from 'react-icons/md';
import {IconType} from 'react-icons';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {ACCOUNT_TABS, type AccountTab} from './common/constants';

const TAB_ICONS: Record<AccountTab['key'], IconType> = {
  profile: MdOutlinePerson,
  security: MdOutlineLock,
  notifications: MdOutlineNotificationsActive,
  workspace: MdOutlineWorkspaces,
};

function isTabActive(pathname: string, tab: AccountTab): boolean {
  return tab.routes.some(route => pathname.includes(`/account/${route}`));
}

export default function Sidebar({isAdmin}: {isAdmin: boolean}) {
  const pathname = usePathname();
  const {workspaceURI} = useWorkspace();

  const tabs = ACCOUNT_TABS.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <nav className="flex flex-col gap-2 p-2 lg:p-0">
      {tabs.map(tab => {
        const Icon = TAB_ICONS[tab.key];
        const active = isTabActive(pathname, tab);
        const href = `${workspaceURI}/account/${tab.routes[0]}`;

        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              'group flex items-start gap-3 rounded-xl p-3 transition-colors',
              'border',
              active
                ? 'bg-royal-pale border-royal text-ink-900'
                : 'bg-white border-ink-100 text-ink-700 hover:border-ink-200 hover:bg-ink-25',
            )}>
            <span
              className={cn(
                'shrink-0 w-9 h-9 rounded-lg grid place-items-center',
                active
                  ? 'bg-royal text-white'
                  : 'bg-ink-50 text-ink-500 group-hover:bg-royal-pale group-hover:text-royal',
              )}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">
                {i18n.t(tab.label)}
              </p>
              <p
                className={cn(
                  'text-xs leading-snug mt-0.5',
                  active ? 'text-ink-700' : 'text-ink-500',
                )}>
                {i18n.t(tab.subtitle)}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
