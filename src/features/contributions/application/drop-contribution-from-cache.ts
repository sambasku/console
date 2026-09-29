import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { CursorPage } from '@/shared/api/types';
import type { ContributionListItem, ContributionStatus, EntityType } from '../domain/contribution';

type ContributionListData = InfiniteData<CursorPage<ContributionListItem>>;

type ListFilter = {
  status?: ContributionStatus;
  entityType?: EntityType;
  mine?: boolean;
};

/** Query list memakai key `['contributions', { status, entityType, mine }]`. */
function isContributionListQuery(queryKey: readonly unknown[]): boolean {
  return (
    queryKey[0] === 'contributions' &&
    queryKey[1] !== 'detail' &&
    typeof queryKey[1] === 'object' &&
    queryKey[1] !== null
  );
}

function listFilter(queryKey: readonly unknown[]): ListFilter | null {
  if (!isContributionListQuery(queryKey)) return null;
  return queryKey[1] as ListFilter;
}

/** Cache list yang masih menampilkan item pending ini (bukan riwayat "milik saya"). */
function listAcceptsItem(queryKey: readonly unknown[], item: ContributionListItem): boolean {
  const filter = listFilter(queryKey);
  if (!filter || filter.mine) return false;
  if (filter.status && filter.status !== item.status) return false;
  if (filter.entityType && filter.entityType !== item.entity_type) return false;
  return true;
}

/**
 * Hapus item dari semua cache antrean contributions (infinite pages).
 * Dipakai setelah approve/reject/correct yang menutup usulan supaya
 * auto-advance tidak menunggu refetch.
 */
export function dropContributionFromListCaches(queryClient: QueryClient, id: string): void {
  queryClient.setQueriesData<ContributionListData>(
    {
      predicate: (query) => isContributionListQuery(query.queryKey),
    },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.filter((item) => item.id !== id),
        })),
      };
    },
  );
}

/**
 * Kembalikan item ke depan halaman pertama cache yang masih cocok
 * (gagal decide - kartu dimunculkan ulang).
 */
export function restoreContributionToListFront(queryClient: QueryClient, item: ContributionListItem): void {
  queryClient.setQueriesData<ContributionListData>(
    {
      predicate: (query) => listAcceptsItem(query.queryKey, item),
    },
    (old) => {
      if (!old?.pages?.length) return old;
      if (old.pages.some((page) => page.data.some((row) => row.id === item.id))) return old;
      const [first, ...rest] = old.pages;
      if (!first) return old;
      return {
        ...old,
        pages: [{ ...first, data: [item, ...first.data] }, ...rest],
      };
    },
  );
}

/** Rekonsiliasi list sekali, setelah antrean decide kosong. */
export function invalidateContributionLists(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) => isContributionListQuery(query.queryKey),
  });
}
