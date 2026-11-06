import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { normalizeError } from '@/shared/api/error';
import type { SponsorshipInput } from '../domain/sponsorship';
import {
  createSponsorshipRequest,
  deleteSponsorshipRequest,
  listSponsorshipsRequest,
  updateSponsorshipRequest,
} from '../infrastructure/sponsorship-api';

export function useSponsorshipList(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-sponsorships'],
    queryFn: () => listSponsorshipsRequest({ limit: 100 }),
    enabled,
  });
}

export function useCreateSponsorship() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (input: SponsorshipInput) => createSponsorshipRequest(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      message.success('Sponsor ditambahkan.');
    },
    onError: (err) => message.warning(normalizeError(err).message || 'Gagal menambah sponsor'),
  });
}

export function useUpdateSponsorship() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (vars: { id: string; input: Partial<SponsorshipInput> }) =>
      updateSponsorshipRequest(vars.id, vars.input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      message.success('Sponsor diperbarui.');
    },
    onError: (err) => message.warning(normalizeError(err).message || 'Gagal memperbarui sponsor'),
  });
}

export function useDeleteSponsorship() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => deleteSponsorshipRequest(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      message.success('Sponsor dihapus dari daftar publik.');
    },
    onError: (err) => message.warning(normalizeError(err).message || 'Gagal menghapus sponsor'),
  });
}
