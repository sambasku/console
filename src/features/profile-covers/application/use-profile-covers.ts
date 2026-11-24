import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileCoverVariant } from '../domain/profile-cover';
import {
  activateProfileCover,
  createProfileCover,
  deleteProfileCover,
  listProfileCovers,
} from '../infrastructure/profile-cover-api';

function queryKey(variant: ProfileCoverVariant) {
  return ['admin-profile-covers', variant] as const;
}

export function useProfileCoverList(
  variant: ProfileCoverVariant,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKey(variant),
    queryFn: ({ signal }) => listProfileCovers(variant, signal),
    enabled,
  });
}

export function useCreateProfileCover(variant: ProfileCoverVariant) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProfileCover,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(variant) }),
  });
}

export function useActivateProfileCover(variant: ProfileCoverVariant) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activateProfileCover,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(variant) }),
  });
}

export function useDeleteProfileCover(variant: ProfileCoverVariant) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProfileCover,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(variant) }),
  });
}