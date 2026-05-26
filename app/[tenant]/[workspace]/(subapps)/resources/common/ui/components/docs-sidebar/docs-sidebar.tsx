'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
  MdAutoAwesome,
  MdExpandMore,
  MdFiberNew,
  MdFolder,
  MdHomeFilled,
  MdSearch,
} from 'react-icons/md';

import {cn} from '@/utils/css';
import {SUBAPP_CODES} from '@/constants';
import {FolderIcon} from '../doc-file-icon';

export interface DocsSidebarCategory {
  id: string;
  fileName: string;
  colorSelect?: string | null;
  logoSelect?: string | null;
  children?: DocsSidebarCategory[];
}

export interface DocsSidebarProps {
  categories: DocsSidebarCategory[];
  newCount: number;
  workspaceURI: string;
  searchPlaceholder: string;
  homeLabel: string;
  recentLabel: string;
  newLabel: string;
  categoriesLabel: string;
}

export function DocsSidebar({
  categories,
  newCount,
  workspaceURI,
  searchPlaceholder,
  homeLabel,
  recentLabel,
  newLabel,
  categoriesLabel,
}: DocsSidebarProps) {
  const pathname = usePathname() ?? '';
  const homeHref = `${workspaceURI}/${SUBAPP_CODES.resources}`;
  const isHomeActive = pathname === homeHref;

  const [search, setSearch] = useState('');

  // Initialize: expand the first top-level category, or any that contains the active folder
  const activeFolderId = useMemo(() => {
    const m = pathname.match(/\/resources\/folder\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const findCategoryForFolder = (
    list: DocsSidebarCategory[],
    folderId: string | null,
  ): string | null => {
    if (!folderId) return null;
    for (const c of list) {
      if (c.id === folderId) return c.id;
      if (c.children?.some(child => child.id === folderId)) return c.id;
    }
    return null;
  };

  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const activeParent = findCategoryForFolder(categories, activeFolderId);
    if (activeParent) initial[activeParent] = true;
    else if (categories[0]) initial[categories[0].id] = true;
    return initial;
  });

  const toggleCat = (id: string) => {
    setOpenCats(prev => ({...prev, [id]: !prev[id]}));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories
      .map(c => {
        const childrenMatch =
          c.children?.filter(s =>
            s.fileName?.toLowerCase().includes(q),
          ) ?? [];
        const catMatch = c.fileName?.toLowerCase().includes(q);
        if (catMatch) return c;
        if (childrenMatch.length > 0) return {...c, children: childrenMatch};
        return null;
      })
      .filter(Boolean) as DocsSidebarCategory[];
  }, [categories, search]);

  return (
    <aside className="w-[280px] shrink-0 bg-white border-r border-ink-100 flex flex-col">
      {/* Search */}
      <div className="px-[18px] pt-[18px] pb-3 border-b border-ink-100">
        <div className="flex items-center gap-2 px-3 py-[9px] rounded-[10px] bg-royal-pale/60 border border-royal-border">
          <MdSearch className="text-royal text-sm shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] text-ink-800 placeholder:text-ink-400"
          />
          <span className="text-[10px] font-mono font-bold tracking-tight px-1.5 py-[1px] rounded-[4px] bg-royal-pale text-royal-dark">
            ⌘K
          </span>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-3 pt-3 pb-2">
        <Link
          href={homeHref}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg mb-0.5 text-left text-[13.5px] transition-colors',
            isHomeActive
              ? 'bg-royal-pale text-royal-dark font-bold'
              : 'text-ink-700 hover:bg-ink-25 font-semibold',
          )}>
          <MdHomeFilled
            className={cn(
              'text-base',
              isHomeActive ? 'text-royal' : 'text-ink-500',
            )}
          />
          <span className="flex-1">{homeLabel}</span>
        </Link>

        <Link
          href={`${homeHref}#recents`}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-left text-[13px] font-medium text-ink-700 hover:bg-ink-25 transition-colors">
          <MdAutoAwesome className="text-sm text-royal" />
          <span className="flex-1">{recentLabel}</span>
        </Link>

        <Link
          href={`${homeHref}#new`}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-left text-[13px] font-medium text-ink-700 hover:bg-ink-25 transition-colors">
          <MdFiberNew className="text-sm text-mint-500" />
          <span className="flex-1">{newLabel}</span>
          {newCount > 0 && (
            <span className="text-[11px] text-ink-500 font-semibold tabular-nums">
              {newCount}
            </span>
          )}
        </Link>
      </div>

      {/* Tree */}
      <div className="flex-1 px-3 pt-2 pb-5 overflow-y-auto">
        <div className="text-[10.5px] font-extrabold tracking-[0.06em] uppercase text-ink-500 px-2 py-1.5">
          {categoriesLabel}
        </div>
        {filtered.length === 0 ? (
          <div className="px-2 py-3 text-[12px] text-ink-400">
            {/* Silent empty state */}
          </div>
        ) : (
          filtered.map(cat => {
            const open = !!openCats[cat.id] || !!search.trim();
            return (
              <div key={cat.id}>
                <button
                  type="button"
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-left text-[13px] font-semibold text-ink-800 hover:bg-ink-25 transition-colors">
                  <MdExpandMore
                    className={cn(
                      'text-[12px] text-ink-400 transition-transform shrink-0',
                      open ? '' : '-rotate-90',
                    )}
                  />
                  <FolderIcon
                    colorSelect={cat.colorSelect}
                    size={22}
                  />
                  <span className="flex-1 min-w-0 truncate">
                    {cat.fileName}
                  </span>
                </button>
                {open && cat.children && cat.children.length > 0 && (
                  <div className="ml-6 pl-2.5 border-l border-ink-100">
                    {cat.children.map(sub => {
                      const isActive = activeFolderId === sub.id;
                      return (
                        <Link
                          key={sub.id}
                          href={`${workspaceURI}/${SUBAPP_CODES.resources}/folder/${sub.id}`}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors',
                            isActive
                              ? 'bg-royal-pale text-royal-dark font-semibold'
                              : 'text-ink-700 font-medium hover:bg-ink-25',
                          )}>
                          <MdFolder
                            className={cn(
                              'text-[11px] shrink-0',
                              isActive ? 'text-royal' : 'text-ink-400',
                            )}
                          />
                          <span className="flex-1 min-w-0 truncate">
                            {sub.fileName}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
