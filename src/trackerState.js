export const GALLERY_AREAS = [
  "Entrance wall",
  "Middle wall · entrance face",
  "Left gallery",
  "Right gallery",
  "Exit wall",
  "Middle wall · exit face",
];
const OLD_AREAS = {
  "Entrance wall": "Entrance area",
  "Exit wall": "Far end / exit area",
};
export const STORAGE_KEY = "turning-manor-progress-v1";
export function initialState() {
  return {
    version: 2,
    activeWing: 1,
    wings: Object.fromEntries(
      [1, 2, 3, 4].map((id) => [
        id,
        {
          notebookMode: null,
          customSpots: [],
          floor: 0,
          retryFloor: null,
          complete: false,
          references: {},
          galleryNotes: Object.fromEntries(
            GALLERY_AREAS.map((area) => [area, ""]),
          ),
          flags: {},
        },
      ]),
    ),
  };
}
export function restoreState(raw) {
  const result = initialState();
  if (!raw) return result;
  const saved = JSON.parse(raw);
  result.activeWing = [1, 2].includes(saved?.activeWing) ? saved.activeWing : 1;
  const legacy = saved?.version !== 2;
  for (const id of [1, 2, 3, 4]) {
    const wing = saved?.wings?.[id];
    if (!wing) continue;
    const references = {};
    for (const [key, ref] of Object.entries(wing.references ?? {})) {
      if (
        !Array.isArray(ref?.items) ||
        !ref.items.length ||
        ref.items.length > 2
      )
        continue;
      if (
        new Set(ref.items).size !== ref.items.length ||
        ref.items.some(
          (x) => !["Plant", "Painting", "Shelf", "Empty"].includes(x),
        )
      )
        continue;
      if (ref.items.includes("Empty") && ref.items.length !== 1) continue;
      references[key] = {
        items: ref.items,
        notes: Object.fromEntries(
          ref.items.map((x) => [
            x,
            typeof ref.notes?.[x] === "string" ? ref.notes[x] : "",
          ]),
        ),
      };
    }
    // Old notebooks counted the reference floor as 1. Move in-progress runs
    // down one floor once, preserving each room's notes and assessments.
    const migratedFloor = Number.isInteger(wing.floor)
      ? wing.floor - (legacy && !wing.complete ? 1 : 0)
      : 0;
    result.wings[id] = {
      notebookMode: ["blank", "guided"].includes(wing.notebookMode)
        ? wing.notebookMode
        : Object.keys(references).length ||
            wing.floor > 0 ||
            wing.galleryEntries ||
            Object.values(wing.galleryNotes ?? {}).some(Boolean)
          ? "guided"
          : null,
      customSpots: validCustomSpots(wing.customSpots)
        ? (wing.customSpots ?? [])
        : [],
      floor: Math.min(16, Math.max(0, migratedFloor)),
      complete: wing.complete === true && wing.floor === 16,
      retryFloor:
        migratedFloor === 0 &&
        Number.isInteger(wing.retryFloor) &&
        wing.retryFloor >= 1 &&
        wing.retryFloor <= 16
          ? wing.retryFloor
          : null,
      references,
      ...(validGalleryEntries(wing.galleryEntries) && wing.galleryEntries
        ? {
            galleryEntries: galleryEntries(
              wing.galleryEntries,
              wing.notebookMode,
            ),
          }
        : {}),
      galleryNotes: Object.fromEntries(
        GALLERY_AREAS.map((area) => [
          area,
          typeof wing.galleryNotes?.[area] === "string"
            ? wing.galleryNotes[area]
            : typeof wing.galleryNotes?.[OLD_AREAS[area]] === "string"
              ? wing.galleryNotes[OLD_AREAS[area]]
              : "",
        ]),
      ),
      flags: Object.fromEntries(
        Object.entries(wing.flags ?? {})
          .filter(
            ([, v]) =>
              v === true || ["same", "different", "unsure"].includes(v),
          )
          .map(([key, value]) => [key, value === true ? "different" : value]),
      ),
    };
  }
  return result;
}
export function finishFloor(wing, passed) {
  wing = {
    ...wing,
    ...(wing.galleryEntries ? { galleryEntries: clearGalleryMarks(wing) } : {}),
  };
  if (!passed) {
    return {
      ...wing,
      flags: {},
      floor: 0,
      complete: false,
      retryFloor: wing.complete
        ? null
        : wing.floor > 0
          ? wing.floor
          : (wing.retryFloor ?? null),
    };
  }
  return {
    ...wing,
    flags: {},
    retryFloor: null,
    floor:
      wing.floor === 0 ? (wing.retryFloor ?? 1) : Math.min(16, wing.floor + 1),
    complete: wing.floor === 16,
  };
}

// Every reference item needs a response; optional extra-change controls don't.
// "Unsure" is an answered item, still highlighted separately for revisiting.
export function spaceChecked(reference, flags, id) {
  if (!reference?.items?.length) return false;
  return reference.items.every((item) =>
    ["same", "different", "unsure"].includes(
      flags[`${id}-${item === "Empty" ? "appeared" : item}`],
    ),
  );
}

// Wall counts remain provisional. Each visible display-case side is one entry.
export function galleryEntries(saved, mode = "guided") {
  const counts = [4, 3, 3, 4, 3, 3];
  return Object.fromEntries(
    GALLERY_AREAS.map((area, index) => [
      area,
      Array.isArray(saved?.[area])
        ? saved[area]
        : Array.from(
            { length: mode === "blank" || mode === null ? 0 : counts[index] },
            (_, n) => ({
              id: `gallery-${index}-${n}`,
              type:
                index === 2 && n === 2
                  ? "Framed art"
                  : index === 2 || index === 3
                    ? "Display"
                    : "",
              notes: "",
              status: null,
            }),
          ),
    ]),
  );
}
export function validGalleryEntries(value) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.keys(value).some((area) => !GALLERY_AREAS.includes(area)))
    return false;
  const entries = Object.values(value);
  if (entries.some((items) => !Array.isArray(items))) return false;
  const flat = entries.flat();
  return (
    flat.length <= 100 &&
    new Set(flat.map((x) => x?.id)).size === flat.length &&
    flat.every(
      (x) =>
        x &&
        typeof x.id === "string" &&
        x.id.length > 0 &&
        x.id.length <= 100 &&
        ["", "Framed art", "Sculpture", "Display"].includes(x.type) &&
        typeof x.notes === "string" &&
        [null, "same", "different", "unsure"].includes(x.status),
    )
  );
}
function clearGalleryMarks(wing) {
  if (!wing.galleryEntries) return undefined;
  return Object.fromEntries(
    Object.entries(wing.galleryEntries).map(([area, items]) => [
      area,
      items.map((item) => ({ ...item, status: null })),
    ]),
  );
}

export function validCustomSpots(spots) {
  return (
    spots === undefined ||
    (Array.isArray(spots) &&
      spots.length <= 100 &&
      new Set(spots.map((x) => x?.id)).size === spots.length &&
      spots.every(
        (x) =>
          x &&
          typeof x.id === "string" &&
          /^custom-[a-zA-Z0-9-]{1,80}$/.test(x.id) &&
          Number.isInteger(x.section) &&
          x.section >= 1 &&
          x.section <= 6 &&
          typeof x.location === "string" &&
          x.location.length <= 200,
      ))
  );
}
export function chooseNotebookMode(wing, mode, wingId) {
  if (!["blank", "guided"].includes(mode) || mode === wing.notebookMode)
    return wing;
  const next = { ...wing, notebookMode: mode };
  if (wingId === 2) {
    const current = galleryEntries(wing.galleryEntries, wing.notebookMode);
    const defaults = galleryEntries(undefined, "guided");
    let capacity = Math.max(0, 100 - Object.values(current).flat().length);
    next.galleryEntries = Object.fromEntries(
      GALLERY_AREAS.map((area) => {
        const existing = current[area];
        // Keep every saved entry. Guided only tops up areas with fewer slots.
        const additions =
          mode === "guided"
            ? defaults[area]
                .slice(existing.length, existing.length + capacity)
                .map((x) => ({
                  ...x,
                  id: `guided-${crypto.randomUUID()}`,
                  type: "",
                }))
            : [];
        capacity -= additions.length;
        return [area, [...existing, ...additions]];
      }),
    );
    if (Object.values(next.galleryEntries).flat().length > 100) return wing;
  }
  return next;
}
