
import { useState } from "react";
import styled from "styled-components";
import { GALLERY_AREAS, galleryEntries } from "./trackerState";

const Panel = styled.section`
  padding: 18px;
  margin: 18px 0;
  background: #39281e;
  border: 3px double #b49360;
  color: #eee2ce;
  h2,
  h3 {
    margin: 0 0 10px;
    font-family: Georgia, serif;
    font-weight: normal;
  }
  p {
    font-size: 0.85rem;
  }
  button {
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid #b49360;
    background: #30231c;
    color: #eee2ce;
    cursor: pointer;
    border-radius: 4px;
  }
  button[aria-pressed="true"] {
    background: #550000;
    border-color: #f5d58c;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0;
  }
`;
const Plan = styled.nav`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-areas: "entrance entrance entrance" "left front right" "left wall right" "left rear right" "exit exit exit";
  gap: 8px;
  button {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.8rem;
  }
  .wall {
    grid-area: wall;
    padding: 16px 4px;
    text-align: center;
    background: #8b6844;
    font-size: 0.75rem;
  }
`;
const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;
const Card = styled.article`
  padding: 14px;
  color: #263321;
  background: #a5b797;
  border: 3px ridge #b49360;
  box-shadow: 0 4px 8px #0005;
  label {
    display: grid;
    gap: 6px;
    margin: 10px 0;
    font-size: 0.85rem;
  }
  textarea {
    width: 100%;
    min-height: 80px;
    padding: 8px;
    font: inherit;
    color: #35251d;
    background: #e9dfc8;
    resize: vertical;
  }
  p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;
const TYPES = ["Framed art", "Sculpture", "Display"];
const ANSWERS = [
  ["same", "Looks the same"],
  ["different", "Something’s different"],
  ["unsure", "Not sure · Revisit"],
];
export default function GalleryTracker({
  wing,
  onUpdate,
  onAdvance,
  onExport,
  message,
  error,
}) {
  const [viewReference, setViewReference] = useState(false);
  const [removing, setRemoving] = useState(null);
  const entries = galleryEntries(wing.galleryEntries);
  const flat = GALLERY_AREAS.flatMap((area) => entries[area]);
  const canAssess = wing.floor > 0 && !viewReference && !wing.complete;
  const editing = wing.floor === 0 || viewReference;
  const checked = flat.filter((x) => x.type && x.status).length;
  const different = flat.filter((x) => x.status === "different").length;
  const unsure = flat.filter((x) => x.status === "unsure").length;
  function change(area, id, patch) {
    onUpdate((old) => ({
      ...old,
      galleryEntries: {
        ...galleryEntries(old.galleryEntries),
        [area]: galleryEntries(old.galleryEntries)[area].map((x) =>
          x.id === id ? { ...x, ...patch } : x,
        ),
      },
    }));
  }
  function advance(pass) {
    setViewReference(false);
    setRemoving(null);
    onAdvance(pass);
  }
  function jump(area) {
    const el = document.getElementById(
      `gallery-${GALLERY_AREAS.indexOf(area)}`,
    );
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "start" });
  }
  const controls = (
    <div className="actions">
      {wing.complete ? (
        <button onClick={() => advance(false)}>Start another run</button>
      ) : viewReference ? (
        <button onClick={() => setViewReference(false)}>
          Return to current floor
        </button>
      ) : (
        <>
          <button onClick={() => advance(true)}>
            {wing.floor === 0
              ? wing.retryFloor
                ? `Retry floor ${wing.retryFloor}`
                : "Finish reference · Go to floor 1"
              : wing.floor === 16
                ? "Pass · Complete wing"
                : "Pass · Next floor"}
          </button>
          {wing.floor > 0 && (
            <button onClick={() => advance(false)}>
              Fail · Review reference floor 0
            </button>
          )}
        </>
      )}
      {wing.floor > 0 && !viewReference && (
        <button onClick={() => setViewReference(true)}>View reference</button>
      )}
    </div>
  );
  return (
    <>
      <Panel>
        <h2>
          Wing 2 · Floor {wing.floor} ·{" "}
          {viewReference
            ? "Reference notes"
            : wing.floor === 0
              ? "Reference floor"
              : wing.complete
                ? "Wing complete"
                : "Anomaly floor"}
        </h2>
        <p>
          Track labeled exhibits only: 7 framed artworks, 4 sculptures, 6
          displays. See from all angles.
        </p>
        <p>
          The wall slots follow our provisional walkthrough, not a confirmed
          exhibit map. Choose each exhibit’s type yourself. Add or remove slots
          on the reference floor as you confirm locations.
        </p>
        <p>
          Entrance is at the top. Left and right retain the same names as your
          walkthrough. The map is schematic.
        </p>
        <p>
          Reference recorded:{" "}
          {TYPES.map(
            (type) =>
              `${flat.filter((x) => x.type === type).length} ${type.toLowerCase()}`,
          ).join(" · ")}
          .
        </p>
        {wing.retryFloor && wing.floor === 0 && (
          <p>Review your reference, then retry floor {wing.retryFloor}.</p>
        )}
        {canAssess && (
          <p role="status">
            {checked}/{flat.length} exhibits checked · {different} anomalies
            marked · {unsure} to revisit
          </p>
        )}
        {controls}
        <button onClick={onExport}>Export notebook</button>
        <p>Notes and choices save automatically in this browser.</p>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <Plan aria-label="Gallery wall map">
          {[
            [0, "entrance"],
            [1, "front"],
            [2, "left"],
            [3, "right"],
            [5, "rear"],
            [4, "exit"],
          ].map(([i, position]) => {
            const area = GALLERY_AREAS[i];
            const items = entries[area];
            return (
              <button
                key={area}
                style={{ gridArea: position }}
                onClick={() => jump(area)}
              >
                {area}
                <br />
                {canAssess
                  ? `${items.filter((x) => x.type && x.status).length}/${items.length} checked`
                  : `${items.length} slots`}
                {canAssess && (
                  <>
                    <br />
                    {items.filter((x) => x.status === "different").length}{" "}
                    marked · {items.filter((x) => x.status === "unsure").length}{" "}
                    revisit
                  </>
                )}
              </button>
            );
          })}
          <div className="wall">Central dividing wall</div>
        </Plan>
      </Panel>
      {GALLERY_AREAS.map((area, index) => (
        <Panel
          key={area}
          id={`gallery-${index}`}
          tabIndex={-1}
          style={{ scrollMarginTop: 20 }}
        >
          <h3>{area}</h3>
          {wing.galleryNotes?.[area] && (
            <details>
              <summary>Earlier wall notes</summary>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {wing.galleryNotes[area]}
              </p>
            </details>
          )}
          <Cards>
            {entries[area].map((item, i) => (
              <Card key={item.id}>
                <strong>
                  Exhibit {i + 1}
                  {item.type ? ` · ${item.type}` : ""}
                </strong>
                {editing ? (
                  <>
                    <div
                      className="actions"
                      role="group"
                      aria-label={`${area}, exhibit ${i + 1} type`}
                    >
                      {TYPES.map((type) => (
                        <button
                          key={type}
                          aria-pressed={item.type === type}
                          onClick={() =>
                            change(area, item.id, { type, status: null })
                          }
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <label>
                      Location and appearance
                      <textarea
                        value={item.notes}
                        placeholder="Which part of this wall? What does the exhibit look like?"
                        onChange={(e) =>
                          change(area, item.id, { notes: e.target.value })
                        }
                      />
                    </label>
                    {removing === item.id ? (
                      <div className="actions">
                        <button
                          onClick={() => {
                            onUpdate((old) => ({
                              ...old,
                              galleryEntries: {
                                ...galleryEntries(old.galleryEntries),
                                [area]: galleryEntries(old.galleryEntries)[
                                  area
                                ].filter((x) => x.id !== item.id),
                              },
                            }));
                            setRemoving(null);
                          }}
                        >
                          Confirm removal
                        </button>
                        <button onClick={() => setRemoving(null)}>
                          Keep exhibit
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setRemoving(item.id)}>
                        Remove slot
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p>{item.notes || "No appearance notes saved."}</p>
                    {!item.type && (
                      <p>
                        Add an item type in View reference before checking this
                        exhibit.
                      </p>
                    )}
                    {canAssess && (
                      <div
                        className="actions"
                        role="group"
                        aria-label={`${area}, exhibit ${i + 1} assessment`}
                      >
                        {ANSWERS.map(([status, label]) => (
                          <button
                            key={status}
                            disabled={!item.type}
                            aria-pressed={item.status === status}
                            onClick={() => change(area, item.id, { status })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            ))}
          </Cards>
          {editing && (
            <div className="actions">
              <button
                disabled={flat.length >= 100}
                onClick={() =>
                  onUpdate((old) => ({
                    ...old,
                    galleryEntries: {
                      ...galleryEntries(old.galleryEntries),
                      [area]: [
                        ...galleryEntries(old.galleryEntries)[area],
                        {
                          id: crypto.randomUUID(),
                          type: "",
                          notes: "",
                          status: null,
                        },
                      ],
                    },
                  }))
                }
              >
                + Add exhibit
              </button>
            </div>
          )}
        </Panel>
      ))}
      <Panel>
        {canAssess && (
          <p role="status">
            {checked}/{flat.length} exhibits checked · {different} anomalies
            marked · {unsure} to revisit
          </p>
        )}
        {controls}
      </Panel>
    </>
  );
}
