// Releases match the Saturday videos at 9 a.m. Pacific (PST).
export const WING_2_RELEASE = Date.parse("2026-11-28T09:00:00-08:00");
export const WING_3_RELEASE = Date.parse("2026-12-12T09:00:00-08:00");
export function wingIsAvailable(id, now = Date.now(), development = false) {
  if (id === 1) return true;
  if (id === 2) return development || now >= WING_2_RELEASE;
  if (id === 3) return development || now >= WING_3_RELEASE;
  return false;
}
