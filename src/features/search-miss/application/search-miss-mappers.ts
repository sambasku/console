import type { SearchMissListItem } from '../domain/search-miss';
import type { SearchMissWire } from '../infrastructure/search-miss-api';

export function normalizeSearchMissListItem(wire: SearchMissWire): SearchMissListItem {
  return {
    id: wire.id,
    term: wire.term,
    direction: wire.direction as SearchMissListItem['direction'],
    searchCount: wire.hit_count,
    fulfilled: wire.is_fulfilled,
    pendingContributionCount: wire.pending_contribution_count,
    pendingContributionId: wire.pending_contribution_id,
    isVisible: wire.is_visible,
    createdAt: wire.created_at,
  };
}
