import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CommunityOrg,
  CommunityProposalStatus,
} from "../domain/community";
import {
  approveCommunityProposalRequest,
  createCommunityOrgRequest,
  listCommunityOrgsRequest,
  listCommunityProposalsRequest,
  rejectCommunityProposalRequest,
  setCommunityOrgStatusRequest,
  updateCommunityOrgRequest,
  type CommunityOrgInput,
  type CommunityProposalApproveInput,
} from "../infrastructure/community-api";

export function useCommunityOrgs(enabled = true) {
  return useQuery({
    queryKey: ["community", "orgs"],
    queryFn: ({ signal }) => listCommunityOrgsRequest(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useCommunityProposals(
  params: { status?: CommunityProposalStatus } = { status: "pending" },
  enabled = true,
) {
  return useQuery({
    queryKey: ["community", "proposals", params],
    queryFn: ({ signal }) => listCommunityProposalsRequest(params, signal),
    enabled,
    staleTime: 15_000,
  });
}

export function useSaveCommunityOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ({ id: string } & Partial<CommunityOrgInput>) | CommunityOrgInput,
    ) => {
      if ("id" in params) {
        const { id, ...body } = params;
        return updateCommunityOrgRequest(id, body);
      }
      return createCommunityOrgRequest(params);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community"] }),
  });
}

export function useSetCommunityOrgStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: Pick<CommunityOrg, "id" | "status">) =>
      setCommunityOrgStatusRequest(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community"] }),
  });
}

export function useReviewCommunityProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      action: "approve" | "reject";
      body?: CommunityProposalApproveInput | { note?: string | null };
    }) => {
      if (params.action === "approve") {
        return approveCommunityProposalRequest(
          params.id,
          (params.body ?? {}) as CommunityProposalApproveInput,
        );
      }
      return rejectCommunityProposalRequest(
        params.id,
        params.body as { note?: string | null },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community"] }),
  });
}
