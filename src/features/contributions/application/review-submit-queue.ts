import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App as AntdApp } from 'antd';
import { normalizeError } from '@/shared/api/error';
import type { ContributionListItem, ReviewDecisionResult } from '../domain/contribution';
import { approveContributionRequest, rejectContributionRequest } from '../infrastructure/contribution-api';
import {
  dropContributionFromListCaches,
  invalidateContributionLists,
  restoreContributionToListFront,
} from './drop-contribution-from-cache';

export type ReviewDecision = 'approve' | 'reject';

/** Sudah diputus orang lain - jangan munculkan ulang. */
export const ALREADY_REVIEWED_CODE = 'CONTRIBUTION_ALREADY_REVIEWED';

const MAX_CONCURRENT = 3;

export interface ReviewCommitInput {
  id: string;
  decision: ReviewDecision;
  comment?: string;
  imageDecisions?: { image_id: string; decision: 'approve' | 'reject' }[];
  censoredByImageId?: Record<string, Blob>;
  listItem: ContributionListItem;
}

export function shouldRestoreFailedReview(errorCode: string): boolean {
  return errorCode !== ALREADY_REVIEWED_CODE;
}

/**
 * Approve/reject di belakang: UI drop + advance dulu, maksimal 3 request
 * bersamaan. Gagal (selain sudah diproses) mengembalikan item ke depan antrean.
 */
export function useReviewSubmitQueue(onRestore: (id: string) => void): {
  enqueue: (input: ReviewCommitInput) => boolean;
  suppressedIds: ReadonlySet<string>;
} {
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  const [suppressedIds, setSuppressedIds] = useState<ReadonlySet<string>>(() => new Set());
  const pending = useRef<ReviewCommitInput[]>([]);
  const inFlight = useRef(0);
  const seen = useRef(new Set<string>());
  const onRestoreRef = useRef(onRestore);
  const messageRef = useRef(message);
  const mounted = useRef(true);
  const pumpRef = useRef<() => void>(() => {});

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    onRestoreRef.current = onRestore;
    messageRef.current = message;
  }, [message, onRestore]);

  const finishJob = useCallback(
    (id: string) => {
      inFlight.current -= 1;
      seen.current.delete(id);
      pumpRef.current();
      if (pending.current.length === 0 && inFlight.current === 0) {
        void invalidateContributionLists(queryClient);
      }
    },
    [queryClient],
  );

  const run = useCallback(
    (job: ReviewCommitInput) => {
      const task =
        job.decision === 'approve'
          ? approveContributionRequest(job.id, job.comment, job.imageDecisions, job.censoredByImageId)
          : rejectContributionRequest(job.id, job.comment ?? '');

      void task.then(
        (result: ReviewDecisionResult) => {
          if (result.merged_into_word_id) {
            messageRef.current.success('Makna digabung ke kata yang sudah tayang.');
          }
          finishJob(job.id);
        },
        (err: unknown) => {
          const apiErr = normalizeError(err);
          if (shouldRestoreFailedReview(apiErr.errorCode)) {
            restoreContributionToListFront(queryClient, job.listItem);
            if (mounted.current) {
              setSuppressedIds((prev) => {
                if (!prev.has(job.id)) return prev;
                const next = new Set(prev);
                next.delete(job.id);
                return next;
              });
              onRestoreRef.current(job.id);
            }
          }
          messageRef.current.error(apiErr.message);
          finishJob(job.id);
        },
      );
    },
    [finishJob, queryClient],
  );

  const pump = useCallback(() => {
    while (inFlight.current < MAX_CONCURRENT && pending.current.length > 0) {
      const job = pending.current.shift();
      if (!job) break;
      inFlight.current += 1;
      run(job);
    }
  }, [run]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const enqueue = useCallback(
    (input: ReviewCommitInput) => {
      if (seen.current.has(input.id)) return false;
      seen.current.add(input.id);
      setSuppressedIds((prev) => {
        const next = new Set(prev);
        next.add(input.id);
        return next;
      });
      dropContributionFromListCaches(queryClient, input.id);
      pending.current.push(input);
      pump();
      return true;
    },
    [pump, queryClient],
  );

  return { enqueue, suppressedIds };
}
