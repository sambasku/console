import { describe, expect, it } from 'vitest';
import { mapEvent, type EventWire } from '../../infrastructure/event-api';
import {
  mapContribution,
  type EventContributionWire,
} from '../../infrastructure/event-contribution-api';

function eventWire(over: Partial<EventWire> = {}): EventWire {
  return {
    id: 'e1',
    slug: 'pawai-blocks-2026',
    name: 'Pawai Blocks Keywords',
    description: 'Acara pawai tahunan.',
    category_id: 'budaya-tradisi',
    category: { id: 'budaya-tradisi', name: 'Budaya dan Tradisi' },
    starts_at: '2026-11-20T02:00:00.000Z',
    ends_at: '2026-11-20T08:00:00.000Z',
    occurrence_status: 'upcoming',
    location_text: 'Lapangan utama Pemangkat',
    lat: 1.5,
    lng: 109.5,
    maps_url: null,
    poster_url: null,
    organizer: 'Panitia Pawai',
    source_url: 'https://facebook.com/pawai',
    source_type: 'facebook',
    source_attribution: '@panitia_pawai',
    region_id: 'r1',
    village_id: 'v1',
    village: { id: 'v1', name: 'Perapakan', slug: 'perapakan' },
    places: [{ id: 'p1', slug: 'pantai', name: 'Pantai Pemangkat', category: 'wisata' }],
    status: 'published',
    cancelled_at: null,
    published_at: '2026-10-01T00:00:00.000Z',
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: null,
    ...over,
  };
}

describe('mapEvent', () => {
  it('map snake_case API ke camelCase domain', () => {
    const e = mapEvent(eventWire());
    expect(e.categoryId).toBe('budaya-tradisi');
    expect(e.category?.name).toBe('Budaya dan Tradisi');
    expect(e.occurrenceStatus).toBe('upcoming');
    expect(e.locationText).toBe('Lapangan utama Pemangkat');
    expect(e.sourceUrl).toBe('https://facebook.com/pawai');
    expect(e.sourceType).toBe('facebook');
    expect(e.village?.name).toBe('Perapakan');
    expect(e.places).toHaveLength(1);
    expect(e.places[0].slug).toBe('pantai');
  });

  it('places kosong aman (tidak undefined)', () => {
    const e = mapEvent(eventWire({ places: undefined as never }));
    expect(e.places).toEqual([]);
  });

  it('field null tetap null (bukan undefined)', () => {
    const e = mapEvent(eventWire({ organizer: null, source_url: null, village: null }));
    expect(e.organizer).toBeNull();
    expect(e.sourceUrl).toBeNull();
    expect(e.village).toBeNull();
  });
});

function contributionWire(
  over: Partial<EventContributionWire> = {},
): EventContributionWire {
  return {
    id: 'c1',
    user_id: 'u1',
    event_id: null,
    status: 'pending',
    revision_note: null,
    reject_reason_code: null,
    reject_reason_text: null,
    reject_reason_display: null,
    created_at: '2026-10-20T00:00:00.000Z',
    updated_at: null,
    reviewed_at: null,
    payload: {
      name: 'Lomba Bakiak',
      description: 'Lomba bakiak antar dusun.',
      category_id: 'sosial',
      starts_at: '2026-12-01T02:00:00.000Z',
      ends_at: '2026-12-01T09:00:00.000Z',
      location_text: 'Lapangan Desa',
      lat: null,
      lng: null,
      maps_url: null,
      poster_url: null,
      organizer: null,
      source_url: null,
      source_type: null,
      source_attribution: null,
      region_id: 'r1',
      village_id: 'v1',
      place_ids: [],
    },
    ...over,
  };
}

describe('mapContribution', () => {
  it('map payload + alasan penolakan', () => {
    const c = mapContribution(contributionWire());
    expect(c.userId).toBe('u1');
    expect(c.status).toBe('pending');
    expect(c.payload.name).toBe('Lomba Bakiak');
    expect(c.payload.category_id).toBe('sosial');
    expect(c.payload.place_ids).toEqual([]);
  });

  it('tampilkan teks penolakan dari server', () => {
    const c = mapContribution(
      contributionWire({
        status: 'rejected',
        reject_reason_code: 'past_event',
        reject_reason_display: 'Acara sudah lewat',
      }),
    );
    expect(c.rejectReasonCode).toBe('past_event');
    expect(c.rejectReasonDisplay).toBe('Acara sudah lewat');
  });
});
