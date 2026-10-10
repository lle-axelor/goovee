import type {Maybe} from '@/types/util';
import {defaultSortOption, sortOptions} from '../constants';
import {OrderByOptions} from '@goovee/orm';
import {AOSPartner} from '@/goovee/.generated/models';

/* MBI: a directory entry is shown under the partner's own name, its
 * simpleFullName — the name without the partner code that AOS prefixes to
 * fullName. The portal-specific company name is not used by the directory. */
export function getEntryName(entry: {simpleFullName?: Maybe<string>}): string {
  return (entry.simpleFullName || '').trim();
}

export function getOrderBy(sort: Maybe<string>): OrderByOptions<AOSPartner> {
  return (sortOptions.find(o => o.value == sort) ?? defaultSortOption).orderBy;
}
