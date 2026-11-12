import { useRef, useState } from "react";
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
const FloorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  .floor-copy {
    min-width: 0;
    flex: 1;
  }
  h2 {
    font-size: clamp(1.2rem, 4vw, 1.6rem);
  }
  @media (max-width: 380px) {
    gap: 8px;
  }
`;
const HelpDialog = styled.dialog`
  width: min(520px, calc(100% - 24px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 24px;
  color: #eee2ce;
  background: #39281e;
  border: 3px double #b49360;
  box-shadow: 0 18px 60px #0009;
  &::backdrop {
    background: #000a;
  }
  p {
    line-height: 1.6;
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
  ElevatorIndicator,
  onUpdate,
  onAdvance,
  onExport,
  onSetup,
  message,
  error,
}) {
  const helpDialog = useRef(null);
  const [viewReference, setViewReference] = useState(false);
  const [removing, setRemoving] = useState(null);
  const guided = wing.notebookMode === "guided";
  const entries = galleryEntries(wing.galleryEntries, wing.notebookMode);
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
        ...galleryEntries(old.galleryEntries, old.notebookMode),
        [area]: galleryEntries(old.galleryEntries, old.notebookMode)[area].map(
          (x) => (x.id === id ? { ...x, ...patch } : x),
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
                : "Finish Primer Floor · Go to floor 1"
              : wing.floor === 16
                ? "Pass · Complete wing"
                : "Pass · Next floor"}
          </button>
          {wing.floor > 0 && (
            <button onClick={() => advance(false)}>
              Fail · Review Primer Floor
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
        <FloorHeader>
          <ElevatorIndicator floor={viewReference ? 0 : wing.floor} />
          <div className="floor-copy">
            <small>{guided ? "Guided notebook" : "Blank notebook"}</small>
            <h2>
              Wing 2 ·{" "}
              {viewReference || wing.floor === 0
                ? "Primer Floor"
                : wing.complete
                  ? "Wing complete"
                  : `Floor ${wing.floor}`}
            </h2>
            <p>
              {viewReference || wing.floor === 0
                ? "Track 7 framed artworks, 4 sculptures, and 6 display sides. Ignore unlabeled art. Add what you see and describe its appearance."
                : "Compare each exhibit with your notes. Mark differences or choose Not sure to revisit."}
            </p>
            <button
              type="button"
              onClick={() => helpDialog.current?.showModal()}
            >
              Help &amp; backup
            </button>
          </div>
        </FloorHeader>
        <HelpDialog ref={helpDialog} aria-labelledby="gallery-help-title">
          <h2 id="gallery-help-title">Using the gallery tracker</h2>
          <p>
            Record labeled exhibits on the Primer Floor. On anomaly floors,
            compare each exhibit with your notes and choose Looks the same,
            Something’s different, or Not sure. Revisit uncertain items before
            choosing your exit.
          </p>
          <p>Track 7 framed artworks, 4 sculptures, and 6 display sides. Ignore unlabeled art. Each visible side of a display counts separately. </p>
          <p>
            The entrance is at the top of the map. Select an area to jump to its
            observations. The map is schematic.
            {guided && " Suggested wall slots are provisional."} Add or remove
            exhibits on the Primer Floor to match what you see.
          </p>
          <p>
            If you fail, review the Primer Floor and then retry the floor you
            failed. You do not have to repeat passed floors.
          </p>
          <p>
            Notes and choices save automatically in this browser. Export a
            notebook to keep a separate backup. To import a notebook, use Help
            &amp; backups in Wing 1.
          </p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                helpDialog.current?.close();
                onSetup();
              }}
            >
              Notebook setup
            </button>
            <button type="button" onClick={onExport}>
              Export notebook
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => helpDialog.current?.close()}
            >
              Close help
            </button>
          </div>
          {message && <p role="status">{message}</p>}
        </HelpDialog>
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
            {checked} of your {flat.length} recorded exhibits checked ·{" "}
            {different} anomalies marked · {unsure} to revisit
          </p>
        )}
        {controls}
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
                  : `${items.length} ${guided ? "slots" : "added"}`}
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
          {guided && (index === 2 || index === 3) && (
            <p>
              {index === 2
                ? "Left gallery: one framed artwork and two visible display sides."
                : "Right gallery: four visible display sides and no framed artwork."}{" "}
              Each side gets its own notes and assessment.
            </p>
          )}
          {wing.galleryNotes?.[area] && (
            <details>
              <summary>Earlier wall notes</summary>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {wing.galleryNotes[area]}
              </p>
            </details>
          )}
          {guided && editing && (index === 2 || index === 3) && (
            <button
              disabled={
                flat.length +
                  Math.max(
                    0,
                    (index === 2 ? 2 : 4) -
                      entries[area].filter((x) => x.type === "Display").length,
                  ) >
                  100 ||
                entries[area].filter((x) => x.type === "Display").length >=
                  (index === 2 ? 2 : 4)
              }
              onClick={() =>
                onUpdate((old) => {
                  const all = galleryEntries(
                    old.galleryEntries,
                    old.notebookMode,
                  );
                  const existing = all[area];
                  const missing = Math.max(
                    0,
                    (index === 2 ? 2 : 4) -
                      existing.filter((x) => x.type === "Display").length,
                  );
                  return {
                    ...old,
                    galleryEntries: {
                      ...all,
                      [area]: [
                        ...existing,
                        ...Array.from({ length: missing }, () => ({
                          id: crypto.randomUUID(),
                          type: "Display",
                          notes: "",
                          status: null,
                        })),
                      ],
                    },
                  };
                })
              }
            >
              Add missing display sides
            </button>
          )}
          <Cards>
            {entries[area].map((item, i) => (
              <Card key={item.id}>
                <strong>
                  {item.type === "Display"
                    ? `Display side ${entries[area].slice(0, i + 1).filter((entry) => entry.type === "Display").length}`
                    : `Exhibit ${i + 1}`}
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
                                ...galleryEntries(
                                  old.galleryEntries,
                                  old.notebookMode,
                                ),
                                [area]: galleryEntries(
                                  old.galleryEntries,
                                  old.notebookMode,
                                )[area].filter((x) => x.id !== item.id),
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
                      ...galleryEntries(old.galleryEntries, old.notebookMode),
                      [area]: [
                        ...galleryEntries(old.galleryEntries, old.notebookMode)[
                          area
                        ],
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
            {checked} of your {flat.length} recorded exhibits checked ·{" "}
            {different} anomalies marked · {unsure} to revisit
          </p>
        )}
        {controls}
      </Panel>
    </>
  );
}
