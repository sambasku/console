export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('id-ID');
}

/** Rasio 0..1 (CTR, engagement rate, share) ke persen. */
export function fmtRatio(ratio: number, digits = 1): string {
  return `${(ratio * 100).toLocaleString('id-ID', { maximumFractionDigits: digits })}%`;
}

export function fmtPosition(position: number): string {
  return position.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export const numericColumn = { align: 'right' as const, className: 'traffic__num' };

export const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  smart_tv: 'Smart TV',
};
