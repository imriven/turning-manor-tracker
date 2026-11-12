import { useState } from "react";
import styled from "styled-components";
const Area = styled.section`
  padding: 20px;
  margin-bottom: 20px;
  border: 3px double #b49360;
  background: #39281e;
  color: #eee2ce;
  h2 {
    font-family: Georgia, serif;
    font-weight: normal;
  }
  label {
    display: grid;
    gap: 6px;
    margin: 12px 0;
  }
  input {
    width: 100%;
    padding: 10px;
    font: inherit;
  }
  button {
    min-height: 44px;
    padding: 10px;
    margin-top: 12px;
    background: #550000;
    color: #eee2ce;
    border: 1px solid #b49360;
    cursor: pointer;
  }
`;
export function notebookSpots(wing) {
  const custom = wing.customSpots ?? [];
  const saved = Object.keys(wing.references)
    .filter((id) => !id.startsWith("custom-"))
    .map((id) => ({
      id,
      section: id === "end-corner" ? 6 : Number(id[1]),
      location:
        id === "end-corner" ? "End of hallway, corner" : id.replace(/-/g, " "),
    }));
  return [...saved, ...custom];
}
export default function BlankHallway({
  wing,
  onUpdate,
  renderSpot,
  editing,
  customOnly = false,
}) {
  const [removing, setRemoving] = useState(null);
  const spots = customOnly ? (wing.customSpots ?? []) : notebookSpots(wing);
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((section) => (
        <Area key={section} id={`blank-section-${section}`} tabIndex={-1}>
          <h2>
            {section === 6 ? "End section" : `Section ${section}`}
            {customOnly ? " · Your added observations" : ""}
          </h2>
          {spots
            .filter((x) => x.section === section)
            .map((spot) => (
              <div key={spot.id}>
                {editing && spot.id.startsWith("custom-") ? (
                  <label>
                    Observation location
                    <input
                      maxLength={200}
                      value={spot.location}
                      onChange={(e) => {
                        const location = e.target.value;
                        onUpdate((old) => ({
                          ...old,
                          customSpots: (old.customSpots ?? []).map((x) =>
                            x.id === spot.id ? { ...x, location } : x,
                          ),
                        }));
                      }}
                      placeholder="Where in this section?"
                    />
                  </label>
                ) : (
                  <p>{spot.location || "Your observation"}</p>
                )}
                {renderSpot(
                  spot.id,
                  spot.location || `Section ${section} observation`,
                )}
                {editing &&
                  (removing === spot.id ? (
                    <div>
                      <p>Remove this observation and its saved notes?</p>
                      <button
                        onClick={() => {
                          onUpdate((old) => ({
                            ...old,
                            customSpots: (old.customSpots ?? []).filter(
                              (x) => x.id !== spot.id,
                            ),
                            references: Object.fromEntries(
                              Object.entries(old.references).filter(
                                ([id]) => id !== spot.id,
                              ),
                            ),
                            flags: Object.fromEntries(
                              Object.entries(old.flags).filter(
                                ([id]) => !id.startsWith(`${spot.id}-`),
                              ),
                            ),
                          }));
                          setRemoving(null);
                        }}
                      >
                        Remove observation and notes
                      </button>
                      <button onClick={() => setRemoving(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setRemoving(spot.id)}>
                      Remove observation
                    </button>
                  ))}
              </div>
            ))}
          {editing && (
            <button
              disabled={(wing.customSpots ?? []).length >= 100}
              onClick={() =>
                onUpdate((old) => ({
                  ...old,
                  customSpots: [
                    ...(old.customSpots ?? []),
                    {
                      id: `custom-${crypto.randomUUID()}`,
                      section,
                      location: "",
                    },
                  ],
                }))
              }
            >
              + Add observation in{" "}
              {section === 6 ? "end section" : `section ${section}`}
            </button>
          )}
          {!editing && !spots.some((x) => x.section === section) && (
            <p>
              No observations recorded here. Add them in your reference
              notebook.
            </p>
          )}
        </Area>
      ))}
    </>
  );
}
