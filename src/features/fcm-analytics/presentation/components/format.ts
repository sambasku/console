export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('id-ID');
}

/** Rasio 0..1 (open rate) ke persen. */
export function fmtRatio(ratio: number, digits = 1): string {
  return `${(ratio * 100).toLocaleString('id-ID', { maximumFractionDigits: digits })}%`;
}

export const numericColumn = { align: 'right' as const, className: 'traffic__num' };
