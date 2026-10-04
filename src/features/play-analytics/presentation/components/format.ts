export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('id-ID');
}

/** Rasio 0..1 (share) ke persen. */
export function fmtRatio(ratio: number, digits = 1): string {
  return `${(ratio * 100).toLocaleString('id-ID', { maximumFractionDigits: digits })}%`;
}

export function fmtRating(n: number): string {
  return n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const numericColumn = { align: 'right' as const, className: 'traffic__num' };

export const COUNTRY_LABELS: Record<string, string> = {
  ID: 'Indonesia',
  MY: 'Malaysia',
  SG: 'Singapura',
  US: 'Amerika Serikat',
  NL: 'Belanda',
};
