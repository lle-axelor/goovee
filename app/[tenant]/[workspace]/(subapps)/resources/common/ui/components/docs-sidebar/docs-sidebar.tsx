'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
  MdExpandMore,
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
  workspaceURI: string;
  searchPlaceholder: string;
  homeLabel: string;
  categoriesLabel: string;
}

export function DocsSidebar({
  categories,
  workspaceURI,
  searchPlaceholder,
  homeLabel,
  categoriesLabel,
}: DocsSidebarProps) {
  const pathname = usePathname() ?? '';
  const homeHref = `${workspaceURI}/${SUBAPP_CODES.resources}`;
  const isHomeActive = pathname === homeHref;

  const [search, setSearch] = useState('');

  const activeFolderId = useMemo(() => {
    const m = pathname.match(/\/resources\/folder\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  // Walk the tree to find the active folder's ancestor chain (so we can
  // auto-expand them on first render).
  const initialOpen = useMemo(() => {
    const initial: Record<string, boolean> = {};
    if (activeFolderId) {
      const ancestors: string[] = [];
      const walk = (
        nodes: DocsSidebarCategory[],
        trail: string[],
      ): boolean => {
        for (const n of nodes) {
          if (n.id === activeFolderId) {
            ancestors.push(...trail);
            return true;
          }
          if (n.children?.length) {
            if (walk(n.children, [...trail, n.id])) return true;
          }
        }
        return false;
      };
      walk(categories, []);
      for (const id of ancestors) initial[id] = true;
    } else if (categories[0]) {
      initial[categories[0].id] = true;
    }
    return initial;
  }, [categories, activeFolderId]);

  const [openCats, setOpenCats] = useState<Record<string, boolean>>(initialOpen);

  const toggleCat = (id: string) => {
    setOpenCats(prev => ({...prev, [id]: !prev[id]}));
  };

  // Recursive name filter — keeps a node if it (or any descendant) matches.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    const filter = (
      nodes: DocsSidebarCategory[],
    ): DocsSidebarCategory[] => {
      const out: DocsSidebarCategory[] = [];
      for (const n of nodes) {
        const childMatches = n.children ? filter(n.children) : [];
        const selfMatch = n.fileName?.toLowerCase().includes(q);
        if (selfMatch || childMatches.length > 0) {
          out.push({...n, children: childMatches});
        }
      }
      return out;
    };
    return filter(categories);
  }, [categories, search]);

  const isSearching = !!search.trim();

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
      </div>

      {/* Tree */}
      <div className="flex-1 px-3 pt-2 pb-5 overflow-y-auto">
        <div className="text-[10.5px] font-extrabold tracking-[0.06em] uppercase text-ink-500 px-2 py-1.5">
          {categoriesLabel}
        </div>
        {filtered.length === 0 ? null : (
          filtered.map(cat => (
            <CategoryNode
              key={cat.id}
              node={cat}
              depth={0}
              activeFolderId={activeFolderId}
              openCats={openCats}
              toggleCat={toggleCat}
              isSearching={isSearching}
              workspaceURI={workspaceURI}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function CategoryNode({
  node,
  depth,
  activeFolderId,
  openCats,
  toggleCat,
  isSearching,
  workspaceURI,
}: {
  node: DocsSidebarCategory;
  depth: number;
  activeFolderId: string | null;
  openCats: Record<string, boolean>;
  toggleCat: (id: string) => void;
  isSearching: boolean;
  workspaceURI: string;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const open = isSearching || !!openCats[node.id];
  const isActive = activeFolderId === node.id;
  const iconSize = depth === 0 ? 22 : 18;
  const textSize = depth === 0 ? 'text-[13px]' : 'text-[12.5px]';

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg mb-0.5 transition-colors',
          isActive
            ? 'bg-royal-pale text-royal-dark'
            : 'text-ink-800 hover:bg-ink-25',
        )}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleCat(node.id)}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="shrink-0 w-6 h-7 grid place-items-center rounded-md hover:bg-ink-50 transition-colors">
            <MdExpandMore
              className={cn(
                'text-[12px] text-ink-400 transition-transform',
                open ? '' : '-rotate-90',
              )}
            />
          </button>
        ) : (
          <span className="shrink-0 w-6 h-7" aria-hidden />
        )}
        <Link
          href={`${workspaceURI}/${SUBAPP_CODES.resources}/folder/${node.id}`}
          className={cn(
            'flex-1 min-w-0 flex items-center gap-2 px-1 py-1.5 font-semibold',
            textSize,
          )}>
          <FolderIcon colorSelect={node.colorSelect} size={iconSize} />
          <span className="flex-1 min-w-0 truncate">{node.fileName}</span>
        </Link>
      </div>
      {open && hasChildren && (
        <div className="ml-3 pl-3 border-l border-ink-100">
          {node.children!.map(child => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              openCats={openCats}
              toggleCat={toggleCat}
              isSearching={isSearching}
              workspaceURI={workspaceURI}
            />
          ))}
        </div>
      )}
    </div>
  );
}
