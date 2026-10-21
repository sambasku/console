import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWordsRequest } from '@/features/words/infrastructure/word-api';
import type { WordGroupInput, WordGroupStatus } from '../domain/word-group';
import {
  addWordGroupMemberRequest,
  createWordGroupRequest,
  deleteWordGroupRequest,
  listAllWordGroupsRequest,
  removeWordGroupMemberRequest,
  updateWordGroupRequest,
} from '../infrastructure/word-group-api';

const KEY = ['word-groups'];

export function useAllWordGroups(params: { q?: string; status?: WordGroupStatus } = {}) {
  return useQuery({
    queryKey: [...KEY, 'all', params.q ?? '', params.status ?? ''],
    queryFn: ({ signal }) => listAllWordGroupsRequest(params, signal),
    staleTime: 30_000,
  });
}

export function useCreateWordGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWordGroupRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateWordGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<WordGroupInput>) =>
      updateWordGroupRequest(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteWordGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWordGroupRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddWordGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      ...body
    }: { groupId: string } & { word_id: string; notes?: string | null }) =>
      addWordGroupMemberRequest(groupId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveWordGroupMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, wordId }: { groupId: string; wordId: string }) =>
      removeWordGroupMemberRequest(groupId, wordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Autocomplete lemma untuk pilih anggota - GET /admin/words (semua status,
 * PRD: kelola lewat pencarian/autocomplete, bukan input ID manual).
 */
export function usePickWords(q: string, enabled = true) {
  return useQuery({
    queryKey: ['words', 'pick', q],
    queryFn: ({ signal }) => listWordsRequest({ q, limit: 10 }, signal).then((p) => p.data),
    enabled: enabled && q.trim().length > 0,
    staleTime: 10_000,
  });
}