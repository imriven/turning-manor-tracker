// December 2, 2026 at midnight Pacific (PST).
export const WING_2_RELEASE = Date.parse("2026-12-02T00:00:00-08:00");

// This is a spoiler/release convenience, not a security boundary.
export function wingIsAvailable(id, now = Date.now(), development = false) {
  if (id === 1) return true;
  if (id === 2) return development || now >= WING_2_RELEASE;
  return false;
}
