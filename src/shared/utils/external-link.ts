/**
 * UTM referal untuk link eksternal (rule `.cursor/rules/external-link-utm.mdc`).
 *
 * Sama dengan helper web (`web/app/presentation/utils/external-link.ts`) -
 * console paket terpisah, jadi helper-nya diduplikasi (bukan diimpor lintas
 * paket). Aturan:
 * - hanya URL https
 * - domain sendiri (sambasku.com + subdomain) tidak diberi UTM
 * - URL yang sudah punya `utm_source` tidak ditimpa
 * - query string + hash asli tetap utuh
 *
 * URL di DB disimpan BERSIH; UTM disisip saat link dirender/di-klik.
 */

const UTM_SOURCE = 'sambasku.com';
const UTM_MEDIUM = 'referral';

const OWN_HOSTS = new Set([
  'sambasku.com',
  'www.sambasku.com',
  'api.sambasku.com',
  'render.sambasku.com',
  'sambasku-staging.iamutaki.com',
  'sambasku-web-staging.ibnuul.workers.dev',
]);

export function isOwnHost(host: string): boolean {
  const lower = host.toLowerCase();
  return (
    OWN_HOSTS.has(lower) ||
    lower.endsWith('.sambasku.com') ||
    lower.endsWith('.iamutaki.com')
  );
}

export function withSambaskuUtm(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== 'https:') return url;
  if (isOwnHost(parsed.host)) return url;
  if (parsed.searchParams.has('utm_source')) return url;

  const utm = `utm_source=${encodeURIComponent(UTM_SOURCE)}&utm_medium=${UTM_MEDIUM}`;

  // Susun ulang string (bukan `parsed.toString()`) supaya hash tetap di
  // ujung dan query tetap di tengah.
  const hashAt = url.indexOf('#');
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const withoutHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const queryAt = withoutHash.indexOf('?');
  if (queryAt >= 0) {
    const base = withoutHash.slice(0, queryAt);
    const query = withoutHash.slice(queryAt + 1);
    const separator = query.length > 0 ? '&' : '';
    return `${base}?${query}${separator}${utm}${hash}`;
  }
  return `${withoutHash}?${utm}${hash}`;
}
