export interface MapPoint {
  lat: number;
  lng: number;
}

export interface MapBias {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface NominatimPlace extends MapPoint {
  label: string;
}

const ENDPOINT = 'https://nominatim.openstreetmap.org';

let tail: Promise<void> = Promise.resolve();
let lastAt = 0;

/** Antrian 1 permintaan / 1.1 dtk. Kebijakan pemakaian Nominatim publik. */
function paced<T>(run: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
  const job = tail.then(async () => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const wait = Math.max(0, lastAt + 1100 - Date.now());
    if (wait > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, wait);
        signal?.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
      });
    }
    lastAt = Date.now();
    return run(signal);
  });
  tail = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

export function parseNominatimSearch(body: unknown): NominatimPlace[] {
  if (!Array.isArray(body)) return [];
  const out: NominatimPlace[] = [];
  for (const row of body) {
    if (!row || typeof row !== 'object') continue;
    const record = row as { lat?: unknown; lon?: unknown; display_name?: unknown };
    const lat = Number(record.lat);
    const lng = Number(record.lon);
    const label = typeof record.display_name === 'string' ? record.display_name : '';
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !label) continue;
    out.push({ lat, lng, label });
  }
  return out;
}

export function parseNominatimReverse(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const label = (body as { display_name?: unknown }).display_name;
  return typeof label === 'string' && label.trim() ? label : null;
}

async function getJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'id' },
    signal,
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

export function searchNominatim(
  query: string,
  opts: { limit?: number; bias?: MapBias; bounded?: boolean; signal?: AbortSignal } = {},
): Promise<NominatimPlace[]> {
  const q = query.trim();
  if (q.length < 3) return Promise.resolve([]);
  return paced(async (signal) => {
    const url = new URL(`${ENDPOINT}/search`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('q', q);
    url.searchParams.set('limit', String(opts.limit ?? 5));
    if (opts.bias) {
      url.searchParams.set(
        'viewbox',
        `${opts.bias.west},${opts.bias.north},${opts.bias.east},${opts.bias.south}`,
      );
      url.searchParams.set('bounded', opts.bounded ? '1' : '0');
    }
    return parseNominatimSearch(await getJson(url, signal));
  }, opts.signal);
}

export function reverseNominatim(
  point: MapPoint,
  signal?: AbortSignal,
): Promise<string | null> {
  return paced(async (inner) => {
    const url = new URL(`${ENDPOINT}/reverse`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(point.lat));
    url.searchParams.set('lon', String(point.lng));
    return parseNominatimReverse(await getJson(url, inner));
  }, signal);
}
