import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listMobileReleasesRequest,
  upsertMobileReleaseRequest,
} from '../infrastructure/mobile-release-api';
import type { MobileReleasePlatform } from '../domain/mobile-release';

const listKey = ['admin-mobile-releases'] as const;

export function useMobileReleases(enabled: boolean) {
  return useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => listMobileReleasesRequest(signal),
    enabled,
  });
}

export function useUpsertMobileRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      platform: MobileReleasePlatform;
      version: string;
      storeUrl?: string | null;
      notes?: string | null;
    }) =>
      upsertMobileReleaseRequest(input.platform, {
        version: input.version,
        store_url: input.storeUrl,
        notes: input.notes,
      }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
