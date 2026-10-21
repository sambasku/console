import { CheckCircleFilled } from '@ant-design/icons';

const VERIFIER_ROLES = new Set(['admin', 'editor', 'root', 'reviewer']);

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
      style={{ color: '#16A34A', fontSize: 14 }}
    />
  );
}
