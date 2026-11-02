import { CheckCircleFilled } from '@ant-design/icons';

const VERIFIER_ROLES = new Set(['admin', 'editor', 'root', 'reviewer']);

/** Biru peran verifikator - sama dengan mobile `verifierBlue` light (`#2A66FF`).
 *  Bukan hijau: hijau di mobile khusus status kata approved. */
export const VERIFIER_BLUE = '#2A66FF';

/** Sama dengan centang di samping nama di app. */
export function isVerifierRole(role: string | null | undefined): boolean {
  return role != null && VERIFIER_ROLES.has(role);
}

/** Centang peran verifikator di samping nama. Kosong jika bukan verifikator. */
export function VerifierMark({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <CheckCircleFilled
      aria-label="Verifikator"
      style={{ color: VERIFIER_BLUE, fontSize: 14 }}
    />
  );
}
