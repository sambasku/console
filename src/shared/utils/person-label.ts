/** Label orang di UI: prefer display_name, fallback username. */
export function personLabel(
  displayName: string | null | undefined,
  username: string | null | undefined,
  fallback = '-',
): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed;
  const handle = username?.trim();
  if (handle) return handle;
  return fallback;
}
