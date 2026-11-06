export const STORAGE_KEY = "turning-manor-progress-v1";

export function initialState() {
  return {
    activeWing: 1,
    wings: Object.fromEntries(
      [1, 2, 3, 4].map((id) => [
        id,
        {
          floor: 1,
          complete: false,
          references: {},
          flags: {},
        },
      ])
    ),
  };
}

export function restoreState(raw) {
  const result = initialState();

  if (!raw) return result;

  const saved = JSON.parse(raw);

  for (const id of [1, 2, 3, 4]) {
    const wing = saved?.wings?.[id];

    if (!wing) continue;

    const references = {};

    for (const [key, ref] of Object.entries(wing.references ?? {})) {
      if (
        !Array.isArray(ref?.items) ||
        !ref.items.length ||
        ref.items.length > 2
      ) {
        continue;
      }

      if (
        new Set(ref.items).size !== ref.items.length ||
        ref.items.some(
          (item) => !["Plant", "Painting", "Shelf", "Empty"].includes(item)
        )
      ) {
        continue;
      }

      if (ref.items.includes("Empty") && ref.items.length !== 1) {
        continue;
      }

      references[key] = {
        items: ref.items,
        notes: Object.fromEntries(
          ref.items.map((item) => [
            item,
            typeof ref.notes?.[item] === "string" ? ref.notes[item] : "",
          ])
        ),
      };
    }

    result.wings[id] = {
      floor: Number.isInteger(wing.floor)
        ? Math.min(16, Math.max(1, wing.floor))
        : 1,
      complete: wing.complete === true && wing.floor === 16,
      references,
      flags: Object.fromEntries(
        Object.entries(wing.flags ?? {})
          .filter(
            ([, value]) =>
              value === true ||
              ["same", "different", "unsure"].includes(value)
          )
          .map(([key, value]) => [
            key,
            value === true ? "different" : value,
          ])
      ),
    };
  }

  return result;
}

export function finishFloor(wing, passed) {
  return {
    ...wing,
    flags: {},
    floor: passed ? Math.min(16, wing.floor + 1) : 1,
    complete: passed && wing.floor === 16,
  };
}